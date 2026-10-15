from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

import pandas as pd
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

try:
    from ml.features import build_behavioural_features
    from ml.generator import build_user_profiles
    from ml.predict import predict_anomaly
    from simulator.scenarios import (
        generate_account_takeover,
        generate_high_amount_transaction,
        generate_location_anomaly,
        generate_new_device_transaction,
        generate_normal_transaction,
        generate_unusual_time_transaction,
        generate_velocity_attack,
    )
    ML_ENGINE_AVAILABLE = True
except ImportError:
    ML_ENGINE_AVAILABLE = False

USER_HISTORY: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
logger = logging.getLogger(__name__)
load_dotenv(Path(__file__).resolve().parents[1] / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
_database_engine: Optional[Engine] = None


def _get_database_engine() -> Engine:
    global _database_engine
    if not DATABASE_URL:
        raise HTTPException(status_code=503, detail="Transaction database is not configured.")
    if _database_engine is None:
        _database_engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=1800,
            connect_args={"connect_timeout": 5},
        )
    return _database_engine


TRANSACTION_QUERY = """
SELECT
    t.transaction_id,
    t.timestamp,
    t.amount,
    t.merchant_name,
    t.merchant_vpa,
    t.device_id,
    t.location_name,
    t.fraud_label,
    t.fraud_scenario,
    u.full_name,
    u.vpa,
    a.risk_score,
    a.risk_level,
    a.alert_type,
    a.status AS alert_status
FROM transactions AS t
LEFT JOIN users AS u ON u.user_id = t.user_id
LEFT JOIN LATERAL (
    SELECT risk_score, risk_level, alert_type, status
    FROM alerts
    WHERE alerts.transaction_id = t.id
    ORDER BY created_at DESC
    LIMIT 1
) AS a ON TRUE
"""


def _query_transactions(
    search: Optional[str] = None,
    risk: Optional[str] = None,
    transaction_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    conditions = []
    params: Dict[str, Any] = {}
    if search:
        conditions.append(
            "(u.full_name ILIKE :search OR t.transaction_id ILIKE :search OR u.vpa ILIKE :search)"
        )
        params["search"] = f"%{search}%"
    if risk and risk.upper() != "ALL":
        conditions.append(
            "UPPER(COALESCE(a.risk_level, CASE WHEN t.fraud_label = 1 THEN 'HIGH' ELSE 'LOW' END)) = :risk"
        )
        params["risk"] = risk.upper()
    if transaction_id:
        conditions.append("t.transaction_id = :transaction_id")
        params["transaction_id"] = transaction_id

    query = TRANSACTION_QUERY
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY t.timestamp DESC, t.transaction_id DESC"

    try:
        with _get_database_engine().connect() as connection:
            return [dict(row) for row in connection.execute(text(query), params).mappings()]
    except SQLAlchemyError as exc:
        logger.exception("Unable to query PostgreSQL transaction data")
        raise HTTPException(
            status_code=503,
            detail="Transaction database is temporarily unavailable.",
        ) from exc


def _transaction_payload(row: Dict[str, Any]) -> Dict[str, Any]:
    timestamp = row["timestamp"]
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=UTC)
    timestamp = timestamp.astimezone(ZoneInfo("Asia/Kolkata"))

    amount = float(row["amount"])
    fraud_label = bool(row["fraud_label"])
    risk_level = row["risk_level"] or ("HIGH" if fraud_label else "LOW")
    risk_score = row["risk_score"]
    scenario = row["alert_type"] or row["fraud_scenario"]
    trigger_signal = scenario.replace("_", " ").title() if scenario else "Baseline transaction"
    alert_status = (row["alert_status"] or "").upper()
    if alert_status in {"OPEN", "INVESTIGATING"}:
        status = "Investigating"
    elif alert_status:
        status = "Resolved"
    else:
        status = "Review case" if fraud_label else "Cleared"
    evidence = []
    if fraud_label:
        evidence.append(
            {
                "title": (scenario or "Fraud signal").replace("_", " ").upper(),
                "description": f"Transaction flagged for {trigger_signal.lower()}.",
                "severity": risk_level,
            }
        )

    return {
        "id": row["transaction_id"],
        "rrn": "",
        "user": row["full_name"] or row["vpa"] or row["transaction_id"],
        "vpa": row["vpa"] or "",
        "amount": amount,
        "amountFormatted": f"₹{amount:,.0f}",
        "triggerSignal": trigger_signal,
        "riskLevel": risk_level,
        "riskScore": risk_score,
        "status": status,
        "timestamp": timestamp.strftime("%H:%M:%S IST"),
        "date": timestamp.strftime("%d %b %Y"),
        "device": row["device_id"],
        "location": row["location_name"] or "Unknown",
        "merchant": row["merchant_name"],
        "merchantVpa": row["merchant_vpa"] or "",
        "merchantBankingName": row["merchant_name"],
        "evidence": evidence,
    }

