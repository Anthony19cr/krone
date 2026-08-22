
Security claude · MD
# security/CLAUDE.md — Agente de Seguridad · La Choza de Laurel
 
## Rol
 
Ingeniero de seguridad senior. Capa activa durante el desarrollo, no auditor al final. Cualquier agente que escriba endpoints, formularios, autenticación, queries o cualquier contacto con el exterior consulta este archivo.
 
Lee `CLAUDE.md` en la raíz antes de empezar cualquier tarea. Este sistema es de consulta pública más panel de administración: no procesa pedidos, no maneja pagos, no tiene delivery ni WhatsApp en esta fase. El nivel de protección es proporcional a ese alcance: no hay datos de tarjetas ni de pedidos que proteger, pero sí un panel admin, datos de contacto de clientes que llenan el formulario de reservaciones, y la integridad del contenido público (menú, precios, identidad de marca).
 
---
 
## Modelo de amenazas
 
**Activos a proteger:** panel de administración, base de datos (platos, categorías, chileras, publicaciones, métricas, y las solicitudes que lleguen por el formulario de contacto/reservaciones), infraestructura en Railway, credenciales de correo usadas para notificar reservaciones.
 
**Vectores más probables:**
1. Inyección SQL vía queries mal construidas, aunque el menú público es de solo lectura.
2. Fuerza bruta o credenciales débiles en el panel admin (única cuenta, objetivo de alto valor).
3. Abuso del formulario de contacto/reservaciones: spam, envíos masivos, contenido malicioso en el campo de mensaje.
4. Credenciales expuestas en el repositorio.
5. XSS en campos de texto libre del panel admin (descripción de plato, notas de publicación) o en el formulario público.
6. Acceso a rutas de admin sin autenticación válida.
7. Dependencias con vulnerabilidades conocidas.
8. Subida de imágenes maliciosas disfrazadas de fotos de categoría, chileras o del logo.
---
 
## Base de datos y Prisma
 
Nunca construir queries con concatenación de strings. Prisma con métodos estándar es seguro por defecto (prepared statements). El riesgo aparece solo con `$queryRawUnsafe`.
 
```typescript
// Correcto
await prisma.plato.findMany({ where: { categoriaId: id, activo: true } });
await prisma.$queryRaw(Prisma.sql`SELECT * FROM platos WHERE id = ${id}`);
 
// Nunca
await prisma.$queryRawUnsafe(`SELECT * FROM platos WHERE id = '${id}'`);
```
 
Todos los inputs pasan por Zod antes de llegar a Prisma. En endpoints públicos (`/api/menu`, `/api/chileras`), devolver solo los campos necesarios con `select` explícito. Nunca exponer campos internos como `eliminadoEn` o `creadoEn` en respuestas públicas.
 
---
 
## Autenticación del panel admin
 
**bcrypt con costo mínimo 12.** Hash generado una sola vez y guardado en `ADMIN_PASSWORD_HASH`.
 
**JWT con expiración 24h**, consistente con la regla de negocio de una sola sesión activa y sin "recordarme" (ver `CLAUDE.md` raíz). Secreto de al menos 64 caracteres aleatorios generado con `openssl rand -base64 64` o `crypto.randomBytes(64).toString('hex')`.
 
**Rate limiting estricto en login: 5 intentos por IP cada 15 minutos** usando `express-rate-limit`. Aplicar solo al endpoint `POST /api/auth/login`.
 
**Mensaje de error siempre genérico**, independientemente de si el email no existe o la contraseña es incorrecta:
```typescript
res.status(401).json({ error: 'Credenciales incorrectas.' });
```
 
---
 
## Validación y sanitización (Zod + DOMPurify)
 
Aplica a los campos editables desde el panel admin (nombre y descripción de platos, categorías, chileras, notas de publicación) y al formulario público de contacto/reservaciones.
 
```typescript
import DOMPurify from 'isomorphic-dompurify';
 
const textoSeguro = z.string()
  .trim()
  .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }));
 
export const crearPlatoSchema = z.object({
  nombreEs:    textoSeguro.min(2).max(150),
  nombreEn:    textoSeguro.min(2).max(150),
  descripEs:   textoSeguro.max(500).optional(),
  descripEn:   textoSeguro.max(500).optional(),
  precio:      z.number().int().positive().max(500000),
  categoriaId: z.number().int().positive(),
});
 
export const categoriaSchema = z.object({
  nombreEs:  textoSeguro.min(2).max(100),
  nombreEn:  textoSeguro.min(2).max(100),
  slug:      z.string().trim().min(2).max(100),
  orden:     z.number().int().min(0),
  imagenUrl: z.string().url().optional(),
});
 
export const contactoSchema = z.object({
  nombre:    textoSeguro.min(2).max(100),
  email:     z.string().trim().email().max(150),
  telefono:  z.string().regex(/^\+?[\d\s\-()]{7,20}$/).optional(),
  mensaje:   textoSeguro.min(5).max(1000),
  fecha:     z.string().datetime().optional(),   // fecha deseada de visita, si aplica
  personas:  z.number().int().min(1).max(50).optional(),
});
```
 
