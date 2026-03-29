"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts"

interface Props {
  income: number
  expenses: number
  debtPayments: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-sm">
      <p className="text-gray-500 mb-0.5">{payload[0].payload.name}</p>
      <p className="text-gray-900 font-medium">₡{Number(payload[0].value).toLocaleString("es-CR")}</p>
    </div>
  )
}

function fmt(v: number) {
  return "₡" + (v / 1000).toFixed(0) + "K"
}

export function CashFlowChart({ income, expenses, debtPayments }: Props) {
  const data = [
    { name: "Ingresos", value: income, color: "#2aab73" },
    { name: "Gastos", value: expenses, color: "#f87171" },
    { name: "Deudas", value: debtPayments, color: "#c9a84c" },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={44}>
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={50} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}