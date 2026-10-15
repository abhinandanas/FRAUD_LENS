from __future__ import annotations

from typing import Dict, Iterable, List, Optional

import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "amount",
    "amount_vs_user_average",
    "amount_z_score",
    "transactions_last_1_minute",
    "transactions_last_5_minutes",
    "transactions_last_1_hour",
    "transactions_today",
    "hour_of_day",
    "is_unusual_hour",
    "distance_from_usual_location",
    "distance_from_previous_transaction",
    "is_new_device",
    "user_device_count",
    "merchant_category_frequency",
    "merchant_category_deviation",
]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return 2 * 6371.0 * np.arcsin(np.sqrt(a))


def build_behavioural_features(df: pd.DataFrame, user_profiles: Optional[Dict[str, dict]] = None) -> pd.DataFrame:
    """Build behavioural features using only historical information available before each transaction."""
    if user_profiles is None:
        user_profiles = {}

    frame = df.sort_values("timestamp").copy()
    frame["timestamp"] = pd.to_datetime(frame["timestamp"])
    features: List[dict] = []

    for user_id, user_group in frame.groupby("user_id", sort=False):
        history: List[dict] = []
        for _, row in user_group.sort_values("timestamp").iterrows():
            current_ts = pd.Timestamp(row["timestamp"])
            prior = pd.DataFrame(history)

            if prior.empty:
                avg_amount = float(row["amount"])
                std_amount = 0.0
                amount_z_score = 0.0
                category_frequency = 0.0
                category_deviation = 0.0
                distance_from_previous = 0.0
                user_device_count = 0
                is_new_device = 1
                transactions_last_1_minute = 0
                transactions_last_5_minutes = 0
                transactions_last_1_hour = 0
                transactions_today = 0
            else:
                prior_ts = pd.to_datetime(prior["timestamp"])
                avg_amount = float(prior["amount"].mean())
                std_amount = float(prior["amount"].std(ddof=0)) if len(prior) > 1 else 0.0
                amount_z_score = 0.0 if std_amount == 0 else (float(row["amount"]) - avg_amount) / std_amount

                previous_tx = prior.iloc[-1]
                distance_from_previous = _haversine_km(
                    float(row["latitude"]),
                    float(row["longitude"]),
                    float(previous_tx["latitude"]),
                    float(previous_tx["longitude"]),
                )

                historical_devices = set(prior["device_id"].tolist())
                is_new_device = int(row["device_id"] not in historical_devices)
                user_device_count = len(historical_devices)

                category_counts = prior["merchant_category"].value_counts(normalize=True)
                category_frequency = float(category_counts.get(row["merchant_category"], 0.0))
                profile = user_profiles.get(user_id, {})
                category_preference = profile.get("merchant_preferences", {})
                category_deviation = float(category_frequency - category_preference.get(row["merchant_category"], 0.0)) if category_preference else 0.0

                transactions_last_1_minute = int((prior_ts >= (current_ts - pd.Timedelta(minutes=1))).sum())
                transactions_last_5_minutes = int((prior_ts >= (current_ts - pd.Timedelta(minutes=5))).sum())
                transactions_last_1_hour = int((prior_ts >= (current_ts - pd.Timedelta(hours=1))).sum())
                transactions_today = int((prior_ts.dt.date == current_ts.date()).sum())
            
            profile = user_profiles.get(user_id, {})
            normal_hours = profile.get("normal_hours", (8, 22))
            normal_start, normal_end = normal_hours
            is_unusual_hour = 1 if not (normal_start <= int(current_ts.hour) <= normal_end) else 0

            usual_lat = float(profile.get("usual_latitude", row["latitude"]))
            usual_lon = float(profile.get("usual_longitude", row["longitude"]))
            distance_from_usual = _haversine_km(float(row["latitude"]), float(row["longitude"]), usual_lat, usual_lon)

            features.append(
                {
                    "amount": float(row["amount"]),
                    "amount_vs_user_average": float(row["amount"]) - avg_amount,
                    "amount_z_score": float(amount_z_score),
                    "transactions_last_1_minute": int(transactions_last_1_minute),
                    "transactions_last_5_minutes": int(transactions_last_5_minutes),
                    "transactions_last_1_hour": int(transactions_last_1_hour),
                    "transactions_today": int(transactions_today),
                    "hour_of_day": int(current_ts.hour),
                    "is_unusual_hour": int(is_unusual_hour),
                    "distance_from_usual_location": float(distance_from_usual),
                    "distance_from_previous_transaction": float(distance_from_previous),
                    "is_new_device": int(is_new_device),
                    "user_device_count": int(user_device_count),
                    "merchant_category_frequency": float(category_frequency),
                    "merchant_category_deviation": float(category_deviation),
                }
            )
            history.append(row.to_dict())

    feature_df = pd.DataFrame(features)
    for column in FEATURE_COLUMNS:
        if column not in feature_df.columns:
            feature_df[column] = 0.0
    return feature_df[FEATURE_COLUMNS]
