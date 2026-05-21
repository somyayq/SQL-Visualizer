import { type DatabaseConfig } from "../hooks/useDatabaseConfig";

export const getPlan = async (query: string, dbConfig?: DatabaseConfig) => {
  query = query.trim().replace(/;$/, "")
  const res = await fetch("http://localhost:5050/api/plan", {
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
};

export const optimizeQuery = async (query: string, dbConfig?: DatabaseConfig) => {
  query = query.trim().replace(/;$/, "")
  const res = await fetch("http://localhost:5050/api/optimize", {
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
};

export const testDbConnection = async (dbConfig: DatabaseConfig) => {
  const res = await fetch("http://localhost:5050/api/plan/test", {
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
};
