import ExcelJS from "exceljs"
import PDFDocument from "pdfkit"
import type { Response } from "express"

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function fmt(n: number) {
  return "₡" + Math.round(n).toLocaleString("en-US")
}

function fmtPDF(n: number) {
  return "CRC" + Math.round(n).toLocaleString("en-US")
}

interface ExportData {
  month: number
  year: number
  totalIncome: number
  totalExpenses: number
  totalDebtPayments: number
  balance: number
  incomes: any[]
  expenses: any[]
  debts: any[]
}

export async function generateExcel(data: ExportData, res: Response) {
  const wb = new ExcelJS.Workbook()
  wb.creator = "Krone"
  wb.created = new Date()

  const monthLabel = `${MONTHS[data.month - 1]} ${data.year}`

  // Styles
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF6B7280" } },
    alignment: { horizontal: "left" },
    border: { bottom: { style: "thin", color: { argb: "FFE5E7EB" } } },
  }

  const accentStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFC9A84C" } },
  }

  const subtotalStyle: Partial<ExcelJS.Style> = {
    font: { bold: true },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9F9F8" } },
  }

  // ── RESUMEN ──────────────────────────────────────────────
  const ws1 = wb.addWorksheet("Resumen")
  ws1.columns = [
    { key: "label", width: 28 },
    { key: "value", width: 22 },
  ]

  ws1.addRow({ label: `Reporte Krone — ${monthLabel}`, value: "" })
  ws1.getRow(1).font = { bold: true, size: 14 }
  ws1.addRow({})

  const summaryRows = [
    { label: "Ingresos del mes", value: fmt(data.totalIncome) },
    { label: "Gastos del mes", value: fmt(data.totalExpenses) },
    { label: "Cuotas de deuda", value: fmt(data.totalDebtPayments) },
    { label: "Balance neto", value: fmt(data.balance) },
  ]

  summaryRows.forEach((r, i) => {
    const row = ws1.addRow(r)
    if (i === summaryRows.length - 1) {
      row.eachCell(cell => Object.assign(cell, accentStyle))
    }
  })

  // ── INGRESOS ─────────────────────────────────────────────
  const ws2 = wb.addWorksheet("Ingresos")
  ws2.columns = [
    { header: "Nombre", key: "name", width: 28 },
    { header: "Categoría", key: "category", width: 18 },
    { header: "Frecuencia", key: "frequency", width: 14 },
    { header: "Monto", key: "amount", width: 18 },
  ]
  ws2.getRow(1).eachCell(cell => Object.assign(cell, headerStyle))

  data.incomes.forEach(i => {
    ws2.addRow({
      name: i.name,
      category: i.category?.name ?? "",
      frequency: i.frequency === "MONTHLY" ? "Mensual" : i.frequency === "BIWEEKLY" ? "Quincenal" : "Único",
      amount: fmt(Number(i.amount)),
    })
  })

  ws2.addRow({})
  const totalIngRow = ws2.addRow({ name: "Total", amount: fmt(data.totalIncome) })
  totalIngRow.eachCell(cell => Object.assign(cell, subtotalStyle))

  // ── GASTOS ───────────────────────────────────────────────
  const ws3 = wb.addWorksheet("Gastos")
  ws3.columns = [
    { header: "Nombre", key: "name", width: 28 },
    { header: "Categoría", key: "category", width: 18 },
    { header: "Frecuencia", key: "frequency", width: 14 },
    { header: "Monto", key: "amount", width: 18 },
  ]
  ws3.getRow(1).eachCell(cell => Object.assign(cell, headerStyle))

  data.expenses.forEach(e => {
    ws3.addRow({
      name: e.name,
      category: e.category?.name ?? "",
      frequency: e.frequency === "MONTHLY" ? "Mensual" : e.frequency === "BIWEEKLY" ? "Quincenal" : "Único",
      amount: fmt(Number(e.amount)),
    })
  })

  ws3.addRow({})
  const totalGasRow = ws3.addRow({ name: "Total", amount: fmt(data.totalExpenses) })
  totalGasRow.eachCell(cell => Object.assign(cell, subtotalStyle))

  // ── DEUDAS ───────────────────────────────────────────────
  const ws4 = wb.addWorksheet("Deudas")
  ws4.columns = [
    { header: "Nombre", key: "name", width: 28 },
    { header: "Tasa anual", key: "rate", width: 14 },
    { header: "Saldo restante", key: "remaining", width: 18 },
    { header: "Cuota mensual", key: "monthly", width: 18 },
    { header: "Progreso", key: "progress", width: 12 },
  ]
  ws4.getRow(1).eachCell(cell => Object.assign(cell, headerStyle))

  data.debts.forEach(d => {
    const pct = Math.round((1 - Number(d.remainingAmount) / Number(d.totalAmount)) * 100)
    ws4.addRow({
      name: d.name,
      rate: `${d.annualRate}%`,
      remaining: fmt(Number(d.remainingAmount)),
      monthly: fmt(Number(d.monthlyPayment)),
      progress: `${pct}%`,
    })
  })

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  res.setHeader("Content-Disposition", `attachment; filename=krone-${data.year}-${data.month}.xlsx`)
  await wb.xlsx.write(res)
  res.end()
}

