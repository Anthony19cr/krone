"use client"

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

interface Props {
  month: number
  year: number
  onChange: (month: number, year: number) => void
}

export function MonthSelector({ month, year, onChange }: Props) {
  function prev() {
    if (month === 1) onChange(12, year - 1)
    else onChange(month - 1, year)
  }

  function next() {
    if (month === 12) onChange(1, year + 1)
    else onChange(month + 1, year)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={prev}
        className="w-7 h-7 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all text-sm"
      >
        &#8249;
      </button>
      <span className="text-sm font-medium text-gray-700 min-w-36 text-center">
        {MONTHS[month - 1]} {year}
      </span>
      <button
        onClick={next}
        className="w-7 h-7 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all text-sm"
      >
        &#8250;
      </button>
    </div>
  )
}