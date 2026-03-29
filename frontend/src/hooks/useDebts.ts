import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface Debt {
  id: number
  name: string
  totalAmount: number
  remainingAmount: number
  totalPayments: number
  paidPayments: number
  annualRate: number
  monthlyPayment: number
}

export interface DebtPayload {
  name: string
  totalAmount: number
  remainingAmount: number
  totalPayments: number
  paidPayments: number
  annualRate: number
}

export function useDebts() {
  return useQuery<Debt[]>({
    queryKey: ["debts"],
    queryFn: async () => {
      const { data } = await api.get("/debts")
      return data
    },
  })
}

export function useCreateDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: DebtPayload) => {
      const { data } = await api.post("/debts", payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  })
}

export function useUpdateDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<DebtPayload> }) => {
      const { data } = await api.put(`/debts/${id}`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  })
}

export function useDeleteDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/debts/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  })
}