import { Request, Response } from "express"
import { buildExportData, generateExcel, generatePDF } from "../services/export.service.js"

export const exportExcel = async (req: Request, res: Response) => {
  const { month, year, symbol } = req.query

  if (!month || !year) {
    res.status(400).json({ error: "month and year are required" })
    return
  }

  const data = await buildExportData(
    Number(month),
    Number(year),
    symbol ? decodeURIComponent(String(symbol)) : "$"
  )

  await generateExcel(data, res)
}

export const exportPDF = async (req: Request, res: Response) => {
  const { month, year, symbol } = req.query

  if (!month || !year) {
    res.status(400).json({ error: "month and year are required" })
    return
  }

  const data = await buildExportData(
    Number(month),
    Number(year),
    symbol ? decodeURIComponent(String(symbol)) : "$"
  )

  await generatePDF(data, res)
}