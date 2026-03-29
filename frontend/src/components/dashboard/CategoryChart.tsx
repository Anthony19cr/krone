"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

interface Category {
  name: string
  color: string
  amount: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-sm">
      <p className="text-gray-500 mb-0.5">{payload[0].name}</p>
      <p className="text-gray-900 font-medium">₡{Number(payload[0].value).toLocaleString("es-CR")}</p>
    </div>
  )
}

export function CategoryChart({ data }: { data: Category[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-300">
        Sin datos
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.amount, 0)

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 mt-2">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-500">{entry.name}</span>
            </div>
            <span className="text-gray-700 font-medium font-mono">
              {Math.round((entry.amount / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}