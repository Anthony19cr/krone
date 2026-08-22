# frontend/CLAUDE.md — Agente Frontend · La Choza de Laurel

## Rol

Ingeniero frontend senior. Responsable de la UI pública (sitio de consulta bilingüe) y el panel admin. Lee `CLAUDE.md` en la raíz y `context.md` antes de cualquier tarea — este archivo asume que la identidad visual definida ahí (paleta, tipografía, logo) ya es vinculante.

Este sitio no tiene carrito, no tiene pedidos, no tiene delivery ni WhatsApp en esta fase. Es de consulta: menú, Chileras, contacto con formulario de reservaciones (solo notifica por correo, no persiste como sistema de reservas), y tres piezas de contenido liviano (Eventos, Testimonios, Publicaciones destacadas). Eventos y Testimonios los gestiona el desarrollador directamente vía Prisma Studio, sin pantalla propia en el panel admin. Publicaciones destacadas es la excepción **(2026-07-29)**: sí tiene pantalla propia en `/panel/redes` — ver `CLAUDE.md` raíz.

---

## Convenciones de nomenclatura

| Elemento | Estilo | Ejemplo |
|---|---|---|
| Archivos de componentes React | PascalCase | `TarjetaPlato.tsx` |
| Archivos no-componentes | kebab-case | `format-precio.ts` |
| Carpetas de rutas Next.js | kebab-case | `/(admin)` |
| Variables y funciones | camelCase | `formatearPrecio` |
| Variables de entorno | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_API_URL` |

---

## Sistema de diseño

### Paleta — definir en `tailwind.config.ts`

Extraída del logo real (`#665317`) y de la dirección aprobada por el cliente: elegante-tradicional con tonos crema, camello, tierra y café, acentos en oliva/dorado/verde y un celeste grisáceo como respiro frío. Fuente de verdad completa en `context.md` — este bloque es su traducción a Tailwind.

```typescript
colors: {
  crema: {
    page:   '#F3ECDD',
    card:   '#FFFBF2',
    border: '#E4D9C4',
  },
  cafe: {
    page:   '#3A2C1F',
    card:   '#4A3A28',
    border: '#5C4934',
  },
  texto: {
    primary:      '#2E2013',
    secondary:    '#6B5B45',
    'primary-d':  '#F3ECD9',
    'secondary-d':'#C9BBA0',
  },
  oliva:   { DEFAULT: '#665317', d: '#C2A44B' },
  dorado:  { DEFAULT: '#C79A3A', d: '#D4AF52' },
  tierra:  { DEFAULT: '#9C5F32', d: '#C17D45' },
  verde:   { DEFAULT: '#4C6B3F', d: '#6E9459' },
  celeste: { DEFAULT: '#7F97A0', d: '#9FB4BC' },
}
```

Los sufijos `-d` son los valores ya calibrados para modo oscuro (más claros/saturados que su contraparte de modo claro para mantener contraste sobre `cafe.page`). Usar con la clase `dark:` de Tailwind, nunca recalcular el tono en runtime.

### Profundidad

Sin sombras en reposo. La profundidad se construye por tonal layering: `crema.card` es visiblemente más claro que `crema.page` en modo claro; `cafe.card` es más claro que `cafe.page` en modo oscuro (nunca casi-negro). Sombra solo en elementos flotantes obligatorios: el FAB de reservar y el overlay del drawer de navegación. `box-shadow: 0 8px 32px rgba(46,32,19,0.12)` en modo claro, `0 8px 32px rgba(0,0,0,0.35)` en modo oscuro.

### Tipografía — definir en `tailwind.config.ts`

```typescript
fontFamily: {
  display: ['Fraunces', 'serif'],
  body:    ['Karla', 'sans-serif'],
  mono:    ['IBM Plex Mono', 'monospace'],
}
```

Cargar en `layout.tsx` con `next/font/google`: `Fraunces` (peso 600, eje óptico `opsz` completo), `Karla` (pesos 400/500/600), `IBM_Plex_Mono` (peso 500). Variables: `--font-display`, `--font-body`, `--font-mono`.

