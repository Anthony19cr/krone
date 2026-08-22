# Krone — Contexto del proyecto

> Ver `CLAUDE.md` en la raíz para el flujo de trabajo y los agentes
> especializados por capa (`backend/CLAUDE.md`, `frontend/CLAUDE.md`,
> `database/CLAUDE.md`, `qa/CLAUDE.md`, `security/CLAUDE.md`). Este archivo
> es el estado vivo del proyecto; los `CLAUDE.md` son las reglas y
> convenciones que no cambian con cada tarea.

Krone es una app de finanzas personales de un solo usuario (sin auth real:
todo el backend usa `userId: 1` hardcodeado). Monorepo con `backend/` y
`frontend/` independientes, cada uno con su propio `package.json`.

## Stack

- **Backend**: Node + Express 5, TypeScript (ESM, `NodeNext`), Prisma 7 con
  `@prisma/adapter-pg` sobre PostgreSQL. Export a PDF (`pdfkit`) y Excel
  (`exceljs`).
- **Frontend**: Next.js 16.2.1 (App Router, Turbopack, React Compiler
  activado), React 19, TanStack Query v5, Zustand (persist) para config de
  moneda, Tailwind v4, Recharts para gráficos.
- Gestor de paquetes del backend: **pnpm** (hay `pnpm-lock.yaml` y
  `pnpm-workspace.yaml`), aunque también existe `package-lock.json`. El
  frontend usa npm (`package-lock.json`).

⚠️ **Importante**: `frontend/AGENTS.md` advierte que esta versión de
Next.js tiene cambios importantes respecto al conocimiento de entrenamiento
del modelo. Antes de escribir código nuevo de Next, revisar
`frontend/node_modules/next/dist/docs/`.

## Cómo levantar el proyecto

Requisitos: PostgreSQL corriendo localmente (servicio Windows
`postgresql-x64-18`), base de datos `krone` creada.

```bash
# Backend (puerto 3001)
cd backend
npm run dev        # tsx watch src/app.ts

# Frontend (puerto 3000)
cd frontend
npm run dev        # next dev (Turbopack)
```

- Backend: http://localhost:3001 (health check en `/health`, API en `/api`)
- Frontend: http://localhost:3000

### Variables de entorno

- `backend/.env`: `DATABASE_URL` (postgresql local), `JWT_SECRET` (no usado
  activamente, no hay auth implementada), `PORT=3001`.
- `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`.

### Seed

`backend/prisma/seed.ts` solo crea un usuario dev (`dev@krone.local`, id 1).
No siembra categorías/datos de ejemplo.

## Modelo de datos (Prisma)

`User` (1 solo usuario real, id=1) → `Category`, `Income`, `Expense`,
`Debt`, `SavingGoal`.

- `Category`: `type` (`INCOME`/`EXPENSE`), color, único por `(name, type, userId)`.
- `Income` / `Expense`: monto, `frequency` (`MONTHLY` / `BIWEEKLY` /
  `WEEKLY` / `ONE_TIME`), `month`/`year` de origen, categoría.
- `Debt`: monto total/restante, cuotas totales/pagadas, tasa anual,
  `frequency` (`MONTHLY` / `BIWEEKLY` / `WEEKLY` — sin `ONE_TIME`, no
  aplica a deudas); `paymentAmount` (antes `monthlyPayment`, renombrado en
  la migración `20260821120100_add_debt_frequency`) es la cuota por
  período, calculada server-side con amortización francesa usando la tasa
  de período correspondiente a `frequency`
  (`backend/src/services/debt.service.ts`, función `calculatePayment`).
- `SavingGoal`: monto objetivo/actual, fecha límite opcional; proyección de
  fecha de cumplimiento calculada en base al balance mensual promedio
  (ingresos - gastos - cuotas de deuda).

## Lógica de recurrencia (clave para entender el resto del código)

`backend/src/lib/recurrence.ts` define qué ingresos/gastos son "efectivos"
para un mes/año dado, comparando `periodIndex = year*12 + month`:

