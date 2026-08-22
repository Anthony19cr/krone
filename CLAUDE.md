# CLAUDE.md — Krone: Gestión de Finanzas Personales

## Rol

Ingeniero de software senior actuando como orquestador. Lee este archivo completo antes de tocar cualquier capa. Luego lee el agente especializado que corresponde a la tarea en curso.

Krone es una aplicación de finanzas personales de **un solo usuario** (sin registro, sin login — todo el backend asume `userId: 1`). Permite registrar ingresos y gastos (únicos, mensuales, quincenales o semanales), deudas con cálculo automático de cuota por amortización francesa, metas de ahorro con proyección de fecha de cumplimiento, un dashboard con resumen mensual y gráficos, historial de 6 meses, y exportación del reporte mensual a PDF y Excel.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js, Express 5, TypeScript (ESM, `NodeNext`) |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Base de datos | PostgreSQL (local, servicio Windows) |
| Gestor de paquetes backend | pnpm |
| Frontend | Next.js 16.2.1 (App Router, Turbopack, React Compiler activado) |
| UI | React 19, Tailwind CSS v4 |
| Data fetching | TanStack Query v5 + axios |
| Estado de cliente | Zustand (con `persist`) |
| Gráficos | Recharts |
| Exportación | `pdfkit` (PDF), `exceljs` (Excel) |
| Gestor de paquetes frontend | npm |

No sustituir tecnologías sin consultar.

**Advertencia (`frontend/AGENTS.md`):** esta versión de Next.js puede tener cambios de comportamiento respecto al conocimiento de entrenamiento del modelo. Antes de escribir código nuevo de Next.js o depurar algo que "debería funcionar", revisar `frontend/node_modules/next/dist/docs/`, en particular la guía de migración a v16.

---

## Agentes especializados

| Capa | Archivo |
|---|---|
| Frontend (Next.js, UI, hooks, temas) | `frontend/CLAUDE.md` |
| Backend (Express, API REST, lógica de negocio) | `backend/CLAUDE.md` |
| Base de datos (PostgreSQL, Prisma, schema, migraciones) | `database/CLAUDE.md` |
| QA (pruebas, flujos críticos, errores conocidos) | `qa/CLAUDE.md` |
| Seguridad (auth, CORS, validación, secretos) | `security/CLAUDE.md` |

Seguridad es transversal: consultarlo siempre que la tarea involucre endpoints, formularios, variables de entorno o cualquier plan de exponer el backend fuera de `localhost`.

---

## Flujo de trabajo

1. Leer este archivo y el agente de la capa a trabajar. Si hay dudas sobre el estado actual del proyecto (qué corre en qué puerto, decisiones ya tomadas, deuda técnica conocida), leer `context.md` primero — es la fuente de verdad viva del estado del proyecto.
2. Si la tarea toca endpoints, CORS o variables de entorno: leer también `security/CLAUDE.md`.
3. Si la tarea involucra datos: `database/CLAUDE.md` (schema) → migración → `backend/CLAUDE.md` (service/controller) → `frontend/CLAUDE.md` (hook/página). Ver la sección "Frecuencias" más abajo como ejemplo real de un cambio que atravesó las tres capas.
4. Confirmar en dos líneas qué se va a construir y qué archivos se van a tocar antes de empezar cambios grandes o que tocan el schema.
5. Backend y frontend corren como dos procesos `npm run dev` independientes (puertos 3001 y 3000). Si algo no responde, no asumir un bug de código antes de comprobar que ambos procesos siguen vivos — `tsx watch` y `next dev` (Turbopack) tardan varios segundos en arrancar o recompilar tras un cambio de schema/dependencias.
6. Toda funcionalidad de frontend se prueba en el navegador (Claude in Chrome si está disponible; si la extensión no conecta, verificar por API con `curl` y dejarlo explícito en la respuesta) antes de darse por terminada.
7. Al terminar, si el cambio afecta el modelo de datos, la arquitectura o alguna decisión que otra sesión de Claude Code debería conocer al iniciar: actualizar `context.md`.
8. Agregar una entrada nueva a `bitacora.md` con lo que se hizo, por qué (decisión/motivo) y qué archivos se tocaron — no reemplaza a `context.md` (que describe el estado actual), es el historial de cómo se llegó ahí. No reescribir entradas anteriores, solo agregar al final.

---

## Reglas de negocio clave

