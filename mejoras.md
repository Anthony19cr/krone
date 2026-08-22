# Mejoras — Krone

Backlog de mejoras identificadas al comparar Krone contra apps de finanzas
personales similares (YNAB, Fintonic, PocketGuard, EveryDollar, Money
Manager). La numeración es solo para referencia rápida ("la mejora #7") —
**no indica el orden en que se van a implementar**. Cuando una mejora se
completa, se tacha su título y se agrega la fecha; el detalle se deja debajo
por si hace falta consultarlo después.

Ver también `context.md` (estado actual) y `bitacora.md` (historial de lo ya
hecho, con el detalle de cómo se implementó cada mejora completada).

---

### 1. ~~Desglose de ahorro por deuda según frecuencia de ingresos~~ — Completado 2026-08-22

**Contexto:** Si el ingreso fuerte del usuario es semanal pero una deuda se
paga mensualmente, no había forma de saber cuánto apartar de cada pago
semanal para juntar la cuota a tiempo.

**Qué se hizo:** Nuevo `backend/src/lib/savingsPlan.ts` — reparte la cuota
mensual-equivalente de una deuda entre las frecuencias de ingreso recurrente
activas del usuario, proporcional al peso de cada una en el ingreso mensual
total (reutiliza `FREQUENCY_MULTIPLIER`, sin IA). `GET /debts` ahora incluye
`savingsPlan` por deuda. En el frontend: tarjeta agregada al inicio de
`/deudas` con el total a apartar por frecuencia sumando todas las deudas, y
un desglose por deuda individual debajo de su barra de progreso.

---

### 2. Presupuestos por categoría

**Contexto:** Krone reporta el gasto ya ocurrido, pero no permite fijar un
límite por categoría ni ver el progreso contra ese límite antes de que el
mes termine — es el núcleo de YNAB/EveryDollar/PocketGuard.

**Qué implica:** Agregar un `budgetLimit` opcional a `Category` (o un modelo
`Budget` separado por mes si se quiere que el límite pueda variar mes a
mes), y una barra de progreso "gastado / límite" en la página de Categorías
o en el Dashboard.

---

### 3. Patrimonio neto y comparación mes a mes en el Dashboard

**Contexto:** El dashboard muestra ingresos/gastos/balance del mes, pero no
un "patrimonio neto" acumulado (ahorros + valor de metas − deuda restante
total), ni el cambio porcentual respecto al mes anterior en cada métrica.

**Qué implica:** Cálculo derivado (no requiere nuevo modelo): sumar
`SavingGoal.currentAmount` y restar `Debt.remainingAmount` de todas las
deudas activas. Para el % de cambio, comparar contra
`summary/historical`del mes anterior.

---

### 4. Historial con rango seleccionable y desglose por categoría

**Contexto:** `/historial` y el dashboard están fijos a 6 meses; no se puede
ver un año completo ni comparar categorías en el tiempo.

**Qué implica:** Parametrizar `getHistoricalSummary` para aceptar un número
de meses o un rango de fechas, y agregar `expensesByCategory` a cada entrada
del historial (ya se calcula para el mes actual en `summary.controller.ts`,
solo falta aplicarlo también ahí).

---

### 5. Recordatorios de vencimiento (deudas y metas)

**Contexto:** No hay forma de saber "esta deuda vence en 3 días" o "esta
meta lleva atraso" sin entrar a revisar manualmente cada página.

**Qué implica:** Requiere una fecha de vencimiento real en `Debt` (hoy solo
existe un contador de cuotas, sin fecha por cuota) y algún mecanismo de
notificación — como mínimo, un badge visual en el Dashboard listando lo
próximo a vencer, sin necesidad de notificaciones push/correo en una primera
versión.

---

### 6. Transacciones con fecha exacta e importación de movimientos

**Contexto:** Ingresos y gastos son "planificados por mes" (`month`/`year`),
no transacciones con fecha específica — no se puede ver qué pasó un día
puntual ni importar un extracto bancario (CSV/OFX).

**Qué implica:** Cambio de modelo significativo — agregar una fecha real
(`DateTime`) además de o en vez de `month`/`year`, y decidir si esto
reemplaza el modelo actual de recurrencia o convive con él (ej.
"transacciones reales" vs. "planificación recurrente"). Es la mejora de
mayor alcance de esta lista — conviene discutirla aparte antes de tocar el
schema.

---

### 7. Subcategorías, etiquetas y notas en ingresos/gastos

**Contexto:** Categorías son planas (sin subcategoría), y los registros no
admiten notas ni etiquetas libres — limita el nivel de detalle al analizar
gastos.

**Qué implica:** Campo `parentId` opcional en `Category` para subcategorías;
campo `notes`/`tags` opcional en `Income`/`Expense`.

---

### 8. Búsqueda y filtro de texto en las tablas

**Contexto:** Las tablas de ingresos/gastos no tienen buscador — con pocos
registros no se nota, pero crece con el tiempo.

**Qué implica:** Filtro client-side simple sobre los datos ya cargados
(no requiere cambios de backend mientras el volumen sea bajo).

---

### 9. Monto variable en ingresos/gastos recurrentes

**Contexto:** Un ingreso/gasto recurrente asume el mismo monto cada vez —
no cubre casos como "el recibo de luz varía cada mes".

