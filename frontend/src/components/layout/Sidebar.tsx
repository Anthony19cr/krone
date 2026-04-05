"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { clsx } from "clsx"
import { applyTheme, loadSavedTheme, themes } from "@/lib/themes"
import { useEffect, useState } from "react"
import { CurrencySelector } from "@/components/ui/CurrencySelector"

const NAV_ITEMS = [
  { href: "/",           label: "Inicio" },
  { href: "/ingresos",   label: "Ingresos" },
  { href: "/gastos",     label: "Gastos" },
  { href: "/deudas",     label: "Deudas" },
  { href: "/metas",      label: "Metas" },
  { href: "/historial",  label: "Historial" },
  { href: "/categorias", label: "Categorías" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [activeTheme, setActiveTheme] = useState(themes[0]!)

  useEffect(() => {
    const saved = loadSavedTheme()
    setActiveTheme(saved)
    applyTheme(saved)
  }, [])

  function handleTheme(theme: typeof themes[0]) {
    setActiveTheme(theme)
    applyTheme(theme)
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 bg-white border-r border-gray-100 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-lg font-semibold tracking-tight text-gray-900">
            Kro<span style={{ 
                color: activeTheme.name === "Krone" 
                ? "var(--color-accent)" 
                : "var(--color-secondary)" 
            }}>ne</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                isActive
                  ? "font-medium"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
              style={
                isActive
                  ? {
                      backgroundColor: "var(--color-secondary)",
                      color: "var(--color-accent)",
                    }
                  : {}
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: isActive ? "var(--color-accent)" : "transparent",
                }}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Currency selector */}
      <div className="px-4 py-4 border-t border-gray-100">
        <CurrencySelector />
      </div>

      {/* Theme switcher */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2.5">Tema</p>
        <div className="flex gap-1.5 flex-wrap">
          {themes.map((theme) => (
            <button
                key={theme.name}
                title={theme.name}
                onClick={() => handleTheme(theme)}
                className="w-5 h-5 rounded-full border-2 transition-all duration-150 cursor-pointer"
                style={{
                backgroundColor: theme.accent,
                borderColor:
                    activeTheme.name === theme.name ? theme.primary : "#e5e7eb",
                }}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}