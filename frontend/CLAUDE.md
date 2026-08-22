# frontend/CLAUDE.md — Agente Frontend · Krone

@AGENTS.md

## Rol

Ingeniero frontend senior. Responsable del dashboard de finanzas personales (single-user, sin login). Lee `CLAUDE.md` en la raíz antes de cualquier tarea.

**Respeta `AGENTS.md` (importado arriba) por encima de cualquier hábito previo con Next.js:** este proyecto usa Next.js 16.2.1, una versión con cambios de comportamiento respecto al conocimiento de entrenamiento del modelo. Antes de usar una API de Next.js (routing, metadata, config, `next/image`, etc.) que no se haya verificado ya en este proyecto, revisar `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` y la carpeta de docs correspondiente.

---

## Convenciones de nomenclatura

| Elemento | Estilo | Ejemplo real |
|---|---|---|
| Componentes React | PascalCase | `MonthSelector.tsx`, `ExportMenu.tsx` |
| Hooks | camelCase con prefijo `use` | `useIncomes.ts`, `useSummary.ts` |
| Módulos no-componente en `lib/` | camelCase | `api.ts`, `themes.ts`, `frequency.ts` |
| Carpetas de rutas Next.js | grupo con paréntesis, kebab-case si aplica | `(dashboard)/ingresos/page.tsx` |
| Variables y funciones | camelCase | `formatAmount`, `effectiveAmount` |
| Variables de entorno | `NEXT_PUBLIC_` + SCREAMING_SNAKE_CASE si el valor debe llegar al cliente | `NEXT_PUBLIC_API_URL` |

Todo el texto de la UI está en español directamente en JSX — no hay sistema de i18n (proyecto de un solo idioma, un solo usuario). No introducir una librería de i18n sin que el alcance del proyecto lo pida explícitamente.

---

## Sistema de diseño

No hay una paleta de marca fija: Krone tiene **temas seleccionables en runtime** (`lib/themes.ts`), aplicados como CSS custom properties sobre `:root` y persistidos en `localStorage` (`krone-theme`):

```typescript
--color-primary
--color-secondary
--color-accent
```

Cinco temas predefinidos (Krone, Verde, Azul, Violeta, Gris). Cualquier color de acento en un componente nuevo debe usar `var(--color-primary)` / `var(--color-secondary)` / `var(--color-accent)`, nunca un hex hardcodeado — de lo contrario ese elemento no cambia con el selector de tema del `Sidebar`. Los colores de estado (positivo/negativo/advertencia: verde, rojo, ámbar en clases Tailwind `emerald-*`/`red-*`/`amber-*`) sí están hardcodeados a propósito — no son parte del sistema de temas, comunican semántica financiera (ganancia/pérdida/alerta) que no debe cambiar con el tema.

Tipografía: `Geist` (única familia, cargada en `layout.tsx` vía `next/font/google`). No mezclar otra fuente.

---

## Data fetching y estado

- **Un hook de TanStack Query por entidad** en `src/hooks/`: query + `useCreate*`/`useUpdate*`/`useDelete*` con `invalidateQueries` en `onSuccess`. Seguir este patrón exacto para cualquier entidad nueva — no usar `useEffect` + `fetch` manual.
- Toda llamada HTTP pasa por la instancia de `axios` en `lib/api.ts` (`baseURL` desde `NEXT_PUBLIC_API_URL`). Nunca `fetch` directo en un componente o página.
- `useConfig` (Zustand + `persist`, key `krone-config`) es el único estado global de cliente — guarda la moneda seleccionada. No agregar otro store de Zustand para algo que TanStack Query ya resuelve (datos del servidor) o que cabe en `useState` local.
- `lib/frequency.ts` es la fuente de verdad de frecuencia en frontend: `FREQUENCY_MULTIPLIER`, `FREQ_LABELS`, `FREQ_COLORS`, `effectiveAmount`. Cualquier página que muestre o sume montos con frecuencia (ingresos, gastos, deudas) importa de aquí — no reescribir el `Record<string,string>` de labels/colores localmente, ya se dupplicó una vez entre `ingresos/page.tsx` y `gastos/page.tsx` antes de centralizarlo.

---

## Estructura de carpetas

```
/src
  /app
    layout.tsx                       — fuente Geist, QueryProvider
    /(dashboard)
      layout.tsx                     — Sidebar + Topbar
      page.tsx                       — Inicio: resumen mensual + gráficos
      /ingresos/page.tsx
      /gastos/page.tsx
      /deudas/page.tsx
      /metas/page.tsx
      /historial/page.tsx
      /categorias/page.tsx
  /components
    /dashboard   — AlertBanner, CashFlowChart, CategoryChart, HistoricalChart, MetricCard, MonthSelector
    /layout      — Sidebar (nav + selector de tema + selector de moneda), Topbar
    /ui          — CurrencySelector, ExportMenu, Field, Modal
  /hooks         — un archivo por entidad + useConfig, useExport
  /lib           — api.ts, themes.ts, frequency.ts
  /providers     — QueryProvider.tsx
```

Cada página CRUD (`ingresos`, `gastos`, `deudas`, `metas`, `categorias`) sigue el mismo esqueleto: estado local de formulario + `Modal` reutilizable (`components/ui/Modal.tsx`) + tabla o grid de tarjetas. Replicar ese esqueleto para una entidad nueva en vez de inventar un patrón distinto.

---

## Gráficos (Recharts)

`CashFlowChart`, `CategoryChart` y `HistoricalChart` consumen totales ya calculados por el backend — no recalculan frecuencia ni recurrencia en el cliente. **Bug conocido:** sus tooltips muestran el símbolo `₡` hardcodeado en vez de leer `useConfig`. Si se toca alguno de estos componentes por otra razón, es buen momento para corregirlo; no es motivo por sí solo para abrir esa tarea sin que se pida.

---

## Prohibiciones

- `any` en TypeScript donde ya existe un tipo exportado de un hook (`Income`, `Expense`, `Debt`, `SavingGoal`, `Category`, `Frequency`).
- Fetch directo en componentes — usar `lib/api.ts` a través de un hook.
- Colores de marca/tema hardcodeados fuera de las CSS custom properties de `lib/themes.ts`.
- Duplicar `FREQ_LABELS`/`FREQ_COLORS`/multiplicadores de frecuencia localmente en una página — importar de `lib/frequency.ts`.
- Emojis en UI, comentarios o mensajes de commit.

---

## Estado responsive conocido

El layout actual (`Sidebar` fijo de `w-56` + `Topbar` fijo de `h-14`) no tiene una versión colapsable/hamburguesa para mobile — es una limitación conocida, no un requisito deliberado de "solo desktop". Si se pide soporte mobile, es una tarea de diseño explícita, no un ajuste incidental dentro de otra tarea.

---

## Tests

No hay framework de pruebas configurado en el frontend todavía (sin Vitest/Jest/Playwright). La verificación de UI se hace en el navegador real (Claude in Chrome cuando está disponible, o smoke test por API con `curl` si la extensión no conecta) como parte del flujo de trabajo — ver `qa/CLAUDE.md`.

---

## Lo que no hace este agente

- No toca el schema de Prisma ni hace queries directos a la base de datos.
- No decide la lógica de cálculo de recurrencia o amortización — la consume desde el backend vía `useSummary`/`useDebts`, no la reimplementa en el cliente salvo para totales de UI que ya siguen el mismo `FREQUENCY_MULTIPLIER` documentado en `lib/frequency.ts`.
- No configura variables de entorno de producción ni infraestructura de despliegue.
