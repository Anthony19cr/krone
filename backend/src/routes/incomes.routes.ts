import { Router } from "express"
import {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} from "../controllers/incomes.controller.js"

export const incomesRouter = Router()

incomesRouter.get("/", getIncomes)
incomesRouter.post("/", createIncome)
incomesRouter.put("/:id", updateIncome)
incomesRouter.delete("/:id", deleteIncome)