from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
GENERATED_DIR = DATA_DIR / "generated"
PROCESSED_DIR = DATA_DIR / "processed"
OUTPUT_CSV = GENERATED_DIR / "transactions.csv"

TRANSACTION_COLUMNS = [
    "transaction_id",
    "user_id",
    "timestamp",
    "amount",
    "merchant_id",
    "merchant_category",
    "device_id",
    "latitude",
    "longitude",
    "location_name",
    "payment_method",
    "transaction_type",
    "fraud_label",
    "fraud_scenario",
]

CITY_COORDS = {
    "Mangalore": (12.9141, 74.8560),
    "Bengaluru": (12.9716, 77.5946),
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.6139, 77.2090),
    "Hyderabad": (17.3850, 78.4867),
    "Chennai": (13.0827, 80.2707),
    "Kochi": (9.9312, 76.2673),
    "Pune": (18.5204, 73.8567),
    "Lucknow": (26.8467, 80.9462),
    "Jaipur": (26.9124, 75.7873),
}

MERCHANT_CATEGORIES = [
    "Groceries",
    "Restaurants",
    "Travel",
    "Electricity",
    "Entertainment",
    "Shopping",
    "Healthcare",
    "Education",
    "Fuel",
    "Bills",
    "Subscriptions",
    "Taxi",
]

PAYMENT_METHODS = ["UPI", "Debit Card", "Credit Card", "Wallet"]
TRANSACTION_TYPES = ["PAYMENT", "TRANSFER", "TOPUP", "REFUND"]


def _spawn_rng(seed: int | None = None) -> np.random.Generator:
    return np.random.default_rng(seed)


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def _normal_hours_for_seed(seed: int, index: int) -> tuple[int, int]:
    start = 8 + ((seed + index) % 6)
    end = 20 + ((seed + index * 2) % 4)
    if end > 23:
        end = 23
    if end <= start:
        end = min(23, start + 4)
    return start, end


def build_user_profiles(num_users: int = 1000, seed: int = 42) -> Dict[str, Dict[str, Any]]:
    rng = _spawn_rng(seed)
    profiles: Dict[str, Dict[str, Any]] = {}
    cities = list(CITY_COORDS.keys())

    for idx in range(num_users):
        user_id = f"U{idx + 1:03d}"
        city = cities[idx % len(cities)]
        base_latitude, base_longitude = CITY_COORDS[city]
        mean_amount = float(np.clip(rng.lognormal(mean=np.log(700), sigma=0.8), 100, 9000))
        amount_std = float(np.clip(mean_amount * 0.45, 50, 2500))
        category_weights = {category: float(rng.uniform(0.3, 2.0)) for category in MERCHANT_CATEGORIES}
        preferred_categories = {k: v / sum(category_weights.values()) for k, v in category_weights.items()}
        normal_hours = _normal_hours_for_seed(seed, idx)
        known_devices = [f"D{idx + 1:03d}"] + [f"D{idx + 1:03d}_{j}" for j in range(1, 2 + (idx % 3))]
        device_bias = rng.choice(known_devices)
        daily_transactions = float(np.clip(rng.normal(loc=4.0, scale=1.6), 0.5, 10.0))
        profiles[user_id] = {
            "user_id": user_id,
            "city": city,
            "usual_latitude": base_latitude + rng.normal(0, 0.05),
            "usual_longitude": base_longitude + rng.normal(0, 0.08),
            "normal_amount_mean": mean_amount,
            "normal_amount_std": amount_std,
            "normal_hours": normal_hours,
            "known_devices": known_devices,
            "usual_device": device_bias,
            "merchant_preferences": preferred_categories,
            "normal_transaction_count_per_day": daily_transactions,
            "location_name": city,
        }
    return profiles


def _choose_category(profile: Dict[str, Any], rng: np.random.Generator) -> str:
    preferences = profile.get("merchant_preferences", {})
    if not preferences:
        return rng.choice(MERCHANT_CATEGORIES)
    categories = list(preferences.keys())
    weights = np.array([preferences.get(c, 0.0) for c in categories], dtype=float)
    weights = weights / weights.sum()
    return str(rng.choice(categories, p=weights))


def _choose_device(profile: Dict[str, Any], rng: np.random.Generator, anomaly: Optional[str] = None) -> str:
    known_devices = profile.get("known_devices", [])
    if anomaly == "NEW_DEVICE":
        decorated = [f"D{int(profile['user_id'][1:]) + 1000:04d}"]
        return decorated[0]
    if not known_devices:
        return f"D{rng.integers(1, 9999):04d}"
    return str(rng.choice(known_devices))


def _random_location(profile: Dict[str, Any], rng: np.random.Generator, anomaly: Optional[str] = None) -> tuple[float, float, str]:
    if anomaly == "LOCATION_ANOMALY":
        far_city = rng.choice(list(CITY_COORDS.keys()))
        lat, lon = CITY_COORDS[far_city]
        return float(lat + rng.normal(0, 0.05)), float(lon + rng.normal(0, 0.08)), str(far_city)

    base_lat = _safe_float(profile.get("usual_latitude", 12.9141))
    base_lon = _safe_float(profile.get("usual_longitude", 74.8560))
    lat = base_lat + rng.normal(0, 0.03)
    lon = base_lon + rng.normal(0, 0.04)
    return float(lat), float(lon), str(profile.get("location_name", "Mangalore"))


