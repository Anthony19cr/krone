import { Router } from "express"
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expenses.controller.js"

export const expensesRouter = Router()

expensesRouter.get("/", getExpenses)
expensesRouter.post("/", createExpense)
expensesRouter.put("/:id", updateExpense)
expensesRouter.delete("/:id", deleteExpense)