**Símbolo `₡` — verificar en runtime.** El subset "latin" que sirve Google Fonts por defecto para IBM Plex Mono no necesariamente incluye el signo de colón (`U+20A1`). Definir el `font-family` de precios con fallback explícito: `'IBM Plex Mono', ui-monospace, monospace` para que el sistema operativo cubra el glifo si la fuente web no lo trae. Confirmar visualmente en Chrome/Safari/Firefox de escritorio y en iOS/Android reales antes de dar por cerrado el QA de esta pieza (documentar el resultado en `qa/ERRORES.md` si aparece el símbolo de "glifo faltante").

### Escala tipográfica

| Elemento | Clases |
|---|---|
| Nombre del negocio | `font-display font-semibold text-4xl md:text-5xl tracking-tight` |
| Títulos de sección | `font-display font-semibold text-2xl md:text-3xl tracking-tight` |
| Nombre de plato | `font-display font-semibold text-base text-texto-primary dark:text-texto-primary-d` |
| Descripción | `font-body text-sm text-texto-secondary dark:text-texto-secondary-d leading-relaxed` |
| Precio | `font-mono font-medium text-lg text-verde dark:text-verde-d` |
| Eyebrow / etiquetas | `font-body text-xs font-semibold uppercase tracking-[0.15em] text-celeste dark:text-celeste-d` |
| Botones | `font-body text-sm font-medium` |

**Iconos**: `@phosphor-icons/react`, peso `Regular` para información, `Bold` para acciones. (Asunción: es lo que traía la plantilla previa y encaja con el tono editorial-minimalista; avisar si se prefiere otra librería.)

---

## Navegación — persistente en todo el sitio público

Tres piezas fijas, ninguna compite por espacio con las otras:

### Barra superior (`NavbarPublico.tsx`)

Siempre visible, máximo 4 elementos: logo/nombre a la izquierda; a la derecha, selector de idioma (`ES`/`EN`, pill compacta), toggle de modo oscuro/claro (ícono luna/sol), y botón hamburguesa. En desktop, donde sobra espacio horizontal, los links de sección (Inicio, Menú, Chileras, Redes, Contacto) se muestran inline y el hamburguesa desaparece.

```tsx
<header className="fixed top-0 left-0 right-0 z-40 bg-crema-page/90 dark:bg-cafe-page/90 backdrop-blur border-b border-crema-border dark:border-cafe-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
  {/* ~56px de alto */}
</header>
```

### Drawer de navegación (`MenuHamburguesa.tsx`)

Solo en mobile. Contiene únicamente los links de sección: Inicio, Menú, Chileras, Redes, Contacto. Nunca duplica idioma/modo (ya están en la barra superior). Entra desde la derecha o como sheet superior, overlay `bg-black/40 dark:bg-black/60 backdrop-blur-sm`, cierra con Escape y click fuera.

### FAB de reservar (`FabReservar.tsx`)

Botón flotante circular o pill, anclado abajo a la derecha — nunca una barra horizontal completa. Lleva a la sección de contacto/reservaciones o abre un modal corto con el formulario.

```tsx
<button
  className="fixed z-30 bg-oliva dark:bg-oliva-d text-crema-page dark:text-cafe-page rounded-full px-5 py-3 flex items-center gap-2 font-body text-sm font-medium"
  style={{
    bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
    right: 'calc(env(safe-area-inset-right) + 16px)',
    boxShadow: '0 8px 32px rgba(46,32,19,0.18)',
  }}
>
  Reservar
</button>
```

`<main>` necesita `padding-bottom` adicional (~90px) para que el último bloque de cada página no quede tapado por el FAB. El FAB nunca se solapa con el drawer abierto: su `z-index` es menor al del overlay del drawer.

---

## Contexto 1: Sitio público

### Inicio

