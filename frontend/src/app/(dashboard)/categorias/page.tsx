"use client"

import { useState } from "react"
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories"
import { Modal } from "@/components/ui/Modal"
import { Field, inputClass } from "@/components/ui/Field"
import type { Category } from "@/hooks/useIncomes"

const PRESET_COLORS = [
  "#6b7280", "#c9a84c", "#2aab73", "#1a6b4a",
  "#f87171", "#fb923c", "#facc15", "#34d399",
  "#60a5fa", "#818cf8", "#e879f9", "#f472b6",
]

const empty = { name: "", type: "INCOME" as "INCOME" | "EXPENSE", color: "#6b7280" }

export default function CategoriasPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(empty)
  const [activeTab, setActiveTab] = useState<"INCOME" | "EXPENSE">("INCOME")

  const { data: incomeCategories = [] } = useCategories("INCOME")
  const { data: expenseCategories = [] } = useCategories("EXPENSE")
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const remove = useDeleteCategory()

  function openCreate(type: "INCOME" | "EXPENSE") {
    setEditing(null)
    setForm({ ...empty, type })
    setOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setForm({ name: cat.name, type: cat.type as "INCOME" | "EXPENSE", color: cat.color })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name) return
    if (editing) {
      await update.mutateAsync({ id: editing.id, payload: { name: form.name, color: form.color } })
    } else {
      await create.mutateAsync(form)
    }
    setOpen(false)
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar esta categoría?")) return
    await remove.mutateAsync(id)
  }

  const categories = activeTab === "INCOME" ? incomeCategories : expenseCategories

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 mt-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Categorías</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {incomeCategories.length} de ingresos · {expenseCategories.length} de gastos
          </p>
        </div>
        <button
          onClick={() => openCreate(activeTab)}
          className="px-4 py-2 text-sm text-white rounded-xl font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          + Agregar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["INCOME", "EXPENSE"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-all ${
              activeTab === type
                ? "text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            style={activeTab === type ? { backgroundColor: "var(--color-primary)" } : {}}
          >
            {type === "INCOME" ? "Ingresos" : "Gastos"}
          </button>
        ))}
      </div>

      {/* Grid */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-300">Sin categorías registradas</p>
          <button
            onClick={() => openCreate(activeTab)}
            className="mt-3 text-xs underline"
            style={{ color: "var(--color-primary)" }}
          >
            Crear la primera
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center justify-between group hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm text-gray-700 font-medium">{cat.name}</span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(cat)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? "Editar categoría" : `Nueva categoría de ${form.type === "INCOME" ? "ingresos" : "gastos"}`}
        onClose={() => setOpen(false)}
        onConfirm={handleSave}
        loading={create.isPending || update.isPending}
      >
        <Field label="Nombre">
          <input
            className={inputClass}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Alimentación"
          />
        </Field>
        <Field label="Color">
          <div className="flex flex-wrap gap-2 mt-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setForm(f => ({ ...f, color }))}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: color,
                  borderColor: form.color === color ? "#1a1a1a" : "transparent",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: form.color }} />
            <input
              className={inputClass}
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              placeholder="#6b7280"
            />
          </div>
        </Field>
      </Modal>
    </div>
  )
}