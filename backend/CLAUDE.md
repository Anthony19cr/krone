# backend/CLAUDE.md — Agente Backend · Krone

## Rol

Ingeniero backend senior. Responsable de la API REST y la lógica de negocio del servidor. Lee `CLAUDE.md` en la raíz antes de empezar cualquier tarea. Lee `security/CLAUDE.md` antes de tocar CORS, variables de entorno o cualquier plan de exponer este backend fuera de `localhost`.

Este backend es deliberadamente simple: un solo usuario (`userId: 1` hardcodeado en cada controller), sin autenticación activa, sin capa de validación con Zod, sin logger estructurado. Es el estado real actual, no un objetivo — antes de "corregirlo" agregando una capa de arquitectura nueva (auth, validación, service layer generalizado), confirmar con el usuario si el alcance del proyecto lo justifica. Ver `security/CLAUDE.md` para cuándo esto deja de ser aceptable (por ejemplo, al desplegar fuera de `localhost`).

---

## Arquitectura real

```
Route → Controller → Prisma directo (mayoría de entidades)
Route → Controller → Service → Prisma (Debt, Export)
```

A diferencia de un patrón por capas estricto, la mayoría de los controllers (`categories`, `incomes`, `expenses`, `savingGoals`, `summary`) llaman a Prisma directamente — no hay una capa de servicio intermedia para ellos. Solo dos dominios tienen service dedicado porque concentran lógica de cálculo no trivial:

- `services/debt.service.ts` — amortización francesa de la cuota de una deuda.
- `services/export.service.ts` — construcción de los datos y generación de PDF/Excel.

Si una lógica de cálculo empieza a repetirse entre controllers (ya pasó con el multiplicador de frecuencia — ver abajo), se extrae a `lib/`, no a un service nuevo por entidad. No agregar una capa de servicio genérica "por si acaso" para entidades CRUD simples — sería abstracción sin necesidad real.

---

## Estructura de carpetas

```
/src
  app.ts                       — bootstrap Express, CORS, /health
  /controllers
    categories.controller.ts
    incomes.controller.ts
    expenses.controller.ts
    debts.controller.ts
    savingGoals.controller.ts
    summary.controller.ts
    export.controller.ts
  /routes
    index.ts                   — monta todos los routers bajo /api
    categories.routes.ts / incomes.routes.ts / ... (uno por recurso)
  /services
    debt.service.ts            — calculatePayment (amortización por frecuencia)
    export.service.ts          — buildExportData, generatePDF, generateExcel
  /lib
    prisma.ts                  — PrismaClient singleton (adapter-pg)
    recurrence.ts               — getEffectiveIncomes/Expenses, FREQUENCY_MULTIPLIER, effectiveAmount
```

---

## Convenciones

| Elemento | Estilo | Ejemplo real |
|---|---|---|
| Variables y funciones | camelCase, en inglés | `getEffectiveIncomes`, `calculatePayment` |
| Archivos | camelCase + sufijo de rol | `savingGoals.controller.ts`, `debt.service.ts` |
| Variables de entorno | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |
| Rutas API | kebab-case en plural | `/api/saving-goals` |

Imports usan extensión `.js` explícita (`from "../lib/prisma.js"`) — requerido por la configuración ESM/`NodeNext` del proyecto, aunque el archivo fuente sea `.ts`. No quitar la extensión al agregar imports nuevos.

---

## La lógica de recurrencia (leer antes de tocar incomes/expenses/debts/summary)

`lib/recurrence.ts` es la fuente de verdad de dos cosas:

1. **Qué registros son "efectivos" en un mes/año dado** (`getEffectiveIncomes`, `getEffectiveExpenses`): compara `periodIndex = year*12+month` del registro contra el mes consultado. `ONE_TIME` solo cuenta en su mes exacto; `MONTHLY`/`BIWEEKLY`/`WEEKLY` cuentan desde su mes de origen en adelante, sin fecha de fin.
2. **Cuánto vale ese registro en términos mensuales** (`FREQUENCY_MULTIPLIER`, `effectiveAmount`): `ONE_TIME`/`MONTHLY` ×1, `BIWEEKLY` ×2, `WEEKLY` ×4.

