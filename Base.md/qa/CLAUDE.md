# qa/CLAUDE.md — Agente QA · La Choza de Laurel

## Rol

Ingeniero de calidad senior. El sistema debe funcionar en condiciones reales, no solo en el happy path. Iterar hasta resolver, nunca asumir que algo funciona sin probarlo, documentar todo lo que se aprende.

Lee `CLAUDE.md` en la raíz antes de empezar cualquier tarea. Este proyecto es deliberadamente simple: sitio bilingüe de consulta con menú interactivo, sección Chileras y panel de administración. No hay carrito, no hay pedidos, no hay pagos, no hay WhatsApp en esta fase. El QA se enfoca en que ese alcance acotado funcione sin fricción, en ambos idiomas y en ambos modos de color.

---

## Al encontrar un error

1. Reproducirlo de forma consistente. Sin reproducción no hay solución.
2. Acotar: frontend, backend, base de datos o entorno.
3. Leer el agente de la capa correspondiente (`frontend/CLAUDE.md`, `backend/CLAUDE.md`, `database/CLAUDE.md`, `security/CLAUDE.md`) para entender qué se esperaba.
4. Plantear hipótesis de más probable a menos probable.
5. Probar cada hipótesis de forma aislada. No cambiar dos cosas al mismo tiempo.
6. Al resolver: documentar en `qa/ERRORES.md`.

---

## Formato de `qa/ERRORES.md`

```markdown
## [Título corto] — [fecha]

### Contexto
Qué parte del sistema, qué se estaba haciendo, en qué fase del proyecto.

### Síntoma
Mensaje de error completo, comportamiento inesperado, stack trace si aplica.

### Lo que intenté primero (y por qué no funcionó)

### Lo que intenté después

### La causa real

### La solución
Cambio específico que resolvió el problema. Código si aplica.

### Por qué esto importa
```

---

## Flujos críticos

**Menú público — probar en dispositivo físico (iPhone y Android) y en desktop:**
1. Abrir el sitio desde un enlace directo (simulando llegada desde Google o Instagram).
2. Verificar que el idioma detectado coincide con el idioma del navegador (inglés si el navegador está en inglés, español en cualquier otro caso).
3. Navegar al menú, filtrar por categoría (Entradas, Carnes, Mariscos, Pastas, Gallos, Bebidas, Postres) y confirmar que el filtro no recarga la página.
4. Verificar que cada plato muestra nombre, precio en colones (`₡`) y descripción en el idioma activo.
5. Cambiar el idioma manualmente desde el selector y confirmar que persiste en la sesión al navegar entre secciones.
6. Cambiar entre modo claro y oscuro y confirmar que la transición es fluida y que todo el contenido sigue siendo legible en ambos modos.

**Sección Chileras — probar en dispositivo físico y desktop:**
1. Verificar que las tres variedades se muestran con nombre, descripción e imagen (o placeholder si no hay imagen).
2. Confirmar que el llamado a la acción es "Disponible en el local" / "Available in-store" y que no hay ningún botón de compra o carrito.

**Contacto y ubicación:**
1. Verificar que el mapa apunta a la sede de Liberia y que no aparece ninguna referencia a Arenal o La Fortuna en ningún componente del sitio.
2. Confirmar que los horarios y el teléfono mostrados coinciden con los datos confirmados en `context.md`.
3. Si existe formulario de contacto/reservaciones: enviar una solicitud de prueba y confirmar que llega la notificación por correo a `contacto@lachozadelaurel.com`. Confirmar también que no se guarda como pedido ni como reserva formal en el sistema (no hay persistencia de reservas en esta fase).

**Panel de administración — probar en laptop y en celular:**
1. Login con credenciales correctas → acceso al panel.
2. Login con credenciales incorrectas → mensaje genérico, sin revelar si el email existe.
3. Crear un plato nuevo, asignarlo a una categoría, y confirmar que aparece de inmediato en el menú público en ambos idiomas.
4. Editar nombre, descripción o precio de un plato existente y confirmar el cambio en el sitio público sin necesidad de redeploy.
5. Desactivar un plato y confirmar que desaparece del menú público pero sigue visible en el panel (activos e inactivos).
6. Intentar eliminar un plato: confirmar que el sistema no permite eliminación física, solo desactivación (ver regla en `database/CLAUDE.md`).
7. Crear, editar y consultar una publicación en el calendario editorial.
8. Consultar la vista de métricas del mes y confirmar que refleja los valores ingresados manualmente.
9. Dejar la sesión inactiva más de 24 horas (o forzar expiración del token) y confirmar que redirige al login con un mensaje claro, sin stack traces.

---

## Casos borde prioritarios

