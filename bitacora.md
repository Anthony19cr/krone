# Bitácora — Krone

Registro cronológico de trabajo, decisiones y cambios relevantes. A diferencia
de `context.md` (estado actual del proyecto) y los `CLAUDE.md` (reglas que no
cambian por tarea), este archivo es un historial — no se reescribe, se agrega
una entrada nueva al final por sesión de trabajo relevante.

Formato de cada entrada: fecha, qué se hizo, por qué (decisión/motivo), y qué
archivos toca. No repetir aquí el detalle técnico completo si ya vive en
`context.md` o en un `CLAUDE.md` — enlazar en vez de duplicar.

---

## 2026-08-21 — Exploración inicial y primer arranque del proyecto

**Qué se hizo:** Lectura completa del código existente (backend Express/Prisma
y frontend Next.js) para entender la arquitectura antes de tocar nada.
Primer arranque de ambos servidores (`npm run dev` en `backend/` y
`frontend/`) y verificación de que PostgreSQL local ya estaba corriendo.

**Decisión:** Crear `context.md` en la raíz como documento vivo de estado del
proyecto — arquitectura, cómo levantarlo, modelo de datos, lógica de
recurrencia, deuda técnica conocida — para que cualquier sesión futura de
Claude Code no tenga que re-explorar todo el código desde cero.

**Archivos clave:** `context.md` (creado).

---

## 2026-08-21 — Diagnóstico: "no se muestran datos" en el navegador

**Contexto:** El usuario reportó que el dashboard no mostraba datos justo
después de recibir el enlace `http://localhost:3000`.

**Qué se hizo:** La extensión de Claude en Chrome no estaba conectada, así
que el diagnóstico se hizo por API directa (`curl`): se confirmó que el
backend sí tenía datos reales (categorías, ingresos, gastos, metas) y que
`/summary/monthly` calculaba correctamente el mes actual. Se revisó CORS
(preflight `OPTIONS` correcto) y se sirvió el HTML inicial del frontend sin
errores.

**Causa real:** No fue un bug de código — `tsx watch` y `next dev`
(Turbopack) tardan varios segundos en aceptar conexiones tras arrancar.
El usuario probablemente abrió la pestaña antes de que ambos procesos
terminaran de levantar.

**Resultado:** Confirmado por el usuario con un hard refresh — sin cambios de
código. Este patrón de diagnóstico (verificar timing de arranque antes de
asumir un bug) quedó documentado en `qa/CLAUDE.md`.

---

## 2026-08-21/22 — Frecuencia semanal (`WEEKLY`) en ingresos, gastos y deudas

**Contexto:** El usuario pidió agregar recurrencia semanal en todo el flujo
donde ya existía mensual/quincenal — ingresos, gastos y también deudas.

**Decisiones tomadas:**
- Multiplicador de `WEEKLY` = ×4 (aproximación simple, no calendario real),
  consistente con el criterio que ya existía para `BIWEEKLY` = ×2. Se
  centralizó en `FREQUENCY_MULTIPLIER` (antes el cálculo estaba repetido
  inline en 3 archivos del backend).
- Las deudas no tenían frecuencia de pago — todas asumían cuota mensual. Se
  agregó `Debt.frequency` (`MONTHLY`/`BIWEEKLY`/`WEEKLY`, sin `ONE_TIME`) y
  se renombró `Debt.monthlyPayment` → `Debt.paymentAmount`, porque el nombre
  anterior ya no describía correctamente el campo. La tasa de amortización
  ahora se calcula por período según la frecuencia de pago, no siempre
  mensual.
- La migración de enum (`ADD VALUE 'WEEKLY'`) se separó en su propio archivo
  de migración, distinto del que agrega la columna `Debt.frequency` —
  PostgreSQL no permite usar un valor de enum recién agregado en la misma
  transacción en que se agregó.

**Qué se hizo:**
- Backend: `schema.prisma` (enum + modelo `Debt`), 2 migraciones nuevas
  (`20260821120000_add_weekly_frequency`, `20260821120100_add_debt_frequency`),
  `lib/recurrence.ts` (multiplicador centralizado), `debt.service.ts`
  (amortización por período), `debts.controller.ts`,
  `summary.controller.ts`, `savingGoals.controller.ts`, `export.service.ts`.
- Frontend: nuevo `lib/frequency.ts` compartido (antes las etiquetas/colores
  de frecuencia estaban duplicadas entre `ingresos/page.tsx` y
  `gastos/page.tsx`), selector de frecuencia semanal en ingresos y gastos,
  selector de "Frecuencia de pago" nuevo en el formulario de deudas.

**Verificación:** Se probó por API crear un ingreso y una deuda semanales, se
confirmó que `summary/monthly` combina correctamente MONTHLY+BIWEEKLY+WEEKLY,
y que la exportación a PDF/Excel no falla con el nuevo esquema. Los datos de
prueba se eliminaron después de verificar.

**Nota:** Durante esta tarea se notó que los datos de gastos habían cambiado
respecto a una verificación anterior en la misma sesión — el usuario había
estado editando/borrando registros desde la UI mientras probaba. No fue un
efecto de ningún cambio de código.

---

## 2026-08-22 — Estructura de gobernanza: `CLAUDE.md` raíz + 5 agentes especializados

**Contexto:** El usuario proveyó, en `Base.md/`, los `CLAUDE.md` de dos
proyectos anteriores (restaurantes, sin relación de dominio con Krone) como
referencia de formato y buenas prácticas generales a adoptar.