export async function generatePDF(data: ExportData, res: Response) {
  const monthLabel = `${MONTHS[data.month - 1]} ${data.year}`
  const doc = new PDFDocument({ margin: 50, size: "A4" })

  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename=krone-${data.year}-${data.month}.pdf`)
  doc.pipe(res)

  // Header
  doc.fontSize(20).font("Helvetica-Bold").text("Krone", 50, 50)
  doc.fontSize(11).font("Helvetica").fillColor("#6b7280").text(`Reporte financiero — ${monthLabel}`, 50, 76)
  doc.moveTo(50, 95).lineTo(545, 95).strokeColor("#e5e7eb").stroke()

  // Summary boxes
  const boxes = [
    { label: "Ingresos", value: fmtPDF(data.totalIncome), x: 50 },
    { label: "Gastos", value: fmtPDF(data.totalExpenses), x: 200 },
    { label: "Deudas", value: fmtPDF(data.totalDebtPayments), x: 350 },
    { label: "Balance", value: fmtPDF(data.balance), x: 430 },
  ]

  boxes.forEach(b => {
    doc.fontSize(8).font("Helvetica").fillColor("#9ca3af").text(b.label.toUpperCase(), b.x, 110)
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a1a").text(b.value, b.x, 124)
  })

  doc.moveTo(50, 148).lineTo(545, 148).strokeColor("#e5e7eb").stroke()

  let y = 165

  function sectionTitle(title: string) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a1a1a").text(title, 50, y)
    y += 18
  }

  function tableHeader(cols: { label: string; x: number; width: number }[]) {
    doc.rect(50, y, 495, 18).fill("#f9f9f8")
    cols.forEach(c => {
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#6b7280").text(c.label, c.x, y + 5, { width: c.width })
    })
    y += 22
  }

  function tableRow(cols: { value: string; x: number; width: number }[], shade: boolean) {
    if (shade) doc.rect(50, y, 495, 16).fill("#fafafa")
    cols.forEach(c => {
      doc.fontSize(8).font("Helvetica").fillColor("#1a1a1a").text(c.value, c.x, y + 4, { width: c.width })
    })
    y += 18
  }

  // Incomes
  sectionTitle("Ingresos")
  tableHeader([
    { label: "NOMBRE", x: 55, width: 180 },
    { label: "CATEGORÍA", x: 240, width: 120 },
    { label: "FRECUENCIA", x: 365, width: 90 },
    { label: "MONTO", x: 460, width: 80 },
  ])
  data.incomes.forEach((i, idx) => {
    tableRow([
      { value: i.name, x: 55, width: 180 },
      { value: i.category?.name ?? "", x: 240, width: 120 },
      { value: i.frequency === "MONTHLY" ? "Mensual" : i.frequency === "BIWEEKLY" ? "Quincenal" : "Único", x: 365, width: 90 },
      { value: fmtPDF(Number(i.amount)), x: 460, width: 80 },
    ], idx % 2 === 1)
  })
  y += 8

  // Expenses
  sectionTitle("Gastos")
  tableHeader([
    { label: "NOMBRE", x: 55, width: 180 },
    { label: "CATEGORÍA", x: 240, width: 120 },
    { label: "FRECUENCIA", x: 365, width: 90 },
    { label: "MONTO", x: 460, width: 80 },
  ])
  data.expenses.forEach((e, idx) => {
    tableRow([
      { value: e.name, x: 55, width: 180 },
      { value: e.category?.name ?? "", x: 240, width: 120 },
      { value: e.frequency === "MONTHLY" ? "Mensual" : e.frequency === "BIWEEKLY" ? "Quincenal" : "Único", x: 365, width: 90 },
      { value: fmtPDF(Number(e.amount)), x: 460, width: 80 },
    ], idx % 2 === 1)
  })
  y += 8

  // Debts
  sectionTitle("Deudas")
  tableHeader([
    { label: "NOMBRE", x: 55, width: 200 },
    { label: "TASA", x: 260, width: 60 },
    { label: "SALDO", x: 325, width: 100 },
    { label: "CUOTA/MES", x: 430, width: 110 },
  ])
  data.debts.forEach((d, idx) => {
    tableRow([
      { value: d.name, x: 55, width: 200 },
      { value: `${d.annualRate}%`, x: 260, width: 60 },
      { value: fmtPDF(Number(d.remainingAmount)), x: 325, width: 100 },
      { value: fmtPDF(Number(d.monthlyPayment)), x: 430, width: 110 },
    ], idx % 2 === 1)
  })

  // Footer
  doc.moveTo(50, 780).lineTo(545, 780).strokeColor("#e5e7eb").stroke()
  doc.fontSize(8).font("Helvetica").fillColor("#9ca3af").text("Generado por Krone · krone.app", 50, 788)

  doc.end()
}