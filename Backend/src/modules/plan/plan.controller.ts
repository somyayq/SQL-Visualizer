import { Request, Response } from "express"
import { parseSQL } from "../parse/parse.service.js"
import { generatePlan } from "./plan.service.js"
import { getPostgresPlan } from "./adapters/postgres.js"
import { getMysqlPlan } from "./adapters/mysql.js"
import { ApiResponse } from "../../types/api.types.js"
import { PlanData } from "../../types/plan.types.js"

const isLocalPlaceholderConfig = (dbConfig: any) => {
  const host = String(dbConfig?.host || "").trim().toLowerCase();

  return !dbConfig?.host
    || !dbConfig?.database
    || !dbConfig?.user
    || dbConfig?.id === "default"
    || host === "localhost"
    || host === "127.0.0.1"
    || host === "::1";
};

const isConnectionError = (error: any) => {
  const code = error?.code;
  const message = String(error?.message || "");

  return [
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "EHOSTUNREACH",
    "ECONNRESET",
    "PROTOCOL_CONNECTION_LOST",
    "ER_ACCESS_DENIED_ERROR"
  ].includes(code) || /connect|timeout|authentication/i.test(message);
};

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

    // Use realistic DB plan only for reachable remote databases.
    if (dbConfig && !isLocalPlaceholderConfig(dbConfig)) {
      try {
        if (dbConfig.type === 'postgres') {
          plan = await getPostgresPlan(query, dbConfig);
        } else if (dbConfig.type === 'mysql') {
          plan = await getMysqlPlan(query, dbConfig);
        } else {
          const ast = parseSQL(query);
          plan = generatePlan(ast);
        }
      } catch (dbError: any) {
        if (isConnectionError(dbError)) {
          throw new Error(`Database connection failed: ${dbError.message}`);
        }

        const ast = parseSQL(query);
        plan = generatePlan(ast);
      }
    } else {
      const ast = parseSQL(query);
      plan = generatePlan(ast);
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

export const testConnection = async (req: Request, res: Response) => {
  try {
    const { dbConfig } = req.body as { dbConfig?: any }

    if (!dbConfig || !dbConfig.host || !dbConfig.database || !dbConfig.user) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Configuration is incomplete. Please provide host, database, and user."
      }
      return res.status(400).json(response)
    }

    if (isLocalPlaceholderConfig(dbConfig)) {
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: "Using fallback plan configuration" }
      }
      return res.status(200).json(response)
    }

    if (dbConfig.type === 'postgres') {
      const { Client } = await import('pg');
      const client = new Client({
        host: dbConfig.host,
        port: parseInt(dbConfig.port, 10) || 5432,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        connectionTimeoutMillis: 5000,
      });
      await client.connect();
      await client.end();
    } else if (dbConfig.type === 'mysql') {
      const mysql = await import('mysql2/promise');
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        port: parseInt(dbConfig.port, 10) || 3306,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        connectTimeout: 5000,
      });
      await connection.end();
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: "Unsupported database type."
      }
      return res.status(400).json(response)
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Connected successfully" }
    }
    return res.status(200).json(response)
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      error: error.message
    }
    return res.status(400).json(response)
  }
}