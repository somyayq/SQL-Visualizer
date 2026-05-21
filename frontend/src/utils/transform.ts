/* eslint-disable @typescript-eslint/no-explicit-any */
export const transformPlan = (plan: any) => {
  if (!plan || !plan.nodes || !plan.edges) return { nodes: [], edges: [] };

  const nodeChildren: Record<string, string[]> = {};
  plan.edges.forEach((e: any) => {
    if (!nodeChildren[e.target]) nodeChildren[e.target] = [];
    nodeChildren[e.target].push(e.source);
  });

  const nodesMap = new Map<string, any>(plan.nodes.map((n: any) => [String(n.id), n]));

  let maxOwnCost = 0;
  plan.nodes.forEach((n: any) => {
    const children = nodeChildren[String(n.id)] || [];
    const childrenCost = children.reduce((sum, childId) => {
      const child = nodesMap.get(String(childId));
      return sum + (child ? (child.cost || 0) : 0);
    }, 0);
    
    // Some EXPLAIN formats give cumulative, some don't. 
    // We try to find the "own" cost. If cost is already small, ownCost is small.
    const ownCost = Math.max(0, (n.cost || 0) - childrenCost);
    n.ownCost = ownCost;
    if (ownCost > maxOwnCost) {
      maxOwnCost = ownCost;
    }
  });

  const nodes = plan.nodes.map((n: any, i: number) => {
    // A bottleneck is a node that contributes significantly to the total cost
    // and is relatively the most expensive single operation.
    const isBottleneck = maxOwnCost > 0 && n.ownCost >= maxOwnCost * 0.8;

    return {
      id: String(n.id),
      type: 'custom',
      data: { 
        label: n.label, 
        type: n.type, 
        rows: n.rows, 
        cost: n.cost,
        isBottleneck
      },
      position: { x: i * 250, y: i * 120 }, // Minimal basic layouting for start
    };
  });

  const edges = plan.edges.map((e: any) => ({
    id: `${e.source}-${e.target}`,
    source: String(e.source),
    target: String(e.target),
    type: 'smoothstep',
    animated: true,
  }));

  return { nodes, edges };
};
