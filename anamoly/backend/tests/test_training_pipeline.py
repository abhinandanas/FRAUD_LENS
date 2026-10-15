import json
from pathlib import Path

import pandas as pd

from ml.features import FEATURE_COLUMNS, build_behavioural_features
from ml.generator import generate_dataset
from ml.predict import predict_anomaly
from ml.train import train_model


def test_small_dataset_has_temporal_split_and_nonempty_windows():
    df = generate_dataset(
        num_users=20,
        num_transactions=200,
        start_date="2024-01-01",
        end_date="2024-12-31",
        anomaly_rate=0.1,
        seed=42,
        output_csv=Path("data/generated/test_small_dataset.csv"),
    )
    assert len(df) == 200
    assert df["timestamp"].is_monotonic_increasing
    train = df[df["timestamp"] < pd.Timestamp("2024-10-01")]
    val = df[(df["timestamp"] >= pd.Timestamp("2024-10-01")) & (df["timestamp"] <= pd.Timestamp("2024-10-31"))]
    test = df[(df["timestamp"] >= pd.Timestamp("2024-11-01")) & (df["timestamp"] <= pd.Timestamp("2024-11-30"))]
    assert not train.empty
    assert not val.empty
    assert not test.empty


def test_future_transactions_cannot_affect_earlier_feature_values():
    df = generate_dataset(
        num_users=12,
        num_transactions=120,
        start_date="2024-01-01",
        end_date="2024-12-31",
        anomaly_rate=0.1,
        seed=11,
        output_csv=Path("data/generated/test_future_leakage.csv"),
    )
    features = build_behavioural_features(df, user_profiles={})
    assert list(features.columns) == FEATURE_COLUMNS
    assert len(features) == len(df)


def test_feature_columns_are_stable_for_inference():
    df = generate_dataset(
        num_users=10,
        num_transactions=80,
        start_date="2024-01-01",
        end_date="2024-12-31",
        anomaly_rate=0.12,
        seed=12,
        output_csv=Path("data/generated/test_feature_order.csv"),
    )
    feature_df = build_behavioural_features(df, user_profiles={})
    assert list(feature_df.columns) == FEATURE_COLUMNS
    model = predict_anomaly(feature_df.iloc[0].to_dict())
    assert set(model.keys()) >= {"anomaly_score", "is_anomaly", "prediction"}


def test_model_artifact_and_feature_order_are_saved():
    generate_dataset(
        num_users=200,
        num_transactions=2000,
        start_date="2024-01-01",
        end_date="2024-11-30",
        anomaly_rate=0.08,
        seed=42,
        output_csv=Path("data/generated/transactions.csv"),
    )
    train_model()
    model_path = Path("ml/models/isolation_forest.joblib")
    feature_path = Path("ml/models/feature_columns.json")
    assert model_path.exists()
    assert feature_path.exists()
    with feature_path.open("r", encoding="utf-8") as handle:
        stored = json.load(handle)
    assert stored == FEATURE_COLUMNS
