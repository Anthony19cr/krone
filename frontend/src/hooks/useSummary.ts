import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface MonthlySummary {
  month: number
  year: number
  totalIncome: number
  totalExpenses: number
  totalDebtPayments: number
  totalOutflow: number
  balance: number
  expenseRatio: number
  alerts: { type: "warning" | "danger"; message: string }[]
  expensesByCategory: { name: string; color: string; amount: number }[]
  incomes: any[]
  expenses: any[]
  debts: any[]
}

export interface HistoricalEntry {
  month: number
  year: number
  label: string
  totalIncome: number
  totalExpenses: number
  balance: number
}

export function useMonthlySummary(month: number, year: number) {
  return useQuery<MonthlySummary>({
    queryKey: ["summary", "monthly", month, year],
    queryFn: async () => {
      const { data } = await api.get(`/summary/monthly?month=${month}&year=${year}`)
      return data
    },
  })
}

export function useHistoricalSummary() {
  return useQuery<HistoricalEntry[]>({
    queryKey: ["summary", "historical"],
    queryFn: async () => {
      const { data } = await api.get("/summary/historical")
      return data
    },
  })
}