def _timestamp_for_profile(profile: Dict[str, Any], rng: np.random.Generator, day: pd.Timestamp, anomaly: Optional[str] = None) -> pd.Timestamp:
    start_hour, end_hour = profile.get("normal_hours", (8, 22))
    if anomaly == "UNUSUAL_TIME":
        hour = int(rng.choice([0, 1, 2, 3, 4, 5, 6, 23]))
        minute = int(rng.integers(0, 60))
        second = int(rng.integers(0, 60))
        return pd.Timestamp(day).replace(hour=hour, minute=minute, second=second)

    hour = int(rng.integers(start_hour, end_hour + 1))
    if hour > 23:
        hour = 23
    minute = int(rng.integers(0, 60))
    second = int(rng.integers(0, 60))
    return pd.Timestamp(day).replace(hour=hour, minute=minute, second=second)


def generate_normal_transaction(profile: Dict[str, Any], timestamp: pd.Timestamp, rng: Optional[np.random.Generator] = None) -> Dict[str, Any]:
    rng = rng or _spawn_rng(42)
    mean_amount = _safe_float(profile.get("normal_amount_mean", 750.0))
    std_amount = _safe_float(profile.get("normal_amount_std", 150.0))
    amount = max(5.0, float(rng.normal(loc=mean_amount, scale=std_amount)))
    amount = float(np.clip(amount, 20.0, mean_amount * 8))

    merchant_category = _choose_category(profile, rng)
    device_id = _choose_device(profile, rng)
    latitude, longitude, location_name = _random_location(profile, rng)
    payment_method = str(rng.choice(PAYMENT_METHODS))
    transaction_type = str(rng.choice(TRANSACTION_TYPES))
    merchant_id = f"M{int(abs(np.round((latitude + longitude) * 10000))) % 100000:05d}"
    return {
        "transaction_id": f"{profile['user_id']}-{pd.Timestamp(timestamp).strftime('%Y%m%d%H%M%S')}-{rng.integers(10000, 99999)}",
        "user_id": profile["user_id"],
        "timestamp": pd.Timestamp(timestamp),
        "amount": round(amount, 2),
        "merchant_id": merchant_id,
        "merchant_category": merchant_category,
        "device_id": device_id,
        "latitude": round(latitude, 6),
        "longitude": round(longitude, 6),
        "location_name": str(location_name),
        "payment_method": payment_method,
        "transaction_type": transaction_type,
        "fraud_label": 0,
        "fraud_scenario": "normal",
    }


def resolve_transaction_scenario(
    transaction: Dict[str, Any],
    profile: Dict[str, Any],
    scenario: str,
    rng: Optional[np.random.Generator] = None,
) -> Dict[str, Any]:
    rng = rng or _spawn_rng(42)
    updated = dict(transaction)
    updated["fraud_label"] = 1
    updated["fraud_scenario"] = scenario

    if scenario == "HIGH_AMOUNT":
        updated["amount"] = round(float(updated["amount"]) * float(rng.uniform(3.5, 8.5)), 2)
    elif scenario == "HIGH_VELOCITY":
        current_ts = pd.Timestamp(updated["timestamp"])
        updated["timestamp"] = current_ts + pd.Timedelta(seconds=float(rng.integers(2, 25)))
    elif scenario == "NEW_DEVICE":
        updated["device_id"] = _choose_device(profile, rng, anomaly="NEW_DEVICE")
    elif scenario == "LOCATION_ANOMALY":
        lat, lon, city = _random_location(profile, rng, anomaly="LOCATION_ANOMALY")
        updated["latitude"] = round(lat, 6)
        updated["longitude"] = round(lon, 6)
        updated["location_name"] = city
    elif scenario == "UNUSUAL_TIME":
        base_dt = pd.Timestamp(updated["timestamp"])
        updated["timestamp"] = base_dt.replace(hour=int(rng.choice([0, 1, 2, 3, 4, 5, 6, 23])), minute=int(rng.integers(0, 60)))
    elif scenario == "MERCHANT_ANOMALY":
        categories = [c for c in MERCHANT_CATEGORIES if c != updated["merchant_category"]]
        updated["merchant_category"] = str(rng.choice(categories))
    elif scenario == "ACCOUNT_TAKEOVER":
        updated["device_id"] = _choose_device(profile, rng, anomaly="NEW_DEVICE")
        lat, lon, city = _random_location(profile, rng, anomaly="LOCATION_ANOMALY")
        updated["latitude"] = round(lat, 6)
        updated["longitude"] = round(lon, 6)
        updated["location_name"] = city
        updated["amount"] = round(float(updated["amount"]) * float(rng.uniform(4.0, 12.0)), 2)
        updated["timestamp"] = pd.Timestamp(updated["timestamp"]) + pd.Timedelta(seconds=int(rng.integers(5, 90)))
        categories = [c for c in MERCHANT_CATEGORIES if c != updated["merchant_category"]]
        updated["merchant_category"] = str(rng.choice(categories))
        base_dt = pd.Timestamp(updated["timestamp"])
        updated["timestamp"] = base_dt.replace(hour=int(rng.choice([0, 1, 2, 3, 4, 5, 6, 23])), minute=int(rng.integers(0, 60)))
    else:
        updated["fraud_label"] = 0
        updated["fraud_scenario"] = "normal"

    updated["transaction_id"] = f"{updated['user_id']}-{pd.Timestamp(updated['timestamp']).strftime('%Y%m%d%H%M%S')}-{rng.integers(10000, 99999)}"
    return updated