`effectiveAmount` se usa en `summary.controller.ts`, `savingGoals.controller.ts` y `export.service.ts` para totales de ingresos, gastos **y deudas** (`debt.paymentAmount * multiplicador(debt.frequency)`). Si se necesita el mismo cálculo en un controller nuevo, importarlo de aquí — no reimplementar el `if (frequency === "BIWEEKLY") amount * 2 : amount` inline; ese patrón ya se duplicó una vez y costó tres archivos sincronizar al agregar `WEEKLY`.

El equivalente en frontend es `frontend/src/lib/frequency.ts` — ambas tablas deben tener los mismos multiplicadores.

---

## Manejo de errores

No existe un middleware de errores centralizado ni una clase `AppError` todavía. Express 5 reenvía automáticamente los rechazos de promesas de los controllers async al manejador de error por defecto, así que un `throw` o una promesa rechazada no cuelga el servidor, pero el mensaje de error que llega al cliente es el de Express por defecto (puede incluir detalles internos en desarrollo). Si se agrega un endpoint con una validación de negocio que deba devolver un error controlado, seguir el patrón ya usado en `debts.controller.ts` y `savingGoals.controller.ts`: `res.status(4xx).json({ error: "mensaje" }); return`.

Si el proyecto crece lo suficiente como para justificar una clase `AppError` + middleware de error global, es una decisión de arquitectura — proponerla, no introducirla de forma incidental dentro de una tarea distinta.

---

## Validación de entrada

No hay Zod ni sanitización de strings en ningún endpoint actualmente. Los controllers validan solo presencia de campos requeridos (`if (!name || !amount ...)`) y castean tipos con `Number(...)`. Esto es aceptable mientras el sistema sea de un solo usuario local (ver `security/CLAUDE.md`), pero es lo primero que debe cambiar si el backend llega a exponerse fuera de `localhost` o a aceptar más de un usuario.

---

## Endpoints (`/api`)

| Método | Ruta | Notas |
|---|---|---|
| GET/POST | `/categories?type=INCOME\|EXPENSE` | `PUT/DELETE /categories/:id` |
| GET/POST | `/incomes?month&year` | Sin `month`/`year` devuelve todos (debug/admin). `PUT/DELETE /incomes/:id` |
| GET/POST | `/expenses?month&year` | Mismo patrón que incomes. `PUT/DELETE /expenses/:id` |
| GET/POST | `/debts` | Calcula `paymentAmount` server-side según `frequency`. `PUT/DELETE /debts/:id` |
| GET/POST | `/saving-goals` | Devuelve `percentage`, `projectedDate`, `onTrack` calculados en el GET. `PUT/DELETE /saving-goals/:id` |
| GET | `/summary/monthly?month&year` | Resumen del mes: totales, alertas, `expensesByCategory` |
| GET | `/summary/historical` | Últimos 6 meses, sin parámetros |
| GET | `/export/pdf?month&year&symbol` | `symbol` es el símbolo de moneda a mostrar; `₡` se traduce a texto "CRC" porque PDFKit no soporta ese glifo |
| GET | `/export/excel?month&year&symbol` | Mismo patrón que `/export/pdf` |

**Inconsistencia conocida:** `frontend/src/hooks/useExport.ts` envía también `currency` como query param, pero `export.controller.ts` solo lee `symbol` — no es un bug funcional (el símbolo ya trae la información necesaria) pero es ruido a limpiar si se toca ese archivo.

---

## CORS

`app.use(cors())` sin restricciones — acepta cualquier origen. Aceptable para desarrollo local de un solo usuario. Ver `security/CLAUDE.md` antes de restringirlo o de desplegar el backend en una URL pública.

---

## Variables de entorno (`backend/.env`)

```
DATABASE_URL=postgresql://...   # PostgreSQL local
JWT_SECRET=...                  # existe, no se usa en ningún código todavía
PORT=3001
```

No agregar valores por defecto hardcodeados para `DATABASE_URL` en el código — debe fallar visiblemente si falta, no conectar silenciosamente a algo inesperado.

---

## Lo que no hace este agente

- No toca componentes React ni hooks del frontend.
- No define el schema de Prisma. Lo consume — si necesita un campo o modelo nuevo, lo reporta a `database/CLAUDE.md` antes de escribir código que asuma que ya existe.
- No decide la política de CORS/autenticación de producción — la implementa según lo que `security/CLAUDE.md` indique, pero no la decide unilateralmente.
- No configura el servicio de PostgreSQL ni la infraestructura de despliegue.
