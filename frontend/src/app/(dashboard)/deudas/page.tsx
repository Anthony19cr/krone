"use client"

import { useState } from "react"
import { useDebts, useCreateDebt, useUpdateDebt, useDeleteDebt, type Debt, type DebtPayload } from "@/hooks/useDebts"
import { Modal } from "@/components/ui/Modal"
import { Field, inputClass } from "@/components/ui/Field"

function fmt(n: number) {
  return "₡" + Math.round(n).toLocaleString("en-US")
}

const empty: DebtPayload = {
  name: "", totalAmount: 0, remainingAmount: 0,
  totalPayments: 12, paidPayments: 0, annualRate: 0,
}

export default function DeudasPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)
  const [form, setForm] = useState<DebtPayload>({ ...empty })

  const { data: debts = [], isLoading } = useDebts()
  const create = useCreateDebt()
  const update = useUpdateDebt()
  const remove = useDeleteDebt()

  function openCreate() {
    setEditing(null)
    setForm({ ...empty })
    setOpen(true)
  }

  function openEdit(debt: Debt) {
    setEditing(debt)
    setForm({
      name: debt.name,
      totalAmount: debt.totalAmount,
      remainingAmount: debt.remainingAmount,
      totalPayments: debt.totalPayments,
      paidPayments: debt.paidPayments,
      annualRate: debt.annualRate,
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.totalAmount) return
    if (editing) {
      await update.mutateAsync({ id: editing.id, payload: form })
    } else {
      await create.mutateAsync(form)
    }
    setOpen(false)
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar esta deuda?")) return
    await remove.mutateAsync(id)
  }

  const totalRestante = debts.reduce((s, d) => s + Number(d.remainingAmount), 0)
  const totalMensual = debts.reduce((s, d) => s + Number(d.monthlyPayment), 0)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 mt-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Deudas</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {debts.length} deuda{debts.length !== 1 ? "s" : ""} · Saldo total {fmt(totalRestante)} · Cuotas {fmt(totalMensual)}/mes
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm text-white rounded-xl font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          + Agregar
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-gray-300">Cargando...</div>
      ) : debts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-300">Sin deudas registradas</p>
          <button onClick={openCreate} className="mt-3 text-xs underline" style={{ color: "var(--color-primary)" }}>
            Agregar la primera
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {debts.map((debt) => {
            const pct = Math.min(100, Math.round((1 - Number(debt.remainingAmount) / Number(debt.totalAmount)) * 100))
            const remaining = debt.totalPayments - debt.paidPayments

            return (
              <div key={debt.id} className="bg-white rounded-2xl border border-gray-100 p-5 group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{debt.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {debt.annualRate}% anual · {remaining} cuota{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold font-mono text-red-400">{fmt(Number(debt.remainingAmount))}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(Number(debt.monthlyPayment))}/mes</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: "var(--color-primary)" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{pct}% pagado</span>
                  <span>Total: {fmt(Number(debt.totalAmount))}</span>
                </div>

                <div className="flex gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                  <button onClick={() => openEdit(debt)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Editar</button>
                  <button onClick={() => handleDelete(debt.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? "Editar deuda" : "Nueva deuda"}
        onClose={() => setOpen(false)}
        onConfirm={handleSave}
        loading={create.isPending || update.isPending}
      >
        <Field label="Nombre">
          <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Crédito banco" />
        </Field>
        <Field label="Monto total (₡)">
          <input className={inputClass} type="number" value={form.totalAmount || ""} onChange={e => setForm(f => ({ ...f, totalAmount: Number(e.target.value) }))} placeholder="0" />
        </Field>
        <Field label="Saldo restante (₡)">
          <input className={inputClass} type="number" value={form.remainingAmount || ""} onChange={e => setForm(f => ({ ...f, remainingAmount: Number(e.target.value) }))} placeholder="0" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cuotas totales">
            <input className={inputClass} type="number" value={form.totalPayments || ""} onChange={e => setForm(f => ({ ...f, totalPayments: Number(e.target.value) }))} placeholder="12" />
          </Field>
          <Field label="Cuotas pagadas">
            <input className={inputClass} type="number" value={form.paidPayments || ""} onChange={e => setForm(f => ({ ...f, paidPayments: Number(e.target.value) }))} placeholder="0" />
          </Field>
        </div>
        <Field label="Tasa de interés anual (%)">
          <input className={inputClass} type="number" value={form.annualRate || ""} onChange={e => setForm(f => ({ ...f, annualRate: Number(e.target.value) }))} placeholder="18" />
        </Field>
      </Modal>
    </div>
  )
}