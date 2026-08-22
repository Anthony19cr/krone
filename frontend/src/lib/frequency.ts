export type Frequency = "MONTHLY" | "BIWEEKLY" | "WEEKLY" | "ONE_TIME"

// Cuántas veces al mes se repite cada frecuencia (misma aproximación que el backend).
export const FREQUENCY_MULTIPLIER: Record<Frequency, number> = {
  ONE_TIME: 1,
  MONTHLY: 1,
  BIWEEKLY: 2,
  WEEKLY: 4,
}

export const FREQ_LABELS: Record<Frequency, string> = {
  ONE_TIME: "Único",
  MONTHLY: "Mensual",
  BIWEEKLY: "Quincenal",
  WEEKLY: "Semanal",
}

export const FREQ_COLORS: Record<Frequency, string> = {
  ONE_TIME: "bg-gray-100 text-gray-500",
  MONTHLY: "bg-emerald-50 text-emerald-600",
  BIWEEKLY: "bg-blue-50 text-blue-600",
  WEEKLY: "bg-purple-50 text-purple-600",
}

export function effectiveAmount(amount: number, frequency: Frequency): number {
  return amount * FREQUENCY_MULTIPLIER[frequency]
}
