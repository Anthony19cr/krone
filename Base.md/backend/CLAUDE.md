# backend/CLAUDE.md — Agente Backend · La Choza de Laurel

## Rol
Ingeniero backend senior. Responsable de la API REST y la lógica de negocio del servidor. Si una regla de negocio puede violarse desde el frontend, la validás en el servidor igual.

Lee `CLAUDE.md` en la raíz antes de empezar cualquier tarea. Lee `security/CLAUDE.md` antes de tocar cualquier endpoint, formulario, query o autenticación.

Este backend es deliberadamente simple: no hay pedidos online, no hay pagos, no hay WhatsApp en esta fase. El sitio es de consulta. La complejidad está en hacerlo correcto, no en hacerlo grande.

---

## Arquitectura de capas

```
Route → Middleware de validación → Controller → Service → Prisma → DB
```

- **Controllers:** reciben request, llaman al service, devuelven response. Sin lógica de negocio, sin queries Prisma.
- **Services:** toda la lógica de negocio. Usan Prisma. No conocen `req` ni `res`.
- **Routes:** solo mapean verbos HTTP a controllers.
- **Middlewares:** validación Zod, autenticación JWT, manejo global de errores.

Si encontrás lógica de negocio en un controller, la movés al service antes de seguir.

---

## Estructura de carpetas

```
/server
  /controllers
    menu.ts
    chileras.ts
    historia.ts
    auth.ts
    admin
      platos.ts
      categorias.ts
      chileras.ts
      historia.ts
      upload.ts
      publicaciones.ts
      metricas.ts
  /services
    menuService.ts
    chilerasService.ts
    historiaService.ts
    authService.ts
    adminService.ts
    publicacionesService.ts
    metricasService.ts
  /routes
    index.ts
    menu.ts
    chileras.ts
    historia.ts
    auth.ts
    admin.ts
  /middlewares
    auth.ts          (verificación JWT)
    validate.ts      (wrapper Zod)
    upload.ts        (multer, subida de imágenes)
    error.ts         (manejador global)
  /schemas
    plato.ts
    categoria.ts
    chilera.ts
    historia.ts
    publicacion.ts
    metrica.ts
    auth.ts
  /lib
    prisma.ts        (cliente Prisma singleton)
    logger.ts        (pino)
    AppError.ts
    uploads.ts       (ruta del directorio de imagenes subidas)
  /types
    index.ts
  app.ts
  server.ts
```

---

## Convenciones

| Elemento | Estilo |
|---|---|
| Variables y funciones | camelCase |
| Archivos | kebab-case |
| Variables de entorno | SCREAMING_SNAKE_CASE |
| Tablas/columnas PostgreSQL | snake_case via `@map` / `@@map` en Prisma |

Las funciones de negocio en services van en español:
`obtenerMenuPublico`, `obtenerChilerasPublicas`, `verificarCredenciales`,
`crearPlato`, `actualizarPlato`, `toggleEstadoPlato`, `crearPublicacion`,
`obtenerMetricasDelMes`.

---

## Validación con Zod

Todo request body pasa por un schema Zod antes de llegar al controller.
El middleware `validate` envuelve el schema y captura los errores:

```typescript
// middlewares/validate.ts
import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
```

Los errores Zod se devuelven con status 400 en español. Nunca exponer mensajes internos al cliente.

---

## Manejo de errores

```typescript
// lib/AppError.ts
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

El middleware de error distingue:
- `ZodError` → 400 con detalles de campo
- `AppError` → statusCode del error con su mensaje
- `Error` genérico → 500 sin detalles internos

Nunca devolver stack traces al cliente. Registrar con `logger.error` los errores inesperados.
Registrar el middleware de error **siempre último** en `app.ts`.

```typescript
// middlewares/error.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: err.flatten().fieldErrors,
    });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  logger.error({ err, url: req.url, method: req.method }, 'Error inesperado');
  return res.status(500).json({ error: 'Ocurrió un error interno. Intenta de nuevo.' });
};
```

---

## Logger

Usar `pino`. En desarrollo con `pino-pretty`, en producción sin transport.

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino(
  process.env.NODE_ENV === 'production'
    ? {}
    : { transport: { target: 'pino-pretty' } },
);
```

Niveles:
- `logger.info`: flujo normal (servidor iniciado, request procesada)
- `logger.warn`: situaciones anómalas sin ruptura (plato no encontrado, intento de login fallido)
- `logger.error`: errores que el sistema no pudo manejar

Nunca loguear contraseñas, tokens JWT ni datos sensibles del negocio.

---

## Paginación

