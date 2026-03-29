"use client"

import { useState } from "react"
import { useMonthlySummary, useHistoricalSummary } from "@/hooks/useSummary"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { AlertBanner } from "@/components/dashboard/AlertBanner"
import { CashFlowChart } from "@/components/dashboard/CashFlowChart"
import { CategoryChart } from "@/components/dashboard/CategoryChart"
import { HistoricalChart } from "@/components/dashboard/HistoricalChart"
import { MonthSelector } from "@/components/dashboard/MonthSelector"

function fmt(n: number) {
  return "₡" + Math.round(n).toLocaleString("en-US")
}

export default function HomePage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data: summary, isLoading } = useMonthlySummary(month, year)
  const { data: historical } = useHistoricalSummary()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Resumen financiero</h2>
          <p className="text-xs text-gray-400 mt-0.5">Visión general de tu situación actual</p>
        </div>
        <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />
      </div>

      {/* Alerts */}
      {summary?.alerts && <AlertBanner alerts={summary.alerts} />}

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Ingresos"
          value={isLoading ? "..." : fmt(summary?.totalIncome ?? 0)}
          sub="este mes"
          variant="positive"
        />
        <MetricCard
          label="Gastos totales"
          value={isLoading ? "..." : fmt(summary?.totalOutflow ?? 0)}
          sub={`${summary?.expenseRatio ?? 0}% del ingreso`}
          variant="negative"
        />
        <MetricCard
          label="Balance"
          value={isLoading ? "..." : fmt(summary?.balance ?? 0)}
          sub={summary?.balance !== undefined && summary.balance >= 0 ? "disponible" : "déficit"}
          variant={summary?.balance !== undefined && summary.balance >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Flujo del mes</p>
          {summary && (
            <CashFlowChart
              income={summary.totalIncome}
              expenses={summary.totalExpenses}
              debtPayments={summary.totalDebtPayments}
            />
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Por categoría</p>
          <CategoryChart data={summary?.expensesByCategory ?? []} />
        </div>
      </div>

      {/* Historical chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Tendencia — últimos 6 meses</p>
        {historical && <HistoricalChart data={historical} />}
      </div>
    </div>
  )
}