**Decisión:** Extraer el patrón estructural (rol del agente, tabla de
agentes especializados, flujo de trabajo por capas, sección "NUNCA",
checklists de QA/seguridad, "lo que no hace este agente") sin copiar el
contenido de negocio de esos proyectos (WhatsApp, SINPE, bilingüe, etc.),
que no aplica a Krone. Cada `CLAUDE.md` de Krone describe el estado **real**
del código (por ejemplo: no hay Zod, no hay service layer general, CORS está
abierto) en vez de imponer una arquitectura aspiracional que contradiga lo
que ya existe — con notas explícitas de qué cambiar y cuándo (ver
`security/CLAUDE.md`, sección "Antes de exponer este backend fuera de
`localhost`").

**Qué se hizo:** Se creó `CLAUDE.md` en la raíz y en `backend/` (nuevo, no
existía), se actualizó `frontend/CLAUDE.md` (ya existía como un simple
`@AGENTS.md` — se preservó ese import y se amplió con el resto de
convenciones), y se crearon las carpetas nuevas `database/`, `qa/` y
`security/`, cada una con su `CLAUDE.md`. `context.md` se enlazó con esta
nueva estructura.

**Archivos clave:** `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`,
`database/CLAUDE.md`, `qa/CLAUDE.md`, `security/CLAUDE.md`, `context.md`.

---

## 2026-08-22 — Bitácora del proyecto

**Qué se hizo:** Se creó este archivo (`bitacora.md`) para llevar un
historial cronológico de trabajo y decisiones, separado del estado actual
(`context.md`) y de las reglas fijas (`CLAUDE.md`). Se referenció en
`CLAUDE.md` raíz como parte del flujo de trabajo a actualizar al terminar
cada tarea relevante.

---

## 2026-08-22 — Auditoría general y plan de ahorro por deuda según frecuencia de ingresos

**Contexto:** El usuario pidió una auditoría de cada sección de Krone
comparándola contra apps de finanzas personales similares (YNAB, Fintonic,
PocketGuard, EveryDollar), y propuso una mejora concreta: dado que su
ingreso fuerte es semanal pero paga una deuda mensualmente, quería que el
sistema sugiera cuánto apartar de cada ingreso semanal para completar la
cuota mensual — explícitamente sin depender de un agente de IA por costo de
tokens.

**Qué se hizo (auditoría):** Se revisó cada sección del código (dashboard,
ingresos/gastos, deudas, metas, historial, categorías, export) y se
documentaron ~20 mejoras posibles en el nuevo archivo `mejoras.md`
(presupuestos por categoría, patrimonio neto, recordatorios de vencimiento,
transacciones con fecha real, snowball/avalanche, modo oscuro, etc.).

**Decisión (algoritmo):** El desglose de ahorro se resolvió con aritmética
pura, reutilizando `FREQUENCY_MULTIPLIER` (la misma tabla que ya normaliza
ingresos/gastos/deudas a "por mes"): la cuota mensual-equivalente de una
deuda se reparte entre las frecuencias de ingreso recurrente activas del
usuario, proporcional al peso de cada una en su ingreso mensual total. Se
eligió la versión "proporcional completa" (reparte entre todos los ingresos
activos) en vez de asumir un solo "ingreso principal", porque el usuario
suele tener ingresos mixtos (semanal + quincenal + mensual) y una versión
simple hubiera sido menos precisa.

**Qué se implementó:**
- `backend/src/lib/savingsPlan.ts` (nuevo) — `buildSavingsPlan(monthlyTarget, incomes)`.
- `backend/src/controllers/debts.controller.ts` — `GET /debts` ahora agrega
  `savingsPlan` a cada deuda, calculado contra los ingresos efectivos del
  mes actual (`getEffectiveIncomes`).
- `frontend/src/hooks/useDebts.ts` — nuevo tipo `SavingsPlanItem`, campo
  `savingsPlan` en `Debt`.
- `frontend/src/app/(dashboard)/deudas/page.tsx` — tarjeta agregada al
  inicio de la página con el total a apartar por frecuencia sumando todas
  las deudas activas, y un desglose por deuda individual debajo de su
  barra de progreso.

**Nota de QA:** Durante el desarrollo se encontró (en `backend/.dev.log`) un
error transitorio real: un intento de edición de la deuda "German" falló
con `Argument paymentAmount is missing` porque el hot-reload de `tsx watch`
recargó el controller viejo (todavía con el campo `monthlyPayment`) contra
el cliente de Prisma ya regenerado con el nuevo nombre `paymentAmount`, en
la ventana entre migrar el schema y terminar de editar el controller en la
tarea anterior. No corrompió datos — la edición simplemente no se guardó
(la deuda quedó en su estado previo) y el problema ya no existe con el
código actual. Se verificó con `curl` contra `/api/debts` que el endpoint
responde correctamente con datos reales del usuario.

**Verificación:** `npx tsc --noEmit` sin errores nuevos en backend ni
frontend (el único error de `tsc` en frontend es de un artefacto de tipos
generado por Next.js, no relacionado con este cambio). Las 7 páginas del
frontend siguen respondiendo 200.

**Pendiente al cierre de esta entrada:** commitear y pushear los cambios de
`savingsPlan` (`backend/src/lib/savingsPlan.ts`, `debts.controller.ts`,
`useDebts.ts`, `deudas/page.tsx`) junto con `mejoras.md` y esta entrada de
bitácora.
