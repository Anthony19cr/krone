import { Router } from "express"
import { getMonthlySummary, getHistoricalSummary } from "../controllers/summary.controller.js"

export const summaryRouter = Router()

summaryRouter.get("/monthly", getMonthlySummary)
summaryRouter.get("/historical", getHistoricalSummary)