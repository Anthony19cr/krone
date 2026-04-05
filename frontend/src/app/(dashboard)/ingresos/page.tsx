"use client"

import { useState } from "react"
import { useIncomes, useCreateIncome, useUpdateIncome, useDeleteIncome, type Income, type IncomePayload } from "@/hooks/useIncomes"
import { useCategories } from "@/hooks/useCategories"
import { Modal } from "@/components/ui/Modal"
import { Field, inputClass, selectClass } from "@/components/ui/Field"
import { MonthSelector } from "@/components/dashboard/MonthSelector"
import { ExportMenu } from "@/components/ui/ExportMenu"
import { useConfig, formatAmount, CURRENCIES } from "@/hooks/useConfig"

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: "Mensual",
  BIWEEKLY: "Quincenal",
  ONE_TIME: "Único",
}

const FREQ_COLORS: Record<string, string> = {
  MONTHLY: "bg-emerald-50 text-emerald-600",
  BIWEEKLY: "bg-blue-50 text-blue-600",
  ONE_TIME: "bg-gray-100 text-gray-500",
}

const empty: IncomePayload = {
  name: "", amount: 0, recurring: false,
  frequency: "ONE_TIME", month: new Date().getMonth() + 1,
  year: new Date().getFullYear(), categoryId: 0,
}

export default function IngresosPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Income | null>(null)
  const [form, setForm] = useState<IncomePayload>({ ...empty, month, year })

  const { data: incomes = [], isLoading } = useIncomes(month, year)
  const { data: categories = [] } = useCategories("INCOME")
  const create = useCreateIncome()
  const update = useUpdateIncome()
  const remove = useDeleteIncome()

  const { currency } = useConfig()
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol ?? "₡"

  function fmt(n: number) { return formatAmount(n, currency) }

  function openCreate() {
    setEditing(null)
    setForm({ ...empty, month, year })
    setOpen(true)
  }

  function openEdit(income: Income) {
    setEditing(income)
    setForm({
      name: income.name,
      amount: income.amount,
      recurring: income.recurring,
      frequency: income.frequency,
      month: income.month,
      year: income.year,
      categoryId: income.categoryId,
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.amount || !form.categoryId) return
    if (editing) {
      await update.mutateAsync({ id: editing.id, payload: form })
    } else {
      await create.mutateAsync(form)
    }
    setOpen(false)
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este ingreso?")) return
    await remove.mutateAsync(id)
  }

  const total = incomes.reduce((s, i) => s + (i.frequency === "BIWEEKLY" ? Number(i.amount) * 2 : Number(i.amount)), 0)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 mt-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Ingresos</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {incomes.length} registro{incomes.length !== 1 ? "s" : ""} · Total {fmt(total)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <ExportMenu month={month} year={year} />
            <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 text-sm text-white rounded-xl font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-300">Cargando...</div>
        ) : incomes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-300">Sin ingresos registrados este mes</p>
            <button onClick={openCreate} className="mt-3 text-xs underline" style={{ color: "var(--color-primary)" }}>
              Agregar el primero
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Categoría</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Frecuencia</th>
                <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Monto</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {incomes.map((income) => (
                <tr key={income.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-3.5 text-sm text-gray-900 font-medium">{income.name}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: income.category.color }} />
                      <span className="text-sm text-gray-500">{income.category.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${FREQ_COLORS[income.frequency]}`}>
                      {FREQ_LABELS[income.frequency]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-semibold font-mono text-emerald-600">
                    {fmt(income.amount)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(income)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Editar</button>
                      <button onClick={() => handleDelete(income.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={editing ? "Editar ingreso" : "Nuevo ingreso"}
        onClose={() => setOpen(false)}
        onConfirm={handleSave}
        loading={create.isPending || update.isPending}
      >
        <Field label="Nombre">
          <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Salario" />
        </Field>
        <Field label={`Monto (${currencySymbol})`}>
          <input className={inputClass} type="number" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} placeholder="0" />
        </Field>
        <Field label="Categoría">
          <select className={selectClass} value={form.categoryId || ""} onChange={e => setForm(f => ({ ...f, categoryId: Number(e.target.value) }))}>
            <option value="">Seleccionar...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Frecuencia">
          <select className={selectClass} value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as any, recurring: e.target.value !== "ONE_TIME" }))}>
            <option value="ONE_TIME">Único</option>
            <option value="MONTHLY">Mensual</option>
            <option value="BIWEEKLY">Quincenal</option>
          </select>
        </Field>
      </Modal>
    </div>
  )
}