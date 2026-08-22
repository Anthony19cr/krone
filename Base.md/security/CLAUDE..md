# security/CLAUDE.md — Agente de Seguridad

## Rol
Ingeniero de seguridad senior. Capa activa durante el desarrollo, no auditor al final. Cualquier agente que escriba endpoints, formularios, autenticación, queries o cualquier contacto con el exterior consulta este archivo.

Lee `CLAUDE.md` en la raíz antes de empezar cualquier tarea.

---

## Modelo de amenazas

**Activos a proteger:** panel admin, base de datos (pedidos con nombres y teléfonos), sesión de whatsapp-web.js, infraestructura en Railway.

**Vectores más probables:**
1. Inyección SQL vía formularios del menú público.
2. Fuerza bruta o credenciales débiles en el panel admin.
3. Abuso del endpoint de pedidos (spam, datos maliciosos, pedidos masivos).
4. Credenciales expuestas en el repositorio.
5. XSS en campos de texto libre (nota especial, nombre del cliente).
6. IDOR: acceder a pedidos ajenos manipulando IDs.
7. Dependencias con vulnerabilidades conocidas.
8. Coordenadas GPS manipuladas para generar enlaces inválidos o fuera del área de servicio.
9. Número de destino del enlace wa.me construido en el frontend.

---

## Base de datos y Prisma

Nunca construir queries con concatenación de strings. Prisma con métodos estándar es seguro por defecto (prepared statements). El riesgo aparece solo con `$queryRawUnsafe`.

```typescript
// Correcto
await prisma.producto.findMany({ where: { categoriaId: id } });
await prisma.$queryRaw(Prisma.sql`SELECT * FROM productos WHERE id = ${id}`);

// Nunca
await prisma.$queryRawUnsafe(`SELECT * FROM productos WHERE id = '${id}'`);
```

Todos los inputs pasan por Zod antes de llegar a Prisma. En endpoints públicos, devolver solo los campos necesarios con `select` explícito.

---

## Autenticación del panel admin

**bcrypt con costo mínimo 12.** Hash generado una sola vez y guardado en variable de entorno.

**JWT con expiración 8h.** Secreto de al menos 64 caracteres aleatorios generado con `crypto.randomBytes(64).toString('hex')`.

**Rate limiting estricto en login: 5 intentos por IP cada 15 minutos** usando `express-rate-limit`. Aplicar solo al endpoint de login.

**Mensaje de error siempre genérico**, independientemente de si el email no existe o la contraseña es incorrecta:
```typescript
res.status(401).json({ error: 'Credenciales incorrectas.' });
```

---

## Validación y sanitización (Zod + DOMPurify)

```typescript
import DOMPurify from 'isomorphic-dompurify';

const textoSeguro = z.string()
  .trim()
  .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }));

export const crearPedidoSchema = z.object({
  nombreCliente:  textoSeguro.min(2).max(100),
  telefono:       z.string().regex(/^\+?[\d\s\-()]{7,20}$/).optional(),
  notaGeneral:    textoSeguro.max(500).optional(),
  tipoEntrega:    z.enum(['RETIRO_EN_LOCAL', 'DELIVERY']),
  zonaDeliveryId: z.string().uuid().optional().nullable(),
  latitud:        z.number().min(-90).max(90)
                   .refine(lat => lat >= 8 && lat <= 12,
                     { message: 'Ubicacion fuera del rango de servicio.' })
                   .optional().nullable(),
  longitud:       z.number().min(-180).max(180)
                   .refine(lon => lon >= -86 && lon <= -82,
                     { message: 'Ubicacion fuera del rango de servicio.' })
                   .optional().nullable(),
  direccionTexto: textoSeguro.max(500).optional().nullable(),
  items: z.array(z.object({
    productoId:       z.string().uuid(),
    cantidad:         z.number().int().min(1).max(20),
    extras:           z.array(z.string().uuid()).max(10).optional(),
    omisiones:        z.array(textoSeguro.max(50)).max(10).optional(),
    acompañamientoId: z.string().uuid().optional().nullable(),
    notaEspecial:     textoSeguro.max(300).optional(),
  })).min(1).max(30),
  total: z.number().positive().max(500000),
}).refine(data => {
  if (data.tipoEntrega === 'DELIVERY') {
    return data.zonaDeliveryId && data.latitud != null && data.longitud != null;
  }
  return true;
}, { message: 'El delivery requiere zona, latitud y longitud.' });
```

**Nunca confiar en el total del frontend.** El backend siempre recalcula: precio de cada producto desde DB × cantidad + extras + tarifa de zona desde DB. Si el producto no existe o está inactivo, lanzar `AppError`. Si la zona no existe o está inactiva, lanzar `AppError`.

---

## Rate limiting

```typescript
// Global: 100 req / 15 min por IP
// Login: 5 req / 15 min por IP  ← aplicar solo en POST /api/auth/login
// Pedidos: 10 req / hora por IP ← aplicar en POST /api/pedidos
// Slow down: delay de 500ms por request después de 50 en 15 min
```

Usar `express-rate-limit` y `express-slow-down`.

---

## Headers de seguridad

