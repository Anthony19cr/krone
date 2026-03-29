import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Category } from "./useIncomes"

export interface Expense {
  id: number
  name: string
  amount: number
  recurring: boolean
  frequency: "MONTHLY" | "BIWEEKLY" | "ONE_TIME"
  month: number
  year: number
  categoryId: number
  category: Category
}

export interface ExpensePayload {
  name: string
  amount: number
  recurring: boolean
  frequency: "MONTHLY" | "BIWEEKLY" | "ONE_TIME"
  month: number
  year: number
  categoryId: number
}

export function useExpenses(month: number, year: number) {
  return useQuery<Expense[]>({
    queryKey: ["expenses", month, year],
    queryFn: async () => {
      const { data } = await api.get(`/expenses?month=${month}&year=${year}`)
      return data
    },
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ExpensePayload) => {
      const { data } = await api.post("/expenses", payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<ExpensePayload> }) => {
      const { data } = await api.put(`/expenses/${id}`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/expenses/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  })
}