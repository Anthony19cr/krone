interface Props {
  label: string
  children: React.ReactNode
}

export function Field({ label, children }: Props) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

export const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors bg-white text-gray-900"
export const selectClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors bg-white text-gray-900"