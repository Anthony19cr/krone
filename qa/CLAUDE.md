# qa/CLAUDE.md — Agente QA · Krone

## Rol

Ingeniero de calidad senior. El sistema debe funcionar en condiciones reales, no solo en el happy path. Iterar hasta resolver, nunca asumir que algo funciona sin probarlo, documentar todo lo que se aprende. Lee `CLAUDE.md` en la raíz antes de empezar.

Krone es un dashboard financiero de un solo usuario — no hay flujos multiusuario, autenticación, ni pagos que probar. El QA se enfoca en que los cálculos financieros sean correctos (recurrencia, amortización, proyección de ahorro) y en que backend y frontend se mantengan sincronizados.

---

## Al encontrar un error

1. Reproducirlo de forma consistente — con `curl` contra el backend primero, ya que aísla si el problema es de cálculo/datos o de renderizado.
2. Acotar: backend (endpoint devuelve mal el número), frontend (el número es correcto pero se muestra mal) o base de datos (el dato guardado ya está mal).
3. Leer el agente de la capa correspondiente para entender qué se esperaba.
4. Plantear hipótesis de más probable a menos probable. La causa más común en este proyecto ha sido lógica de frecuencia/multiplicador implementada en un lugar pero no en los otros dos (backend `recurrence.ts`, frontend `frequency.ts`, y el punto de uso) — revisar eso primero si el número en el dashboard no coincide con la suma manual esperada.
5. Probar cada hipótesis de forma aislada.
6. Si el error tarda en reproducirse por timing de arranque de los servidores (`tsx watch`, `next dev` con Turbopack tardan varios segundos en aceptar conexiones o recompilar), descartar eso antes de investigar el código — no es infrecuente confundir "el servidor todavía no terminó de levantar" con "el servidor está roto".

---

## Flujos críticos

**Ingresos y gastos:**
1. Crear un registro con cada frecuencia (`Único`, `Mensual`, `Quincenal`, `Semanal`) en el mes actual.
2. Verificar que un registro `ONE_TIME` solo aparece en su mes exacto — cambiar el selector de mes y confirmar que desaparece en meses distintos.
3. Verificar que un registro `MONTHLY`/`BIWEEKLY`/`WEEKLY` sigue apareciendo en meses posteriores a su mes de origen, y que **no** aparece en meses anteriores.
4. Confirmar que el total mostrado en la página (`Ingresos`/`Gastos`) coincide con la suma manual: `MONTHLY` cuenta ×1, `BIWEEKLY` ×2, `WEEKLY` ×4.

**Deudas:**
1. Crear una deuda con cada frecuencia de pago y verificar que la cuota calculada (`paymentAmount`) baja al aumentar `totalPayments` o subir `remainingAmount` de forma coherente con una tabla de amortización estándar.
2. Verificar que el aporte de la deuda al balance mensual del dashboard usa el equivalente mensual (`paymentAmount × multiplicador`), no el monto de la cuota tal cual, cuando la frecuencia no es `MONTHLY`.
3. Editar una deuda existente cambiando su frecuencia y confirmar que la cuota se recalcula.

**Metas de ahorro:**
1. Con balance mensual positivo, verificar que `projectedDate` se calcula y que `onTrack` compara correctamente contra `targetDate` si existe.
2. Con balance mensual ≤ 0, verificar que `projectedDate` es `null` (no debe mostrar una fecha absurda ni un error).
3. Meta con `currentAmount >= targetAmount`: `projectedDate` debe ser `"Completada"`.

**Resumen mensual (dashboard e historial):**
1. Verificar que las alertas cambian correctamente en los tres umbrales: balance negativo (déficit, rojo), `expenseRatio >= 90` (rojo), `expenseRatio >= 75` (ámbar).
2. Verificar que `/summary/historical` siempre devuelve exactamente 6 meses, incluyendo el actual, en orden cronológico.

