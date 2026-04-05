import { Response } from "express"
import ExcelJS from "exceljs"
import { createRequire } from "module"
import { getEffectiveIncomes, getEffectiveExpenses } from "../lib/recurrence.js"
import { prisma } from "../lib/prisma.js"

const require = createRequire(import.meta.url)
const PDFDocument = require("pdfkit")

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportData {
  month: number
  year: number
  symbol: string
  totalIncome: number
  totalExpenses: number
  totalDebtPayments: number
  balance: number
  incomes: Awaited<ReturnType<typeof getEffectiveIncomes>>
  expenses: Awaited<ReturnType<typeof getEffectiveExpenses>>
  debts: Array<{
    id: number
    name: string
    annualRate: unknown
    remainingAmount: unknown
    monthlyPayment: unknown
  }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

/**
 * PDFKit no soporta el glifo ₡.
 * El frontend puede enviar "₡" como símbolo cuando la moneda es CRC.
 * En ese caso usamos el texto "CRC" para que PDFKit lo renderice correctamente.
 */
function safePdfSymbol(symbol: string): string {
  if (symbol === "₡") return "CRC"
  return symbol
}

function fmt(amount: number, symbol: string): string {
  return `${symbol} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function frequencyLabel(freq: string): string {
  if (freq === "MONTHLY") return "Mensual"
  if (freq === "BIWEEKLY") return "Quincenal"
  return "Unico"
}

function effectiveAmount(amount: unknown, frequency: string): number {
  const n = Number(amount)
  return frequency === "BIWEEKLY" ? n * 2 : n
}

// ---------------------------------------------------------------------------
// Build export data (with recurrence logic)
// ---------------------------------------------------------------------------

export async function buildExportData(
  month: number,
  year: number,
  symbol: string
): Promise<ExportData> {
  const [incomes, expenses, debts] = await Promise.all([
    getEffectiveIncomes(1, month, year),
    getEffectiveExpenses(1, month, year),
    prisma.debt.findMany({ where: { userId: 1 } }),
  ])

  const totalIncome = incomes.reduce(
    (s, i) => s + effectiveAmount(i.amount, i.frequency), 0
  )
  const totalExpenses = expenses.reduce(
    (s, e) => s + effectiveAmount(e.amount, e.frequency), 0
  )
  const totalDebtPayments = debts.reduce(
    (s, d) => s + Number(d.monthlyPayment), 0
  )

  return {
    month,
    year,
    symbol,
    totalIncome,
    totalExpenses,
    totalDebtPayments,
    balance: totalIncome - totalExpenses - totalDebtPayments,
    incomes,
    expenses,
    debts,
  }
}

// ---------------------------------------------------------------------------
// PDF generator
// ---------------------------------------------------------------------------

export async function generatePDF(data: ExportData, res: Response): Promise<void> {
  const symbol = safePdfSymbol(data.symbol)
  const monthName = MONTH_NAMES_ES[data.month - 1]
  const title = `Krone — Reporte financiero — ${monthName} ${data.year}`

  const doc = new PDFDocument({ margin: 50, size: "A4" })

  res.setHeader("Content-Type", "application/pdf")
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="krone-${data.year}-${data.month}.pdf"`
  )
  doc.pipe(res)

  // --- Header ---
  doc.fontSize(22).font("Helvetica-Bold").text("Krone", 50, 50)
  doc.fontSize(11).font("Helvetica").fillColor("#6b7280")
    .text(`Reporte financiero — ${monthName} ${data.year}`, 50, 78)
  doc.fillColor("#000000")
  doc.moveDown(1.5)

  // --- Summary cards (single row, 4 columns) ---
  const cardY = doc.y
  const cardW = 118
  const cardGap = 10
  const cards = [
    { label: "INGRESOS", value: data.totalIncome, color: "#1a6b4a" },
    { label: "GASTOS", value: data.totalExpenses, color: "#991b1b" },
    { label: "DEUDAS", value: data.totalDebtPayments, color: "#92400e" },
    { label: "BALANCE", value: data.balance, color: data.balance >= 0 ? "#1a3f6b" : "#991b1b" },
  ]

  cards.forEach((card, i) => {
    const x = 50 + i * (cardW + cardGap)
    doc.rect(x, cardY, cardW, 56).fillAndStroke("#f9fafb", "#e5e7eb")
    doc.fontSize(7).font("Helvetica-Bold").fillColor("#6b7280")
      .text(card.label, x + 8, cardY + 8, { width: cardW - 16 })
    doc.fontSize(11).font("Helvetica-Bold").fillColor(card.color)
      .text(fmt(card.value, symbol), x + 8, cardY + 24, { width: cardW - 16 })
  })

  doc.y = cardY + 72
  doc.fillColor("#000000")

  // --- Section: Incomes ---
  drawSectionTitle(doc, "Ingresos")
  drawTableHeader(doc, ["Nombre", "Categoria", "Frecuencia", "Monto"])

  if (data.incomes.length === 0) {
    drawEmptyRow(doc, "Sin ingresos registrados para este mes.")
  } else {
    data.incomes.forEach((income) => {
      drawTableRow(doc, [
        income.name,
        income.category.name,
        frequencyLabel(income.frequency),
        fmt(effectiveAmount(income.amount, income.frequency), symbol),
      ])
    })
  }

  // --- Section: Expenses ---
  doc.moveDown(0.5)
  drawSectionTitle(doc, "Gastos")
  drawTableHeader(doc, ["Nombre", "Categoria", "Frecuencia", "Monto"])

  if (data.expenses.length === 0) {
    drawEmptyRow(doc, "Sin gastos registrados para este mes.")
  } else {
    data.expenses.forEach((expense) => {
      drawTableRow(doc, [
        expense.name,
        expense.category.name,
        frequencyLabel(expense.frequency),
        fmt(effectiveAmount(expense.amount, expense.frequency), symbol),
      ])
    })
  }

  // --- Section: Debts ---
  doc.moveDown(0.5)
  drawSectionTitle(doc, "Deudas")
  drawTableHeader(doc, ["Nombre", "Tasa", "Saldo", "Cuota/Mes"])

  if (data.debts.length === 0) {
    drawEmptyRow(doc, "Sin deudas registradas.")
  } else {
    data.debts.forEach((debt) => {
      drawTableRow(doc, [
        debt.name,
        `${Number(debt.annualRate).toFixed(2)}%`,
        fmt(Number(debt.remainingAmount), symbol),
        fmt(Number(debt.monthlyPayment), symbol),
      ])
    })
  }

  // --- Footer ---
  doc.moveDown(2)

  const footerY = Math.min(doc.y, doc.page.height - 60)

  doc.fontSize(8).font("Helvetica").fillColor("#9ca3af")
    .text("Generado por Krone · krone.app", 50, footerY, {
      align: "center",
      width: doc.page.width - 100,
    })

  doc.end()
}

