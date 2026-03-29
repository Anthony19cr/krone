import { Router } from "express"
import {
  getSavingGoals,
  createSavingGoal,
  updateSavingGoal,
  deleteSavingGoal,
} from "../controllers/savingGoals.controller.js"

export const savingGoalsRouter = Router()

savingGoalsRouter.get("/", getSavingGoals)
savingGoalsRouter.post("/", createSavingGoal)
savingGoalsRouter.put("/:id", updateSavingGoal)
savingGoalsRouter.delete("/:id", deleteSavingGoal)