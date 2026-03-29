import { Router } from "express"
import {
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
} from "../controllers/debts.controller.js"

export const debtsRouter = Router()

debtsRouter.get("/", getDebts)
debtsRouter.post("/", createDebt)
debtsRouter.put("/:id", updateDebt)
debtsRouter.delete("/:id", deleteDebt)