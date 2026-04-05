"use client"

import { useConfig, CURRENCIES } from "@/hooks/useConfig"
import { selectClass } from "@/components/ui/Field"

export function CurrencySelector() {
  const { currency, setCurrency } = useConfig()

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Moneda</label>
      <select
        className={selectClass}
        value={currency}
        onChange={e => setCurrency(e.target.value as any)}
      >
        {CURRENCIES.map(c => (
          <option key={c.code} value={c.code}>
            {c.symbol} {c.label} ({c.code})
          </option>
        ))}
      </select>
    </div>
  )
}