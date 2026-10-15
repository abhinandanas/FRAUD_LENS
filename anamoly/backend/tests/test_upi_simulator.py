from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_simulator_scenario_endpoint_detects_fraud_result():
    response = client.post("/api/simulator/scenario", json={"scenario": "account_takeover", "user_id": "U001"})
    assert response.status_code == 200
    payload = response.json()
    assert "transaction" in payload
    assert "prediction" in payload
    assert "is_anomaly" in payload["prediction"]
    assert payload["transaction"]["user_id"] == "U001"
