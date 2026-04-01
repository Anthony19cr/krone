import { Router } from "express"
import { exportExcel, exportPDF } from "../controllers/export.controller.js"

export const exportRouter = Router()

exportRouter.get("/excel", exportExcel)
exportRouter.get("/pdf", exportPDF)