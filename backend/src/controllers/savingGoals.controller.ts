import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"

function calculateProjectedDate(
  targetAmount: number,
  currentAmount: number,
  monthlyBalance: number
): string | null {
  if (monthlyBalance <= 0) return null
  const remaining = targetAmount - currentAmount
  if (remaining <= 0) return "Completada"
  const monthsNeeded = Math.ceil(remaining / monthlyBalance)
  const projected = new Date()
  projected.setMonth(projected.getMonth() + monthsNeeded)
  return projected.toISOString().slice(0, 7)
}

export const getSavingGoals = async (_req: Request, res: Response) => {
  const goals = await prisma.savingGoal.findMany({
    where: { userId: 1 },
    orderBy: { createdAt: "desc" },
  })

  const incomes = await prisma.income.findMany({ where: { userId: 1 } })
  const expenses = await prisma.expense.findMany({ where: { userId: 1 } })
  const debts = await prisma.debt.findMany({ where: { userId: 1 } })

  const totalIncome = incomes.reduce((sum, i) => {
    return sum + (i.frequency === "BIWEEKLY" ? Number(i.amount) * 2 : Number(i.amount))
  }, 0)

  const totalExpenses = expenses.reduce((sum, e) => {
    return sum + (e.frequency === "BIWEEKLY" ? Number(e.amount) * 2 : Number(e.amount))
  }, 0)

  const totalDebtPayments = debts.reduce((sum, d) => sum + Number(d.monthlyPayment), 0)
  const monthlyBalance = totalIncome - totalExpenses - totalDebtPayments

  const goalsWithProjection = goals.map((goal) => {
    const projectedDate = calculateProjectedDate(
      Number(goal.targetAmount),
      Number(goal.currentAmount),
      monthlyBalance
    )

    const targetDate = goal.targetDate
      ? goal.targetDate.toISOString().slice(0, 7)
      : null

    const onTrack = projectedDate && targetDate
      ? projectedDate <= targetDate
      : null

    return {
      ...goal,
      percentage: Math.min(100, Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)),
      projectedDate,
      targetDate,
      onTrack,
    }
  })

  res.json(goalsWithProjection)
}

export const createSavingGoal = async (req: Request, res: Response) => {
  const { name, targetAmount, currentAmount, targetDate } = req.body

  if (!name || !targetAmount) {
    res.status(400).json({ error: "name and targetAmount are required" })
    return
  }

  const goal = await prisma.savingGoal.create({
    data: {
      name,
      targetAmount,
      currentAmount: currentAmount ?? 0,
      targetDate: targetDate ? new Date(targetDate) : null,
      userId: 1,
    },
  })

  res.status(201).json(goal)
}

export const updateSavingGoal = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, targetAmount, currentAmount, targetDate } = req.body

  const goal = await prisma.savingGoal.update({
    where: { id: Number(id) },
    data: {
      name,
      targetAmount,
      currentAmount,
      targetDate: targetDate ? new Date(targetDate) : null,
    },
  })

  res.json(goal)
}

export const deleteSavingGoal = async (req: Request, res: Response) => {
  const { id } = req.params

  await prisma.savingGoal.delete({
    where: { id: Number(id) },
  })

  res.status(204).send()
}