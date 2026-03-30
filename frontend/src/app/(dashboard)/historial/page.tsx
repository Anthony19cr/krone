"use client"

import { useHistoricalSummary } from "@/hooks/useSummary"
import { HistoricalChart } from "@/components/dashboard/HistoricalChart"

function fmt(n: number) {
  return "₡" + Math.round(n).toLocaleString("en-US")
}

export default function HistorialPage() {
  const { data: historical = [], isLoading } = useHistoricalSummary()

  const best = historical.reduce((a, b) => b.balance > a.balance ? b : a, historical[0] ?? { balance: 0, label: "" })
  const worst = historical.reduce((a, b) => b.balance < a.balance ? b : a, historical[0] ?? { balance: 0, label: "" })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 mt-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Historial</h2>
          <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses</p>
        </div>
      </div>

      {/* Summary cards */}
      {historical.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1.5">Promedio ingresos</p>
            <p className="text-xl font-semibold font-mono text-emerald-600">
              {fmt(Math.round(historical.reduce((s, h) => s + h.totalIncome, 0) / historical.length))}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">por mes</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1.5">Promedio gastos</p>
            <p className="text-xl font-semibold font-mono text-red-400">
              {fmt(Math.round(historical.reduce((s, h) => s + h.totalExpenses, 0) / historical.length))}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">por mes</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1.5">Mejor mes</p>
            <p className="text-xl font-semibold font-mono" style={{ color: "var(--color-primary)" }}>
              {fmt(best.balance)}
            </p>
            <p className="text-xs text-gray-400 mt-1.5 capitalize">{best.label}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Ingresos vs gastos</p>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-300">Cargando...</div>
        ) : (
          <HistoricalChart data={historical} />
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Mes</th>
              <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Ingresos</th>
              <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Gastos</th>
              <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-300">Cargando...</td></tr>
            ) : historical.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-300">Sin datos</td></tr>
            ) : (
              [...historical].reverse().map((h, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900 capitalize">{h.label}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-mono text-emerald-600">{fmt(h.totalIncome)}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-mono text-red-400">{fmt(h.totalExpenses)}</td>
                  <td className={`px-5 py-3.5 text-right text-sm font-mono font-semibold ${h.balance >= 0 ? "text-gray-900" : "text-red-500"}`}>
                    {fmt(h.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}   