- **Hero**: carrusel de fotos reales del local (`CarruselHero.tsx`), crossfade 3000ms, sin Ken Burns forzado si `prefers-reduced-motion` está activo.
- **Nuestra historia** (`SeccionHistoria.tsx`): justo después del hero. Consume `GET /api/historia` (máximo 5 filas fijas, gestionadas desde `/panel/historia`, ver "Contexto 2"). Layout intercalado fila por fila: fila impar (índice par, 0-based) con texto a la izquierda y foto a la derecha en desktop; fila siguiente invertida (`md:order-1`/`md:order-2`), en mobile ambas colapsan a una sola columna (texto arriba, foto abajo). Cada fila sin `imagenUrl` usa el mismo fallback visual que `BannerCategoria.tsx` (bloque `oliva/20`, etiqueta "Foto próximamente"/"Photo coming soon"). Si no hay ninguna fila activa, la sección entera no se renderiza — mismo criterio que Testimonios/Eventos.
- **Ubicación**: teaser corto (dirección + mapa embebido pequeño) con link a la sección de contacto completa.
- **Testimonios** (`SeccionTestimonios.tsx`): consume `GET /api/testimonios` (activos). Si el arreglo viene vacío, la sección no se renderiza — no hay estado vacío visible en el sitio público.
- **Eventos** (`SeccionEventos.tsx`): consume `GET /api/eventos-vigentes` (activos y no vencidos por fecha). Mismo comportamiento: arreglo vacío = sección ausente, no un mensaje de "no hay eventos".

### Menú (`/menu`)

**Decisión de producto: una sola foto por categoría, ninguna foto por plato.** El menú real tiene 17 categorías (ver `menu.md`) — no seis o siete. El filtro de categorías en scroll horizontal ya soportaba esto sin rediseño.

- Filtro por categoría sin recarga de página, scroll horizontal de categorías en mobile.
- `BannerCategoria.tsx`: banner de ancho completo (`aspect-[3/1]` aprox.), `object-cover`, con degradado `bg-gradient-to-t from-black/60 to-transparent` y el nombre de la categoría superpuesto en `font-display font-semibold text-crema-page` sobre la esquina inferior izquierda. Si la categoría no tiene `imagenUrl` todavía, fondo sólido `oliva/20` con el nombre centrado (sin ícono de plato — ya no aplica, no hay fotos de plato en esta pantalla).
- `FilaPlato.tsx`: fila de lista, no card. `flex justify-between items-start`, `border-b border-crema-border dark:border-cafe-border` (excepto la última fila de la categoría), `py-3`. Nombre en `font-display font-semibold text-base`, descripción completa debajo en `font-body text-sm text-texto-secondary`, precio alineado a la derecha en `font-mono text-verde dark:text-verde-d`, sin truncar — al no haber imagen que compita por espacio, la descripción completa siempre cabe.
- **Sin modal de detalle.** Como la fila ya muestra el nombre y la descripción completa (no hay `line-clamp` que ocultar), no hace falta un modal para "ver más". Esto elimina `DetallePlato.tsx` de la plantilla anterior — menos JavaScript, menos superficie de mantenimiento. Si en el futuro una descripción resulta demasiado larga para una fila, resolver con un toggle de texto simple (`line-clamp-2` + botón "ver más" que expande in-place), no con un modal nuevo.

### Chileras (`/chileras`)

Grid de las tres variedades, mismo estilo de tarjeta que el menú. Llamado a la acción fijo: "Disponible en el local" / "Available in-store" — nunca un botón de compra.

### Redes (`/redes`)

`GridRedes.tsx`: consume `GET /api/publicaciones-destacadas` (curadas manualmente por el desarrollador, sin integración en vivo con Meta). Cada tarjeta enlaza a la publicación original en Instagram/Facebook. Sección aparte con links directos a los perfiles oficiales (Instagram, Facebook, TripAdvisor, Google) con su badge de calificación si aplica.

### Contacto (`/contacto`)

Mapa, horarios, y `FormularioReservacion.tsx`: nombre, email, teléfono (opcional), mensaje, fecha deseada (opcional), número de personas (opcional). Al enviar: `POST /api/contacto`. Estados de envío: enviando (skeleton en el botón), éxito ("Tu solicitud fue enviada, te contactaremos pronto." / "Your request was sent, we'll contact you soon."), error (mensaje en el idioma activo, botón reintentar). Ningún dato se muestra como "reserva confirmada" — el formulario solo dispara la notificación por correo.

### Estados obligatorios

Todo componente con datos remotos maneja tres estados: cargando (skeleton shimmer, mismas dimensiones que el contenido real, color base `crema-card/60` o `cafe-card/60`), vacío (solo donde aplica — el menú y Chileras sí muestran "El menú estará disponible pronto" / "El menú estará disponible pronto" si no hay platos activos; Testimonios y Eventos, como se indicó arriba, simplemente no se renderizan), error (mensaje en el idioma activo, botón reintentar, sin stack trace).

