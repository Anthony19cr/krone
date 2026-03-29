export type Theme = {
  name: string
  primary: string
  secondary: string
  accent: string
}

export const themes: Theme[] = [
  { name: "Krone",   primary: "#6b7280", secondary: "#e5e7eb", accent: "#c9a84c" },
  { name: "Verde",   primary: "#1a6b4a", secondary: "#2aab73", accent: "#e6f5ee" },
  { name: "Azul",    primary: "#1a3f6b", secondary: "#2a72ab", accent: "#e6f0f5" },
  { name: "Violeta", primary: "#3d1a6b", secondary: "#7a2aab", accent: "#f0e6f5" },
  { name: "Gris",    primary: "#2a2a2a", secondary: "#555555", accent: "#f0f0f0" },
]

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.style.setProperty("--color-primary", theme.primary)
  root.style.setProperty("--color-secondary", theme.secondary)
  root.style.setProperty("--color-accent", theme.accent)
  localStorage.setItem("krone-theme", JSON.stringify(theme))
}

export function loadSavedTheme(): Theme {
  if (typeof window === "undefined") return themes[0]!
  const saved = localStorage.getItem("krone-theme")
  return saved ? JSON.parse(saved) : themes[0]!
}