**Qué implica:** Permitir un ajuste puntual del monto efectivo para un
mes específico sin romper la recurrencia base, o registrar el mes con ese
monto distinto como una anulación puntual sobre el recurrente.

---

### 10. Fecha de vencimiento por cuota de deuda

**Contexto:** `Debt` sabe cuántas cuotas van pagadas/faltan, pero no cuándo
vence la próxima cuota en el calendario.

**Qué implica:** Campo `startDate` (o `nextDueDate`) en `Debt`, calculando
las fechas de vencimiento a partir de ahí y la frecuencia. Habilita también
la mejora #5.

---

### 11. Estrategia de pago entre varias deudas (snowball vs. avalanche)

**Contexto:** Con varias deudas activas, no hay ayuda para decidir cuál
atacar primero con un abono extra — es una función común en calculadoras de
deuda.

**Qué implica:** Cálculo puro (sin IA): ordenar deudas por
`remainingAmount` ascendente (snowball) o por `annualRate` descendente
(avalanche) y simular el efecto de destinar un monto extra fijo a la
primera de la lista hasta saldarla, luego pasar a la siguiente.

---

### 12. Simulador de abono extra a capital

**Contexto:** No se puede ver "si pago ₡20,000 de más este mes a esta
deuda, ¿cuánto tiempo/interés me ahorro?" antes de decidir hacerlo.

**Qué implica:** Reutiliza la misma fórmula de amortización de
`debt.service.ts`, corriendo la simulación con `remainingAmount` reducido
por el abono extra en el mes indicado.

---

### 13. Reparto de balance entre metas de ahorro simultáneas

**Contexto:** Con 2+ metas activas, la proyección de cada una usa el mismo
balance mensual promedio completo, como si no compitieran entre sí por el
mismo dinero disponible.

**Qué implica:** Permitir asignar un porcentaje o monto fijo del balance
mensual disponible a cada meta (similar al reparto proporcional ya
implementado en la mejora #1), en vez de asumir que todo el balance está
disponible para cada meta por separado.

---

### 14. Historial de aportes a metas de ahorro

**Contexto:** `currentAmount` se edita a mano sin dejar rastro de cuándo o
cuánto se aportó cada vez.

**Qué implica:** Modelo `SavingContribution` (fecha, monto, `savingGoalId`)
en vez de un solo campo mutable; `currentAmount` pasaría a ser la suma de
sus aportes.

---

### 15. Subcategorías e íconos en Categorías

**Contexto:** Categorías solo tienen nombre y color — apps similares suelen
dar también un ícono representativo.

**Qué implica:** Campo `icon` (nombre de ícono de una librería ya usada o
por definir) en `Category`, más UI de selección en `categorias/page.tsx`.

---

### 16. Exportación anual, CSV, y metas de ahorro en el reporte

**Contexto:** La exportación PDF/Excel es de un mes a la vez y no incluye
metas de ahorro; no hay opción de CSV para importar en otra herramienta.

**Qué implica:** Extender `export.service.ts` para aceptar un rango de
meses (o "todo el año"), agregar una sección de metas de ahorro al reporte,
y un tercer generador (`generateCSV`) reutilizando `buildExportData`.

---

### 17. Modo oscuro

**Contexto:** Krone ya tiene temas de color seleccionables
(`lib/themes.ts`), pero no una variante oscura de ninguno de ellos.

**Qué implica:** Definir valores oscuros para cada token de tema
(`--color-primary/secondary/accent`) y un toggle de modo claro/oscuro,
además de revisar contraste en todos los componentes.

---

### 18. Navegación mobile (sidebar colapsable)

**Contexto:** El `Sidebar` es fijo (`w-56`) y el `Topbar` fijo (`h-14`) sin
versión colapsable — en pantallas angostas la app no es cómoda de usar. Ya
documentado como limitación conocida en `frontend/CLAUDE.md`.

**Qué implica:** Convertir `Sidebar` en un drawer/hamburguesa por debajo de
un breakpoint, similar al patrón ya usado en otros proyectos de referencia
(`Base.md/`).

---

### 19. Confirmación de borrado con modal propio (reemplazar `window.confirm`)

**Contexto:** Todas las eliminaciones (categorías, ingresos, gastos, deudas,
metas) usan el `confirm()` nativo del navegador — funcional, pero sin
posibilidad de mostrar contexto adicional (por ejemplo, "esta categoría
tiene 5 gastos asociados") ni de deshacer la acción.

**Qué implica:** Reutilizar el componente `Modal` ya existente para un
`ConfirmModal` dedicado; considerar además si vale la pena introducir soft
delete (ver nota en `database/CLAUDE.md` — hoy el borrado es físico e
inmediato en todas las entidades).

---

### 20. Autenticación real

**Contexto:** Ya documentado en detalle en `security/CLAUDE.md` — todo el
backend asume `userId: 1` sin ningún login. No es una mejora de producto
sino un bloqueante de seguridad si el proyecto deja de correr solo en
`localhost`.

**Qué implica:** Ver `security/CLAUDE.md`, sección "Antes de exponer este
backend fuera de `localhost`", para el orden recomendado de esta y las
demás tareas de seguridad asociadas.
