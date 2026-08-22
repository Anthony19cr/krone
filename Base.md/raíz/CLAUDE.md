# CLAUDE.md — La Choza de Laurel: Sitio Web y Gestión Digital

## Rol
Ingeniero de software senior actuando como orquestador. Lee este archivo completo antes de tocar cualquier capa. Luego lee el agente especializado que corresponde a la tarea en curso.

Sitio web profesional bilingüe (español / inglés) para La Choza de Laurel, restaurante de comida típica costarricense ubicado en Liberia, Guanacaste, a minutos del Aeropuerto Internacional Daniel Oduber. El sitio reemplaza una plantilla de GoDaddy obsoleta y centraliza la presencia digital del negocio: menú interactivo y filtrable, sección de productos artesanales (Chileras La Choza), panel de administración para el dueño, y gestión activa de redes sociales y Google My Business. El cliente final no tiene conocimientos técnicos ni tiempo para operar el sistema: la interfaz de administración debe ser operable sin fricción.

---

## Contexto del cliente

**Negocio:** La Choza de Laurel — restaurante de comida típica costarricense y Bar & Grill.
**Sede activa:** Liberia, Guanacaste, Ruta 21, frente al Aeropuerto Internacional Daniel Oduber.
**Sede cerrada:** Arenal / La Fortuna — aparece incorrectamente como activa en Google Maps y Apple Maps. Corrección urgente en el setup inicial.
**Operación:** Más de 15 años. Flujo constante de turistas internacionales + clientela local.
**Audiencia principal:** Turistas internacionales (inglés) + locales de Guanacaste (español).
**Productos artesanales:** Chileras La Choza — tres variedades de salsa artesanal disponibles en el local. Sin presencia digital propia hasta ahora.
**Redes sociales:** Dos cuentas de Instagram fragmentadas (`lachozadelaurel`, `restaurantelachozadelaurel`), ambas abandonadas. Facebook con 3,200 seguidores sin gestión activa. A unificar en el setup inicial.
**TripAdvisor:** 186 reseñas, calificación 4.0, posición #24 de 115 en Liberia.
**Developer:** Anthony David Salas Salas — mismo desarrollador que construye, mantiene y gestiona el contenido. Sin intermediarios.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL 15 |
| Internacionalización | next-intl (español / inglés) |
| Animaciones | Framer Motion |
| Hosting | Railway (frontend + backend + DB en el mismo workspace) |
| Autenticación admin | JWT — una sola cuenta de administrador |
| Modo oscuro | next-themes — light / dark nativo |

No sustituir tecnologías sin consultar.

---

## Agentes especializados

| Capa | Archivo |
|---|---|
| Frontend (Next.js, UI, componentes, i18n, dark mode) | `frontend/CLAUDE.md` |
| Backend (Express, API REST, lógica de negocio) | `backend/CLAUDE.md` |
| Base de datos (PostgreSQL, Prisma, schema) | `database/CLAUDE.md` |
| QA (pruebas, validaciones, errores conocidos) | `qa/CLAUDE.md` |
| Seguridad (auth, validación, headers, secretos) | `security/CLAUDE.md` |

Seguridad es transversal: consultarlo siempre que la tarea involucre endpoints, formularios, autenticación, queries o cualquier contacto con el exterior.

---

## Identidad visual — CERRADA

La paleta, la tipografía y el logo fueron acordados con el cliente y son vinculantes para todos los agentes desde ahora. La fuente de verdad completa vive en `context.md`; esta tabla es un resumen de referencia rápida.

### Paleta (extraída del color exacto del logo, `#665317`)

| Token | Modo claro | Modo oscuro |
|---|---|---|
| Fondo de página | `#F3ECDD` (crema) | `#3A2C1F` (café, nunca negro) |
| Fondo de tarjeta | `#FFFBF2` | `#4A3A28` |
| Borde | `#E4D9C4` | `#5C4934` |
| Texto principal | `#2E2013` | `#F3ECD9` |
| Texto secundario | `#6B5B45` | `#C9BBA0` |
| Oliva (marca) | `#665317` | `#C2A44B` |
| Dorado (acento) | `#C79A3A` | `#D4AF52` |
| Tierra | `#9C5F32` | `#C17D45` |
| Verde (precios) | `#4C6B3F` | `#6E9459` |
| Celeste grisáceo (acento frío, uso puntual) | `#7F97A0` | `#9FB4BC` |