### Animaciones

- Entrada de tarjetas: `stagger` con `translateY(12px) + opacity 0→1` en 500ms, vía `IntersectionObserver`.
- Hover de tarjeta: `translateY(-2px)` + sombra sutil en 200ms ease-out, solo en dispositivos con puntero fino (`@media (hover: hover)`).
- `prefers-reduced-motion`: desactiva Ken Burns del hero y el stagger de entrada.
- Transición de modo claro/oscuro: `transition: background-color 300ms ease, color 300ms ease` a nivel de `body`.

---

## Contexto 2: Panel admin

Alcance: login, platos, categorías, chileras, historia (sección "Nuestra historia" de Inicio), publicaciones destacadas de Redes, calendario editorial, métricas. Eventos y Testimonios quedan fuera — se administran vía Prisma Studio, no tienen ruta en `/panel`.

### Principios

- Fondo `crema-page` / `cafe-page`, cards `crema-card` / `cafe-card`, `border: 1px solid crema-border` / `cafe-border`. Sin sombras grandes.
- `border-radius` máximo 12px.
- Solo `Karla` para todo el texto de UI. `Fraunces` únicamente en el nombre del negocio en el sidebar.
- Sin animaciones de entrada ni motion perpetuo — el panel es utilitario, no editorial.
- Botones CTA: fondo `texto-primary` (`texto-primary-d` en oscuro), texto `crema-page`, hover ligeramente más claro, `border-radius: 6px`.
- Botones secundarios: fondo transparente, `border: 1px solid crema-border`/`cafe-border`, hover fondo `crema-page`/`cafe-page` con opacidad.
- Acciones destructivas (desactivar plato/categoría): siempre con `ConfirmModal.tsx`. Nunca `window.confirm()`.
- Color de acento activo en sidebar/tabs: `oliva` únicamente.

### Layout

Sidebar 240px fijo en desktop. En mobile (el panel **sí** debe ser operable desde celular — don Ronny y Marcos gestionan contenido desde el teléfono), la sidebar colapsa a hamburguesa igual que el sitio público, con las mismas reglas de `dvh`/`safe-area` de la sección siguiente.

### Tablas

`Table` de shadcn/ui. Headers `text-xs uppercase tracking-wider text-texto-secondary`. Toggle de estado (activo/inactivo): `Switch` de shadcn/ui con acento `verde`. Cambio optimista: actualiza UI antes de la respuesta del servidor; si falla, revierte y muestra un toast de error.

### Formularios

Label encima del input. Texto de ayuda `text-texto-secondary text-xs` debajo del label. Error `text-red-600 text-xs` debajo del input. Gap entre campos `gap-5`. Inputs: `border: 1px solid crema-border`, `border-radius: 6px`, focus `border-oliva` + `ring-2 ring-oliva/20`.

**`PlatoForm.tsx` no tiene campo de imagen** — nombre ES/EN, descripción ES/EN, precio y categoría únicamente. **`CategoriaForm.tsx`, `ChileraForm.tsx` y `HistoriaForm.tsx` sí tienen subida de imagen real** (una sola foto por recurso, no una galería), vía el componente compartido `shared/CampoImagen.tsx`: selector de archivo (`accept="image/jpeg,image/png,image/webp"`), sube a `POST /api/admin/upload` apenas se elige el archivo (no espera al submit del formulario), muestra preview de la imagen actual y estado de "Subiendo...". El backend convierte automáticamente a WebP — ver `security/CLAUDE.md` para las reglas de validación de esa subida y `backend/CLAUDE.md` para el detalle del endpoint.

---

## Estructura de carpetas

