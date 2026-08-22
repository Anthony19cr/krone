import { Frequency } from "@prisma/client"
import { FREQUENCY_MULTIPLIER, effectiveAmount } from "./recurrence.js"

export interface SavingsPlanItem {
  frequency: Frequency
  monthlyEquivalent: number   // cuánto aporta esa frecuencia al ingreso mensual total
  weight: number              // proporción del ingreso mensual total (0–1)
  amountToSetAside: number    // cuánto apartar de CADA pago de esa frecuencia
}

/**
 * Reparte un monto mensual objetivo (ej. la cuota mensual-equivalente de una
 * deuda) entre las frecuencias de ingreso recurrente del usuario, de forma
 * proporcional al peso de cada una en su ingreso mensual total.
 *
 * No usa IA ni heurísticas: es una regla de tres sobre FREQUENCY_MULTIPLIER,
 * la misma tabla que ya normaliza ingresos/gastos/deudas a "por mes" en el
 * resto del backend.
 */
export function buildSavingsPlan(
  monthlyTarget: number,
  incomes: { amount: unknown; frequency: Frequency }[]
): SavingsPlanItem[] {
  if (monthlyTarget <= 0) return []

  const totalsByFrequency = new Map<Frequency, number>()

  for (const income of incomes) {
    if (income.frequency === "ONE_TIME") continue
    const monthly = effectiveAmount(income.amount, income.frequency)
    totalsByFrequency.set(
      income.frequency,
      (totalsByFrequency.get(income.frequency) ?? 0) + monthly
    )
  }

  const totalMonthlyIncome = [...totalsByFrequency.values()].reduce((s, v) => s + v, 0)
  if (totalMonthlyIncome <= 0) return []

  return [...totalsByFrequency.entries()]
    .map(([frequency, monthlyEquivalent]) => {
      const weight = monthlyEquivalent / totalMonthlyIncome
      const portion = monthlyTarget * weight
      return {
        frequency,
        monthlyEquivalent,
        weight,
        amountToSetAside: Math.round(portion / FREQUENCY_MULTIPLIER[frequency]),
      }
    })
    .sort((a, b) => FREQUENCY_MULTIPLIER[b.frequency] - FREQUENCY_MULTIPLIER[a.frequency])
}
