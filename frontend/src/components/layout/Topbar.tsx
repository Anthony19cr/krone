"use client"

import { usePathname } from "next/navigation"

const PAGE_TITLES: Record<string, string> = {
  "/":           "Inicio",
  "/ingresos":   "Ingresos",
  "/gastos":     "Gastos",
  "/deudas":     "Deudas",
  "/metas":      "Metas de ahorro",
  "/historial":  "Historial",
  "/categorias": "Categorías",
}

const DAYS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

export function Topbar() {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? "Krone"

  const now = new Date()
  const label = `${DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]} de ${now.getFullYear()}`

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 fixed top-0 right-0 left-56 z-30">
      <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
      <span className="text-xs text-gray-400">{label}</span>
    </header>
  )
}