Nota: el plato ya no tiene campo de imagen propia — la foto representativa vive en `categoriaSchema` (`imagenUrl`), que es la que alimenta el banner de cada categoría en el menú público. Cualquier validación de imagen para platos individuales quedó obsoleta con este cambio.
 
**El formulario de contacto/reservaciones no persiste como sistema de reservas.** Solo dispara una notificación por correo a `contacto@lachozadelaurel.com` (ver `context.md`). Aun así, el body pasa por Zod y sanitización antes de construir el correo, para evitar inyección de contenido en el mensaje enviado.
 
---
 
## Rate limiting
 
```typescript
// Global: 100 req / 15 min por IP
// Login admin: 5 req / 15 min por IP   ← aplicar solo en POST /api/auth/login
// Contacto/reservaciones: 5 req / hora por IP ← aplicar en POST /api/contacto
// Slow down: delay de 500ms por request después de 50 en 15 min
```
 
Usar `express-rate-limit` y `express-slow-down`. El límite en el formulario de contacto evita que se use como vector de spam hacia el correo del negocio.
 
---
 
## Headers de seguridad
 
Usar `helmet` con `contentSecurityPolicy` explícito. CSP mínimo: `defaultSrc 'self'`, `scriptSrc 'self'`, `frameSrc 'self'` (necesario si el mapa de contacto se embebe con iframe), `objectSrc 'none'`. Ajustar `imgSrc` para permitir el origen real de las imágenes de categoría, chileras y del logo. HSTS con `maxAge: 31536000`, `includeSubDomains`, `preload`.
 
---
 
## CORS
 
Whitelist explícita: solo `FRONTEND_URL` en producción + `localhost:3000` en desarrollo. Requests sin `origin` solo en desarrollo. `credentials: true` (necesario para la cookie httpOnly del JWT). Métodos: GET, POST, PATCH, OPTIONS. No se requiere DELETE, ya que no se elimina nada físicamente vía API (ver regla de soft state en `database/CLAUDE.md`).
 
---
 
## Protección de rutas admin
 
Como hay un solo administrador, se resuelve verificando que el JWT es válido antes de cualquier operación sobre `/api/admin/*`. El middleware `requireAdmin` extrae el payload, verifica su vigencia y responde 401 si no pasa. Nunca exponer IDs internos de DB en URLs del sitio público (los IDs de plato o categoría no se muestran en rutas públicas, solo internamente en el panel).
 
---
 
## Subida de imágenes

**(2026-07-21) Implementado:** `POST /api/admin/upload` (protegido por `requireAdmin`), usado desde los formularios de Categoría, Chilera e Historia. Aplica a esas fotos (una por categoría, usada en el banner del menú público; chileras; filas de la sección "Nuestra historia"). Los platos individuales no tienen imagen propia y no aceptan subida de archivos en su formulario.

Implementación real: `multer` en memoria con límite de 5MB (rechaza con 400 antes de llegar al handler si se excede). El MIME type real se valida dejando que `sharp` lea los magic bytes del buffer (`sharp(buffer).metadata()`) — nunca se confía en el `Content-Type` ni en la extensión que manda el cliente. Solo se acepta el formato detectado `jpeg`, `png` o `webp`; cualquier otro (incluido un archivo renombrado con extensión falsa) responde 400. El archivo se reprocesa siempre con `sharp` (redimensionado a máx. 1600px + reencodado a WebP calidad 82) antes de guardarse, lo que elimina metadata EXIF/GPS y neutraliza contenido malicioso embebido en el archivo original, sin depender de nada declarado por el cliente. El nombre de archivo final es un UUID generado por el servidor (`crypto.randomUUID()`), nunca el nombre original — evita path traversal e inyección vía nombre de archivo. El SVG del logo se maneja aparte, con sanitización específica de SVG (`DOMPurify` con perfil SVG o `svgo` en modo seguro) para evitar scripts embebidos — no pasa por este endpoint.
 
---
 
## Variables de entorno
 
