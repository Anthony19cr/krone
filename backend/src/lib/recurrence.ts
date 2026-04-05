import { prisma } from "./prisma.js"

function periodIndex(year: number, month: number): number {
  return year * 12 + month
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