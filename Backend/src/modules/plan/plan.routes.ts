import { Router } from "express"
import { getPlan, testConnection } from "./plan.controller.js"

const router = Router()

router.post("/", getPlan)
router.post("/test", testConnection)

export default router