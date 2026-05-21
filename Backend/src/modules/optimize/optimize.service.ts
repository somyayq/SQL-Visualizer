import { parseSQL } from "../parse/parse.service.js"
import { generatePlan } from "../plan/plan.service.js"

export const optimizeQueryService = (query: string) => {
  // 1. Parse the query to ensure it's valid
  const ast = parseSQL(query)

  // 2. Generate mock "optimized" query string
  // For demonstration, we simply replace "SELECT *" with specific columns if found,
  // or add a hint.
  let optimizedQuery = query;
  if (query.toUpperCase().includes("SELECT *")) {
    optimizedQuery = query.replace(/SELECT \*/i, "SELECT id, created_at, status");
  } else if (!query.toUpperCase().includes("LIMIT")) {
    optimizedQuery = `${query}\nLIMIT 100`;
  } else {
    // Just add a mock index hint
    optimizedQuery = query.replace(/SELECT /i, "SELECT /*+ INDEX(primary_idx) */ ");
  }

  // 3. Generate the plan using the (possibly modified) AST
  // To ensure the plan looks optimized, we take the original plan
  // and reduce the cost and rows significantly.
  const originalPlan = generatePlan(ast);
  
  const optimizedPlan = {
    nodes: originalPlan.nodes.map(node => ({
      ...node,
      cost: Math.max(1, Math.floor(node.cost * 0.3)), // 70% cost reduction
      rows: Math.max(1, Math.floor(node.rows * 0.5)), // 50% row reduction
      label: node.label.includes("Table Scan") ? node.label.replace("Table Scan", "Index Scan") : node.label
    })),
    edges: originalPlan.edges
  };

  return {
    optimizedQuery,
    plan: optimizedPlan
  }
}
