# security/CLAUDE.md — Agente de Seguridad · Krone

## Rol

Ingeniero de seguridad senior. Capa activa durante el desarrollo, no auditor al final. Cualquier agente que escriba endpoints, formularios, CORS o variables de entorno consulta este archivo. Lee `CLAUDE.md` en la raíz antes de empezar.

Krone corre hoy exclusivamente en `localhost`, de un solo usuario, sin exposición a internet. El nivel de protección actual es proporcional a ese alcance — **pero el hallazgo más importante de este archivo es que el proyecto no está listo para dejar de ser así**, y cualquier tarea que implique desplegarlo fuera de `localhost` debe pasar primero por la sección "Antes de exponer este backend fuera de `localhost`".

---

## Modelo de amenazas

**Activos a proteger:** los datos financieros del usuario (ingresos, gastos, deudas, metas de ahorro) en PostgreSQL local, y las credenciales de esa base de datos en `backend/.env`.

**Estado actual, en orden de severidad si el alcance cambiara:**

1. **No hay autenticación implementada.** `JWT_SECRET` existe en `.env` pero no se usa en ningún archivo del código — no hay login, no hay middleware que proteja ningún endpoint. Todo `/api/*` es de lectura y escritura pública para quien pueda alcanzar el puerto 3001. Mientras el backend solo escuche en `localhost`, esto no es explotable desde fuera de la máquina del usuario. **Es un bloqueante crítico el día que se considere exponer el backend en una URL pública o en una red compartida** — no desplegar sin resolver esto primero.
2. **CORS abierto a cualquier origen** (`app.use(cors())` sin whitelist en `backend/src/app.ts`). Mismo razonamiento: aceptable en desarrollo local, inaceptable si el backend se expone públicamente sin autenticación, porque cualquier sitio web podría hacer requests de lectura/escritura contra los datos del usuario si conociera la URL.
3. **Sin validación ni sanitización de entrada.** Los controllers no usan Zod ni ninguna librería de validación — confían en `req.body` tal cual, casteando con `Number(...)` donde corresponde. No hay límite de longitud en campos de texto libre (nombre de categoría, nombre de deuda, nombre de meta). Riesgo bajo mientras el único cliente sea el propio frontend de Krone contra `localhost`, pero es la primera capa a agregar si el backend deja de ser exclusivamente local.
4. **`backend/.env` contiene la contraseña de PostgreSQL en texto plano** (`DATABASE_URL=postgresql://postgres:admin@localhost:5432/krone`). Está en `.gitignore` — verificar que siga así antes de cualquier commit. No pegar el contenido de este archivo en chats, issues, ni logs compartidos.

---

## Base de datos y Prisma

El proyecto ya usa Prisma Client con métodos estándar (`findMany`, `create`, `update`, `delete`) en todo el código actual — eso es seguro por defecto (prepared statements). **No hay ningún uso de `$queryRawUnsafe` en el proyecto — mantenerlo así.** Si alguna vez se necesita una query cruda, usar `$queryRaw` con template tag (`Prisma.sql`), nunca concatenación de strings:

```typescript
// Correcto si hiciera falta
await prisma.$queryRaw(Prisma.sql`SELECT * FROM "Income" WHERE id = ${id}`)

// Nunca
await prisma.$queryRawUnsafe(`SELECT * FROM "Income" WHERE id = '${id}'`)
```

---

## CORS — estado actual y qué cambiar antes de exponer el backend

Actual (`backend/src/app.ts`):
```typescript
app.use(cors())   // acepta cualquier origen
```

Antes de que el backend escuche en algo distinto de `localhost`, restringir a un origen explícito:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
}))
```
No hacer este cambio de forma incidental dentro de otra tarea sin que el usuario haya decidido desplegar el proyecto — restringir CORS en desarrollo local sin necesidad puede romper el flujo de trabajo sin ningún beneficio real mientras todo corre en la misma máquina.

---

## Antes de exponer este backend fuera de `localhost`

No hacer esto sin que el usuario lo pida explícitamente y sin completar, en este orden:

1. **Implementar autenticación real.** El campo `JWT_SECRET` ya existe en `.env` — decidir si se usa para un login de un solo usuario (email + contraseña con hash bcrypt, sesión vía cookie `httpOnly`) antes de escribir cualquier otro cambio de seguridad. Sin esto, todo lo demás es cosmético.
2. **Restringir CORS** al dominio real del frontend desplegado (ver sección anterior).
3. **Agregar validación de entrada con Zod** en cada controller — mínimo: longitud máxima de strings, tipos numéricos con rango razonable (montos positivos, `month` entre 1 y 12, `annualRate` entre 0 y un tope razonable).
4. **No exponer stack traces.** Verificar que `NODE_ENV=production` en el despliegue y que ningún handler devuelve `err.message`/`err.stack` crudo al cliente.
5. **Rate limiting básico** (`express-rate-limit`) al menos en los endpoints de escritura, para evitar que un uso accidental (o un bug en el frontend) genere miles de requests contra la base de datos.
6. **`npm audit`** en ambos paquetes antes de desplegar.

---

## Variables de entorno

`.env` nunca en el repositorio — verificar `.gitignore` en `backend/` y `frontend/` antes de cualquier `git add` amplio; ya están cubiertos, pero un `git add -A` accidental es el vector más probable de fuga real en este proyecto, no un ataque externo.

```
# backend/.env
DATABASE_URL=...   # credenciales de PostgreSQL local
JWT_SECRET=...      # sin usar todavía — ver "Antes de exponer este backend"
PORT=3001

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Cualquier variable con prefijo `NEXT_PUBLIC_` queda embebida en el bundle del navegador — nunca poner un secreto ahí. `NEXT_PUBLIC_API_URL` es seguro porque es solo una URL, no una credencial.

---

## Logging

No hay logger estructurado en el proyecto (sin `pino`/`winston`) — se depende de los logs por defecto de `tsx watch`/Express y de `next dev`. Mientras el proyecto sea local y de un solo usuario, esto es aceptable. Si se agrega logging explícito, nunca loguear el contenido de `DATABASE_URL` ni `JWT_SECRET`.

---

## Checklist — solo aplica si se decide exponer el proyecto fuera de `localhost`

- [ ] Autenticación implementada y probada (login, sesión, logout).
- [ ] CORS restringido al dominio real del frontend.
- [ ] Validación Zod en todos los endpoints de escritura.
- [ ] `NODE_ENV=production` en el despliegue; sin stack traces en las respuestas.
- [ ] Rate limiting en endpoints de escritura.
- [ ] `npm audit` sin vulnerabilidades críticas ni altas en `backend/` y `frontend/`.
- [ ] `DATABASE_URL` y cualquier secreto configurados como variables de entorno del hosting, nunca hardcodeados.
- [ ] `.env`/`.env.local` confirmados fuera del repositorio.

---

## Lo que no hace este agente

- No reemplaza una auditoría profesional. El nivel de protección documentado aquí es proporcional a un proyecto local de un solo usuario — no a un producto multiusuario en producción.
- No implementa la autenticación por su cuenta sin que el usuario decida primero desplegar el proyecto — es un cambio de arquitectura significativo (login, sesiones, middleware en cada ruta), no un ajuste incidental.
- No gestiona infraestructura de hosting ni certificados TLS.
