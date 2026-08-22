import { prisma } from "./prisma.js"
import { Frequency } from "@prisma/client"

function periodIndex(year: number, month: number): number {
  return year * 12 + month
}

// Cuántas veces al mes se repite cada frecuencia (aproximación simple, sin
// precisión de calendario — igual criterio ya usado para BIWEEKLY).
export const FREQUENCY_MULTIPLIER: Record<Frequency, number> = {
  ONE_TIME: 1,
  MONTHLY: 1,
  BIWEEKLY: 2,
  WEEKLY: 4,
}

export function effectiveAmount(amount: unknown, frequency: Frequency): number {
  return Number(amount) * FREQUENCY_MULTIPLIER[frequency]
}

export async function getEffectiveIncomes(userId: number, m: number, y: number) {
  const targetIndex = periodIndex(y, m)

  const all = await prisma.income.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })

  return all.filter((income) => {
    const originIndex = periodIndex(income.year, income.month)
    if (income.frequency === "ONE_TIME") {
      return originIndex === targetIndex
    }
    return originIndex <= targetIndex
  })
}

export async function getEffectiveExpenses(userId: number, m: number, y: number) {
  const targetIndex = periodIndex(y, m)

  const all = await prisma.expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })

  return all.filter((expense) => {
    const originIndex = periodIndex(expense.year, expense.month)
    if (expense.frequency === "ONE_TIME") {
      return originIndex === targetIndex
    }
    return originIndex <= targetIndex
  })
}