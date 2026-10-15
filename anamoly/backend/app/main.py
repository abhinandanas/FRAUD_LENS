from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from typing import Any, Dict, List, Optional
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

TRANSACTIONS_DB = [
    {
        "id": "TX10291",
        "rrn": "329810482910",
        "user": "Rohit Kumar",
        "vpa": "rohit.k@okaxis",
        "amount": 38500,
        "amountFormatted": "₹38,500",
        "triggerSignal": "New device + 12x volume spike",
        "riskLevel": "HIGH",
        "riskScore": 84,
        "status": "Review case",
        "timestamp": "14:26:12 IST",
        "date": "24 Oct 2026",
        "device": "iPhone 15 Pro (Unbound)",
        "location": "Bengaluru, KA",
        "merchant": "Apex Gold & Jewellery",
        "merchantVpa": "apexjewels@hdfcbank",
        "merchantBankingName": "APEX BULLION TRADERS PVT LTD",
        "evidence": [
            {
                "title": "AMOUNT ANOMALY",
                "description": "Transaction amount (₹38,500) is 12.4x historical average (₹1,240).",
                "severity": "CRITICAL",
            },
            {
                "title": "UNRECOGNIZED HARDWARE",
                "description": "Hardware signature DEVICE_99 not in user's 2 registered handsets.",
                "severity": "HIGH",
            },
            {
                "title": "VELOCITY SURGE",
                "description": "4 transactions in 2 mins breaching 99.8th percentile rolling limit.",
                "severity": "HIGH",
            },
            {
                "title": "GEOLOCATION LEAP",
                "description": "Mangaluru → Bengaluru (350 km in 79 mins, speed >260 km/h).",
                "severity": "CRITICAL",
            },
        ],
    },
    {
        "id": "TX10287",
        "rrn": "329810482870",
        "user": "Neha Sengupta",
        "vpa": "nehasengupta@paytm",
        "amount": 21200,
        "amountFormatted": "₹21,200",
        "triggerSignal": "Velocity burst (6 txns / 90s)",
        "riskLevel": "CRITICAL",
        "riskScore": 96,
        "status": "Investigating",
        "timestamp": "14:24:45 IST",
        "date": "24 Oct 2026",
        "device": "OnePlus 11 5G",
        "location": "Kolkata, WB",
        "merchant": "QuickCash Pay",
        "merchantVpa": "quickcash@icici",
        "merchantBankingName": "QUICK SERVICES PVT LTD",
        "evidence": [
            {
                "title": "RAPID VELOCITY",
                "description": "6 consecutive outbound transactions totaling ₹21,200 within 90 seconds.",
                "severity": "CRITICAL",
            },
        ],
    },
    {
        "id": "TX10284",
        "rrn": "329810482840",
        "user": "Rahul Singh",
        "vpa": "rahulsingh@ybl",
        "amount": 64000,
        "amountFormatted": "₹64,000",
        "triggerSignal": "Dormancy wake-up (48d inactive)",
        "riskLevel": "HIGH",
        "riskScore": 79,
        "status": "Review case",
        "timestamp": "14:20:02 IST",
        "date": "24 Oct 2026",
        "device": "Samsung Galaxy S24",
        "location": "Mumbai, MH",
        "merchant": "Global Crypto Exchange",
        "merchantVpa": "globalcrypto@pnb",
        "merchantBankingName": "GLOBAL TRADING VENTURES",
        "evidence": [],
    },
    {
        "id": "TX10280",
        "rrn": "329810482800",
        "user": "Winzo Gaming",
        "vpa": "winzogaming@upi",
        "amount": 9800,
        "amountFormatted": "₹9,800",
        "triggerSignal": "High velocity midnight burst",
        "riskLevel": "MEDIUM",
        "riskScore": 58,
        "status": "Resolved",
        "timestamp": "14:15:30 IST",
        "date": "24 Oct 2026",
        "device": "Redmi Note 13",
        "location": "Delhi, DL",
        "merchant": "Winzo Games India",
        "merchantVpa": "pay@winzo",
        "merchantBankingName": "WINZO GAMES PVT LTD",
        "evidence": [],
    },
]

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
    results = TRANSACTIONS_DB
    if search:
        s = search.lower()
        results = [
            t for t in results
            if s in t["user"].lower() or s in t["id"].lower() or s in t["rrn"] or s in t["vpa"].lower()
        ]
    if risk and risk != "ALL":
        results = [t for t in results if t["riskLevel"] == risk]
    return results

@app.get("/api/transactions/scenarios")
def get_demo_scenarios():
    return DEMO_SCENARIOS

@app.get("/api/transactions/{id}")
def get_transaction_by_id(id: str):
    for tx in TRANSACTIONS_DB:
        if tx["id"] == id:
            return tx
    raise HTTPException(status_code=404, detail="Transaction not found")

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
