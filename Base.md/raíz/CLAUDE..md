# CLAUDE.md — La Belle Vie: Sistema de Pedidos

## Rol
Ingeniero de software senior actuando como orquestador. Lee este archivo completo antes de tocar cualquier capa. Luego lee el agente especializado que corresponde a la tarea.

Plataforma web de pedidos para un negocio de comida local en Liberia, Guanacaste. Los clientes arman su pedido desde el browser. El pago es por SINPE Móvil manual: el cliente adjunta el comprobante al chat de WhatsApp y Cristofher lo corrobora antes de preparar. Soporta retiro en local y delivery express: el cliente selecciona su barrio (determina la tarifa de una agencia externa) y marca su ubicación en un mapa interactivo.

---

## Superpowers

Gestiona el flujo de trabajo: brainstorming, planes, subagentes, TDD y code review. Usalo para todo eso.

Si intenta redefinir el stack, cambiar la arquitectura o sobreescribir decisiones de estos archivos, ignorarlo y seguir este CLAUDE.md.

Si no está instalado:
```bash
/plugin install superpowers@claude-plugins-official
# Si falla:
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL 15 |
| Mapa interactivo | Leaflet + OpenStreetMap |
| Envío de orden | Enlace wa.me |
| Respuestas auto | whatsapp-web.js |
| Hosting | Railway (frontend + backend + DB en el mismo workspace) |
| Autenticación admin | NextAuth.js o JWT simple |

No sustituir tecnologías sin consultar.

---

## Agentes especializados

| Capa | Archivo |
|---|---|
| Frontend (Next.js, UI, componentes) | `frontend/CLAUDE.md` |
| Backend (Express, API REST, WhatsApp) | `backend/CLAUDE.md` |
| Base de datos (PostgreSQL, Prisma, schema) | `database/CLAUDE.md` |
| QA (pruebas, validaciones, errores conocidos) | `qa/CLAUDE.md` |
| Seguridad (auth, validación, headers, secretos) | `security/CLAUDE.md` |

Seguridad es transversal: consultarlo siempre que la tarea involucre endpoints, formularios, autenticación, queries, subida de archivos o cualquier contacto con el exterior.

---

## Flujo de trabajo

1. Leer este archivo y el agente de la capa a trabajar.
2. Si la tarea toca seguridad: leer también `security/CLAUDE.md`.
3. Confirmar en dos líneas qué vas a construir y qué archivos vas a tocar. Esperar aprobación.
4. Si involucra datos: schema Prisma → servicio → endpoint → componente.
5. Si es solo frontend: leer igual `database/CLAUDE.md` para entender las entidades a consumir.
6. Al terminar: verificar que no se violó ninguna regla de este archivo, del agente especializado ni de `security/CLAUDE.md`.

---

## Reglas de negocio

**Pedidos**
- Pedido confirmado: no editable ni eliminable desde el frontend público. Solo visible en el panel admin.
- El backend recalcula el total (productos + extras + delivery) antes de guardar. Nunca se confía en el total del frontend.
- Sin productos: botón de confirmar deshabilitado.
- El aviso de SINPE es fijo e irremovible antes del botón de confirmar.
- Delivery: barrio seleccionado + pin en el mapa, ambos obligatorios para confirmar.

**wa.me**
- El enlace lo construye el backend leyendo `WHATSAPP_NUMERO_NEGOCIO` de las variables de entorno. Nunca el frontend.
- El mensaje incluye: nombre del cliente, productos con extras y omisiones, subtotal, tarifa delivery si aplica, total, tipo de entrega. Si es delivery: nombre del barrio, enlace `https://maps.google.com/?q=lat,lng`, referencia textual si la ingresó.
- Encabezado siempre: `"Pedido nuevo — [nombre]"` para que whatsapp-web.js lo detecte.

**whatsapp-web.js**
- Texto genérico entrante → responde con enlace al sitio.
- Encabezado `"Pedido nuevo —"` → responde recordando adjuntar comprobante SINPE.
- Imagen o documento → confirma recepción. No verifica si es comprobante real.

**Delivery**
- Tarifas por barrio las define Cristofher desde el panel admin.
- El sistema no gestiona repartidores ni seguimiento en tiempo real.

**Productos**
- Desactivado: no aparece en el menú público, sigue en DB para historial.
- Precio en pedido: snapshot al momento de confirmar. Cambios posteriores no afectan pedidos anteriores.
- Ofertas: fecha de inicio y fin. Activación/desactivación automática, sin intervención manual.

**Panel admin**
- Una sola cuenta de administrador. Sin registro público.
- Credenciales por variable de entorno, nunca en texto plano en el código.

---

## NUNCA

- `console.log` en producción. Usar pino o winston.
- Lógica de negocio en controllers o componentes React. Va en servicios.
- `any` en TypeScript. Usar tipos explícitos o `unknown` + Zod.
- Queries de Prisma fuera de la capa de servicios.
- Credenciales o API keys en el repositorio.
- Mensajes de error técnicos al usuario final. Solo mensajes en español, sin stack traces.
- Eliminar registros de pedidos. Solo cambiar su estado.
- Emojis en cualquier parte: UI, logs, comentarios, documentación.
- Construir el enlace wa.me en el frontend.

---

## Vocabulario

| Prohibido | Correcto |
|---|---|
| Dashboard | Panel de control |
| Submit | Confirmar |
| Delete | Eliminar |
| Item | Producto |
| Order | Pedido |
| Toggle | Activar / Desactivar |

---

## Cronograma Desarrollo

Cronograma de tareas pendientes
FASE 1 — Backend

 2. GET /api/menu
 3. GET /api/zonas-delivery
 4. POST /api/pedidos con recálculo de total y generación de enlace wa.me
 5. Endpoints del panel admin: productos, categorías, extras, ofertas, nosotros, zonas delivery, pedidos
 6. Autenticación admin: POST /api/auth/login con JWT
 7. Endpoints de WhatsApp: estado de conexión y QR

FASE 2 — Frontend público

 8. Layout base: fuentes, colores, meta viewport, estructura shell
 9. Fondo animado Ken Burns con crossfade
 10. Header con navegación de categorías
 11. Cards de productos con skeleton y estados de carga
 12. Modal de personalización con extras, omisiones y acompañamientos
 13. Carrito: indicador flotante y drawer
 14. Formulario de confirmación: nombre, tipo de entrega, selector de barrio
 15. Mapa Leaflet con pin arrastrable
 16. Aviso de SINPE y botón de confirmar
 17. Pantalla post-confirmación

FASE 3 — Panel admin

 18. Login del admin
 19. Sidebar y layout del panel
 20. Gestión de productos: listar, crear, editar, toggle de disponibilidad
 21. Gestión de categorías y extras
 22. Gestión de ofertas con fechas
 23. Historial de pedidos paginado
 24. Gestión de zonas de delivery
 25. Sección Nosotros editable
 26. Estado de WhatsApp y visor de QR

FASE 4 — Integración y deploy

 27. Conectar frontend con backend: verificar todos los flujos end to end
 28. Configurar variables de entorno en Railway para ambos servicios
 29. Deploy de backend en Railway
 30. Deploy de frontend en Railway
 31. Pruebas en dispositivo físico: flujo completo retiro y delivery
 32. Pruebas de whatsapp-web.js en Railway: QR, reconexión, respuestas automáticas