Nunca devolver todos los registros sin paginación donde el volumen puede crecer.
El menú público no requiere paginación (catálogo acotado).
Las publicaciones del panel sí requieren paginación desde el primer endpoint.

Formato estándar de respuesta paginada:
```typescript
{
  datos: T[],
  meta: {
    total: number,
    pagina: number,
    porPagina: number,
    totalPaginas: number,
  }
}
```

---

## Endpoints

### Públicos (sin autenticación)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/menu` | Todas las categorías activas con sus platos activos |
| GET | `/api/menu/:categoriaSlug` | Platos activos de una categoría específica |
| GET | `/api/chileras` | Todas las chileras activas |
| GET | `/api/historia` | Filas activas de la sección "Nuestra historia" en Inicio, ordenadas por `orden` |

**Regla crítica:** los platos inactivos y las categorías inactivas **nunca** aparecen en los endpoints públicos. Esta restricción se garantiza en la capa de servicio, no en el frontend.

Formato de respuesta del menú:
```typescript
{
  categorias: [
    {
      id: number,
      slug: string,
      nombreEs: string,
      nombreEn: string,
      orden: number,
      imagenUrl: string | null,   // foto representativa de la categoría, usada en el banner
      platos: [
        {
          id: number,
          nombreEs: string,
          nombreEn: string,
          descripEs: string | null,
          descripEn: string | null,
          precio: number,       // en colones enteros, ej: 7000
        }
      ]
    }
  ]
}
```

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login del administrador |
| POST | `/api/auth/logout` | Cierra la sesión activa |
| GET | `/api/auth/me` | Confirma si la cookie actual sigue siendo una sesión válida (requiere `requireAdmin`) — lo usa el frontend para proteger `/panel/*` server-side antes de renderizar nada |

Body esperado para `/login`:
```typescript
{ email: string, password: string }
```

Respuesta exitosa de `/login`, `/logout` y `/me`:
```typescript
{ ok: true }   // el JWT nunca vuelve en el body — vive solo en la cookie httpOnly
```

Rate limiting: máximo 5 intentos por IP en 15 minutos en `/login`. Ver `security/CLAUDE.md`.

**Una sola sesión activa a la vez** (regla de negocio, ver `CLAUDE.md` raíz): cada JWT lleva un `jti` (UUID) generado en `authService.verificarCredenciales`. El `jti` de la sesión vigente se guarda en una variable de módulo (`sesionActivaJti`, no en la base de datos — no existe tabla `Administrador`). `requireAdmin` rechaza cualquier token cuyo `jti` no coincida con el vigente, aunque la firma y la expiración sean válidas — así un login nuevo invalida automáticamente cualquier sesión anterior. `logout` también limpia `sesionActivaJti`. Efecto secundario esperado: si el proceso de Node se reinicia (deploy, crash), la sesión activa se pierde y hay que iniciar sesión de nuevo — es el comportamiento correcto, no un bug.

### Panel de administración (requieren JWT válido)

**Platos**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/platos` | Todos los platos (activos e inactivos) |
| POST | `/api/admin/platos` | Crear un plato nuevo |
| PATCH | `/api/admin/platos/:id` | Editar nombre, descripción, precio o categoría |
| PATCH | `/api/admin/platos/:id/estado` | Activar o desactivar un plato |

Body para crear/editar plato:
```typescript
{
  nombreEs: string,
  nombreEn: string,
  descripEs?: string,
  descripEn?: string,
  precio: number,         // entero, en colones
  categoriaId: number,
}
```

El plato no tiene imagen propia. La foto representativa vive en la categoría (ver más abajo) y se muestra una sola vez, en el banner del menú público.

Body para toggle de estado:
```typescript
{ activo: boolean }
```

**Categorías**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/categorias` | Todas las categorías |
| POST | `/api/admin/categorias` | Crear una categoría |
| PATCH | `/api/admin/categorias/:id` | Editar nombre, orden o imagen |
| PATCH | `/api/admin/categorias/:id/estado` | Activar o desactivar |

Body para crear/editar categoría:
```typescript
{
  nombreEs: string,
  nombreEn: string,
  slug: string,
  orden: number,
  imagenUrl?: string,      // foto representativa de la categoría, usada en el banner del menú
                           // URL absoluta (https://...) o ruta relativa a /public (/images/...) — ambas validas
}
```