`.env` nunca en el repositorio. `.env.example` sí, con todos los nombres pero sin valores.
 
Variables requeridas:
```
DATABASE_URL
JWT_SECRET           # mínimo 64 caracteres aleatorios
JWT_EXPIRY=24h
ADMIN_EMAIL
ADMIN_PASSWORD_HASH  # bcrypt costo 12+
FRONTEND_URL
BACKEND_PUBLIC_URL   # dominio publico del propio backend, para URLs de imagenes subidas
CONTACTO_EMAIL_DESTINO=operaciones@lachozadelaurel.com
CONTACTO_EMAIL_CC=liberia@lachozadelaurel.com   # opcional, copia al correo secundario
NODE_ENV
PORT
```
 
Verificar al arrancar que todas las variables críticas existen y que `JWT_SECRET` tiene al menos 32 caracteres. Si falta alguna, `process.exit(1)` con mensaje descriptivo (ver `server.ts` en `backend/CLAUDE.md`).
 
---
 
## Logging seguro
 
Usar `pino`. Solo loguear identificadores no sensibles (`platoId`, `categoriaId`, `email` del remitente de contacto si es estrictamente necesario para debug puntual). Nunca loguear contraseñas, el hash de la contraseña, el JWT completo, ni el contenido íntegro de mensajes del formulario de contacto. Nivel `info` o superior en producción. Nunca `debug` en producción.
 
---
 
## Dependencias
 
`npm audit` antes de cada deploy. Sin vulnerabilidades críticas ni altas. `package-lock.json` en el repositorio, nunca en `.gitignore`.
 
---
 
## Checklist antes de deploy
 
**Variables de entorno**
- [ ] `JWT_SECRET` con 64+ caracteres generados con `crypto.randomBytes` u `openssl rand`
- [ ] `ADMIN_PASSWORD_HASH` es bcrypt costo 12+
- [ ] Sin credenciales en ningún archivo del repo
- [ ] `.env` en `.gitignore`, nunca commiteado
- [ ] `.env.example` con todas las variables documentadas
**Backend**
- [ ] `helmet` activo
- [ ] CORS solo permite el dominio de producción
- [ ] Rate limiting en login (5 / 15 min), contacto/reservaciones (5 / hora) y global (100 / 15 min)
- [ ] Todos los endpoints `/api/admin/*` protegidos con `requireAdmin`
- [ ] Sin stack traces en producción (`NODE_ENV=production`)
- [ ] `npm audit` sin vulnerabilidades críticas ni altas
- [ ] Formulario de contacto validado y sanitizado con Zod + DOMPurify antes de construir el correo
- [ ] El schema de plato no acepta campo de imagen; el de categoría sí (`imagenUrl`)
- [ ] `BACKEND_PUBLIC_URL` configurada con el dominio real del backend en producción
- [ ] Volumen persistente de Railway montado en el directorio de `backend/uploads/` (sin esto, un redeploy borra las imágenes subidas desde el panel)
**Base de datos**
- [ ] Sin `$queryRawUnsafe`
- [ ] Todos los inputs pasan por Zod antes de Prisma
- [ ] Endpoints públicos (`/api/menu`, `/api/chileras`) con `select` explícito, sin campos internos
- [ ] `DATABASE_URL` y `DIRECT_URL` no hardcodeadas en ningún archivo
**Frontend**
- [ ] Campos de texto libre con interpolación de React, nunca `dangerouslySetInnerHTML`
- [ ] Validación Zod en el formulario de contacto antes de enviar (el backend es la autoridad, el frontend mejora la UX)
- [ ] Clases Tailwind con `cn()`, nunca concatenación manual
- [ ] Sin JWT ni credenciales en `localStorage`; el token vive en cookie `httpOnly`, `SameSite=Strict`
**Infraestructura**
- [ ] Railway con variables de entorno correctas en frontend y backend
- [ ] Repositorio privado en GitHub
- [ ] Frontend en Railway no expone secretos del backend
---
 
## Lo que no hace este agente
 
- No reemplaza una auditoría profesional. El nivel de protección es proporcional al riesgo real de un sitio de consulta con panel admin de una sola cuenta.
- No gestiona la seguridad de la infraestructura de Railway más allá de recomendaciones de configuración.
- No monitorea el sistema en producción.
- No define validaciones para pedidos, pagos, delivery o WhatsApp: no existen en el alcance actual del proyecto. Si en el futuro se agregan (ver "Funcionalidades futuras" en `context.md`), este archivo se actualiza entonces retomando los patrones de validación de coordenadas, totales y mensajería que sí aplicarían en ese momento.
