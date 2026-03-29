import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { CategoryType } from "@prisma/client"

export const getCategories = async (req: Request, res: Response) => {
  const { type } = req.query

  const categories = await prisma.category.findMany({
    where: type ? { type: type as CategoryType } : undefined,
    orderBy: { name: "asc" },
  })

  res.json(categories)
}

export const createCategory = async (req: Request, res: Response) => {
  const { name, type, color } = req.body

  if (!name || !type) {
    res.status(400).json({ error: "name and type are required" })
    return
  }

  const category = await prisma.category.create({
    data: { name, type, color, userId: 1 },
  })

  res.status(201).json(category)
}

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, color } = req.body

  const category = await prisma.category.update({
    where: { id: Number(id) },
    data: { name, color },
  })

  res.json(category)
}

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params

  await prisma.category.delete({
    where: { id: Number(id) },
  })

  res.status(204).send()
}