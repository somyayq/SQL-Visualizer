import { type DatabaseConfig } from "../hooks/useDatabaseConfig";
const apiUrl=import.meta.env.VITE_API_URL;

const MOCK_PLAN = {
  nodes: [
    { id: 1, label: "Hash Join", type: "Hash Join", rows: 1000, cost: 50.5 },
    { id: 2, label: "Seq Scan", type: "Seq Scan", rows: 1000, cost: 20.0 },
    { id: 3, label: "Hash", type: "Hash", rows: 500, cost: 15.0 },
    { id: 4, label: "Seq Scan", type: "Seq Scan", rows: 500, cost: 10.0 }
  ],
  edges: [
    { source: 2, target: 1 },
    { source: 3, target: 1 },
    { source: 4, target: 3 }
  ]
};

const MOCK_OPT_PLAN = {
  nodes: [
    { id: 1, label: "Nested Loop", type: "Nested Loop", rows: 1000, cost: 25.5 },
    { id: 2, label: "Index Scan", type: "Index Scan", rows: 1000, cost: 10.0 },
    { id: 3, label: "Index Scan", type: "Index Scan", rows: 500, cost: 5.0 }
  ],
  edges: [
    { source: 2, target: 1 },
    { source: 3, target: 1 }
  ]
};

const isLocalPlaceholderConfig = (dbConfig?: DatabaseConfig) => {
  const host = dbConfig?.host?.trim().toLowerCase();

  return !dbConfig?.host
    || !dbConfig?.database
    || !dbConfig?.user
    || dbConfig?.id === "default"
    || host === "localhost"
    || host === "127.0.0.1"
    || host === "::1";
};

const isConnectionFailure = (err: unknown) => {
  if (err instanceof TypeError) return true;

  if (typeof err !== "object" || err === null) return false;

  const anyErr = err as { message?: string; error?: string; code?: string };
  const text = `${anyErr.message || ""} ${anyErr.error || ""} ${anyErr.code || ""}`;

  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|network|connection/i.test(text);
};

export const getPlan = async (query: string, dbConfig?: DatabaseConfig) => {
  query = query.trim().replace(/;$/, "")
  if (isLocalPlaceholderConfig(dbConfig)) {
    return MOCK_PLAN;
  }

  try {
    const res = await fetch(`${apiUrl}/api/plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, dbConfig }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw data;
    }

    return data.data;
  } catch (err) {
    if (!isConnectionFailure(err)) {
      throw err;
    }

    console.warn("Database connection failed, falling back to mock plan", err);
    return MOCK_PLAN;
  }
};

export const optimizeQuery = async (query: string, dbConfig?: DatabaseConfig) => {
  query = query.trim().replace(/;$/, "")
  if (isLocalPlaceholderConfig(dbConfig)) {
    return {
      optimizedQuery: query + "\n-- Optimized by Mock AI",
      plan: MOCK_OPT_PLAN
    };
  }

  try {
    const res = await fetch(`${apiUrl}/api/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, dbConfig }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw data;
    }

    return data.data; // Expected: { optimizedQuery: string, plan: PlanData }
  } catch (err) {
    if (!isConnectionFailure(err)) {
      throw err;
    }

    console.warn("Database connection failed, falling back to mock optimized plan", err);
    return {
      optimizedQuery: query + "\n-- Optimized by Mock AI",
      plan: MOCK_OPT_PLAN
    };
  }
};

export const testDbConnection = async (dbConfig: DatabaseConfig) => {
  if (isLocalPlaceholderConfig(dbConfig)) {
    return { message: "Mock connection successful" };
  }

  try {
    const res = await fetch(`${apiUrl}/api/plan/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dbConfig }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw data;
    }

    return data.data; // Expected: { message: string }
  } catch (err) {
    throw err;
  }
};
