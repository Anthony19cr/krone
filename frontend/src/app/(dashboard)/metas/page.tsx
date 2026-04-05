"use client"

import { useState } from "react"
import { useSavingGoals, useCreateSavingGoal, useUpdateSavingGoal, useDeleteSavingGoal, type SavingGoal, type SavingGoalPayload } from "@/hooks/useSavingGoals"
import { Modal } from "@/components/ui/Modal"
import { Field, inputClass } from "@/components/ui/Field"
import { useConfig, formatAmount, CURRENCIES } from "@/hooks/useConfig"

const empty: SavingGoalPayload = { name: "", targetAmount: 0, currentAmount: 0, targetDate: "" }

export default function MetasPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SavingGoal | null>(null)
  const [form, setForm] = useState<SavingGoalPayload>({ ...empty })

  const { data: goals = [], isLoading } = useSavingGoals()
  const create = useCreateSavingGoal()
  const update = useUpdateSavingGoal()
  const remove = useDeleteSavingGoal()

  const { currency } = useConfig()
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol ?? "₡"

  function fmt(n: number) { return formatAmount(n, currency) }

  function openCreate() {
    setEditing(null)
    setForm({ ...empty })
    setOpen(true)
  }

  function openEdit(goal: SavingGoal) {
    setEditing(goal)
    setForm({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate ?? "",
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.targetAmount) return
    if (editing) {
      await update.mutateAsync({ id: editing.id, payload: form })
    } else {
      await create.mutateAsync(form)
    }
    setOpen(false)
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar esta meta?")) return
    await remove.mutateAsync(id)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 mt-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Metas de ahorro</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {goals.length} meta{goals.length !== 1 ? "s" : ""} activa{goals.length !== 1 ? "s" : ""}
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
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-300">Sin metas registradas</p>
          <button onClick={openCreate} className="mt-3 text-xs underline" style={{ color: "var(--color-primary)" }}>
            Crear la primera
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100))
            const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)

            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-gray-100 p-5 group">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900">{goal.name}</p>
                  <span
                    className="text-sm font-semibold font-mono"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {pct}%
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {goal.projectedDate && goal.projectedDate !== "Completada" && (
                    <span className="text-xs text-gray-400">
                      Proyección: {goal.projectedDate}
                    </span>
                  )}
                  {goal.targetDate && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                        goal.onTrack
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {goal.onTrack ? "En tiempo" : "Fuera de tiempo"} · Límite: {goal.targetDate}
                    </span>
                  )}
                  {goal.projectedDate === "Completada" && (
                    <span className="text-xs px-2 py-0.5 rounded-lg font-medium bg-emerald-50 text-emerald-600">
                      Meta alcanzada
                    </span>
                  )}
                  {!goal.projectedDate && !goal.targetDate && (
                    <span className="text-xs text-gray-300">Sin proyección disponible</span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: "var(--color-primary)" }}
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-400 mb-4">
                  <span>{fmt(Number(goal.currentAmount))} ahorrado</span>
                  <span>Faltan {fmt(remaining)}</span>
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Meta: {fmt(Number(goal.targetAmount))}</span>
                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(goal)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Editar</button>
                    <button onClick={() => handleDelete(goal.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? "Editar meta" : "Nueva meta de ahorro"}
        onClose={() => setOpen(false)}
        onConfirm={handleSave}
        loading={create.isPending || update.isPending}
      >
        <Field label="Nombre">
          <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Fondo de emergencia" />
        </Field>
        <Field label={`Monto objetivo (${currencySymbol})`}>
          <input className={inputClass} type="number" value={form.targetAmount || ""} onChange={e => setForm(f => ({ ...f, targetAmount: Number(e.target.value) }))} placeholder="0" />
        </Field>
        <Field label={`Ahorro actual (${currencySymbol})`}>
          <input className={inputClass} type="number" value={form.currentAmount || ""} onChange={e => setForm(f => ({ ...f, currentAmount: Number(e.target.value) }))} placeholder="0" />
        </Field>
        <Field label="Fecha límite (opcional)">
        <input className={inputClass} type="month" value={form.targetDate ?? ""} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
      </Field>
      </Modal>
    </div>
  )
}