### Tipografía

- **Display:** Fraunces, peso 600 — nombre del negocio, titulares, nombre de plato.
- **Cuerpo:** Karla (400/500/600).
- **Mono (precios):** IBM Plex Mono (500), con fallback `ui-monospace, monospace` — el subset "latin" de Google Fonts no siempre incluye el glifo `₡`. Verificar explícitamente su cobertura antes de dar por buena cualquier fuente para precios, no asumir que un subset por defecto lo trae.

### Logo

Tres variantes en SVG confirmadas por el cliente: color, negro, blanco — rutas en `context.md` (`/public/logo-color.svg`, `/public/logo-negro.svg`, `/public/logo-blanco.svg`).

### Navegación

Definida colaborativamente con el cliente a partir de bocetos propios:
- **Barra superior fija:** logo, selector de idioma (ES/EN), toggle de modo oscuro/claro, botón hamburguesa (máximo 4 elementos).
- **Drawer (hamburguesa):** solo links de sección — Inicio, Menú, Chileras, Redes, Contacto.
- **FAB "Reservar":** botón flotante circular/pill, anclado abajo-derecha (no una barra completa).

Ver `frontend/CLAUDE.md` para la implementación de componentes de este patrón de navegación.

**Principios que aplican desde ahora y no cambian:**

- Responsive desde 320px hasta pantallas anchas. Mobile-first.
- Bilingüe completo: cada pieza de texto visible tiene versión en español e inglés. Sin excepciones.
- Light mode y dark mode nativos. El sistema sigue la preferencia del sistema operativo por defecto y permite cambio manual.
- Animaciones suaves y fluidas: entradas con fade + desplazamiento, transiciones de modo claro/oscuro con `transition`, micro-interacciones en hover. Sin efectos que causen mareo o distraccción.
- Sin emojis en ninguna capa: UI, logs, comentarios, documentación.
- Sin estética genérica de plantilla. El sitio debe proyectar la identidad física del restaurante: carácter costarricense, calidez, solidez, 15 años de operación.

Leer `frontend/CLAUDE.md` para convenciones de componentes, estructura de carpetas y reglas de estilo.

---

## Flujo de trabajo

1. Leer este archivo y el agente de la capa a trabajar.
2. Si la tarea toca seguridad: leer también `security/CLAUDE.md`.
3. Confirmar en dos líneas qué vas a construir y qué archivos vas a tocar. Esperar aprobación.
4. Si involucra datos: schema Prisma → servicio → endpoint → componente.
5. Si es solo frontend: leer igual `database/CLAUDE.md` para entender las entidades a consumir.
6. Toda sección o componente nuevo de frontend se prueba en el navegador antes de darse por terminado — funcionalidad completa, no solo inspección visual, más al menos una vista responsive por debajo del breakpoint `md`. Si algo falla, se itera y corrige en el mismo turno.
7. Al terminar: verificar que no se violó ninguna regla de este archivo, del agente especializado ni de `security/CLAUDE.md`.
8. Actualizar `cronograma.md` reflejando el nuevo estado (hecho / pendiente / notas) antes de dar la tarea por terminada — no como paso aparte al final del proyecto.

---

## Secciones del sitio público

1. **Inicio** — hero con fotos reales, teaser de ubicación, Testimonios, Eventos.
2. **Menú** — filtrable por categoría, banner de foto representativa por categoría (ver "Entidades principales").
3. **Chileras** — sin botón de compra; el sitio comunica que están disponibles solo en el local.
4. **Redes** (`/redes`) — publicaciones destacadas curadas manualmente + links a perfiles oficiales.
5. **Contacto** — mapa, horarios, formulario de reservaciones (solo notifica por correo a `contacto@lachozadelaurel.com`, no persiste como sistema de reservas en esta fase).

La sección Redes no estaba en el alcance original del contrato; se agregó como decisión de producto durante el desarrollo y queda documentada aquí como parte del alcance vigente.

---

## Entidades principales del sistema

