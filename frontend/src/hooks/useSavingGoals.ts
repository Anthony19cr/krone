import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface SavingGoal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  percentage: number
  projectedDate: string | null
  targetDate: string | null
  onTrack: boolean | null
}

export interface SavingGoalPayload {
  name: string
  targetAmount: number
  currentAmount: number
  targetDate?: string
}

export function useSavingGoals() {
  return useQuery<SavingGoal[]>({
    queryKey: ["saving-goals"],
    queryFn: async () => {
      const { data } = await api.get("/saving-goals")
      return data
    },
  })
}

export function useCreateSavingGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SavingGoalPayload) => {
      const { data } = await api.post("/saving-goals", payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saving-goals"] }),
  })
}

export function useUpdateSavingGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<SavingGoalPayload> }) => {
      const { data } = await api.put(`/saving-goals/${id}`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saving-goals"] }),
  })
}

export function useDeleteSavingGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/saving-goals/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saving-goals"] }),
  })
}