**Chileras**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/chileras` | Todas las chileras (activas e inactivas) |
| PATCH | `/api/admin/chileras/:id` | Editar nombre, descripción o imagen |
| PATCH | `/api/admin/chileras/:id/estado` | Activar o desactivar |

Las chileras no se crean ni eliminan desde el panel en esta fase.
Las tres variedades se cargan en el seed y se gestionan solo por estado.

**Historia** (filas de la sección "Nuestra historia" en Inicio)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/historia` | Todas las filas (activas e inactivas), ordenadas por `orden` |
| PATCH | `/api/admin/historia/:id` | Editar texto (ES/EN) o imagen |
| PATCH | `/api/admin/historia/:id/estado` | Activar o desactivar |

Máximo 5 filas fijas, cargadas una sola vez en el seed (`orden` 1-5, `@unique`). No se crean ni eliminan desde el panel — mismo patrón que Chileras. Una fila inactiva simplemente no aparece en `GET /api/historia`; si no queda ninguna fila activa, `SeccionHistoria.tsx` no renderiza nada (mismo criterio que Testimonios/Eventos).

**Publicaciones destacadas** (posts curados de Instagram/Facebook, mostrados en `/redes` — ver excepción documentada en `CLAUDE.md` raíz, sección "Contenido adicional")

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/publicaciones-destacadas` | Todas las publicaciones (activas e inactivas) |
| POST | `/api/admin/publicaciones-destacadas` | Crear una publicación destacada |
| PATCH | `/api/admin/publicaciones-destacadas/:id` | Editar url, imagen, plataforma u orden |
| PATCH | `/api/admin/publicaciones-destacadas/:id/estado` | Activar o desactivar |

A diferencia de Chileras/Historia, sí se crean desde el panel — el número de posts curados varía con el tiempo, no es un catálogo fijo. `imagenUrl` es obligatorio (a diferencia de categoría/chilera/historia, donde es opcional) — toda publicación destacada necesita una foto. `url` valida como URL absoluta real (enlace al post original).

**Subida de imágenes** (categorías, chileras, historia, publicaciones destacadas)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/admin/upload` | Sube una imagen (`multipart/form-data`, campo `imagen` + campo opcional `carpeta`) y devuelve `{ url }` |

`multer` (memoria, límite 5MB) recibe el archivo; `sharp` valida el formato real leyendo los magic bytes (no el `Content-Type` ni la extensión que manda el cliente — ver `security/CLAUDE.md`), lo redimensiona a un ancho máximo de 1600px y lo reencoda a WebP calidad 82, lo que además elimina cualquier metadata EXIF/GPS y neutraliza contenido malicioso embebido en el archivo original. El resultado se guarda en `backend/uploads/<carpeta>/<uuid>.webp` (`carpeta` es `categorias`, `chileras`, `historia`, `redes` u `otros` si no se manda una válida) y se sirve como estático en `/uploads/...`. La URL devuelta es absoluta (`${BACKEND_PUBLIC_URL}/uploads/...`) porque el frontend consume estas imágenes desde un origen distinto al backend.

`backend/uploads/` está en `.gitignore` — es contenido generado por el usuario, no código. **En producción (Railway) requiere un volumen persistente montado en ese directorio**; sin eso, cada redeploy borra las imágenes subidas. Ese volumen es una tarea de Fase 4 (deploy), todavía no configurada — ver Gaps en `cronograma.md`.

**Publicaciones**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/publicaciones` | Publicaciones del mes actual (paginadas) |
| POST | `/api/admin/publicaciones` | Crear una publicación en el calendario |
| PATCH | `/api/admin/publicaciones/:id` | Editar descripción, fecha o estado |

Body para crear publicación:
```typescript
{
  fecha: string,          // ISO 8601
  plataforma: 'instagram' | 'facebook' | 'ambas',
  descripcion: string,
  estado: 'programada' | 'publicada',
  notas?: string,
}
```

**Métricas**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/metricas` | Métricas del mes actual |
| PATCH | `/api/admin/metricas/:id` | Actualizar valores de métricas |

Las métricas son ingresadas manualmente por el desarrollador.
La automatización vía Google Analytics o Meta API es una funcionalidad futura.

---

## Autenticación JWT

Un solo administrador. Credenciales en variables de entorno.

```
ADMIN_EMAIL=marcos@lachozadelaurel.com
ADMIN_PASSWORD_HASH=<bcrypt hash generado con bcrypt.hash(password, 12)>
JWT_SECRET=<generar con: openssl rand -base64 64>
JWT_EXPIRY=24h
```

El token se devuelve al frontend como JSON. El frontend lo almacena en una cookie `httpOnly` con `SameSite=Strict`. No en `localStorage`.

El middleware `requireAdmin` verifica el token en cada request al panel:

```typescript
// middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../lib/AppError';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (!token) throw new AppError('No autorizado', 401);

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    throw new AppError('Sesión expirada. Iniciá sesión nuevamente.', 401);
  }
};
```

Ver `security/CLAUDE.md` para la implementación completa con hash bcrypt.

---

## CORS

Solo el dominio del frontend en producción. En desarrollo, permitir `localhost:3000`.

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:3000',
  credentials: true,   // necesario para cookies httpOnly
}));
```

Ver `security/CLAUDE.md` para la configuración completa.

---

## Variables de entorno requeridas

```
# Base de datos
DATABASE_URL=postgresql://...

# Autenticación
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
JWT_SECRET=
JWT_EXPIRY=24h

# CORS
FRONTEND_URL=https://[dominio-del-sitio]

# URL pública del propio backend (subida de imágenes)
BACKEND_PUBLIC_URL=https://[dominio-del-backend]

# Entorno
NODE_ENV=production
PORT=4000
```

Nunca hay valores por defecto hardcodeados para variables de seguridad.
Si falta una variable crítica al arrancar, el servidor lanza un error descriptivo y no inicia.

---

## Inicialización del servidor

```typescript
// server.ts
import app from './app';
import { logger } from './lib/logger';

const PORT = process.env.PORT ?? 4000;

const requiredEnv = [
  'DATABASE_URL',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD_HASH',
  'JWT_SECRET',
  'FRONTEND_URL',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    logger.error(`Variable de entorno requerida no definida: ${key}`);
    process.exit(1);
  }
}

app.listen(PORT, () => {
  logger.info(`Servidor activo en puerto ${PORT}`);
});
```

---

## Reglas de negocio del menú

- Un plato desactivado no aparece en `/api/menu` ni en `/api/menu/:categoriaSlug`.
- Una categoría desactivada tampoco aparece, junto con todos sus platos.
- No se eliminan platos ni categorías: solo se desactivan. Los registros permanecen en DB.
- El precio se almacena en colones enteros (sin decimales). `7000` representa `₡7,000`.
- La formateación del precio (`₡7,000`) ocurre en el frontend, no en el backend.
- La imagen representativa de cada categoría (`imagenUrl`) es opcional a nivel de schema, pero el frontend espera que toda categoría activa la tenga para renderizar su banner correctamente. Si falta, el banner cae a un color de fondo sólido en vez de romper el layout — ver `frontend/CLAUDE.md`.

---

## Tests

`vitest` + `supertest`, contra una base de datos de pruebas dedicada (`lachoza_test`), nunca contra la de desarrollo. `tests/setup.ts` aborta la corrida si `DATABASE_URL` no contiene `lachoza_test` — es una salvaguarda real, no cosmética, porque los tests crean y borran filas.

**Setup (una sola vez por máquina):**
1. `CREATE DATABASE lachoza_test;` en el mismo Postgres que ya usás para desarrollo.
2. Copiar `.env.test.example` a `.env.test` y ajustar `DATABASE_URL` si tu Postgres local no usa las credenciales del ejemplo.
3. Aplicar las migraciones a la base de pruebas:
   ```
   node -e "require('dotenv').config({path:'.env.test'});require('child_process').execSync('npx prisma migrate deploy',{stdio:'inherit',env:process.env})"
   ```

**Correr los tests:** `npm test` (una corrida) o `npm run test:watch` (modo watch).

**Estructura:**
```
/tests
  setup.ts              (carga .env.test, valida que no sea la DB de desarrollo)
  /helpers
    db.ts                (fixtures de categoria/plato + limpieza)
  /services
    authService.test.ts   (unitario, sin DB — lee ADMIN_EMAIL/ADMIN_PASSWORD_HASH de env)
    menuService.test.ts   (regla crítica: nada inactivo llega al público)
    adminService.test.ts  (desactivar nunca elimina; admin ve todo, público solo lo activo)
  /schemas
    plato.test.ts          (Zod + sanitización DOMPurify)
    contacto.test.ts       (Zod + sanitización DOMPurify del formulario de reservaciones)
  /middlewares
    auth.test.ts            (requireAdmin vía supertest: token válido/ausente/inválido/expirado, jti de sesión única)
  /routes
    auth.test.ts              (POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout — máximo 3 logins por archivo, ver nota abajo)
    menu.test.ts              (smoke test del cableado route → controller → service)
    historia.test.ts          (GET /api/historia: solo filas activas, ordenadas)
    contacto.test.ts          (POST /api/contacto: caso feliz sin SMTP configurado en .env.test, validación 400 — máximo 2 solicitudes por archivo, mismo cuidado que auth.test.ts con el rate limiting real)
    admin-platos.test.ts      (CRUD + la respuesta de POST/PATCH siempre incluye la categoria — regresión real, ver nota abajo)
    admin-categorias.test.ts  (CRUD + imagenUrl relativa/absoluta + slug duplicado + desactivar sin eliminar)
    admin-chileras.test.ts    (edición, imagenUrl inválida, id inexistente, desactivar sin eliminar)
    admin-historia.test.ts    (edición de texto, imagenUrl inválida, id inexistente, desactivar sin eliminar)
    admin-upload.test.ts      (requiere admin, caso feliz + carpeta, formato invalido, archivo excede 5MB, sin archivo)
    admin-publicaciones.test.ts (calendario: crear, plataforma inválida, listado paginado del mes, editar estado)
    admin-publicaciones-destacadas.test.ts (crear, imagenUrl faltante, url inválida, plataforma inválida, editar, id inexistente, desactivar sin eliminar)
    admin-metricas.test.ts    (upsert del mes actual, editar sin duplicar, rating fuera de rango, id inexistente)
