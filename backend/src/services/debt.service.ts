import { Frequency } from "@prisma/client"
import { FREQUENCY_MULTIPLIER } from "../lib/recurrence.js"

export function calculatePayment(
  remainingAmount: number,
  annualRate: number,
  remainingPayments: number,
  frequency: Frequency = "MONTHLY"
): number {
  if (remainingPayments <= 0) return 0

  const periodsPerYear = 12 * FREQUENCY_MULTIPLIER[frequency]

  if (annualRate === 0) return Math.round(remainingAmount / remainingPayments)

  const periodRate = annualRate / 100 / periodsPerYear
  const payment =
    (remainingAmount * periodRate) /
    (1 - Math.pow(1 + periodRate, -remainingPayments))

  return Math.round(payment)
}
