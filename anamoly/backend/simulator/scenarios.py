from __future__ import annotations

from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd

from ml.generator import (
    _spawn_rng,
    build_user_profiles,
    generate_normal_transaction as shared_generate_normal_transaction,
    resolve_transaction_scenario,
)


def _profile_for_user(user_id: str, seed: int = 42):
    profiles = build_user_profiles(num_users=max(1, int(user_id[1:]) + 1), seed=seed)
    return profiles.get(user_id, next(iter(profiles.values())))


def generate_normal_transaction(user_id: str = "U001", timestamp: Optional[datetime] = None, seed: int = 42):
    profile = _profile_for_user(user_id, seed)
    ts = pd.Timestamp(timestamp) if timestamp is not None else pd.Timestamp.utcnow()
    rng = _spawn_rng(seed)
    return shared_generate_normal_transaction(profile, ts, rng)


def generate_high_amount_transaction(user_id: str = "U001", timestamp: Optional[datetime] = None, seed: int = 42):
    profile = _profile_for_user(user_id, seed)
    ts = pd.Timestamp(timestamp) if timestamp is not None else pd.Timestamp.now(tz="UTC").tz_localize(None)
    rng = _spawn_rng(seed)
    txn = shared_generate_normal_transaction(profile, ts, rng)
    return resolve_transaction_scenario(txn, profile, "HIGH_AMOUNT", rng)


def generate_velocity_attack(user_id: str = "U001", timestamp: Optional[datetime] = None, seed: int = 42):
    profile = _profile_for_user(user_id, seed)
    ts = pd.Timestamp(timestamp) if timestamp is not None else pd.Timestamp.now(tz="UTC").tz_localize(None)
    rng = _spawn_rng(seed)
    txn = shared_generate_normal_transaction(profile, ts, rng)
    return resolve_transaction_scenario(txn, profile, "HIGH_VELOCITY", rng)


def generate_new_device_transaction(user_id: str = "U001", timestamp: Optional[datetime] = None, seed: int = 42):
    profile = _profile_for_user(user_id, seed)
    ts = pd.Timestamp(timestamp) if timestamp is not None else pd.Timestamp.now(tz="UTC").tz_localize(None)
    rng = _spawn_rng(seed)
    txn = shared_generate_normal_transaction(profile, ts, rng)
    return resolve_transaction_scenario(txn, profile, "NEW_DEVICE", rng)


def generate_location_anomaly(user_id: str = "U001", timestamp: Optional[datetime] = None, seed: int = 42):
    profile = _profile_for_user(user_id, seed)
    ts = pd.Timestamp(timestamp) if timestamp is not None else pd.Timestamp.now(tz="UTC").tz_localize(None)
    rng = _spawn_rng(seed)
    txn = shared_generate_normal_transaction(profile, ts, rng)
    return resolve_transaction_scenario(txn, profile, "LOCATION_ANOMALY", rng)


def generate_unusual_time_transaction(user_id: str = "U001", timestamp: Optional[datetime] = None, seed: int = 42):
    profile = _profile_for_user(user_id, seed)
    ts = pd.Timestamp(timestamp) if timestamp is not None else pd.Timestamp.now(tz="UTC").tz_localize(None)
    rng = _spawn_rng(seed)
    txn = shared_generate_normal_transaction(profile, ts, rng)
    return resolve_transaction_scenario(txn, profile, "UNUSUAL_TIME", rng)


def generate_account_takeover(user_id: str = "U001", timestamp: Optional[datetime] = None, seed: int = 42):
    profile = _profile_for_user(user_id, seed)
    ts = pd.Timestamp(timestamp) if timestamp is not None else pd.Timestamp.now(tz="UTC").tz_localize(None)
    rng = _spawn_rng(seed)
    txn = shared_generate_normal_transaction(profile, ts, rng)
    return resolve_transaction_scenario(txn, profile, "ACCOUNT_TAKEOVER", rng)
