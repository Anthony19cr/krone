import { Router } from "express"
import { categoriesRouter } from "./categories.routes.js"
import { incomesRouter } from "./incomes.routes.js"
import { expensesRouter } from "./expenses.routes.js"
import { debtsRouter } from "./debts.routes.js"
import { savingGoalsRouter } from "./savingGoals.routes.js"
import { summaryRouter } from "./summary.routes.js"

export const router = Router()

router.get("/", (_req, res) => {
  res.json({ message: "Krone API v1" })
})

router.use("/categories", categoriesRouter)
router.use("/incomes", incomesRouter)
router.use("/expenses", expensesRouter)
router.use("/debts", debtsRouter)
router.use("/saving-goals", savingGoalsRouter)
router.use("/summary", summaryRouter)