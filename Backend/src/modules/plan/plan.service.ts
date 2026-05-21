import { PlanData, NodeType } from "../../types/plan.types.js"
import { SelectAST } from "../../types/ast.types.js"

const tableStats: Record<string, number> = {
  users: 1000,
  orders: 2000,
  products: 500
}

const parseExpr = (expr: any): string => {
  if (!expr) return ""

  if (expr.type === "binary_expr") {
    const left = parseExpr(expr.left)
    const right = parseExpr(expr.right)
    return `${left} ${expr.operator} ${right}`
  }

  if (expr.type === "column_ref") {
    return expr.table
      ? `${expr.table}.${expr.column}`
      : expr.column
  }

  if (expr.type === "number") {
    return String(expr.value)
  }

  if (expr.type === "string") {
    return `'${expr.value}'`
  }

  return ""
}

export const generatePlan = (rawAst: unknown): PlanData => {
  const ast = rawAst as SelectAST

  const nodes: any[] = []
  const edges: any[] = []

  let id = 1

  const createNode = (
    type: NodeType,
    label: string,
    rows: number,
    cost: number
  ) => {
    const node = {
      id: String(id++),
      type,
      label,
      rows,
      cost
    }

    nodes.push(node)
    return node.id
  }

  const firstTable = ast.from[0].table
  let lastRows = tableStats[firstTable] || 1000

  let lastNodeId = createNode(
    "SCAN",
    `Table Scan: ${firstTable}`,
    lastRows,
    lastRows
  )

  for (let i = 1; i < ast.from.length; i++) {
    const tableObj = ast.from[i]

    const rightRows = tableStats[tableObj.table] || 1000

    const rightTableId = createNode(
      "SCAN",
      `Table Scan: ${tableObj.table}`,
      rightRows,
      rightRows
    )

    const joinCondition = (tableObj as any).on
      ? parseExpr((tableObj as any).on)
      : ""

    const joinType =
      tableObj.join && typeof tableObj.join === "object"
        ? tableObj.join.join
        : "JOIN"

    const joinRows = Math.floor((lastRows * rightRows) / 100)
    const joinCost = lastRows + rightRows

    const joinId = createNode(
      "JOIN",
      `${joinType} ON ${joinCondition}`,
      joinRows,
      joinCost
    )

    edges.push({ source: lastNodeId, target: joinId })
    edges.push({ source: rightTableId, target: joinId })

    lastRows = joinRows
    lastNodeId = joinId
  }

  if (ast.where) {
    const filterCondition = parseExpr(ast.where)

    const filterRows = Math.floor(lastRows / 2)
    const filterCost = filterRows

    const filterId = createNode(
      "FILTER",
      filterCondition,
      filterRows,
      filterCost
    )

    edges.push({
      source: lastNodeId,
      target: filterId
    })

    lastRows = filterRows
    lastNodeId = filterId
  }

  let columns: string

  if (ast.columns === "*") {
    columns = "*"
  } else {
    columns = ast.columns
      .map(c =>
        (c.expr as any).table
          ? `${(c.expr as any).table}.${(c.expr as any).column}`
          : (c.expr as any).column
      )
      .join(", ")
  }

  const projCost = Math.floor(lastRows * 0.1)

  const projId = createNode(
    "PROJECTION",
    `SELECT ${columns}`,
    lastRows,
    projCost
  )

  edges.push({
    source: lastNodeId,
    target: projId
  })

  return { nodes, edges }
}