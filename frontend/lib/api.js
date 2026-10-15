const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchOverviewData() {
  const res = await fetch(`${API_BASE_URL}/api/overview`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch overview data from backend: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchTransactions(filters = {}) {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.riskLevel) query.set("risk", filters.riskLevel);
  const url = `${API_BASE_URL}/api/transactions?${query.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch transactions from backend: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchDemoScenarios() {
  const res = await fetch(`${API_BASE_URL}/api/transactions/scenarios`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch demo scenarios from backend: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchSimulatorScenarios() {
  const res = await fetch(`${API_BASE_URL}/api/simulator/scenarios`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch simulator scenarios from backend: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchTransactionById(id) {
  const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch transaction ${id} from backend: ${res.statusText}`);
  }
  return await res.json();
}

export async function processPaymentDemoPayload(scenarioId, customData = {}) {
  const res = await fetch(`${API_BASE_URL}/api/simulator/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId, ...customData }),
  });
  if (!res.ok) {
    throw new Error(`Failed to process payment demo payload via backend: ${res.statusText}`);
  }
  const data = await res.json();
  return {
    success: true,
    transaction: {
      id: `TX${Math.floor(10000 + Math.random() * 90000)}`,
      riskLevel: data.riskLevel,
      riskScore: data.compositeRiskScore,
    },
    scenario: data,
  };
}

export async function runSimulation(payload) {
  const bodyData = typeof payload === "string" ? { scenarioId: payload } : payload;
  const res = await fetch(`${API_BASE_URL}/api/simulator/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyData),
  });
  if (!res.ok) {
    throw new Error(`Backend simulator API error: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchAnalyticsData() {
  const res = await fetch(`${API_BASE_URL}/api/analytics`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics data from backend: ${res.statusText}`);
  }
  return await res.json();
}