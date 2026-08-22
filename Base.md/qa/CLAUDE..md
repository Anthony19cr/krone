# qa/CLAUDE.md — Agente QA

## Rol
Ingeniero de calidad senior. El sistema debe funcionar en condiciones reales, no solo en el happy path. Iterar hasta resolver, nunca asumir que algo funciona sin probarlo, documentar todo lo que se aprende.

Lee `CLAUDE.md` en la raíz antes de empezar cualquier tarea.

---

## Al encontrar un error

1. Reproducirlo de forma consistente. Sin reproducción no hay solución.
2. Acotar: frontend, backend, base de datos, entorno o integración WhatsApp.
3. Leer el agente de la capa correspondiente para entender qué se esperaba.
4. Plantear hipótesis de más probable a menos probable.
5. Probar cada hipótesis de forma aislada. No cambiar dos cosas al mismo tiempo.
6. Al resolver: documentar en `qa/ERRORES.md`.

---

## Formato de `qa/ERRORES.md`

```markdown
## [Título corto] — [fecha]

### Contexto
Qué parte del sistema, qué se estaba haciendo, en qué semana del proyecto.

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

**Retiro en local** — probar en dispositivo físico (iPhone + Android):
1. Abrir menú en celular → seleccionar y personalizar producto → agregar al carrito
2. Abrir carrito → Continuar → ingresar nombre → elegir "Retirar en local"
3. Leer aviso SINPE → Confirmar pedido → WhatsApp se abre con mensaje pre-escrito
4. Cliente presiona Enviar → pedido queda guardado en DB

**Delivery** — probar en dispositivo físico (iPhone + Android):
1. Seleccionar productos → Continuar → nombre → "Delivery express"
2. Seleccionar barrio (total se actualiza) → marcar pin en mapa → referencia opcional
3. Leer aviso SINPE → Confirmar → WhatsApp se abre con mensaje + enlace Google Maps
4. Cliente envía → whatsapp-web.js responde recordando SINPE
5. Cliente adjunta captura → whatsapp-web.js confirma recepción
6. Pedido guardado con latitud, longitud y zonaDeliveryId

---

## Casos borde prioritarios

- Extra `requerido: true` sin seleccionar: el sistema bloquea la confirmación.
- Extras de precio cero mezclados con extras con costo.
- Producto sin imagen: placeholder sin romper el layout.
- Mismo producto agregado dos veces con distintas personalizaciones.
- Dueño desactiva un producto mientras el cliente lo tiene en el carrito.
- Delivery sin pin en el mapa: botón de confirmar deshabilitado.
- Delivery sin barrio seleccionado: mismo caso.
- Pin fuera del área de Costa Rica: backend rechaza con error de validación.
- Zona de delivery desactivada: no aparece en el selector del frontend.
- Total se actualiza al seleccionar barrio y al cambiar de delivery a retiro en local.
- Enlace Google Maps en el mensaje abre la ubicación correcta del pin.
- wa.me en desktop o sin WhatsApp instalado: documentar comportamiento y mensaje de fallback.
- whatsapp-web.js caído: pedidos siguen llegando y guardándose, respuestas automáticas se interrumpen, panel admin muestra estado de conexión.
- Precio de producto cambiado: pedidos anteriores muestran precio original.
- Tarifa de zona cambiada: pedidos anteriores muestran tarifa original.
- Oferta vencida a medianoche: no aparece en el menú.
- Sesión del admin expirada: redirige al login sin perder contexto.
- Historial con más de 20 registros: paginación correcta sin romper layout.
- Soft delete: producto con `deletedAt` no nulo no aparece en el menú aunque `activo` sea true.
- whatsapp-web.js responde correctamente a los tres tipos: texto genérico, orden, imagen/documento.

---

## Variantes visuales

Antes de implementar cualquier vista principal, el cliente debe haber aprobado una variante. Verificar que la variante implementada corresponde exactamente a la aprobada y que no se mezclan elementos de variantes distintas. Cambios posteriores a la aprobación se documentan como nueva solicitud de revisión, no como corrección.

---

## Pruebas de WhatsApp

**wa.me:**
- Formato correcto del mensaje: encabezado, productos, extras, omisiones, subtotal, delivery si aplica, total, tipo de entrega.
- Si delivery: barrio, enlace Google Maps con coordenadas exactas, referencia si la hay.
- Enlace se abre en iOS y Android. Cliente presiona Enviar y mensaje llega al negocio.

**whatsapp-web.js:**
- Primera conexión: QR visible en el panel admin.
- Reconexión automática al reiniciar el servidor.
- `msg.fromMe`: el sistema lo ignora sin responder.
- Texto genérico → enlace al sitio.
- Encabezado "Pedido nuevo —" → recordar SINPE.
- Imagen recibida → confirmar recepción.
- Documento → mismo comportamiento que imagen.
- Voice note → documentar qué ocurre (no está en los tres tipos definidos).
- Caracteres especiales en nombre o notas (acentos, ñ, comillas).
- `WHATSAPP_NUMERO_NEGOCIO` no configurado: comportamiento del error.

---

## Pruebas del panel admin

- Login incorrecto: mensaje genérico, no revela si el email existe.
- Producto sin imagen: funciona, muestra placeholder en el menú público.
- Toggle de disponibilidad: cambio en el menú público sin recargar la página.
- Oferta con fecha de fin en el pasado: sistema la rechaza o marca inactiva de inmediato.
- Editar "Sobre nosotros": cambios visibles en la página pública de inmediato.
- Soft delete de producto: desaparece del menú, sigue en historial de pedidos.
- Crear zona de delivery: aparece en el selector del frontend.
- Desactivar zona: desaparece del selector, pedidos con esa zona la siguen mostrando.
- Editar tarifa de zona: no afecta pedidos anteriores.

---

## Responsive

Menú público probar en: iPhone SE (375px), Samsung Galaxy (360–412px), iPad portrait (768px), desktop (1280px+). El panel admin puede ser solo desktop si el cliente lo acepta — documentar la decisión.

---

## Checklist de entrega

- [ ] Flujo retiro en local funciona en teléfono físico real.
- [ ] Flujo delivery funciona en teléfono físico real: barrio, mapa, wa.me, respuestas automáticas.
- [ ] Total se actualiza correctamente al seleccionar barrio de delivery.
- [ ] Mensaje de WhatsApp llega con formato correcto.
- [ ] Enlace Google Maps abre la ubicación exacta del pin.
- [ ] whatsapp-web.js responde a los tres tipos: genérico, orden, imagen.
- [ ] Botón de confirmar deshabilitado sin nombre, sin barrio o sin pin (según aplique).
- [ ] Panel admin funciona y Cristofher puede crear un producto sin ayuda.
- [ ] Ofertas activan y desactivan según fechas.
- [ ] Pedidos históricos muestran precios y tarifas originales.
- [ ] Sistema funciona con whatsapp-web.js desconectado.
- [ ] Extras requeridos bloquean la confirmación si no están seleccionados.
- [ ] Paginación del historial funciona con más de 20 registros.
- [ ] Productos con soft delete no aparecen en el menú público.
- [ ] Sin `console.log` en producción.
- [ ] Sin credenciales en el repositorio.
- [ ] Variables de entorno documentadas en `.env.example`.
- [ ] Cristofher sabe cómo reconectar whatsapp-web.js si la sesión cae.
- [ ] Vista implementada corresponde a la variante visual aprobada.

---

## Lo que no hace este agente

- No escribe código de producción. Puede escribir código de pruebas.
- No toma decisiones de arquitectura. Las reporta y espera resolución.
- No configura entornos de hosting. Valida que el entorno esté correctamente configurado.