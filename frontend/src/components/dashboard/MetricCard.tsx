interface Props {
  label: string
  value: string
  sub?: string
  variant?: "default" | "positive" | "negative"
}

export function MetricCard({ label, value, sub, variant = "default" }: Props) {
  const valueColor =
    variant === "positive"
      ? "text-emerald-600"
      : variant === "negative"
      ? "text-red-500"
      : "text-gray-900"

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-xl font-semibold ${valueColor} leading-none font-mono`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  )
}