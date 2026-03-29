import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Category } from "./useIncomes"

export function useCategories(type?: "INCOME" | "EXPENSE") {
  return useQuery<Category[]>({
    queryKey: ["categories", type],
    queryFn: async () => {
      const url = type ? `/categories?type=${type}` : "/categories"
      const { data } = await api.get(url)
      return data
    },
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; type: string; color: string }) => {
      const { data } = await api.post("/categories", payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: { name?: string; color?: string } }) => {
      const { data } = await api.put(`/categories/${id}`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  })
}