import { Router } from "express"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller.js"

export const categoriesRouter = Router()

categoriesRouter.get("/", getCategories)
categoriesRouter.post("/", createCategory)
categoriesRouter.put("/:id", updateCategory)
categoriesRouter.delete("/:id", deleteCategory)