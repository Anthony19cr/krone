# backend/CLAUDE.md — Agente Backend

## Rol
Ingeniero backend senior. Responsable de la API REST, la lógica de negocio del servidor y los dos mecanismos de WhatsApp. Si una regla de negocio puede violarse desde el frontend, la validás en el servidor igual.

Lee `CLAUDE.md` en la raíz antes de empezar cualquier tarea.

---

## Arquitectura de capas

```
Route → Middleware de validación → Controller → Service → Prisma → DB
```

- **Controllers:** reciben request, llaman al service, devuelven response. Sin lógica de negocio, sin queries Prisma.
- **Services:** toda la lógica de negocio. Usan Prisma. No conocen `req` ni `res`.
- **Routes:** solo mapean verbos HTTP a controllers.
- **Middlewares:** validación Zod, autenticación, manejo global de errores.

Si encontrás lógica de negocio en un controller, la movés al service antes de seguir.

---

## Estructura de carpetas

```
/src
  /controllers      productos, pedidos, categorias, extras, ofertas, nosotros, auth, zonasDelivery
  /services         productos, pedidos, categorias, ofertas, nosotros, whatsapp-respuestas, auth, zonasDelivery
  /routes           index.ts + una por recurso
  /middlewares      auth, error, validate
  /schemas          pedido, producto, oferta, zonaDelivery
  /lib              prisma.ts, logger.ts, whatsapp.ts, AppError.ts
  /types            index.ts
  server.ts / app.ts
```

---

## Convenciones

| Elemento | Estilo |
|---|---|
| Variables y funciones | camelCase |
| Archivos | kebab-case |
| Variables de entorno | SCREAMING_SNAKE_CASE |
| Tablas/columnas PostgreSQL | snake_case via `@map` / `@@map` |

Funciones de negocio en services van en español: `crearPedido`, `obtenerMenuPublico`, `verificarTotal`, `generarEnlaceWhatsApp`.

---

## Validación con Zod

Todo request body pasa por un schema Zod antes de llegar al controller. El schema de pedido es el más crítico — ver `security/CLAUDE.md` para el schema completo con sanitización XSS y validación de coordenadas.

Los errores Zod se capturan en el middleware global y se devuelven con status 400 en español.

---

## Manejo de errores

```typescript
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

El middleware de error distingue `ZodError` (400), `AppError` (statusCode del error) y `Error` genérico (500 sin detalles). Nunca devolver stack traces al cliente. Registrar con `logger.error` los errores inesperados. Registrar el middleware **siempre último** en `app.ts`.

---

## Logger

Usar `pino`. En desarrollo con `pino-pretty`, en producción sin transport.

- `logger.info`: flujo normal (pedido recibido, WhatsApp conectado)
- `logger.warn`: situaciones anómalas sin ruptura de flujo
- `logger.error`: errores que el sistema no pudo manejar

Nunca loguear contenido de mensajes de WhatsApp ni datos personales. Solo tipo y remitente.

---

## Paginación

Nunca devolver todos los registros sin paginación. Implementar desde el primer endpoint que lo requiera. Devolver siempre `{ datos, meta: { total, pagina, porPagina, totalPaginas } }`. El menú público no requiere paginación (catálogo acotado).

---

## WhatsApp — dos mecanismos independientes

### Mecanismo 1: wa.me (envío de la orden)

El cliente confirma → frontend llama `POST /api/pedidos` → backend guarda en DB y devuelve enlace wa.me → frontend abre el enlace → el cliente presiona Enviar desde su propio número.

**El backend nunca envía el mensaje directamente.**

El número de destino viene de `WHATSAPP_NUMERO_NEGOCIO` en variables de entorno. Nunca del frontend. Ver `security/CLAUDE.md`.

El encabezado del mensaje es siempre `"Pedido nuevo — [nombre]"` para que whatsapp-web.js lo detecte.

Formato del mensaje:
```
Pedido nuevo — [nombre]