**Menú**
- Organizado por categorías. El listado real y definitivo de categorías y platos —incluyendo precios en colones— vive en `menu.md`, transcrito del menú físico del restaurante. No asumir ni hardcodear una lista de categorías distinta a la de ese archivo.
- Cada plato tiene: nombre (ES + EN), descripción (ES + EN), precio, categoría, estado (activo / inactivo). **El plato ya no tiene imagen propia.**
- Cada categoría tiene una única foto representativa (`imagenUrl`), usada en el banner de esa categoría en el menú público. Ver `database/CLAUDE.md` y `frontend/CLAUDE.md` para el detalle del componente `BannerCategoria.tsx` + `FilaPlato.tsx`.
- El menú público muestra solo platos activos de categorías activas.
- El precio que aparece en el menú es el precio actual en DB. No hay lógica de snapshot en el menú público (solo aplica si en el futuro hay pedidos online).
- El administrador puede activar, desactivar, crear y editar platos desde el panel sin tocar código.

**Chileras La Choza**
- Sección propia en el sitio con las tres variedades de salsa artesanal.
- Cada producto tiene: nombre (ES + EN), descripción (ES + EN), imagen propia, precio, estado.
- Disponibles solo para compra en el local. El sitio comunica esto con claridad; no hay e-commerce en esta fase.

**Contenido adicional (valor agregado no facturado)**
- **Eventos, Testimonios y Publicaciones destacadas** — tres piezas de contenido liviano, decisión de Anthony documentada en `context.md`, sin integración en vivo con APIs externas (para no generar costo operativo variable ni dependencia de tokens que expiren).
- Eventos se ocultan automáticamente si no hay ninguno vigente por fecha. Testimonios son reseñas de Google/TripAdvisor copiadas manualmente. Publicaciones destacadas son posts de Instagram/Facebook curados manualmente.
- Eventos y Testimonios se gestionan directamente vía Prisma Studio por Anthony — **sin pantalla propia en el panel de administración.** Marcos y don Ronny no las tocan.
- **(2026-07-29) Publicaciones destacadas es la excepción a lo anterior:** a pedido explícito de Anthony, sí tiene pantalla propia en el panel (`/panel/redes`, sección "Publicaciones destacadas" en el sidebar) — CRUD completo (crear, editar, activar/desactivar) con subida de imagen vía el mismo mecanismo que categorías/chileras/historia. Superó la decisión original documentada arriba solo para este contenido; Eventos y Testimonios se mantienen sin pantalla, sin cambios.

**Códigos QR**
- Generados en el setup inicial con identidad visual del restaurante.
- Destinos: menú digital, Instagram oficial, Google Maps, reseña en Google.
- Entregados en alta resolución para impresión (menús físicos, mesas, cartelería).

**Panel de administración**
- Una sola cuenta. Sin registro público.
- Credenciales por variable de entorno. Nunca en texto plano.
- El administrador puede: gestionar platos y categorías, ver métricas básicas del sitio, ver el calendario de publicaciones, gestionar publicaciones destacadas de Redes, solicitar cambios de contenido.
- Eventos y Testimonios quedan fuera del panel (ver arriba). Publicaciones destacadas sí tiene pantalla propia — ver arriba.

**Métricas**
- El panel muestra métricas básicas: visitas al sitio, alcance en Instagram (si hay integración disponible), publicaciones del mes, rating de Google.
- En la primera fase, las métricas pueden ser ingresadas manualmente por el desarrollador en el reporte mensual. La integración automática es una mejora futura.

---

## Reglas de negocio

**Menú público**
- Plato inactivo: no aparece en el sitio público. Permanece en DB para historial.
- El menú es filtrable por categoría desde el frontend. Sin recarga de página.
- El menú es bilingüe: el idioma activo del usuario determina qué versión se muestra.
- En móvil el menú debe ser legible sin hacer zoom. Sin PDF, sin imágenes de texto.

**Sede de Arenal**
- Eliminada como ubicación activa, de contacto, o en el selector de sedes/mapa (la sede está cerrada). Excepción explícita: "Nuestra historia" puede mencionar La Fortuna de San Carlos como origen histórico del negocio — es narrativa de pasado, no una sede operativa hoy. Ver `context.md`, sección "Sede activa y sede cerrada", para la redacción completa de la regla.
- El perfil de Google My Business de Arenal debe marcarse como cerrado permanentemente en el setup inicial. Esta acción no es parte del código, pero es tarea documentada en el cronograma.
- Si en el futuro se reactiva una segunda sede, el sistema debe poder soportarla sin rediseño.