def generate_dataset(
    num_users: int = 1000,
    num_transactions: int = 100000,
    start_date: str = "2024-01-01",
    end_date: str = "2024-11-30",
    anomaly_rate: float = 0.08,
    seed: int = 42,
    output_csv: Optional[str | Path] = None,
) -> pd.DataFrame:
    rng = _spawn_rng(seed)
    user_profiles = build_user_profiles(num_users=num_users, seed=seed)
    start_ts = pd.Timestamp(start_date)
    end_ts = pd.Timestamp(end_date)
    generated: List[Dict[str, Any]] = []
    anomaly_count_target = int(round(num_transactions * anomaly_rate))
    all_days = pd.date_range(start_ts, end_ts, freq="D")

    if num_transactions <= 0:
        raise ValueError("num_transactions must be positive")

    user_ids = list(user_profiles.keys())
    for _ in range(num_transactions):
        user_id = str(rng.choice(user_ids))
        profile = user_profiles[user_id]
        day = pd.Timestamp(rng.choice(all_days))
        ts = _timestamp_for_profile(profile, rng, day)
        txn = generate_normal_transaction(profile, ts, rng)
        generated.append(txn)

    anomaly_indices = set(rng.choice(len(generated), size=min(anomaly_count_target, len(generated)), replace=False).tolist())
    scenarios = [
        "HIGH_AMOUNT",
        "HIGH_VELOCITY",
        "NEW_DEVICE",
        "LOCATION_ANOMALY",
        "UNUSUAL_TIME",
        "MERCHANT_ANOMALY",
        "ACCOUNT_TAKEOVER",
    ]

    for index in sorted(anomaly_indices):
        profile = user_profiles[generated[index]["user_id"]]
        scenario = str(rng.choice(scenarios))
        generated[index] = resolve_transaction_scenario(generated[index], profile, scenario, rng)

    df = pd.DataFrame(generated, columns=TRANSACTION_COLUMNS)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)
    df["fraud_label"] = df["fraud_label"].astype(int)
    df["fraud_scenario"] = df["fraud_scenario"].fillna("normal")

    output_target = Path(output_csv) if output_csv is not None else OUTPUT_CSV
    output_target.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_target, index=False)
    return df


def print_dataset_quality_report(df: pd.DataFrame) -> None:
    missing_values = int(df.isna().sum().sum())
    duplicate_ids = int(df["transaction_id"].duplicated().sum())
    scenario_counts = df["fraud_scenario"].value_counts(dropna=False).to_dict()

    print("Dataset quality report")
    print(f"Total transactions: {len(df):,}")
    print(f"Number of users: {df['user_id'].nunique():,}")
    print(f"Anomaly count: {int(df['fraud_label'].sum())}")
    print(f"Anomaly percentage: {df['fraud_label'].mean() * 100:.2f}%")
    print(f"Date range: {df['timestamp'].min()} -> {df['timestamp'].max()}")
    print(f"Amount statistics: mean={df['amount'].mean():.2f}, median={df['amount'].median():.2f}, max={df['amount'].max():.2f}")
    print(f"Transactions per user: mean={df.groupby('user_id').size().mean():.2f}, max={df.groupby('user_id').size().max()}")
    print(f"Transactions per day: {df.groupby(df['timestamp'].dt.date).size().mean():.2f} average/day")
    print(f"Unique devices: {df['device_id'].nunique():,}")
    print(f"Unique merchants: {df['merchant_id'].nunique():,}")
    print(f"Missing values: {missing_values}")
    print(f"Duplicate transaction IDs: {duplicate_ids}")
    print("Scenario counts:")
    for scenario, count in sorted(scenario_counts.items()):
        print(f"  {scenario}: {count}")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate synthetic UPI behavioural transaction data.")
    parser.add_argument("--num-users", type=int, default=1000)
    parser.add_argument("--num-transactions", type=int, default=100000)
    parser.add_argument("--start-date", type=str, default="2024-01-01")
    parser.add_argument("--end-date", type=str, default="2024-11-30")
    parser.add_argument("--anomaly-rate", type=float, default=0.08)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df = generate_dataset(
        num_users=args.num_users,
        num_transactions=args.num_transactions,
        start_date=args.start_date,
        end_date=args.end_date,
        anomaly_rate=args.anomaly_rate,
        seed=args.seed,
        output_csv=OUTPUT_CSV,
    )
    print_dataset_quality_report(df)
