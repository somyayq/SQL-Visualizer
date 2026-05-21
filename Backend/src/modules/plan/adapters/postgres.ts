import pg from 'pg';

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

export const getPostgresPlan = async (query: string, config: any): Promise<PlanData> => {
  const { Client } = pg;
  const client = new Client({
    host: config.host,
    port: parseInt(config.port, 10),
    user: config.user,
    password: config.password,
    database: config.database,
  });

  await client.connect();

  try {
    // We execute EXPLAIN (FORMAT JSON) to get the raw plan
    const result = await client.query(`EXPLAIN (FORMAT JSON) ${query}`);
    const rawPlan = result.rows[0]['QUERY PLAN'][0].Plan;

    const nodes: PlanNodeData[] = [];
    const edges: { source: string; target: string }[] = [];
    let nodeIdCounter = 1;

    // Recursive function to parse the Postgres plan tree
    const parseNode = (planNode: any): string => {
      const currentId = String(nodeIdCounter++);
      
      const type = planNode['Node Type'];
      let label = type;
      
      if (planNode['Relation Name']) {
        label = `${type} on ${planNode['Relation Name']}`;
      } else if (planNode['Join Type']) {
        label = `${planNode['Join Type']} ${type}`;
      }

      nodes.push({
        id: currentId,
        type: type,
        label: label,
        rows: Math.round(planNode['Plan Rows'] || 0),
        cost: Math.round(planNode['Total Cost'] || 0),
      });

      if (planNode.Plans && Array.isArray(planNode.Plans)) {
        for (const child of planNode.Plans) {
          const childId = parseNode(child);
          edges.push({
            source: childId,
            target: currentId
          });
        }
      }

      return currentId;
    };

    parseNode(rawPlan);

    return { nodes, edges };
  } finally {
    await client.end();
  }
};
