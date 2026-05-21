import { Router } from "express"
import { handleOptimize } from "./optimize.controller.js"

const router = Router()

router.post("/", handleOptimize)

export default router
