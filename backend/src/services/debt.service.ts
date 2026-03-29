export function calculateMonthlyPayment(
  remainingAmount: number,
  annualRate: number,
  remainingPayments: number
): number {
  if (remainingPayments <= 0) return 0
  if (annualRate === 0) return Math.round(remainingAmount / remainingPayments)

  const monthlyRate = annualRate / 100 / 12
  const payment =
    (remainingAmount * monthlyRate) /
    (1 - Math.pow(1 + monthlyRate, -remainingPayments))

  return Math.round(payment)
}