**Idioma**
- La selección de idioma persiste en la sesión.
- El idioma por defecto se detecta desde el navegador (`Accept-Language`). Si no hay coincidencia, por defecto es español.
- Todas las rutas públicas existen en ambos idiomas: `/es/menu`, `/en/menu`, etc.

**Panel admin**
- Solo una sesión activa a la vez.
- El token expira en 24 horas. No hay "recordarme".
- Toda acción destructiva (eliminar plato, desactivar categoría) requiere confirmación explícita.

**Panel de admin no funciona en el preview de subdominios gratuitos de Railway (`*.up.railway.app`) — no es un bug, es un límite de arquitectura conocido**
- Causa real (confirmada 2026-07-23, no es solo `sameSite`): `frontend/src/lib/auth-server.ts` lee la cookie `token` de la petición que el navegador hace al propio frontend (`web-production-....up.railway.app`) para reenviarla al backend. Esa cookie la emite el backend bajo su propio host (`api-production-....up.railway.app`) — un host distinto. El navegador **nunca** adjunta la cookie de un host a una petición hecha a otro host, sin importar el valor de `sameSite`. Confirmado con `curl -i` al login: el header `Set-Cookie` ya traía `SameSite=None; Secure` y aun así el panel seguía sin mantener sesión.
- `backend/src/controllers/auth.ts` sí soporta relajar el valor vía la variable de entorno opcional `COOKIE_SAME_SITE` (default `'strict'`), pero **por sí sola no resuelve este problema** — se probó y confirmó insuficiente. No activarla de nuevo sin resolver primero el problema de fondo.
- Arreglo real, dos opciones (ninguna aplicada todavía, requiere decisión de Anthony):
  1. **Dominio propio real** (`lachozadelaurel.com` + `api.lachozadelaurel.com`): ahí sí funciona con `sameSite: 'strict'` tal como está, fijando el atributo `Domain` de la cookie al dominio padre compartido. Es el plan ya previsto en Fase 4 — este problema se resuelve solo al llegar ahí, sin tocar código.
  2. **Proxy same-origin en Next.js** (`next.config.mjs` con `rewrites()` reenviando `/api/*` al backend): el navegador solo habla con un host en cualquier dominio, elimina el problema de raíz de forma permanente. Cambio de arquitectura real (toca `lib/api.ts`, `lib/api-admin.ts`, `lib/auth-server.ts`, CORS del backend) — no se implementó el 2026-07-23 por alcance/tiempo, queda como mejora futura si se quiere un preview con panel funcional antes del dominio real.
- Mientras tanto: el sitio público (menú, chileras, redes, contacto) funciona perfecto en el link de preview de Railway — es lo único que se necesitaba para la aprobación de Marcos y don Ronny.

---

## NUNCA

- `console.log` en producción. Usar pino o winston.
- Lógica de negocio en controllers o componentes React. Va en servicios.
- `any` en TypeScript. Usar tipos explícitos o `unknown` + Zod.
- Queries de Prisma fuera de la capa de servicios.
- Credenciales o API keys en el repositorio.
- Mensajes de error técnicos al usuario final. Solo mensajes en el idioma activo, sin stack traces.
- Eliminar registros de platos. Solo cambiar su estado a inactivo.
- Emojis en cualquier capa: UI, logs, comentarios, documentación.
- Texto hardcodeado en componentes. Todo pasa por el sistema de i18n.
- Colores o tipografías fuera del sistema de tokens definido en `context.md`.
- Campo de imagen en el schema o formularios de plato individual — la imagen vive únicamente en categoría, chilera o marca.
- Asumir una lista de categorías del menú distinta a la de `menu.md`.

---

## Vocabulario

| Prohibido | Correcto |
|---|---|
| Dashboard | Panel de administración |
| Submit | Guardar / Confirmar |
| Delete | Desactivar (para platos) / Eliminar (para registros sin historial) |
| Item | Plato / Producto |
| Toggle | Activar / Desactivar |
| Manage | Gestionar |
| Settings | Configuración |
| Dark mode | Modo oscuro |

---

## Archivos del proyecto

