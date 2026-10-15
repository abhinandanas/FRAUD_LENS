from pathlib import Path

from ml.generator import generate_dataset


def test_generate_dataset_is_deterministic_and_schema_consistent():
    csv_path = Path("data/generated/test_deterministic.csv")
    ds1 = generate_dataset(
        num_users=25,
        num_transactions=300,
        start_date="2024-01-01",
        end_date="2024-02-01",
        anomaly_rate=0.1,
        seed=42,
        output_csv=csv_path,
    )
    ds2 = generate_dataset(
        num_users=25,
        num_transactions=300,
        start_date="2024-01-01",
        end_date="2024-02-01",
        anomaly_rate=0.1,
        seed=42,
        output_csv=csv_path,
    )

    assert ds1.equals(ds2)

    required = {
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
    }
    assert required.issubset(ds1.columns)
    assert len(ds1) == 300
    assert ds1["timestamp"].is_monotonic_increasing


def test_generate_dataset_has_ground_truth_fields_for_evaluation():
    df = generate_dataset(
        num_users=10,
        num_transactions=100,
        start_date="2024-01-01",
        end_date="2024-01-10",
        anomaly_rate=0.15,
        seed=7,
        output_csv=Path("data/generated/test_ground_truth.csv"),
    )

    assert "fraud_label" in df.columns
    assert "fraud_scenario" in df.columns
    assert set(df["fraud_label"].unique()).issubset({0, 1})
