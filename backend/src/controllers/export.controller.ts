import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { generateExcel, generatePDF } from "../services/export.service.js"

async function getExportData(month: number, year: number) {
  const [incomes, expenses, debts] = await Promise.all([
    prisma.income.findMany({
      where: { userId: 1, month, year },
      include: { category: true },
    }),
    prisma.expense.findMany({
      where: { userId: 1, month, year },
      include: { category: true },
    }),
    prisma.debt.findMany({ where: { userId: 1 } }),
  ])

  const totalIncome = incomes.reduce((s, i) =>
    s + (i.frequency === "BIWEEKLY" ? Number(i.amount) * 2 : Number(i.amount)), 0)

  const totalExpenses = expenses.reduce((s, e) =>
    s + (e.frequency === "BIWEEKLY" ? Number(e.amount) * 2 : Number(e.amount)), 0)

  const totalDebtPayments = debts.reduce((s, d) => s + Number(d.monthlyPayment), 0)

  return {
    month, year,
    totalIncome,
    totalExpenses,
    totalDebtPayments,
    balance: totalIncome - totalExpenses - totalDebtPayments,
    incomes,
    expenses,
    debts,
  }
}

export const exportExcel = async (req: Request, res: Response) => {
  const { month, year } = req.query
  if (!month || !year) {
    res.status(400).json({ error: "month and year are required" })
    return
  }
  const data = await getExportData(Number(month), Number(year))
  await generateExcel(data, res)
}

export const exportPDF = async (req: Request, res: Response) => {
  const { month, year } = req.query
  if (!month || !year) {
    res.status(400).json({ error: "month and year are required" })
    return
  }
  const data = await getExportData(Number(month), Number(year))
  await generatePDF(data, res)
}