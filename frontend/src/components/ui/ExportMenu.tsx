"use client"

import { useState } from "react"
import { useExport } from "@/hooks/useExport"

interface Props {
  month: number
  year: number
}

export function ExportMenu({ month, year }: Props) {
  const [loading, setLoading] = useState<"pdf" | "excel" | null>(null)
  const { exportPDF, exportExcel } = useExport()

  async function handlePDF() {
    setLoading("pdf")
    try { await exportPDF(month, year) }
    finally { setLoading(null) }
  }

  async function handleExcel() {
    setLoading("excel")
    try { await exportExcel(month, year) }
    finally { setLoading(null) }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePDF}
        disabled={loading === "pdf"}
        className="px-3 py-2 text-xs border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50 font-medium"
      >
        {loading === "pdf" ? "Generando..." : "PDF"}
      </button>
      <button
        onClick={handleExcel}
        disabled={loading === "excel"}
        className="px-3 py-2 text-xs border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50 font-medium"
      >
        {loading === "excel" ? "Generando..." : "Excel"}
      </button>
    </div>
  )
}