export type NodeType = string;

export interface PlanNode{
    id:string,
    type:NodeType,
    label:string,
    cost: number,
    rows: number
}

export interface PlanEdge{
    source: string,
    target: string
}

export interface PlanData{
    nodes: PlanNode[]
    edges: PlanEdge[]
}