```

Cada test que toca la DB crea sus propios registros con slugs/nombres únicos (`idUnico()` en `tests/helpers/db.ts`) y los borra en `afterEach`/`afterAll` — nunca dependen de datos del seed ni entre sí. Los archivos corren en paralelo entre sí; dentro de un mismo archivo, los tests corren en serie.

`tests/helpers/auth.ts` expone `cookieAdmin()`, que llama a `verificarCredenciales()` directamente (sin pasar por `POST /api/auth/login`) para obtener una cookie de sesión válida en los tests de rutas admin. Existe específicamente para no consumir el límite de intentos de login real — todos los `tests/routes/admin-*.test.ts` lo usan en vez de loguearse por HTTP.

`crearPlato`/`actualizarPlato`/`toggleEstadoPlato` en `adminService.ts` usan un `select` compartido (`platoSelect`) que siempre incluye `categoria: { nombreEs, slug }` — se descubrió durante el QA manual del panel que sin esto, editar un plato desde el panel rompía la tabla (`Cannot read properties of undefined (reading 'nombreEs')`) porque el `PATCH` devolvía el plato sin la relación que el frontend siempre espera. `admin-platos.test.ts` cubre esto explícitamente para que no vuelva a pasar.

**Cuidado con el rate limiting real:** `POST /api/auth/login` tiene el límite de 5 intentos/15min de producción (ver más abajo). `tests/routes/auth.test.ts` hace como máximo 3 intentos por esa razón — si se agregan más tests contra ese endpoint, hay que seguir contando intentos totales por archivo para no bloquear corridas repetidas. Los tests de rutas admin no cuentan para este límite porque usan `cookieAdmin()`.

**Cobertura actual:** autenticación completa (login, `requireAdmin`, `GET /api/auth/me`, logout, sesión única por `jti`), la regla crítica de visibilidad del menú público, el ciclo desactivar/reactivar sin eliminar, validación Zod + sanitización de dos schemas representativos (`plato`, `contacto`), los endpoints admin de categorías, chileras, historia, publicaciones, publicaciones destacadas y métricas (caso feliz + validación por recurso), `GET /api/historia` (solo filas activas), `POST /api/admin/upload` (caso feliz, organización por carpeta, formato real inválido vía `sharp`, límite de 5MB, requiere admin), y `POST /api/contacto` (caso feliz + validación 400; sin `SMTP_HOST` en `.env.test` el servicio toma la misma rama de fallback documentada para producción — loguea y no envía correo — así que el test no necesita mockear `nodemailer`). **No cubierto todavía:** el frontend (cero tests de componentes — ver `frontend/CLAUDE.md`, es una decisión de alcance deliberada, no una omisión).

---

## Lo que no hace este agente

- No toca componentes React ni estilos Tailwind.
- No define el schema de Prisma. Lo consume. Si necesita un campo nuevo, lo reporta al agente de base de datos antes de escribir código que lo use.
- No configura Railway ni variables de entorno en el dashboard de producción.
- No gestiona pedidos, pagos ni WhatsApp en esta fase. El sistema es de consulta pura.
- **(2026-07-21)** Sí sube imágenes al servidor ahora — `POST /api/admin/upload` (ver sección "Subida de imágenes" más abajo). Antes de esa fecha las imágenes solo se referenciaban por URL/ruta relativa; ese endpoint es la excepción documentada, no una regla general. Los assets de marca (logo) siguen fuera de este flujo, se gestionan manualmente. Los platos individuales no tienen imagen propia.