```
/app
  /[locale]
    /(public)
      page.tsx                — Inicio
      /menu/page.tsx
      /chileras/page.tsx
      /redes/page.tsx
      /contacto/page.tsx
  /(admin)
    /login/page.tsx
    /panel/page.tsx
    /panel/platos/page.tsx
    /panel/categorias/page.tsx
    /panel/chileras/page.tsx
    /panel/historia/page.tsx
    /panel/redes/page.tsx      (Publicaciones destacadas — excepción, ver CLAUDE.md raíz)
    /panel/calendario/page.tsx
    /panel/metricas/page.tsx
/components
  /publico
    NavbarPublico.tsx
    MenuHamburguesa.tsx
    FabReservar.tsx
    CarruselHero.tsx
    SeccionHistoria.tsx
    SeccionTestimonios.tsx
    SeccionEventos.tsx
    BannerCategoria.tsx
    FilaPlato.tsx
    GridRedes.tsx
    FormularioReservacion.tsx
    SelectorIdioma.tsx
    ToggleModo.tsx
  /admin
    Sidebar.tsx
    PlatoTable.tsx
    PlatoForm.tsx
    CategoriaTable.tsx
    CategoriaForm.tsx
    ChileraTable.tsx
    ChileraForm.tsx
    HistoriaTable.tsx
    HistoriaForm.tsx
    PublicacionDestacadaTable.tsx  (Publicaciones destacadas de /redes)
    PublicacionDestacadaForm.tsx
    CalendarioPublicaciones.tsx
    PublicacionForm.tsx
    MetricasView.tsx
  /shared
    SkeletonCard.tsx
    EmptyState.tsx
    ConfirmModal.tsx
    ToastProvider.tsx
    CampoImagen.tsx        (selector de archivo + subida a /api/admin/upload, usado en Categoria/Chilera/Historia)
/lib
  api.ts
  utils.ts
  format.ts              — formatearPrecio (con fallback de fuente para ₡), formatearFecha
/hooks
  use-menu.ts
  use-chileras.ts
  use-testimonios.ts
  use-eventos.ts
  use-publicaciones-destacadas.ts
  use-admin-platos.ts
  use-admin-categorias.ts
  use-admin-chileras.ts
  use-admin-historia.ts
  use-admin-publicaciones-destacadas.ts
  use-admin-calendario.ts
  use-admin-metricas.ts
```

---

## Reglas de viewport en mobile

Aplican a todo el sitio: público y panel admin (ambos deben funcionar bien en celular).

### Unidades de altura

| Prohibido | Correcto |
|---|---|
| `h-screen` / `min-h-screen` | `min-h-[100dvh]` |
| `height: 100vh` | `height: 100dvh` |
| `max-h-screen` en modales | `max-h-[100dvh]` |

### Shell del sitio público

```tsx
<div className="min-h-[100dvh] flex flex-col">
  <header className="fixed top-0 left-0 right-0 z-40"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}>
    {/* ~56px */}
  </header>
  <main className="flex-1 overflow-y-auto"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 56px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 90px)',
        }}>
    {/* el padding-bottom deja espacio para el FAB de reservar */}
  </main>
</div>
```

### Bottom sheets / modales (drawer de navegación, `DetallePlato.tsx`)

```tsx
<div className="fixed inset-x-0 bottom-0 z-50"
     style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 80px)' }}>
  <div className="overflow-y-auto h-full">{/* contenido */}</div>
  <div className="sticky bottom-0"
       style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
    {/* botón de cierre o acción principal */}
  </div>
</div>
```

### `env(safe-area-inset-*)` — cuándo aplicar

| Elemento | Inset |
|---|---|
| Header fijo | `padding-top: env(safe-area-inset-top)` |
| FAB de reservar | `bottom` y `right` suman `env(safe-area-inset-bottom)` / `env(safe-area-inset-right)` |
| Bottom sheet / modal | `padding-bottom: env(safe-area-inset-bottom)` en el área de acción |
| Main | `padding-top` (header) y `padding-bottom` (espacio para el FAB) |