// --- PDF drawing helpers ---

function drawSectionTitle(doc: typeof PDFDocument, title: string) {
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#111827")
    .text(title, { continued: false })
  doc.moveDown(0.3)
}

function drawTableHeader(doc: typeof PDFDocument, cols: string[]) {
  const colW = (doc.page.width - 100) / cols.length
  const rowY = doc.y

  doc.rect(50, rowY, doc.page.width - 100, 18).fill("#f3f4f6")
  doc.fontSize(8).font("Helvetica-Bold").fillColor("#374151")

  cols.forEach((col, i) => {
    doc.text(col, 54 + i * colW, rowY + 5, { width: colW - 8 })
  })

  doc.y = rowY + 20
  doc.fillColor("#000000")
}

function drawTableRow(doc: typeof PDFDocument, cols: string[]) {
  const colW = (doc.page.width - 100) / cols.length
  const rowY = doc.y

  // Alternating row background
  doc.fontSize(8).font("Helvetica").fillColor("#111827")

  cols.forEach((col, i) => {
    doc.text(col, 54 + i * colW, rowY, { width: colW - 8 })
  })

  doc.moveDown(0.4)

  // Divider line
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y)
    .strokeColor("#e5e7eb").lineWidth(0.5).stroke()
  doc.moveDown(0.2)
}

function drawEmptyRow(doc: typeof PDFDocument, message: string) {
  doc.fontSize(8).font("Helvetica").fillColor("#9ca3af")
    .text(message, 54, doc.y, { width: doc.page.width - 108 })
  doc.moveDown(0.6)
}

// ---------------------------------------------------------------------------
// Excel generator
// ---------------------------------------------------------------------------

