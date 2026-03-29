import { Router } from "express"
import { categoriesRouter } from "./categories.routes.js"

export const router = Router()

router.get("/", (_req, res) => {
  res.json({ message: "Krone API v1" })
})

router.use("/categories", categoriesRouter)