**Exportación PDF/Excel:**
1. Confirmar que los totales del PDF/Excel coinciden exactamente con los del dashboard para el mismo mes.
2. Probar con moneda `CRC` (símbolo `₡`) específicamente en el PDF — es el caso especial donde el símbolo se sustituye por el texto "CRC" porque PDFKit no soporta ese glifo. Confirmar que no aparece un carácter roto (glifo faltante) en su lugar.
3. Probar un mes sin deudas/ingresos/gastos — las tablas deben mostrar el mensaje de "sin registros", no romperse ni quedar vacías sin explicación.

**Cambio de moneda y tema:**
1. Cambiar la moneda en el selector del `Sidebar` y confirmar que el símbolo se actualiza en todas las páginas CRUD y en el dashboard.
2. Confirmar el bug conocido: los tooltips de los gráficos (`CashFlowChart`, `CategoryChart`, `HistoricalChart`) siguen mostrando `₡` fijo — no reportarlo como regresión nueva, ya está documentado en `context.md`.
3. Cambiar de tema y recargar la página — el tema debe persistir (`localStorage`, key `krone-theme`).

---

## Casos borde prioritarios

- Ingreso/gasto recurrente creado en un mes futuro respecto al mes actual del sistema — no debe aparecer en meses anteriores a su origen.
- Deuda con `paidPayments >= totalPayments` (ya saldada): `remainingPayments <= 0` debe devolver cuota `0`, no un error ni `NaN`.
- Deuda con `annualRate = 0`: la cuota se calcula como división simple (`remainingAmount / remainingPayments`), sin la fórmula de interés compuesto — confirmar que no divide por cero si `remainingPayments` es 0.
- Categoría eliminada mientras tiene ingresos/gastos asociados — confirmar el comportamiento real (no hay soft delete, ver `database/CLAUDE.md`; el borrado físico puede fallar por restricción de FK o dejar datos huérfanos según cómo esté la relación).
- Mes sin ningún dato (`totalIncome = 0`): `expenseRatio` debe ser `0`, no `Infinity` ni `NaN` — ya hay un guard (`totalIncome > 0 ? ... : 0`), confirmar que sigue ahí si se toca `summary.controller.ts`.
- Recarga de la página justo después de arrancar los servidores (`npm run dev` en ambas carpetas) — la primera request al backend puede tardar unos segundos; no confundir con un error real de conexión.

---

## Checklist de verificación antes de dar una tarea por terminada

- [ ] El cambio se probó contra el endpoint del backend con `curl`, no solo asumido por lectura de código.
- [ ] Si el cambio toca frecuencia/multiplicadores: se verificó en `backend/src/lib/recurrence.ts` **y** `frontend/src/lib/frequency.ts` que ambas tablas coinciden.
- [ ] Si el cambio toca el schema: se corrió `npx prisma generate` y se reinició el proceso de `tsx watch` (no recoge el cliente regenerado solo con hot-reload de archivos fuente).
- [ ] Las 7 páginas del frontend (`/`, `/ingresos`, `/gastos`, `/deudas`, `/metas`, `/historial`, `/categorias`) siguen devolviendo 200 tras el cambio.
- [ ] Si se crearon registros de prueba durante la verificación, se eliminaron antes de terminar — no dejar datos de prueba mezclados con los datos reales del usuario.
- [ ] `context.md` se actualizó si el cambio afecta arquitectura, modelo de datos o alguna decisión que otra sesión debería conocer.
- [ ] Sin `console.log` de depuración olvidado en el código final.

---

## Lo que no hace este agente

- No escribe código de producción. Puede escribir scripts de verificación puntuales (por ejemplo, llamadas `curl` de prueba), pero se eliminan sus efectos secundarios (datos de prueba) al terminar.
- No toma decisiones de arquitectura. Las reporta y espera resolución del agente correspondiente.
- No configura infraestructura ni el entorno de PostgreSQL.
