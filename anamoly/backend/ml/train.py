from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import confusion_matrix, f1_score, precision_score, recall_score

from ml.features import FEATURE_COLUMNS, build_behavioural_features
from ml.generator import build_user_profiles, generate_dataset, print_dataset_quality_report

MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_PATH = MODEL_DIR / "isolation_forest.joblib"
FEATURE_PATH = MODEL_DIR / "feature_columns.json"
METADATA_PATH = MODEL_DIR / "training_metadata.json"

DEFAULT_TRAIN_START = pd.Timestamp("2024-01-01")
DEFAULT_TRAIN_END = pd.Timestamp("2024-09-30")
DEFAULT_VAL_START = pd.Timestamp("2024-10-01")
DEFAULT_VAL_END = pd.Timestamp("2024-10-31")
DEFAULT_TEST_START = pd.Timestamp("2024-11-01")
DEFAULT_TEST_END = pd.Timestamp("2024-11-30")


def _load_or_generate_dataset() -> pd.DataFrame:
    csv_path = Path(__file__).resolve().parent.parent / "data" / "generated" / "transactions.csv"
    if csv_path.exists():
        return pd.read_csv(csv_path, parse_dates=["timestamp"])

    df = generate_dataset(
        num_users=1000,
        num_transactions=100000,
        start_date="2024-01-01",
        end_date="2024-11-30",
        anomaly_rate=0.08,
        seed=42,
        output_csv=csv_path,
    )
    return df


def _split_by_time(df: pd.DataFrame):
    train_df = df[df["timestamp"] < DEFAULT_VAL_START].copy()
    val_df = df[(df["timestamp"] >= DEFAULT_VAL_START) & (df["timestamp"] <= DEFAULT_VAL_END)].copy()
    test_df = df[(df["timestamp"] >= DEFAULT_TEST_START) & (df["timestamp"] <= DEFAULT_TEST_END)].copy()
    return train_df, val_df, test_df


def _validate_temporal_split(df: pd.DataFrame):
    min_ts = df["timestamp"].min()
    max_ts = df["timestamp"].max()
    min_day = min_ts.normalize()
    max_day = max_ts.normalize()
    if max_day < DEFAULT_TEST_END.normalize() or min_day > DEFAULT_TRAIN_START.normalize():
        raise ValueError(
            "The dataset is too short to support the required chronological train/validation/test split. "
            "Use a date range that covers at least 2024-01-01 through 2024-11-30. "
            f"Current dataset range is {min_ts.date()} through {max_ts.date()}."
        )

    train_df, val_df, test_df = _split_by_time(df)
    if train_df.empty or val_df.empty or test_df.empty:
        raise ValueError(
            "The dataset does not contain sufficient history for the required split: "
            "train (2024-01-01 to 2024-09-30), validation (2024-10-01 to 2024-10-31), "
            "test (2024-11-01 to 2024-11-30). "
            f"Current dataset range is {min_ts.date()} through {max_ts.date()}."
        )
    return train_df, val_df, test_df


def _evaluate_model(model: IsolationForest, X: pd.DataFrame, y_true: pd.Series) -> dict:
    predictions = model.predict(X)
    pred_labels = (predictions == -1).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, pred_labels, labels=[0, 1]).ravel()
    return {
        "ground_truth_anomalies": int(y_true.sum()),
        "predicted_anomalies": int(pred_labels.sum()),
        "precision": precision_score(y_true, pred_labels, zero_division=0),
        "recall": recall_score(y_true, pred_labels, zero_division=0),
        "f1": f1_score(y_true, pred_labels, zero_division=0),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }


def train_model() -> dict:
    """Train an IsolationForest on historical normal behaviour and evaluate on later windows.

    Temporal leakage is avoided by building behavioural features using only transactions that
    occurred before each current row, and by training only on the pre-October historical window.
    """
    df = _load_or_generate_dataset().sort_values("timestamp").reset_index(drop=True)
    train_df, val_df, test_df = _validate_temporal_split(df)

    user_profiles = build_user_profiles(num_users=df["user_id"].nunique(), seed=42)
    normal_train = train_df[train_df["fraud_label"] == 0].copy()

    x_train = build_behavioural_features(normal_train, user_profiles)
    model = IsolationForest(contamination=0.02, n_estimators=200, random_state=42)
    model.fit(x_train[FEATURE_COLUMNS])

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with FEATURE_PATH.open("w", encoding="utf-8") as handle:
        json.dump(FEATURE_COLUMNS, handle, indent=2)

    import joblib
    joblib.dump(model, MODEL_PATH)

    metadata = {
        "train_start": str(train_df["timestamp"].min()),
        "train_end": str(train_df["timestamp"].max()),
        "val_start": str(val_df["timestamp"].min()) if not val_df.empty else None,
        "val_end": str(val_df["timestamp"].max()) if not val_df.empty else None,
        "test_start": str(test_df["timestamp"].min()) if not test_df.empty else None,
        "test_end": str(test_df["timestamp"].max()) if not test_df.empty else None,
        "feature_columns": FEATURE_COLUMNS,
        "contamination": 0.02,
        "model_name": "IsolationForest",
    }
    with METADATA_PATH.open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)

    print("Training data summary")
    print(f"Training rows: {len(train_df):,}")
    print(f"Validation rows: {len(val_df):,}")
    print(f"Test rows: {len(test_df):,}")

    for name, frame in {"validation": val_df, "test": test_df}.items():
        if frame.empty:
            continue
        x_eval = build_behavioural_features(frame, user_profiles)
        metrics = _evaluate_model(model, x_eval[FEATURE_COLUMNS], frame["fraud_label"].astype(int))
        print(f"Synthetic {name} evaluation metrics:")
        print(f"  test_samples={len(frame):,}")
        print(f"  ground_truth_anomalies={metrics['ground_truth_anomalies']}")
        print(f"  predicted_anomalies={metrics['predicted_anomalies']}")
        print(f"  precision={metrics['precision']:.4f}")
        print(f"  recall={metrics['recall']:.4f}")
        print(f"  f1={metrics['f1']:.4f}")
        print(f"  confusion_matrix={metrics['confusion_matrix']}")

        by_scenario = []
        for scenario in [
            "HIGH_AMOUNT",
            "HIGH_VELOCITY",
            "NEW_DEVICE",
            "LOCATION_ANOMALY",
            "UNUSUAL_TIME",
            "MERCHANT_ANOMALY",
            "ACCOUNT_TAKEOVER",
        ]:
            scenario_mask = frame["fraud_scenario"].fillna("normal") == scenario
            if not scenario_mask.any():
                continue
            scenario_frame = frame[scenario_mask].copy()
            scenario_x = build_behavioural_features(scenario_frame, user_profiles)
            scenario_metrics = _evaluate_model(model, scenario_x[FEATURE_COLUMNS], scenario_frame["fraud_label"].astype(int))
            by_scenario.append((scenario, len(scenario_frame), scenario_metrics))

        if by_scenario:
            print(f"  scenario_breakdown:")
            for scenario, total, metrics in by_scenario:
                print(f"    {scenario}: samples={total}, precision={metrics['precision']:.4f}, recall={metrics['recall']:.4f}, f1={metrics['f1']:.4f}")

    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved feature order: {FEATURE_PATH}")
    print(f"Saved metadata: {METADATA_PATH}")
    print_dataset_quality_report(df)
    return {"model_path": str(MODEL_PATH), "feature_columns": FEATURE_COLUMNS, "metadata_path": str(METADATA_PATH)}


if __name__ == "__main__":
    train_model()
