import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { getEffectiveExpenses } from "../lib/recurrence.js"
import { Frequency } from "@prisma/client"

export const getExpenses = async (req: Request, res: Response) => {
  const { month, year } = req.query

  if (month && year) {
    const expenses = await getEffectiveExpenses(1, Number(month), Number(year))
    res.json(expenses)
    return
  }

  const expenses = await prisma.expense.findMany({
    where: { userId: 1 },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })

  res.json(expenses)
}

export const createExpense = async (req: Request, res: Response) => {
  const { name, amount, recurring, frequency, month, year, categoryId } = req.body

  if (!name || !amount || !month || !year || !categoryId) {
    res.status(400).json({ error: "name, amount, month, year and categoryId are required" })
    return
  }

  const expense = await prisma.expense.create({
    data: {
      name,
      amount,
      recurring: recurring ?? false,
      frequency: frequency ?? Frequency.ONE_TIME,
      month: Number(month),
      year: Number(year),
      categoryId: Number(categoryId),
      userId: 1,
    },
    include: { category: true },
  })

  res.status(201).json(expense)
}

export const updateExpense = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, amount, recurring, frequency, month, year, categoryId } = req.body

  const expense = await prisma.expense.update({
    where: { id: Number(id) },
    data: {
      name,
      amount,
      recurring,
      frequency,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
    },
    include: { category: true },
  })

  res.json(expense)
}

export const deleteExpense = async (req: Request, res: Response) => {
  const { id } = req.params

  await prisma.expense.delete({
    where: { id: Number(id) },
  })

  res.status(204).send()
}