Requiere en `app/layout.tsx`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```
Sin `viewport-fit=cover`, los `safe-area-inset` son siempre cero.

---

## Tests

`vitest`, entorno `node` (sin `jsdom` — no hay tests de componentes React todavía). `npm test` corre la suite, `npm run test:watch` para modo watch.

**Alcance actual, deliberadamente acotado:** solo lógica pura en `lib/` (`format.ts`, `utils.ts`, `api.ts` con `fetch` mockeado). No hay tests de componentes ni E2E con Playwright — la verificación de UI (render, navegación, claro/oscuro, responsive) ya se hace en el navegador real con Claude in Chrome como parte del flujo de trabajo (ver "Notas de metodología" en `cronograma.md`), así que un E2E automatizado duplicaría ese trabajo sin agregar cobertura nueva por ahora. Si el panel admin (Fase 3) llega a tener flujos complejos de formulario que valga la pena proteger contra regresiones, ahí sí se justifica evaluar Playwright o Testing Library — no antes.

**Cobertura actual (`frontend/tests/`):**
- `format.test.ts` — `formatearPrecio` (incluye el separador de miles real de `Intl` para `es-CR`, que es un espacio de no separación U+00A0, no una coma) y `formatearFecha` (incluye un test que documenta un riesgo real de zona horaria: una fecha guardada a medianoche UTC puede mostrarse un día antes en husos horarios negativos como Costa Rica — afecta a `SeccionEventos.tsx`, no corregido todavía porque requiere decidir la semántica correcta de `fechaInicio`/`fechaFin` antes de tocar el código).
- `utils.test.ts` — `cn()`.
- `api.test.ts` — `apiFetch` (éxito, error con mensaje del backend, error sin body parseable, payload de `POST` correcto) con `fetch` mockeado vía `vi.stubGlobal`.

---

## Prohibiciones absolutas

- Emojis en cualquier parte: UI, logs, comentarios, alt text, placeholders.
- Fuentes fuera de las tres definidas (`Fraunces`, `Karla`, `IBM Plex Mono`) para texto de marca.
- Sombras `shadow-md` / `shadow-lg` / `shadow-xl` salvo en el FAB y el overlay del drawer, ya definidos explícitamente.
- `h-screen`, `min-h-screen`, `100vh` en cualquier parte del sitio.
- `any` en TypeScript.
- Lógica de negocio en componentes. Va en hooks o en `/lib`.
- Fetch directo en componentes. Usar `/lib/api.ts`.
- Mensajes de error en el idioma incorrecto (deben coincidir con el idioma activo del usuario).
- `z-index` arbitrarios — usar una escala documentada (header 40, FAB 30, drawer/overlay 50).
- Modificar componentes de `components/ui` (shadcn/ui) directamente.
- Concatenar clases Tailwind manualmente. Usar siempre `cn()` (`clsx` + `tailwind-merge`).
- `dangerouslySetInnerHTML` en campos de texto libre.
- JWT ni credenciales en `localStorage` — el token del admin vive en cookie `httpOnly`.
- Usar `—` (el guion largo) en la interfaz.
- Cualquier botón, componente o flujo de carrito, pedidos, delivery o WhatsApp — no existen en el alcance de este proyecto.

---

## Accesibilidad mínima

- `focus-visible` con `ring-2 ring-oliva/50` en todo elemento interactivo.
- `alt` descriptivo en todas las imágenes de contenido, en el idioma activo.
- Contraste mínimo 4.5:1 — verificar especialmente los textos sobre `oliva` y `dorado` (usar `crema-page` o `texto-primary` según el fondo, nunca blanco puro ni negro puro).
- El FAB de reservar y el formulario de contacto son operables solo con teclado.
- `prefers-reduced-motion`: desactiva Ken Burns del hero y el stagger de entrada de tarjetas.

---

## Lo que no hace este agente

- No toca el schema de Prisma ni hace queries directos.
- No construye pantallas de admin para Eventos ni Testimonios — esas viven en Prisma Studio. Publicaciones destacadas sí tiene pantalla propia (`/panel/redes`, ver excepción documentada en `CLAUDE.md` raíz).
- No configura Railway ni el dominio.
- No toma decisiones de arquitectura de datos.

---

## Referencia visual

Paleta y tipografía ya están cerradas con el cliente (ver `context.md`, sección Identidad visual, para los valores completos y el uso del logo en sus tres variantes — color, negro, blanco). El prototipo estructural completo (layout de cada sección, no solo tokens) se guardará en `frontend/prototipo` una vez construido — hasta que exista, ningún componente de layout es definitivo, aunque los tokens de color y tipografía de esta sección sí lo son.

El logo oficial (`La_choza_de_Laurel_logo_color.svg` y sus variantes negro/blanco) va en el navbar y el footer. Nunca reemplazar el logo con texto plano salvo como placeholder temporal antes de integrarlo.
