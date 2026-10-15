from __future__ import annotations

from datetime import datetime
from typing import Dict, Optional

import numpy as np
import pandas as pd

from ml.generator import (
    _spawn_rng,
    build_user_profiles,
    generate_dataset,
    generate_normal_transaction,
    resolve_transaction_scenario,
)


def generate_seed_transaction(
    user_id: Optional[str] = None,
    timestamp: Optional[datetime] = None,
    seed: int = 42,
    scenario: Optional[str] = None,
) -> dict:
    """Generate a single transaction using the same generator used for offline data."""
    profiles = build_user_profiles(num_users=max(1, int((user_id[1:]) if user_id else 1) + 1), seed=seed)
    if user_id is None:
        user_id = next(iter(profiles))
    profile = profiles.get(user_id, next(iter(profiles.values())))
    ts = pd.Timestamp(timestamp) if timestamp is not None else pd.Timestamp.utcnow()
    rng = _spawn_rng(seed)
    transaction = generate_normal_transaction(profile, ts, rng)
    if scenario:
        transaction = resolve_transaction_scenario(transaction, profile, scenario, rng)
    return transaction


def generate_simulation_dataset(
    num_users: int = 200,
    num_transactions: int = 5000,
    start_date: str = "2024-08-01",
    end_date: str = "2024-08-31",
    anomaly_rate: float = 0.08,
    seed: int = 42,
) -> pd.DataFrame:
    return generate_dataset(
        num_users=num_users,
        num_transactions=num_transactions,
        start_date=start_date,
        end_date=end_date,
        anomaly_rate=anomaly_rate,
        seed=seed,
    )
