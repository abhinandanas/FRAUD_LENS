from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd
import joblib

from ml.features import FEATURE_COLUMNS

MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_PATH = MODEL_DIR / "isolation_forest.joblib"
FEATURE_PATH = MODEL_DIR / "feature_columns.json"


def _load_model_and_columns() -> tuple[Any, list[str]]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "The trained IsolationForest model does not exist yet. Run `python -m ml.train` from backend first."
        )
    if not FEATURE_PATH.exists():
        raise FileNotFoundError("The feature order file is missing from the model directory.")

    with FEATURE_PATH.open("r", encoding="utf-8") as handle:
        feature_columns = json.load(handle)

    model = joblib.load(MODEL_PATH)
    return model, feature_columns


def predict_anomaly(features: dict | pd.DataFrame | pd.Series | list[dict]) -> dict:
    """Score a single transaction or batch of transactions using the stored model and feature order."""
    model, feature_columns = _load_model_and_columns()

    if isinstance(features, dict):
        frame = pd.DataFrame([features])
    elif isinstance(features, pd.Series):
        frame = pd.DataFrame([features.to_dict()])
    elif isinstance(features, pd.DataFrame):
        frame = features.copy()
    elif isinstance(features, list):
        frame = pd.DataFrame(features)
    else:
        raise TypeError("Unsupported features input. Use a dict, pandas Series, DataFrame, or list of dicts.")

    missing_columns = [column for column in feature_columns if column not in frame.columns]
    if missing_columns:
        raise ValueError(f"Missing required feature columns: {missing_columns}")

    ordered = frame[feature_columns]
    scores = model.score_samples(ordered)
    predictions = model.predict(ordered)

    if len(scores) == 1:
        return {
            "anomaly_score": float(-scores[0]),
            "is_anomaly": bool(predictions[0] == -1),
            "prediction": int(predictions[0]),
        }

    return [
        {"anomaly_score": float(-score), "is_anomaly": bool(prediction == -1), "prediction": int(prediction)}
        for score, prediction in zip(scores, predictions)
    ]


if __name__ == "__main__":
    example = {
        "amount": 2150.0,
        "amount_vs_user_average": 1200.0,
        "amount_z_score": 1.8,
        "transactions_last_1_minute": 0,
        "transactions_last_5_minutes": 1,
        "transactions_last_1_hour": 2,
        "transactions_today": 3,
        "hour_of_day": 22,
        "is_unusual_hour": 1,
        "distance_from_usual_location": 18.4,
        "distance_from_previous_transaction": 0.7,
        "is_new_device": 1,
        "user_device_count": 2,
        "merchant_category_frequency": 0.05,
        "merchant_category_deviation": 0.38,
    }
    print(predict_anomaly(example))
