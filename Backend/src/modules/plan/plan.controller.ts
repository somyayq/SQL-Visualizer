import { Request, Response } from "express"
import { parseSQL } from "../parse/parse.service.js"
import { generatePlan } from "./plan.service.js"
import { getPostgresPlan } from "./adapters/postgres.js"
import { getMysqlPlan } from "./adapters/mysql.js"
import { ApiResponse } from "../../types/api.types.js"
import { PlanData } from "../../types/plan.types.js"

export const getPlan = async (req: Request, res: Response) => {
  try {
    const { query, dbConfig } = req.body as { query: string, dbConfig?: any }

    if (!query) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Query is required"
      }
      return res.status(400).json(response)
    }

    let plan: PlanData;

    // Use realistic DB plan if credentials are provided
    if (dbConfig && dbConfig.host && dbConfig.user) {
      try {
        if (dbConfig.type === 'postgres') {
          plan = await getPostgresPlan(query, dbConfig);
        } else if (dbConfig.type === 'mysql') {
          plan = await getMysqlPlan(query, dbConfig);
        } else {
          // Fallback if type is unsupported
          const ast = parseSQL(query)
          plan = generatePlan(ast)
        }
      } catch (dbError: any) {
        throw new Error(`Database error: ${dbError.message}`);
      }
    } else {
      // Fallback to mock AST-based plan
      const ast = parseSQL(query)
      plan = generatePlan(ast)
    }

    const response: ApiResponse<PlanData> = {
      success: true,
      data: plan
    }

    return res.status(200).json(response)
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      error: error.message,
      location: error.location
    }

    return res.status(400).json(response)
  }
}