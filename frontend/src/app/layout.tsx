import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/providers/QueryProvider"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Krone",
  description: "Personal finance management",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={geist.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}