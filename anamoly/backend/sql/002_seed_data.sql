INSERT INTO users (user_id, full_name, vpa, city, device_count)
VALUES
    ('U001', 'Aarav Mehta', 'aarav@upi', 'Bengaluru', 2),
    ('U002', 'Neha Sharma', 'neha@upi', 'Delhi', 3),
    ('U003', 'Karan Iyer', 'karan@upi', 'Mumbai', 2),
    ('U004', 'Priya Nair', 'priya@upi', 'Kochi', 1)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO transactions (
    user_id,
    transaction_id,
    timestamp,
    amount,
    merchant_name,
    merchant_vpa,
    merchant_category,
    payment_method,
    transaction_type,
    device_id,
    latitude,
    longitude,
    location_name,
    fraud_label,
    fraud_scenario
)
VALUES
    ('U001', 'U001-20240615093011-1021', '2024-06-15 09:30:11+00', 450.00, 'Chai Point', 'chaipoint@hdfcbank', 'Restaurants', 'UPI', 'PAYMENT', 'D001', 12.9716, 77.5946, 'Bengaluru', 0, 'normal'),
    ('U001', 'U001-20240615095020-2042', '2024-06-15 09:50:20+00', 36500.00, 'Apex Gold & Jewellery', 'apexjewels@hdfcbank', 'Shopping', 'UPI', 'PAYMENT', 'D999', 12.9716, 77.5946, 'Bengaluru', 1, 'ACCOUNT_TAKEOVER'),
    ('U002', 'U002-20240615092022-3021', '2024-06-15 09:20:22+00', 1250.00, 'Metro Pharmacy', 'metro@yesbank', 'Healthcare', 'Credit Card', 'PAYMENT', 'D004', 28.6139, 77.2090, 'Delhi', 0, 'normal'),
    ('U003', 'U003-20240615081518-5012', '2024-06-15 08:15:18+00', 9800.00, 'Winzo Games', 'winzo@upi', 'Entertainment', 'Wallet', 'TOPUP', 'D005', 19.0760, 72.8777, 'Mumbai', 1, 'HIGH_VELOCITY')
ON CONFLICT (transaction_id) DO NOTHING;

INSERT INTO alerts (transaction_id, user_id, risk_score, risk_level, alert_type, status)
SELECT t.id, t.user_id, 94, 'CRITICAL', 'ACCOUNT_TAKEOVER', 'OPEN'
FROM transactions t
WHERE t.transaction_id = 'U001-20240615095020-2042'
ON CONFLICT DO NOTHING;

INSERT INTO alerts (transaction_id, user_id, risk_score, risk_level, alert_type, status)
SELECT t.id, t.user_id, 76, 'HIGH', 'UNUSUAL_DEVICE', 'OPEN'
FROM transactions t
WHERE t.transaction_id = 'U003-20240615081518-5012'
ON CONFLICT DO NOTHING;
