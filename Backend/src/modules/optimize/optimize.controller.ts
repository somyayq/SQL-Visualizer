import { Request, Response } from "express"
import { optimizeQueryService } from "./optimize.service.js"

export const handleOptimize = (req: Request, res: Response) => {
  try {
    const { query } = req.body

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query string is required"
      })
    }

    const data = optimizeQueryService(query)

    res.json({
      success: true,
      data
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to optimize query",
      location: error.location
    })
  }
}