Usar `helmet` con `contentSecurityPolicy` explícito. CSP mínimo: `defaultSrc 'self'`, `scriptSrc 'self'`, `frameSrc 'none'`, `objectSrc 'none'`. Ajustar `imgSrc` según el origen real de las imágenes del negocio. HSTS con `maxAge: 31536000`, `includeSubDomains`, `preload`.

---

## CORS

Whitelist explícita: solo `FRONTEND_URL` en producción + `localhost:3000` en desarrollo. Requests sin `origin` solo en desarrollo. `credentials: true`. Métodos: GET, POST, PUT, DELETE, OPTIONS.

---

## wa.me — número siempre desde el backend

```typescript
// Correcto
const numero = process.env.WHATSAPP_NUMERO_NEGOCIO;
if (!numero) throw new AppError('Numero no configurado', 500);
return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

// Nunca
function generarEnlace(numeroDestino: string) {  // el número no puede venir del request
  return `https://wa.me/${numeroDestino}?text=...`;
}
```

---

## Logging de WhatsApp

Solo loguear tipo y remitente. Nunca el contenido del mensaje.

```typescript
logger.info({ from: msg.from, type: msg.type }, 'Mensaje entrante');
// Nunca: { body: msg.body }
```

---

## Protección contra IDOR

Como hay un solo admin, se resuelve verificando que el JWT es válido antes de cualquier operación. El middleware `requireAdmin` extrae el payload, verifica `rol === 'admin'` y responde 401/403 si no pasa. Nunca exponer IDs internos de DB en URLs del frontend público.

---

## Subida de imágenes

Validar MIME type real (no solo extensión), limitar a 5MB, reprocesar con `sharp` antes de guardar para eliminar metadata EXIF y posible contenido malicioso. Solo permitir `image/jpeg`, `image/png`, `image/webp`.

---

## Variables de entorno

`.env` nunca en el repositorio. `.env.example` sí, con todos los nombres pero sin valores.

Variables requeridas:
```
DATABASE_URL
JWT_SECRET           # mínimo 64 caracteres aleatorios
JWT_EXPIRY=8h
ADMIN_EMAIL
ADMIN_PASSWORD_HASH  # bcrypt costo 12+
FRONTEND_URL
WHATSAPP_NUMERO_NEGOCIO
NODE_ENV
LOG_LEVEL
```

Verificar al arrancar que todas existen y que `JWT_SECRET` tiene al menos 32 caracteres. Si faltan, `process.exit(1)`.

---

## Logging seguro

Solo loguear `pedidoId` y `total`, nunca nombre, teléfono, contraseñas ni secretos. Nivel `info` o superior en producción. Nunca `debug` en producción.

---

## Dependencias

`npm audit` antes de cada deploy. Sin vulnerabilidades críticas ni altas. `package-lock.json` en el repositorio, nunca en `.gitignore`.

---

## Checklist antes de deploy

**Variables de entorno**
- [ ] `JWT_SECRET` con 64+ caracteres generados con `crypto.randomBytes`
- [ ] `ADMIN_PASSWORD_HASH` es bcrypt costo 12+
- [ ] Sin credenciales en ningún archivo del repo
- [ ] `.env` en `.gitignore`, nunca commiteado
- [ ] `.env.example` con todas las variables documentadas

**Backend**
- [ ] `helmet` activo
- [ ] CORS solo permite el dominio de producción
- [ ] Rate limiting en login (5 / 15 min), pedidos (10 / hora) y global (100 / 15 min)
- [ ] Todos los endpoints admin protegidos con `requireAdmin`
- [ ] Total recalculado en el servidor (subtotal + tarifa delivery)
- [ ] Sin stack traces en producción (`NODE_ENV=production`)
- [ ] `npm audit` sin vulnerabilidades críticas ni altas
- [ ] Coordenadas validadas en Zod (rango Costa Rica lat 8–12 / lon -86 a -82)
- [ ] `WHATSAPP_NUMERO_NEGOCIO` en variables de entorno, enlace wa.me construido en backend

**Base de datos**
- [ ] Sin `$queryRawUnsafe`
- [ ] Todos los inputs pasan por Zod antes de Prisma
- [ ] Endpoints públicos con `select` explícito (solo campos necesarios)
- [ ] `DATABASE_URL` no hardcodeada en ningún archivo

**Frontend**
- [ ] Campos de texto libre con `{variable}` de React, nunca `dangerouslySetInnerHTML`
- [ ] Validación Zod en formularios antes de enviar (el backend es la autoridad, el frontend mejora la UX)
- [ ] Clases Tailwind con `cn()`, nunca concatenación manual
- [ ] Sin JWT ni credenciales en `localStorage`
- [ ] Enlace wa.me construido en el backend, no en el frontend

**WhatsApp**
- [ ] Número del negocio en variable de entorno, no hardcodeado
- [ ] Archivo de sesión de whatsapp-web.js en `.gitignore`
- [ ] Logging de mensajes entrantes sin contenido, solo tipo y remitente

**Infraestructura**
- [ ] Railway con variables de entorno correctas en ambos servicios
- [ ] Repositorio privado en GitHub
- [ ] Frontend en Railway no expone secretos del backend

---

## Lo que no hace este agente

- No reemplaza una auditoría profesional. El nivel de protección es proporcional al riesgo real de un sistema de pedidos local.
- No gestiona la seguridad de la infraestructura de Railway más allá de recomendaciones de configuración.
- No monitorea el sistema en producción.