def _normalize_timestamp(value: Optional[datetime]) -> pd.Timestamp:
    if value is None:
        return pd.Timestamp.now().tz_localize(None)
    ts = pd.Timestamp(value)
    if ts.tzinfo is not None:
        ts = ts.tz_convert("UTC").tz_localize(None)
    return ts

app = FastAPI(
    title="UPI Sentinel Behavioural Fraud Detection API",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Live Backend Datasets
OVERVIEW_DATA = {
    "kpis": {
        "volumeMonitored": "₹4.82 Cr",
        "volumeSubtitle": "14,210 transactions today · 99.8% within baseline",
        "volumeProgress": 99.8,
        "anomaliesFlagged": "28 cases",
        "anomaliesSubtitle": "0.19% rate · 6 currently under active triage",
        "anomaliesProgress": 19,
        "avgInvestigationTime": "4.2 mins",
        "avgSubtitle": "Well within 15 min team SLA (98.4% resolved)",
        "avgProgress": 85,
    },
    "behaviouralSignals": [
        {"name": "Amount Outlier", "percentage": 38, "color": "#8B9A6E"},
        {"name": "Rapid Velocity", "percentage": 29, "color": "#8B9A6E"},
        {"name": "Unrecognised Device", "percentage": 18, "color": "#8B9A6E"},
        {"name": "Location Leap / Speed", "percentage": 10, "color": "#D97706"},
        {"name": "Off-Hours Settlement", "percentage": 5, "color": "#8B9A6E"},
    ],
    "analystObservation": "Most deviations this shift originate from high-ticket spikes on newly bound devices.",
    "shiftNotes": {
        "author": "Lead Analyst Anand Sharma",
        "timestamp": "Logged at 06:30 IST",
        "text": "UPI server switch v2.4 patch deployed at 02:00 IST. Isolation Forest thresholds recalibrated for festive merchant volumes.",
        "status": "Handover Confirmed",
    },
}

DEMO_SCENARIOS = [
  {
    "id": "normal",
    "label": "Normal (₹450)",
    "merchant": "Chai Point",
    "merchantVpa": "chaipoint@hdfcbank",
    "merchantBankingName": "MOUNTAIN TRAIL FOODS PVT LTD",
    "amount": 450,
    "amountFormatted": "₹ 450",
    "description": "Evening tea and refreshments",
    "userAccount": "HDFC Bank •••• 4821",
    "accountType": "Savings Account (Primary)",
    "avatarLetter": "C",
    "riskScore": 8,
    "riskLevel": "LOW",
    "statusMessage": "Payload analyzed • 99.9% baseline match. Zero anomaly flags.",
  },
  {
    "id": "high_amount",
    "label": "High Amount (₹38,500)",
    "merchant": "Apex Gold & Jewellery",
    "merchantVpa": "apexjewels@hdfcbank",
    "merchantBankingName": "APEX BULLION TRADERS PVT LTD",
    "amount": 38500,
    "amountFormatted": "₹ 38,500",
    "description": "Wedding jewellery advance payment",
    "userAccount": "HDFC Bank •••• 4821",
    "accountType": "Savings Account (Primary)",
    "avatarLetter": "A",
    "riskScore": 84,
    "riskLevel": "HIGH",
    "statusMessage": "Payload analyzed • 12.4x volume spike + New device binding triggered.",
  },
  {
    "id": "new_device",
    "label": "New Device",
    "merchant": "Electronics Bazaar",
    "merchantVpa": "electrobazaar@icici",
    "merchantBankingName": "BAZAAR RETAIL ENTERPRISES",
    "amount": 52000,
    "amountFormatted": "₹ 52,000",
    "description": "Flagship smartphone purchase",
    "userAccount": "ICICI Bank •••• 9102",
    "accountType": "Salary Account",
    "avatarLetter": "E",
    "riskScore": 89,
    "riskLevel": "HIGH",
    "statusMessage": "Unrecognised device hardware key • Isolation Forest score: 0.89.",
  },
  {
    "id": "midnight_transfer",
    "label": "Midnight Transfer",
    "merchant": "Winzo Games",
    "merchantVpa": "winzogaming@upi",
    "merchantBankingName": "WINZO GAMES INDIA PVT LTD",
    "amount": 21200,
    "amountFormatted": "₹ 21,200",
    "description": "Off-hours gaming wallet recharge",
    "userAccount": "Axis Bank •••• 3341",
    "accountType": "Digital Savings",
    "avatarLetter": "W",
    "riskScore": 76,
    "riskLevel": "MEDIUM",
    "statusMessage": "Off-hours burst detected (02:14 AM IST) • Velocity threshold warning.",
  },
]

SIMULATOR_SCENARIOS = [
  {"id": "normal", "name": "Normal Transaction", "risk": "LOW", "score": 12},
  {"id": "high_amount", "name": "High Amount Spike", "risk": "HIGH", "score": 84},
  {"id": "high_velocity", "name": "High Velocity Burst", "risk": "CRITICAL", "score": 96},
  {"id": "new_device", "name": "Unbound New Device", "risk": "HIGH", "score": 89},
  {"id": "location_leap", "name": "Location Leap / Speed", "risk": "CRITICAL", "score": 92},
  {"id": "unusual_time", "name": "Unusual Off-Hours", "risk": "MEDIUM", "score": 65},
  {"id": "merchant_anomaly", "name": "High-Risk Merchant Category", "risk": "HIGH", "score": 78},
  {"id": "account_takeover", "name": "SIM-Swap / Dormancy Wake-Up", "risk": "CRITICAL", "score": 95},
]

class SimulationRequest(BaseModel):
    scenarioId: Optional[str] = "impossible_travel"
    amount: Optional[float] = 38500.0
    payee: Optional[str] = "Apex Gold Jewellery"
    deviceId: Optional[str] = "DEVICE_99"
    location: Optional[str] = "Bengaluru"
    timestamp: Optional[str] = "03:17 AM"

class ScenarioRequest(BaseModel):
    user_id: Optional[str] = "U001"
    scenario: Optional[str] = "normal"
    timestamp: Optional[datetime] = None
    seed: int = 42

SCENARIO_GENERATORS = {
    "normal": generate_normal_transaction,
    "high_amount": generate_high_amount_transaction,
    "amount_spike": generate_high_amount_transaction,
    "high_velocity": generate_velocity_attack,
    "velocity": generate_velocity_attack,
    "new_device": generate_new_device_transaction,
    "location_leap": generate_location_anomaly,
    "location_anomaly": generate_location_anomaly,
    "impossible_travel": generate_location_anomaly,
    "unusual_time": generate_unusual_time_transaction,
    "merchant_anomaly": generate_high_amount_transaction,
    "account_takeover": generate_account_takeover,
}


def _normalize_scenario_name(value: Optional[str]) -> str:
    if value is None:
        return "normal"
    normalized = value.strip().lower().replace("-", "_").replace(" ", "_")
    if normalized in {"amount_spike", "high_amount"}:
        return "high_amount"
    if normalized in {"velocity", "high_velocity"}:
        return "high_velocity"
    if normalized in {"location_leap", "location_anomaly", "impossible_travel"}:
        return "location_anomaly"
    if normalized in {"unusual", "unusual_time", "off_hours", "off_hours_transaction"}:
        return "unusual_time"
    return normalized


@app.get("/")
def root():
    return {"message": "UPI Sentinel Fraud Intelligence API", "status": "active"}

@app.get("/health")
def health():
    return {"status": "healthy", "engine": "IForest-v2.4", "latency_ms": 14}

@app.get("/api/overview")
def get_overview():
    return OVERVIEW_DATA

@app.get("/api/transactions")
def get_transactions(search: Optional[str] = None, risk: Optional[str] = None):
    return [_transaction_payload(row) for row in _query_transactions(search=search, risk=risk)]

@app.get("/api/transactions/scenarios")
def get_demo_scenarios():
    return DEMO_SCENARIOS

@app.get("/api/transactions/{id}")
def get_transaction_by_id(id: str):
    legacy_ids = {"TX10291": "U001-20240615095020-2042"}
    results = _query_transactions(transaction_id=legacy_ids.get(id, id))
    if not results:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return _transaction_payload(results[0])

@app.get("/api/simulator/scenarios")
def get_simulator_scenarios():
    return SIMULATOR_SCENARIOS

@app.post("/api/simulator/scenario")
def run_scenario(req: ScenarioRequest):
    scenario_name = _normalize_scenario_name(req.scenario)
    generator = SCENARIO_GENERATORS.get(scenario_name, generate_normal_transaction)
    timestamp = req.timestamp or datetime.now(UTC)
    transaction = generator(user_id=req.user_id or "U001", timestamp=timestamp, seed=req.seed)

    if not isinstance(transaction, dict):
        raise HTTPException(status_code=500, detail="Scenario generator did not return a transaction payload.")

    user_profile_count = max(5, (int(str(req.user_id or "U001")[1:]) if str(req.user_id or "U001").startswith("U") else 1) + 5)
    profiles = build_user_profiles(num_users=user_profile_count, seed=req.seed)
    historical_transactions = []
    baseline_ts = pd.Timestamp(timestamp)
    for offset in range(3):
        historical_transactions.append(
            generate_normal_transaction(
                user_id=req.user_id or "U001",
                timestamp=baseline_ts - pd.Timedelta(hours=3 - offset, minutes=offset * 7),
                seed=req.seed + offset + 10,
            )
        )

    frame = pd.DataFrame(historical_transactions + [transaction])
    feature_frame = build_behavioural_features(frame, profiles)
    prediction = predict_anomaly(feature_frame.tail(1))

    transaction_payload = dict(transaction)
    if "timestamp" in transaction_payload and hasattr(transaction_payload["timestamp"], "isoformat"):
        transaction_payload["timestamp"] = transaction_payload["timestamp"].isoformat()

    return {
        "transaction": transaction_payload,
        "prediction": prediction,
    }


@app.post("/api/simulator/run")
def run_simulation(req: SimulationRequest):
    score = 87
    risk_level = "CRITICAL"
    if req.scenarioId == "normal":
        score = 8
        risk_level = "LOW"
    elif req.scenarioId == "high_amount" or req.scenarioId == "amount_spike":
        score = 78
        risk_level = "HIGH"
    elif req.scenarioId == "high_velocity" or req.scenarioId == "velocity":
        score = 96
        risk_level = "CRITICAL"
    elif req.scenarioId == "new_device":
        score = 89
        risk_level = "HIGH"
    elif req.scenarioId == "location_leap" or req.scenarioId == "impossible_travel":
        score = 92
        risk_level = "CRITICAL"

    return {
        "compositeRiskScore": score,
        "riskLevel": risk_level,
        "severity": "CRITICAL SEVERITY" if score > 85 else "HIGH RISK TRIGGER",
        "treeDepth": 4.1,
        "treeDepthAvg": 11.2,
        "inferenceLatencyMs": 14,
        "deviations": [
            {
                "title": f"Amount Spike: ₹{req.amount:,.0f}" if req.amount else "Amount Spike",
                "points": 32,
                "detail": "12.4x historical baseline (₹1,240 · 4.8σ outlier)",
                "type": "spike",
            },
            {
                "title": f"Unrecognized Hardware: {req.deviceId}" if req.deviceId else "Unrecognized Hardware",
                "points": 25,
                "detail": "Hardware signature not in user's 2 registered handsets",
                "type": "device",
            },
            {
                "title": "Velocity Surge: 4 txns in 2 mins",
                "points": 18,
                "detail": "Breaches 99.8th percentile rolling limit",
                "type": "velocity",
            },
            {
                "title": "Geolocation Leap: Impossible Travel",
                "points": 12,
                "detail": "Mangaluru → Bengaluru (350 km in 79 mins, >260 km/h)",
                "type": "geo",
            },
        ],
        "explainabilityText": "Payload path reached anomaly leaf node at depth 4.1 (vs baseline 11.2). Compound penalty initiated by impossible displacement speed and unverified device signature.",
        "pipeline": [
          {"step": "Ingested", "status": "Completed", "detail": "Switch feed"},
          {"step": "Vectors", "status": "Completed", "detail": "15 features"},
          {"step": "Rules", "status": "Completed", "detail": "Sliding window"},
          {"step": "Scored", "status": "Completed", "detail": "Depth 4.1"},
        ]
    }

@app.get("/api/analytics")
def get_analytics():
    return {
        "volumeTrend": [
            {"time": "00:00", "volume": 1200, "riskCases": 1},
            {"time": "03:00", "volume": 450, "riskCases": 4},
            {"time": "06:00", "volume": 2100, "riskCases": 2},
            {"time": "09:00", "volume": 8400, "riskCases": 5},
            {"time": "12:00", "volume": 14210, "riskCases": 8},
            {"time": "15:00", "volume": 11200, "riskCases": 6},
            {"time": "18:00", "volume": 9800, "riskCases": 2},
            {"time": "21:00", "volume": 6400, "riskCases": 0},
        ],
        "riskDistribution": [
            {"name": "Low Risk (<20)", "value": 13950, "color": "#8B9A6E"},
            {"name": "Medium Risk (20-60)", "value": 232, "color": "#CA8A04"},
            {"name": "High Risk (60-85)", "value": 22, "color": "#D97706"},
            {"name": "Critical (>85)", "value": 6, "color": "#DC2626"},
        ],
        "signalContributions": [
            {"name": "Amount Outlier", "percentage": 38},
            {"name": "Rapid Velocity", "percentage": 29},
            {"name": "Unrecognized Device", "percentage": 18},
            {"name": "Location Leap", "percentage": 10},
            {"name": "Off-Hours Settlement", "percentage": 5},
        ]
    }