| Archivo | Propósito |
|---|---|
| `CLAUDE.md` (este archivo) | Orquestador. Punto de entrada para cualquier tarea. |
| `context.md` | Identidad del cliente: paleta, tipografías, logo, voz de marca, datos de contacto, arquitectura del sistema y valor agregado no facturado. Fuente de verdad, ya actualizada con la identidad visual cerrada. |
| `menu.md` | Menú completo transcrito del menú físico real: 17 categorías, todos los platos con precio real en colones, Chileras con precio. Fuente de verdad para el seed de Prisma — reemplaza cualquier lista de categorías anterior, incluida la que aparecía antes en este archivo. |
| `cronograma.md` | Fases, tareas y estado del proyecto. Se actualiza conforme avanza el trabajo. |
| `prototipo.md` | Guía visual definitiva del diseño acordado con el cliente. Aún no se ha formalizado como documento aparte: mientras tanto, `context.md` (identidad) + `prototipo-funcional.html` (prototipo interactivo enviado al cliente) cumplen esa función. Se crea formalmente cuando el prototipo quede aprobado por Marcos y don Ronny. |
| `frontend/CLAUDE.md` | Agente de frontend: componentes, estructura, i18n, dark mode, animaciones. |
| `backend/CLAUDE.md` | Agente de backend: Express, API REST, servicios, validaciones. |
| `database/CLAUDE.md` | Agente de base de datos: schema Prisma, migraciones, seeds, convenciones. |
| `qa/CLAUDE.md` | Agente de QA: pruebas, flujos críticos, errores conocidos. |
| `security/CLAUDE.md` | Agente de seguridad: auth, headers, validación de inputs, secretos. |

---

## Cronograma de alto nivel

Ver `cronograma.md` para el detalle de cada fase y el estado de cada tarea.

**Fase 0 — Setup inicial (semanas 1-2)**
Corrección de sede Arenal en Google Maps y Apple Maps. Unificación de cuentas de Instagram. Auditoría del logo y entrega del kit de marca. Guía de identidad visual. Códigos QR. Actualización de Google My Business.

**Fase 1 — Base de datos y backend (semanas 2-3)**
Schema Prisma con entidades de menú, categorías, platos, Chileras y administrador. Endpoints REST documentados. Autenticación JWT del panel admin.

**Fase 2 — Sitio web público (semanas 2-4)**
Layout base bilingüe con light/dark mode. Hero section con Testimonios y Eventos. Menú interactivo y filtrable con banner por categoría. Sección Chileras. Sección Redes con publicaciones destacadas. Sección de contacto con mapa, horarios y formulario de reservaciones. Footer con códigos QR.

**Fase 3 — Panel de administración (semana 4)**
Login del admin. Gestión de platos y categorías. Vista de métricas básicas. Calendario de publicaciones. Solicitud de cambios de contenido.

**Fase 4 — Integración, QA y deploy (semana 4-5)**
Conexión frontend-backend. Pruebas end to end. Variables de entorno en Railway. Deploy. Pruebas en dispositivo físico y en los dos idiomas.

**Fase 5 — Operación mensual (mes 2 en adelante)**
Publicaciones semanales en Instagram y Facebook. Respuesta a comentarios y mensajes. Google My Business activo. Actualizaciones del sitio. Reporte mensual de métricas.

---

*Proyecto: La Choza de Laurel — Liberia, Guanacaste, Costa Rica*
*Developer: Anthony David Salas Salas — anthonydavidsalassalas@gmail.com — +506 8333-1508*
*Inicio: Julio 2026*

---

## Retomar trabajo pendiente

Al iniciar una sesión de trabajo sin una tarea puntual asignada, seguir este flujo:

1. Leer `context.md` y todos los archivos mencionados en el mismo.
2. Leer `cronograma.md` y retomar las tareas que hayan quedado pendientes en el documento.
3. Conforme se complete cada tarea, actualizar `cronograma.md` reflejando el nuevo estado.
4. Con ayuda de `qa/CLAUDE.md` y `security/CLAUDE.md`, probar cada funcionalidad tocada. Usar Chrome para verificar en el navegador que funciona correctamente.
5. Una vez corroborado que todo funciona bien, hacer commit y push sin coautoría de Claude y con el mensaje de commit en español.