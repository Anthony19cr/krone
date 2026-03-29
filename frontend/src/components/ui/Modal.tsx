"use client"

import { useEffect } from "react"
import { clsx } from "clsx"

interface Props {
  open: boolean
  title: string
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
  loading?: boolean
  children: React.ReactNode
}

export function Modal({ open, title, onClose, onConfirm, confirmLabel = "Guardar", loading, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none">&#215;</button>
        </div>
        <div className="space-y-4">{children}</div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-2 flex-1 py-2 text-sm rounded-xl text-white font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? "Guardando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}