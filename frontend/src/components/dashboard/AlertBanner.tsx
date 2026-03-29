interface Alert {
  type: "warning" | "danger"
  message: string
}

export function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return null

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`px-4 py-2.5 rounded-lg text-sm border ${
            alert.type === "danger"
              ? "bg-red-50 border-red-200 text-red-600"
              : "bg-amber-50 border-amber-200 text-amber-600"
          }`}
        >
          {alert.message}
        </div>
      ))}
    </div>
  )
}