import { api } from "@/lib/api"

export function useExport() {
  async function downloadFile(url: string, filename: string) {
    const response = await api.get(url, { responseType: "blob" })
    const blob = new Blob([response.data])
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  async function exportPDF(month: number, year: number) {
    await downloadFile(
      `/export/pdf?month=${month}&year=${year}`,
      `krone-${year}-${month}.pdf`
    )
  }

  async function exportExcel(month: number, year: number) {
    await downloadFile(
      `/export/excel?month=${month}&year=${year}`,
      `krone-${year}-${month}.xlsx`
    )
  }

  return { exportPDF, exportExcel }
}