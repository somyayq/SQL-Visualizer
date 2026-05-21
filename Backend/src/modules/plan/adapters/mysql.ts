import mysql from 'mysql2/promise';

export interface PlanNodeData {
  id: string;
  type: string;
  label: string;
  rows: number;
  cost: number;
}

export interface PlanData {
  nodes: PlanNodeData[];
  edges: { source: string; target: string }[];
}

export const getMysqlPlan = async (query: string, config: any): Promise<PlanData> => {
  const connection = await mysql.createConnection({
    host: config.host,
    port: parseInt(config.port, 10) || 3306,
    user: config.user,
    password: config.password,
    database: config.database,
  });

  try {
    // We execute EXPLAIN FORMAT=JSON to get the raw plan
    const [rows] = await connection.query(`EXPLAIN FORMAT=JSON ${query}`);
    
    // The exact column name might vary, we get the first value of the first row
    const firstRow: any = (rows as any)[0];
    const rawPlan = typeof firstRow === 'object' ? Object.values(firstRow)[0] : firstRow;
    const planObj = typeof rawPlan === 'string' ? JSON.parse(rawPlan) : rawPlan;

    const nodes: PlanNodeData[] = [];
    const edges: { source: string; target: string }[] = [];
    let nodeIdCounter = 1;

    // Recursive function to parse the MySQL plan tree
    const parseNode = (nodeName: string, nodeData: any): string => {
      const currentId = String(nodeIdCounter++);
      
      let type = nodeName.toUpperCase();
      let label = type;
      let nodeRows = 0;
      let cost = 0;

      if (nodeData.table_name) {
        type = nodeData.access_type ? `SCAN (${nodeData.access_type})` : 'TABLE';
        label = `${type} on ${nodeData.table_name}`;
      } else if (nodeName === 'nested_loop') {
        type = 'JOIN';
        label = 'Nested Loop Join';
      } else if (nodeName === 'query_block') {
        type = 'QUERY';
        label = 'Query Block';
      }

      // Try to extract rows and cost
      if (nodeData.rows !== undefined) {
        nodeRows = Number(nodeData.rows);
      } else if (nodeData.rows_examined_per_scan !== undefined) {
        nodeRows = Number(nodeData.rows_examined_per_scan);
      } else if (nodeData.rows_produced_per_join !== undefined) {
        nodeRows = Number(nodeData.rows_produced_per_join);
      }
      
      if (nodeData.cost_info) {
        cost = Number(nodeData.cost_info.query_cost || nodeData.cost_info.read_cost || nodeData.cost_info.eval_cost || 0);
      }

      nodes.push({
        id: currentId,
        type: type,
        label: label,
        rows: Math.round(nodeRows),
        cost: Number(cost.toFixed(2)),
      });

      // Recurse into children
      const childrenIds: string[] = [];

      if (Array.isArray(nodeData)) {
        for (const child of nodeData) {
          if (typeof child === 'object' && child !== null) {
            const childKeys = Object.keys(child);
            if (childKeys.length === 1) {
              childrenIds.push(parseNode(childKeys[0], child[childKeys[0]]));
            } else {
              childrenIds.push(parseNode('OPERATION', child));
            }
          }
        }
      } else if (typeof nodeData === 'object' && nodeData !== null) {
        // Search for nested structures common in MySQL JSON Explain
        const knownChildKeys = ['query_block', 'table', 'nested_loop', 'grouping_operation', 'ordering_operation', 'subqueries', 'materialized_from_subquery'];
        for (const key of Object.keys(nodeData)) {
          if (knownChildKeys.includes(key)) {
            childrenIds.push(parseNode(key, nodeData[key]));
          }
        }
      }

      // In MySQL, the execution flows from the inner operations (children) outwards.
      let sumRows = 0;
      let sumCost = 0;

      for (const childId of childrenIds) {
        edges.push({
          source: childId,
          target: currentId
        });
        const childNode = nodes.find(n => n.id === childId);
        if (childNode) {
          sumRows += childNode.rows;
          sumCost += childNode.cost;
        }
      }

      // Bubble up values if the current node lacks them
      const thisNode = nodes.find(n => n.id === currentId);
      if (thisNode) {
        if (thisNode.rows === 0 && sumRows > 0) thisNode.rows = sumRows;
        if (thisNode.cost === 0 && sumCost > 0) thisNode.cost = Number(sumCost.toFixed(2));
      }

      return currentId;
    };

    if (planObj.query_block) {
      parseNode('query_block', planObj.query_block);
    } else {
      parseNode('plan', planObj);
    }

    return { nodes, edges };
  } finally {
    await connection.end();
  }
};