export async function generateExcel(data: ExportData, res: Response): Promise<void> {
  const { symbol } = data
  const monthName = MONTH_NAMES_ES[data.month - 1]
  const workbook = new ExcelJS.Workbook()

  workbook.creator = "Krone"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(`${monthName} ${data.year}`)

  // --- Column widths ---
  sheet.columns = [
    { key: "a", width: 32 },
    { key: "b", width: 20 },
    { key: "c", width: 16 },
    { key: "d", width: 20 },
  ]

  // --- Styles ---
  const headerFill: ExcelJS.Fill = {
    type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" },
  }
  const sectionFill: ExcelJS.Fill = {
    type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" },
  }
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }
  const sectionFont: Partial<ExcelJS.Font> = { bold: true, size: 11 }
  const labelFont: Partial<ExcelJS.Font> = { bold: true, size: 9, color: { argb: "FF6B7280" } }
  const thinBorder: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FFE5E7EB" } }
  const cellBorders = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder }

  // --- Report title ---
  const titleRow = sheet.addRow(["Krone — Reporte Financiero"])
  titleRow.font = { bold: true, size: 16 }
  sheet.addRow([`${monthName} ${data.year}`]).font = { size: 11, color: { argb: "FF6B7280" } }
  sheet.addRow([])

  // --- Summary section ---
  const summaryHeaders = sheet.addRow(["INGRESOS", "GASTOS", "DEUDAS", "BALANCE"])
  summaryHeaders.eachCell((cell) => {
    cell.font = labelFont
    cell.fill = sectionFill
    cell.border = cellBorders
    cell.alignment = { horizontal: "center" }
  })

  const summaryValues = sheet.addRow([
    data.totalIncome,
    data.totalExpenses,
    data.totalDebtPayments,
    data.balance,
  ])
  summaryValues.eachCell((cell, colNum) => {
    cell.numFmt = `"${symbol} "#,##0.00`
    cell.font = {
      bold: true,
      size: 11,
      color: {
        argb: colNum === 4
          ? (data.balance >= 0 ? "FF1A3F6B" : "FF991B1B")
          : colNum === 1 ? "FF1A6B4A" : "FF991B1B",
      },
    }
    cell.alignment = { horizontal: "center" }
    cell.border = cellBorders
  })

  sheet.addRow([])

  // --- Incomes table ---
  addTableSection(sheet, "Ingresos", ["Nombre", "Categoria", "Frecuencia", "Monto"],
    data.incomes.map((i) => [
      i.name,
      i.category.name,
      frequencyLabel(i.frequency),
      effectiveAmount(i.amount, i.frequency),
    ]),
    symbol, headerFill, headerFont, cellBorders
  )

  sheet.addRow([])

  // --- Expenses table ---
  addTableSection(sheet, "Gastos", ["Nombre", "Categoria", "Frecuencia", "Monto"],
    data.expenses.map((e) => [
      e.name,
      e.category.name,
      frequencyLabel(e.frequency),
      effectiveAmount(e.amount, e.frequency),
    ]),
    symbol, headerFill, headerFont, cellBorders
  )

  sheet.addRow([])

  // --- Debts table ---
  addTableSection(sheet, "Deudas", ["Nombre", "Tasa anual", "Saldo restante", "Cuota mensual"],
    data.debts.map((d) => [
      d.name,
      Number(d.annualRate) / 100,
      Number(d.remainingAmount),
      Number(d.monthlyPayment),
    ]),
    symbol, headerFill, headerFont, cellBorders,
    [undefined, "0.00%", undefined, undefined]
  )

  // --- Send response ---
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="krone-${data.year}-${data.month}.xlsx"`
  )

  await workbook.xlsx.write(res)
  res.end()
}

// --- Excel helper ---

function addTableSection(
  sheet: ExcelJS.Worksheet,
  title: string,
  headers: string[],
  rows: (string | number)[][],
  symbol: string,
  headerFill: ExcelJS.Fill,
  headerFont: Partial<ExcelJS.Font>,
  cellBorders: Partial<ExcelJS.Borders>,
  customFormats?: (string | undefined)[]
) {
  // Section title
  const titleRow = sheet.addRow([title])
  titleRow.font = { bold: true, size: 12 }
  titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } }

  // Header row
  const headerRow = sheet.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.fill = headerFill
    cell.font = headerFont
    cell.border = cellBorders
    cell.alignment = { horizontal: "left" }
  })

  // Data rows
  if (rows.length === 0) {
    sheet.addRow(["Sin registros para este mes."])
    return
  }

  rows.forEach((rowData) => {
    const row = sheet.addRow(rowData)
    row.eachCell((cell, colNum) => {
      cell.border = cellBorders
      cell.alignment = { horizontal: "left" }

      const colIndex = colNum - 1
      const customFmt = customFormats?.[colIndex]

      if (customFmt) {
        cell.numFmt = customFmt
      } else if (typeof cell.value === "number" && colIndex === rowData.length - 1) {
        // Last column with numeric value = amount
        cell.numFmt = `"${symbol} "#,##0.00`
      }
    })
  })
}