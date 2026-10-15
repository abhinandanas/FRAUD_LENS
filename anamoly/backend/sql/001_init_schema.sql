CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    vpa VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL,
    device_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(50) NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    merchant_name VARCHAR(150) NOT NULL,
    merchant_vpa VARCHAR(150),
    merchant_category VARCHAR(80) NOT NULL,
    payment_method VARCHAR(40) NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    device_id VARCHAR(50) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_name VARCHAR(100),
    fraud_label SMALLINT NOT NULL DEFAULT 0,
    fraud_scenario VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_time ON transactions (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_fraud ON transactions (fraud_label, fraud_scenario);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    risk_score INT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    alert_type VARCHAR(80) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_alerts_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON alerts (user_id, status, created_at DESC);