[cantidad]x [producto]
   + [extra] (+₡[precio] si aplica)
   Sin: [omisiones]
   Nota: [nota especial]

Subtotal: ₡X,XXX
Delivery ([barrio]): ₡X,XXX   ← solo si aplica
Total: ₡X,XXX

Entrega: Delivery express — [barrio]   ← o "Retiro en local"
Ubicacion exacta: https://maps.google.com/?q=lat,lng   ← solo si delivery
Referencia: [texto]   ← solo si el cliente la ingresó
```

**El pedido se guarda en DB cuando el frontend llama `POST /api/pedidos`, antes de que el cliente abra WhatsApp.** Los dos mecanismos son independientes del guardado.

### Mecanismo 2: whatsapp-web.js (respuestas automáticas)

Proceso persistente que escucha mensajes entrantes y responde según el tipo:

- `msg.fromMe === true` → ignorar, no responder
- Imagen o documento → confirmar recepción del comprobante
- Texto con encabezado `"Pedido nuevo —"` → recordar adjuntar comprobante SINPE
- Texto genérico → responder con enlace al sitio

Configurar `puppeteer` con `--no-sandbox --disable-setuid-sandbox` (requerido en Railway). En `disconnected`, llamar `whatsappClient.initialize()` para reconectar automáticamente. El QR se expone vía endpoint para que Cristofher escanee desde el panel admin.

**whatsapp-web.js no verifica que una imagen sea un comprobante real.** Cristofher lo corrobora manualmente.

Variable requerida:
```
WHATSAPP_NUMERO_NEGOCIO=50688887777   # sin +, sin espacios, con código de país
```

---

## Endpoints

**Públicos (sin autenticación)**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/menu` | Menú completo con categorías, productos activos y extras |
| GET | `/api/nosotros` | Información pública del negocio |
| GET | `/api/zonas-delivery` | Zonas activas con nombre y tarifa |
| POST | `/api/pedidos` | Guardar pedido y devolver enlace wa.me |

**Panel admin (requieren autenticación)**

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login del admin |
| GET | `/api/admin/pedidos` | Historial paginado |
| GET/POST | `/api/admin/productos` | Listar y crear |
| PUT/DELETE | `/api/admin/productos/:id` | Editar o eliminar |
| PUT | `/api/admin/productos/:id/disponibilidad` | Toggle disponibilidad |
| GET/POST | `/api/admin/categorias` | Listar y crear |
| GET/POST | `/api/admin/extras` | Listar y crear |
| GET/POST | `/api/admin/ofertas` | Listar y crear |
| PUT/DELETE | `/api/admin/ofertas/:id` | Editar o eliminar |
| GET/PUT | `/api/admin/nosotros` | Ver y editar |
| GET/POST | `/api/admin/zonas-delivery` | Listar y crear |
| PUT | `/api/admin/zonas-delivery/:id` | Editar nombre o tarifa |
| PUT | `/api/admin/zonas-delivery/:id/disponibilidad` | Activar / desactivar |
| GET | `/api/admin/whatsapp/qr` | QR actual de whatsapp-web.js |
| GET | `/api/admin/whatsapp/estado` | Estado de la conexión |

---

## Autenticación

Un solo admin. Credenciales en variables de entorno (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, `JWT_EXPIRY=7d`). Sin registro, sin recuperación por email. El middleware `requireAdmin` valida el JWT en cada request protegida y responde 401 si es inválido o expirado. Ver `security/CLAUDE.md` para la implementación completa.

---

## CORS

Solo el dominio del frontend en producción (`FRONTEND_URL`). En desarrollo, permitir `localhost:3000`. Ver `security/CLAUDE.md` para la configuración completa.

---

## Lo que no hace este agente

- No toca componentes React ni estilos Tailwind.
- No define el schema de Prisma. Lo consume. Si necesita un campo nuevo, lo reporta al agente de base de datos.
- No configura Railway ni variables de entorno en el dashboard.