- `ONE_TIME`: solo cuenta en su mes/año de origen exacto.
- `MONTHLY` / `BIWEEKLY` / `WEEKLY`: cuentan desde su mes/año de origen
  **en adelante** (no hay lógica de "fin de recurrencia").
- El monto "efectivo" mensual se calcula multiplicando por
  `FREQUENCY_MULTIPLIER` (mismo criterio en backend
  `lib/recurrence.ts` y frontend `lib/frequency.ts`):
  `ONE_TIME`/`MONTHLY` ×1, `BIWEEKLY` ×2, `WEEKLY` ×4. Es una
  aproximación simple (no usa calendario real: no distingue meses de 4 vs
  5 semanas), consistente con el criterio que ya existía para `BIWEEKLY`.
- Esta misma tabla de multiplicadores se usa para las deudas: el aporte
  mensual-equivalente de una deuda es `paymentAmount * multiplicador(frequency)`,
  y la tasa de período usada en la amortización es
  `annualRate / 100 / (12 * multiplicador(frequency))`.

El helper `effectiveAmount(amount, frequency)` centraliza este cálculo
(backend: `lib/recurrence.ts`; frontend: `lib/frequency.ts`) y se usa en
`summary.controller.ts`, `savingGoals.controller.ts`,
`export.service.ts`, y en las páginas de ingresos/gastos/deudas del
frontend — si se agrega otra frecuencia en el futuro, solo hay que tocar
`FREQUENCY_MULTIPLIER` en esos dos archivos (más las opciones de los
`<select>` y `FREQ_LABELS`/`FREQ_COLORS` en el frontend).

## Rutas API (`/api`)

`/categories`, `/incomes`, `/expenses`, `/debts`, `/saving-goals`
(CRUD estándar), `/summary/monthly?month&year`, `/summary/historical`
(últimos 6 meses), `/export/pdf` y `/export/excel`
(`?month&year&symbol`).

## Frontend — estructura

Rutas en el grupo `(dashboard)`: `/` (inicio), `/ingresos`, `/gastos`,
`/deudas`, `/metas`, `/historial`, `/categorias`. Layout con `Sidebar`
(navegación + selector de tema + selector de moneda) y `Topbar`.

- Un hook TanStack Query por entidad en `src/hooks/` (`useIncomes`,
  `useExpenses`, `useDebts`, `useSavingGoals`, `useCategories`,
  `useSummary`, `useExport`).
- `useConfig` (Zustand + persist en localStorage, key `krone-config`):
  moneda seleccionada globalmente. El símbolo de moneda es solo cosmético
  en frontend — el backend no hace conversión de tasas, todo se guarda en
  la unidad que el usuario ingresó.
- `src/lib/themes.ts`: temas de color aplicados vía CSS custom properties
  (`--color-primary/secondary/accent`) y persistidos en localStorage
  (`krone-theme`).
- `src/lib/frequency.ts`: fuente única de verdad para frecuencias en el
  frontend (`FREQUENCY_MULTIPLIER`, `FREQ_LABELS`, `FREQ_COLORS`,
  `effectiveAmount`). Usado por `ingresos/page.tsx`, `gastos/page.tsx` y
  `deudas/page.tsx`. `useDebts.ts` expone `DebtFrequency` (= `Frequency`
  sin `ONE_TIME`) para el formulario de deudas.
- Los gráficos (`CashFlowChart`, `CategoryChart`, `HistoricalChart`) usan
  Recharts y tienen el símbolo ₡ hardcodeado en sus tooltips (no respetan
  `useConfig`).

## Notas / deuda técnica conocida

- No hay autenticación real; todo asume un único usuario (`userId: 1`).
  `JWT_SECRET` existe en `.env` pero no se usa en el código.
- La recurrencia no soporta "fecha de fin" — un ingreso/gasto recurrente
  se proyecta indefinidamente hacia el futuro una vez creado.
- Los tooltips de los gráficos del dashboard muestran ₡ fijo,
  independientemente de la moneda configurada por el usuario.
- `frontend/src/hooks/useExport.ts` envía `currency` como query param al
  export, pero el backend (`export.controller.ts`) solo lee `symbol`.
