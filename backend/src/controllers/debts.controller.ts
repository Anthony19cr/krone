import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { calculateMonthlyPayment } from "../services/debt.service.js"

export const getDebts = async (_req: Request, res: Response) => {
  const debts = await prisma.debt.findMany({
    where: { userId: 1 },
    orderBy: { createdAt: "desc" },
  })

  res.json(debts)
}

export const createDebt = async (req: Request, res: Response) => {
  const { name, totalAmount, remainingAmount, totalPayments, paidPayments, annualRate } = req.body

  if (!name || !totalAmount || !remainingAmount || !totalPayments || annualRate === undefined) {
    res.status(400).json({ error: "name, totalAmount, remainingAmount, totalPayments and annualRate are required" })
    return
  }

  const paid = paidPayments ?? 0
  const remainingPayments = totalPayments - paid
  const monthlyPayment = calculateMonthlyPayment(
    Number(remainingAmount),
    Number(annualRate),
    remainingPayments
  )

  const debt = await prisma.debt.create({
    data: {
      name,
      totalAmount,
      remainingAmount,
      totalPayments: Number(totalPayments),
      paidPayments: paid,
      annualRate,
      monthlyPayment,
      userId: 1,
    },
  })

  res.status(201).json(debt)
}

export const updateDebt = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, totalAmount, remainingAmount, totalPayments, paidPayments, annualRate } = req.body

  const existing = await prisma.debt.findUnique({ where: { id: Number(id) } })
  if (!existing) {
    res.status(404).json({ error: "Debt not found" })
    return
  }

  const finalRemainingAmount = remainingAmount ?? Number(existing.remainingAmount)
  const finalTotalPayments = totalPayments ?? existing.totalPayments
  const finalPaidPayments = paidPayments ?? existing.paidPayments
  const finalAnnualRate = annualRate ?? Number(existing.annualRate)
  const remainingPayments = finalTotalPayments - finalPaidPayments

  const monthlyPayment = calculateMonthlyPayment(
    finalRemainingAmount,
    finalAnnualRate,
    remainingPayments
  )

  const debt = await prisma.debt.update({
    where: { id: Number(id) },
    data: {
      name,
      totalAmount,
      remainingAmount,
      totalPayments,
      paidPayments,
      annualRate,
      monthlyPayment,
    },
  })

  res.json(debt)
}

export const deleteDebt = async (req: Request, res: Response) => {
  const { id } = req.params

  await prisma.debt.delete({
    where: { id: Number(id) },
  })

  res.status(204).send()
}