- Plato sin imagen: placeholder sin romper el layout, en ambos idiomas y ambos modos de color.
- Plato con nombre o descripción muy larga: no rompe el diseño de la tarjeta ni desborda en móvil.
- Categoría desactivada: sus platos no aparecen en el menú público aunque estén activos individualmente.
- Plato reactivado después de estar desactivado: vuelve a aparecer en el orden correcto.
- Cambio de precio de un plato: se refleja de inmediato en el menú público (no hay lógica de snapshot en esta fase).
- Selector de idioma sin coincidencia de `Accept-Language`: por defecto cae a español.
- Recarga de página con idioma ya seleccionado: el idioma persiste, no vuelve al detectado por navegador.
- Cambio de modo claro/oscuro y recarga de página: verificar comportamiento esperado según lo definido en `frontend/CLAUDE.md`.
- Menú con muchas categorías activas en pantalla pequeña (320px): navegación entre categorías sigue siendo usable.
- Publicación con fecha pasada: se muestra correctamente en el historial sin marcarse como error.
- Métricas del mes sin ningún valor ingresado todavía: el panel muestra el estado vacío sin romper, no un error.
- Doble clic o envío duplicado en formulario de contacto/reservaciones: no genera dos notificaciones por correo.
- Sesión de administrador abierta en dos pestañas: verificar comportamiento frente a la regla de una sola sesión activa.
- Acción destructiva (desactivar plato o categoría) sin confirmar el diálogo: la acción no se ejecuta.

---

## Variantes visuales

Antes de implementar cualquier vista principal, el cliente debe haber aprobado una variante en `prototipo.md`. Verificar que la variante implementada corresponde exactamente a la aprobada y que no se mezclan elementos de variantes distintas. Cambios posteriores a la aprobación se documentan como nueva solicitud de revisión, no como corrección. Mientras `prototipo.md` no exista, no hay variante que validar contra un estándar fijo — reportar cualquier decisión visual que parezca definitiva antes de tiempo.

---

## Pruebas del panel admin

- Login incorrecto: mensaje genérico, no revela si el email existe.
- Plato sin imagen: funciona, muestra placeholder en el menú público.
- Toggle de estado (activo/inactivo): cambio visible en el menú público sin recargar la página.
- Editar plato o chilera: cambios visibles en el sitio público de inmediato, en ambos idiomas.
- Desactivar categoría: sus platos desaparecen del menú público en conjunto.
- Crear publicación en el calendario: aparece correctamente ordenada por fecha.
- Editar métricas del mes: el `upsert` actualiza el registro existente sin crear duplicados.
- Intentar acceder a rutas de admin sin token: redirige al login, sin exponer datos.
- Token expirado a mitad de una acción: mensaje claro en el idioma activo, sin stack traces.

---

## Responsive

Sitio público: probar en iPhone SE (375px), Samsung Galaxy (360–412px), iPad portrait (768px), desktop (1280px+). Verificar en los dos idiomas y en ambos modos de color en cada breakpoint. El panel admin debe ser operable tanto en laptop como en celular, según lo definido en `context.md` (el dueño no tiene formación técnica y puede necesitar hacer cambios rápidos desde el teléfono).

---

## Checklist de entrega

- [ ] Menú público funciona en teléfono físico real, en ambos idiomas.
- [ ] Filtro por categoría funciona sin recarga de página.
- [ ] Selector de idioma persiste correctamente durante la sesión.
- [ ] Light mode y dark mode funcionan sin romper legibilidad en ninguna vista.
- [ ] Sección Chileras muestra las tres variedades sin ningún elemento de compra.
- [ ] Ninguna referencia a Arenal o La Fortuna aparece en el sitio público.
- [ ] Mapa apunta correctamente a la sede de Liberia.
- [ ] Formulario de contacto/reservaciones (si existe) notifica por correo sin duplicados.
- [ ] Panel admin: login, creación y edición de platos, categorías y chileras funcionan sin ayuda técnica.
- [ ] Plato desactivado desaparece del menú público pero permanece en el panel.
- [ ] Ningún plato o categoría puede eliminarse físicamente desde el panel.
- [ ] Calendario de publicaciones permite crear, editar y consultar sin errores.
- [ ] Métricas del mes se actualizan correctamente vía upsert.
- [ ] Sesión de administrador expira a las 24 horas y redirige al login con mensaje claro.
- [ ] Acciones destructivas requieren confirmación explícita.
- [ ] Responsive correcto desde 320px hasta desktop, en ambos idiomas y ambos modos de color.
- [ ] Sin `console.log` en producción.
- [ ] Sin credenciales en el repositorio.
- [ ] Variables de entorno documentadas en `.env.example`.
- [ ] Sin emojis en ninguna capa: UI, mensajes, logs, documentación.
- [ ] Vista implementada corresponde a la variante visual aprobada en `prototipo.md` (una vez que ese archivo exista).

---

## Lo que no hace este agente

- No escribe código de producción. Puede escribir código de pruebas.
- No toma decisiones de arquitectura. Las reporta y espera resolución.
- No configura entornos de hosting en Railway. Valida que el entorno esté correctamente configurado.
- No prueba flujos de pedidos, pagos, delivery ni WhatsApp: no existen en el alcance actual del proyecto. Si en el futuro se agregan (ver "Funcionalidades futuras" en `context.md`), este archivo se actualiza entonces.
