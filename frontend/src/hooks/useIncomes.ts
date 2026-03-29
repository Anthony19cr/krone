import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface Category {
  id: number
  name: string
  type: string
  color: string
}

export interface Income {
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

export interface IncomePayload {
  name: string
  amount: number
  recurring: boolean
  frequency: "MONTHLY" | "BIWEEKLY" | "ONE_TIME"
  month: number
  year: number
  categoryId: number
}

export function useIncomes(month: number, year: number) {
  return useQuery<Income[]>({
    queryKey: ["incomes", month, year],
    queryFn: async () => {
      const { data } = await api.get(`/incomes?month=${month}&year=${year}`)
      return data
    },
  })
}

export function useCreateIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: IncomePayload) => {
      const { data } = await api.post("/incomes", payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incomes"] }),
  })
}

export function useUpdateIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<IncomePayload> }) => {
      const { data } = await api.put(`/incomes/${id}`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incomes"] }),
  })
}

export function useDeleteIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/incomes/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incomes"] }),
  })
}