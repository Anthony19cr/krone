import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"

export const getMonthlySummary = async (req: Request, res: Response) => {
  const { month, year } = req.query

  if (!month || !year) {
    res.status(400).json({ error: "month and year are required" })
    return
  }

  const m = Number(month)
  const y = Number(year)

  const [incomes, expenses, debts] = await Promise.all([
    prisma.income.findMany({
      where: { userId: 1, month: m, year: y },
      include: { category: true },
    }),
    prisma.expense.findMany({
      where: { userId: 1, month: m, year: y },
      include: { category: true },
    }),
    prisma.debt.findMany({ where: { userId: 1 } }),
  ])

  const totalIncome = incomes.reduce((sum, i) => {
    const amount = Number(i.amount)
    return sum + (i.frequency === "BIWEEKLY" ? amount * 2 : amount)
  }, 0)

  const totalExpenses = expenses.reduce((sum, e) => {
    const amount = Number(e.amount)
    return sum + (e.frequency === "BIWEEKLY" ? amount * 2 : amount)
  }, 0)

  const totalDebtPayments = debts.reduce((sum, d) => sum + Number(d.monthlyPayment), 0)
  const totalOutflow = totalExpenses + totalDebtPayments
  const balance = totalIncome - totalOutflow
  const expenseRatio = totalIncome > 0 ? Math.round((totalOutflow / totalIncome) * 100) : 0

  // expenses grouped by category for donut chart
  const byCategory = expenses.reduce<Record<string, { name: string; color: string; amount: number }>>(
    (acc, e) => {
      const key = e.category.name
      if (!acc[key]) {
        acc[key] = { name: key, color: e.category.color, amount: 0 }
      }
      acc[key]!.amount += Number(e.amount)
      return acc
    },
    {}
  )

  // alerts
  const alerts: { type: "warning" | "danger"; message: string }[] = []
  if (balance < 0) {
    alerts.push({ type: "danger", message: `Déficit de ₡${Math.abs(balance).toLocaleString("es-CR")} este mes.` })
  } else if (expenseRatio >= 90) {
    alerts.push({ type: "danger", message: `Tus gastos representan el ${expenseRatio}% de tus ingresos.` })
  } else if (expenseRatio >= 75) {
    alerts.push({ type: "warning", message: `Tus gastos están en el ${expenseRatio}% de tus ingresos.` })
  }

  res.json({
    month: m,
    year: y,
    totalIncome,
    totalExpenses,
    totalDebtPayments,
    totalOutflow,
    balance,
    expenseRatio,
    alerts,
    incomes,
    expenses,
    debts,
    expensesByCategory: Object.values(byCategory),
  })
}

export const getHistoricalSummary = async (_req: Request, res: Response) => {
  const userId = 1
  const results = []

  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = date.getMonth() + 1
    const y = date.getFullYear()

    const [incomes, expenses, debts] = await Promise.all([
      prisma.income.findMany({ where: { userId, month: m, year: y } }),
      prisma.expense.findMany({ where: { userId, month: m, year: y } }),
      prisma.debt.findMany({ where: { userId } }),
    ])

    const totalIncome = incomes.reduce((sum, i) => {
      return sum + (i.frequency === "BIWEEKLY" ? Number(i.amount) * 2 : Number(i.amount))
    }, 0)

    const totalExpenses = expenses.reduce((sum, e) => {
      return sum + (e.frequency === "BIWEEKLY" ? Number(e.amount) * 2 : Number(e.amount))
    }, 0)

    const totalDebtPayments = debts.reduce((sum, d) => sum + Number(d.monthlyPayment), 0)

    results.push({
      month: m,
      year: y,
      label: date.toLocaleString("es-CR", { month: "short", year: "numeric" }),
      totalIncome,
      totalExpenses: totalExpenses + totalDebtPayments,
      balance: totalIncome - totalExpenses - totalDebtPayments,
    })
  }

  res.json(results)
}