- **Un solo usuario real.** Todo el backend usa `userId: 1`. No hay tabla de sesiones ni JWT activo — ver `security/CLAUDE.md` para el riesgo que esto implica si el proyecto se despliega fuera de `localhost`.
- **Frecuencias — mensual, quincenal, semanal, único.** Un ingreso, gasto o cuota de deuda puede repetirse `MONTHLY`, `BIWEEKLY`, `WEEKLY` o ser `ONE_TIME`. La equivalencia mensual usa `FREQUENCY_MULTIPLIER` (`ONE_TIME`/`MONTHLY` ×1, `BIWEEKLY` ×2, `WEEKLY` ×4) — es una aproximación simple, no un calendario real. Esta tabla vive en **dos** archivos que deben mantenerse sincronizados: `backend/src/lib/recurrence.ts` y `frontend/src/lib/frequency.ts`. Si se agrega una frecuencia nueva, hay que tocar ambos, más el enum de Prisma, la migración, y los `<select>` del frontend (ingresos, gastos, deudas).
- **Deudas.** La cuota (`paymentAmount`) se calcula server-side con amortización francesa, usando una tasa de período derivada de la frecuencia de pago de la deuda (`backend/src/services/debt.service.ts`). Nunca se calcula en el frontend.
- **Moneda es cosmética en el frontend.** `useConfig` (Zustand) guarda el símbolo/código de moneda elegido por el usuario, pero el backend nunca convierte montos entre monedas — todo se almacena en la unidad en que el usuario lo ingresó. No asumir que cambiar la moneda en el selector convierte los números existentes.
- **Sin fecha de fin de recurrencia.** Un ingreso/gasto recurrente, una vez creado, se proyecta indefinidamente hacia el futuro desde su mes de origen. No hay campo para "terminar" una recurrencia.

---

## NUNCA

- Commitear `.env`, `DATABASE_URL` con credenciales, o cualquier secreto — ver `.gitignore`, ya cubierto, pero verificar antes de cualquier `git add` amplio.
- Cambiar `FREQUENCY_MULTIPLIER` en un solo archivo (backend o frontend) sin actualizar el otro — produce inconsistencia entre lo que el dashboard reporta y lo que el usuario ve en las tablas.
- Ejecutar `prisma migrate reset` o cualquier operación destructiva contra la base de datos de desarrollo sin confirmar primero con el usuario — contiene datos reales que el usuario ha estado ingresando manualmente.
- Introducir `any` en TypeScript donde ya existe un tipo de Prisma o uno definido en `frontend/src/hooks/*` — reutilizarlo.
- Asumir que un servidor está caído porque una request falla inmediatamente después de arrancarlo — `tsx watch` y `next dev` con Turbopack tardan en aceptar conexiones o compilar la primera ruta visitada.
- Emojis en código, comentarios, commits o documentación del proyecto.

---

## Archivos del proyecto

| Archivo | Propósito |
|---|---|
| `CLAUDE.md` (este archivo) | Orquestador. Punto de entrada para cualquier tarea. |
| `context.md` | Estado vivo del proyecto: arquitectura, cómo levantarlo, modelo de datos, deuda técnica conocida. Se actualiza conforme el proyecto avanza (se sobrescribe, no acumula historial). |
| `bitacora.md` | Historial cronológico: qué se hizo, qué se decidió y por qué, sesión a sesión. Se agrega una entrada nueva al final, nunca se reescribe lo anterior. |
| `backend/CLAUDE.md` | Agente de backend: Express, API REST, servicios, convenciones. |
| `frontend/CLAUDE.md` | Agente de frontend: Next.js, componentes, hooks, temas. |
| `database/CLAUDE.md` | Agente de base de datos: schema Prisma, migraciones, convenciones de datos. |
| `qa/CLAUDE.md` | Agente de QA: flujos críticos, casos borde, checklist de verificación. |
| `security/CLAUDE.md` | Agente de seguridad: modelo de amenazas, auth, CORS, checklist antes de exponer el proyecto fuera de `localhost`. |

---

## Retomar trabajo pendiente

Al iniciar una sesión de trabajo sin una tarea puntual asignada:

1. Leer `context.md` completo y las últimas 2-3 entradas de `bitacora.md`.
2. Verificar si el backend (puerto 3001, `/health`) y el frontend (puerto 3000) siguen corriendo; si no, levantarlos (`npm run dev` en cada carpeta).
3. Revisar `git log`/`git status` para confirmar si hay trabajo sin commitear desde la última entrada de la bitácora.
4. Con ayuda de `qa/CLAUDE.md`, probar en el navegador cualquier funcionalidad tocada en la sesión anterior antes de continuar con trabajo nuevo.
