import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { Frequency } from "@prisma/client"

export const getIncomes = async (req: Request, res: Response) => {
  const { month, year } = req.query

  const incomes = await prisma.income.findMany({
    where: {
      userId: 1,
      ...(month ? { month: Number(month) } : {}),
      ...(year ? { year: Number(year) } : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })

  res.json(incomes)
}

export const createIncome = async (req: Request, res: Response) => {
  const { name, amount, recurring, frequency, month, year, categoryId } = req.body

  if (!name || !amount || !month || !year || !categoryId) {
    res.status(400).json({ error: "name, amount, month, year and categoryId are required" })
    return
  }

  const income = await prisma.income.create({
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

  res.status(201).json(income)
}

export const updateIncome = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, amount, recurring, frequency, month, year, categoryId } = req.body

  const income = await prisma.income.update({
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

  res.json(income)
}

export const deleteIncome = async (req: Request, res: Response) => {
  const { id } = req.params

  await prisma.income.delete({
    where: { id: Number(id) },
  })

  res.status(204).send()
}