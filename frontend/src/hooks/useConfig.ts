import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Currency = "CRC" | "USD" | "EUR" | "MXN" | "COP" | "ARS"

export const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: "CRC", label: "Colón costarricense", symbol: "₡" },
  { code: "USD", label: "Dólar estadounidense", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "MXN", label: "Peso mexicano", symbol: "$" },
  { code: "COP", label: "Peso colombiano", symbol: "$" },
  { code: "ARS", label: "Peso argentino", symbol: "$" },
]

interface ConfigStore {
  currency: Currency
  setCurrency: (currency: Currency) => void
}

export const useConfig = create<ConfigStore>()(
  persist(
    (set) => ({
      currency: "CRC",
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "krone-config" }
  )
)

export function formatAmount(amount: number, currency: Currency): string {
  const cur = CURRENCIES.find(c => c.code === currency)
  const symbol = cur?.symbol ?? "₡"
  return symbol + Math.round(amount).toLocaleString("en-US")
}