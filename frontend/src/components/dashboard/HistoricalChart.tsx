"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { HistoricalEntry } from "@/hooks/useSummary"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-sm space-y-1">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500">{p.name}</span>
          <span className="text-gray-900 font-medium ml-auto">₡{Number(p.value).toLocaleString("es-CR")}</span>
        </div>
      ))}
    </div>
  )
}

function fmt(v: number) {
  return "₡" + (v / 1000).toFixed(0) + "K"
}

export function HistoricalChart({ data }: { data: HistoricalEntry[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={50} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
        <Line type="monotone" dataKey="totalIncome" name="Ingresos" stroke="#2aab73" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="totalExpenses" name="Gastos" stroke="#f87171" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}