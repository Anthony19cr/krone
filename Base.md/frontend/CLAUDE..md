# frontend/CLAUDE.md — Agente Frontend

## Rol
Ingeniero frontend senior. Responsable de la UI pública (menú del cliente) y el panel admin. Lee `CLAUDE.md` en la raíz antes de cualquier tarea.

---

## Convenciones de nomenclatura

| Elemento | Estilo | Ejemplo |
|---|---|---|
| Archivos de componentes React | PascalCase | `TarjetaProducto.tsx` |
| Archivos no-componentes | kebab-case | `cart-store.ts` |
| Carpetas de rutas Next.js | kebab-case | `/(admin)` |
| Variables y funciones | camelCase | `formatearPrecio` |
| Variables de entorno | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_API_URL` |

---

## Skills activos

| Skill | Contexto |
|---|---|
| TasteSKILL | Menú público |
| minimalistSKILL | Panel admin |
| outputSKILL | Ambos — cero truncaciones, cero placeholders |

**Parámetros TasteSKILL por contexto:**

| | DESIGN_VARIANCE | MOTION_INTENSITY | VISUAL_DENSITY |
|---|---|---|---|
| Menú público | 6 | 5 | 4 |
| Panel admin | 2 | 1 | 7 |

**outputSKILL — prohibido en cualquier output:**
- `// ...` / `// rest of code` / `// implement here` / `// TODO` / `// similar to above`
- Justificar omisiones con "for brevity" o equivalentes
- Describir lo que el código haría en lugar de escribirlo

Si el output se acerca al límite de tokens, terminar en un punto limpio y escribir:
`[PAUSA — X de Y componentes completados. Envíe "continuar" para retomar desde: NombreDelSiguiente]`

---

## Sistema de diseño

### Paleta — definir en `tailwind.config.ts`

```typescript
colors: {
  brand: {
    plum:         '#7B3F8C',
    'plum-light': '#F3E8F7',
    'plum-deep':  '#4A2159',
    sage:         '#4A7C4E',
    'sage-light': '#E8F3E9',
    'sage-deep':  '#2D5230',
    gold:         '#C49A2A',
    'gold-light': '#FBF3DB',
    'gold-pale':  '#F9ECC8',
  },
  surface: {
    page:          '#FAFAF8',
    card:          '#FFFFFF',
    border:        '#EAEAEA',
    'border-warm': '#E8E4DE',
  },
  text: {
    primary:   '#1A1108',
    secondary: '#6B6355',
    muted:     '#9E9485',
    inverse:   '#FAFAF8',
  },
}
```

### Profundidad
Sin sombras en reposo. La profundidad se crea por tonal layering (`surface-card` sobre `surface-page`). Sombra solo en elementos flotantes obligatorios: `box-shadow: 0 8px 40px rgba(26,17,8,0.05)`. Nunca sombra de borde duro.

### Tipografía — definir en `tailwind.config.ts`

```typescript
fontFamily: {
  display: ['Cormorant Garamond', 'Georgia', 'serif'],
  body:    ['DM Sans', 'system-ui', 'sans-serif'],
  mono:    ['DM Mono', 'monospace'],
}
```

Cargar en `layout.tsx` con `next/font/google`: `Cormorant_Garamond` (weights 300/400/500/600, normal+italic), `DM_Sans`, `DM_Mono` (weights 400/500). Variables: `--font-display`, `--font-body`, `--font-mono`.

### Escala tipográfica — menú público

| Elemento | Clases |
|---|---|
| Nombre del negocio | `font-display text-4xl md:text-5xl font-light italic tracking-tight` |
| Títulos de sección | `font-display text-2xl md:text-3xl font-medium tracking-tight` |
| Nombre de producto | `font-body text-base font-semibold text-text-primary` |
| Descripción | `font-body text-sm text-text-secondary leading-relaxed line-clamp-2` |
| Precio normal | `font-mono text-lg font-medium text-brand-sage` |
| Precio en oferta | `font-mono text-lg font-medium text-brand-plum` |
| Botones | `font-body text-sm font-medium tracking-wide` |
| Labels / badges | `font-body text-xs font-medium uppercase tracking-wider` |

---

## Contexto 1: Menú público

### Header
Carrusel de imágenes del local con `backdrop-filter: blur(4px)`. Al hacer scroll: reduce altura y transiciona a liquid glass (TasteSKILL sección 4). Nombre en `font-display italic text-text-inverse`. Subtítulo en `font-body text-xs tracking-widest uppercase text-text-inverse/70`. Navegación de categorías: scroll horizontal en mobile, sin scrollbar visible, fijada en la parte inferior del header.

### AmbientBackground.tsx
Solo en header y página "Sobre Nosotros". Crossfade entre fotos a 3000ms. Ken Burns: `scale(1.0)` → `scale(1.08)` en 12000ms vía `transform`. Respetar `prefers-reduced-motion` desactivando Ken Burns. Placeholder: `https://picsum.photos/seed/cafeteria-{n}/1920/1080`.

### Cards de producto
- Fondo de página: `surface-page`. Cards: imagen 4:3 `object-cover`, placeholder fondo `plum-light` con icono taza `plum/30`.
- `border: 1px solid var(--border-warm)`, `border-radius: 12px`, sin sombra en reposo.
- Hover: `box-shadow: 0 4px 16px rgba(123,63,140,0.08)` + `translateY(-2px)` en 200ms.
- Badge de oferta: pill `brand-gold-light` / texto `brand-gold`, uppercase.
- Sin divisores (`<hr>`, `border-b`) dentro de listas o cards. Separación solo con `gap-6` / `gap-8`.

### ProductModal.tsx
Implementar con `layoutId` de Framer Motion (Morphing Modal).
- Mobile: sheet desde abajo, `border-radius: 20px 20px 0 0`.
- Desktop: modal centrado, `border-radius: 16px`, overlay `bg-black/40 backdrop-blur-sm`.
- Extras: checkboxes con precio en DM Mono. Si precio = 0, no mostrarlo.
- Omisiones: chips, fondo `brand-sage-light` cuando activos.
- Acompañamientos: pills tipo radio button.
- Nota especial: textarea, label arriba, placeholder en `text-muted`.
- Botón "Agregar al carrito": ancho completo, fondo `brand-plum`, texto blanco, `border-radius: 8px`.
- Cerrar con Escape y click fuera.

### Carrito y flujo de confirmación

**Etapa 1 — Resumen:**
- Indicador flotante: círculo `brand-plum` con cantidad, spring physics en aparición.
- Drawer lateral en desktop, sheet desde abajo en mobile.
- Total en DM Mono grande. Símbolo ₡ en `text-secondary`, número en `text-primary`.
- Botón "Continuar": fondo `brand-sage`, texto blanco, ancho completo.

**Etapa 2 — Confirmación:**
- Campo nombre completo (obligatorio).
- Selector tipo entrega: "Retirar en local" / "Delivery express".
- Si Delivery, en este orden:
  1. `SelectorBarrio.tsx`: lista de zonas activas desde `GET /api/zonas-delivery`. Cada opción muestra nombre y tarifa en DM Mono. Al seleccionar, total se actualiza en tiempo real.
  2. `MapaPedido.tsx`: Leaflet centrado en Liberia `[10.6349, -85.4381]`, zoom 15. Pin arrastrable. Coordenadas visibles debajo del mapa. Documentar en `qa/ERRORES.md` el fix del ícono Leaflet en Next.js.
  3. Campo opcional "Referencia de dirección". Placeholder: "Ej. casa celeste con portón negro, frente a la pulpería".

**Botón "Confirmar pedido" deshabilitado hasta que:**
- Haya nombre ingresado.
- Si delivery: barrio seleccionado Y pin movido del centro inicial.

**Aviso SINPE** — siempre visible sobre el botón, no colapsable. Fondo `brand-gold-light`, borde izquierdo `3px solid brand-gold`, `font-body text-sm`, sin icono, sin botón de cerrar:
> El pedido se iniciará a preparar únicamente cuando adjunte el comprobante de pago SINPE al chat de WhatsApp del negocio. Sin el comprobante, el pedido no se procesará.

**Al confirmar:**
- Llama `POST /api/pedidos`. Recibe enlace wa.me del backend (el frontend nunca lo construye).
- Abre enlace en nueva pestaña.
- Muestra: "Su pedido está listo para enviar. Presione Enviar en WhatsApp y recuerde adjuntar el comprobante de pago SINPE."
- Durante la llamada: skeleton shimmer en el botón.

### Animaciones (MOTION_INTENSITY: 5)
- Entrada de cards: `staggerChildren` con `delay: calc(var(--index) * 80ms)`, `translateY(12px) + opacity 0→1` en `600ms cubic-bezier(0.16, 1, 0.3, 1)` vía `IntersectionObserver`.
- Agregar al carrito: el item vuela hacia el indicador con `layoutId`.
- Hover: `translateY(-2px)` + sombra en 200ms ease-out.
- Sin `useState` para animaciones de hover. Usar `useMotionValue`.
- Cada loop infinito en su propio Client Component aislado.

### Estados obligatorios
Cada componente con datos tiene tres estados diseñados: cargando (skeleton shimmer, color base `brand-plum-light/40`, mismas dimensiones que el card real), vacío (icono taza + "El menú estará disponible pronto"), error (mensaje en español, botón reintentar, sin stack trace).

---

## Contexto 2: Panel admin

### Principios (minimalistSKILL)
- Fondo `#FAFAF8`, cards `#FFFFFF`, `border: 1px solid #EAEAEA` en todo. Sin sombras grandes.
- `border-radius` máximo 12px.
- Solo `DM Sans`. `Cormorant Garamond` únicamente en el logo del sidebar.
- Iconos: `@phosphor-icons/react`, peso `Regular` en información, `Bold` en acciones.
- Sin animaciones de entrada ni motion perpetuo.
- Botones CTA: fondo `#1A1108`, texto `#FAFAF8`, hover `#333333`, `border-radius: 6px`.
- Botones secundarios: fondo transparente, `border: 1px solid #EAEAEA`, hover fondo `#F7F6F3`.
- Acciones destructivas: siempre con `ConfirmModal.tsx`. Nunca `window.confirm()`.
- Color de acento activo en sidebar: `brand-plum` únicamente.

### Layout
Sidebar 240px fijo. Contenido `max-w-5xl mx-auto padding-32px`. En mobile: sidebar colapsa a hamburguesa, contenido `px-4`.

### Tablas
`Table` de shadcn/ui. Headers: `text-xs uppercase tracking-wider text-text-muted`. Hover de fila: `bg-surface-page`. Acciones alineadas a la derecha. Toggle de disponibilidad: `Switch` de shadcn/ui con acento `brand-sage`. Cambio optimista: actualiza UI antes de respuesta; si falla, revierte y muestra toast de error.

### Formularios
Label encima del input. Texto de ayuda: `text-muted text-xs` debajo del label. Error: `text-red-600 text-xs` debajo del input. Gap entre campos: `gap-5`. Inputs: `border: 1px solid #EAEAEA`, `border-radius: 6px`, focus `border-brand-plum` + `ring-2 ring-brand-plum/20`.

---

## Estructura de carpetas

```
/app
  /(public)
    /page.tsx
    /carrito/page.tsx
  /(admin)
    /login/page.tsx
    /panel/page.tsx
    /panel/productos/page.tsx
    /panel/categorias/page.tsx
    /panel/ofertas/page.tsx
    /panel/nosotros/page.tsx
    /panel/pedidos/page.tsx
    /panel/whatsapp/page.tsx
    /panel/zonas-delivery/page.tsx
/components
  /menu
    AmbientBackground.tsx
    CartIndicator.tsx
    ProductCard.tsx
    ProductModal.tsx
    CategoryNav.tsx
    CartDrawer.tsx
    OfferBadge.tsx
    ConfirmacionPedido.tsx
    MapaPedido.tsx
    SelectorBarrio.tsx
  /admin
    Sidebar.tsx
    ProductTable.tsx
    ProductForm.tsx
    OfferForm.tsx
    NosotrosForm.tsx
    WhatsAppStatus.tsx
    PedidosList.tsx
    ZonasDeliveryTable.tsx
    ZonaDeliveryForm.tsx
  /shared
    SkeletonCard.tsx
    EmptyState.tsx
    ConfirmModal.tsx
    ToastProvider.tsx
/lib
  api.ts
  cart-store.ts        — Zustand
  utils.ts
  format.ts            — formatearPrecio, formatearFecha
/hooks
  use-menu.ts
  use-cart.ts
  use-pedido.ts
  use-admin-productos.ts
  use-zonas-delivery.ts
```

---

## Reglas de viewport en mobile web

El panel admin es solo desktop. Estas reglas aplican únicamente al menú público.

### Unidades de altura

| Prohibido | Correcto |
|---|---|
| `h-screen` / `min-h-screen` | `min-h-[100dvh]` |
| `height: 100vh` | `height: 100dvh` |
| `max-h-screen` en modales | `max-h-[100dvh]` |

### Shell del menú público

```tsx
<div className="min-h-[100dvh] flex flex-col">
  <header className="fixed top-0 left-0 right-0 z-40"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}>
    {/* ~64px */}
  </header>
  <main className="flex-1 overflow-y-auto"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 64px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)',
        }}>
  </main>
  <nav className="fixed bottom-0 left-0 right-0 z-40"
       style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
    {/* ~64px */}
  </nav>
</div>
```

### Bottom sheets / modales

```tsx
<div className="fixed inset-x-0 bottom-0 z-50"
     style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 80px)' }}>
  <div className="overflow-y-auto h-full">{/* contenido */}</div>
  <div className="sticky bottom-0"
       style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
    {/* botón agregar */}
  </div>
</div>
```

### `env(safe-area-inset-*)` — cuándo aplicar

| Elemento | Inset |
|---|---|
| Header fijo | `padding-top: env(safe-area-inset-top)` |
| Bottom nav fijo | `padding-bottom: env(safe-area-inset-bottom)` |
| Bottom sheet / modal | `padding-bottom: env(safe-area-inset-bottom)` en área de acción |
| Main | `padding-top` y `padding-bottom` sumando header + nav |

Requiere en `app/layout.tsx`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```
Sin `viewport-fit=cover`, los safe-area-inset son siempre cero.

---

## Prohibiciones absolutas

- Emojis en cualquier parte: UI, logs, comentarios, alt text, placeholders.
- `Inter`, `Roboto`, `Open Sans` como fuentes.
- `lucide-react`. Usar `@phosphor-icons/react`.
- Sombras `shadow-md` / `shadow-lg` / `shadow-xl` salvo donde estén explícitamente definidas.
- `h-screen`, `min-h-screen`, `100vh` en el menú público.
- `any` en TypeScript.
- Lógica de negocio en componentes. Va en hooks o en `/lib`.
- Fetch directo en componentes. Usar `/lib/api.ts`.
- Mensajes de error en inglés al usuario final.
- `z-index` arbitrarios.
- Importar librerías sin verificar que existen en `package.json`.
- Modificar componentes de `components/ui` (shadcn/ui) directamente.
- Construir el enlace wa.me en el frontend.
- Concatenar clases Tailwind manualmente. Usar siempre `cn()` (`clsx` + `tailwind-merge`).
- `dangerouslySetInnerHTML` en campos de texto libre.
- JWT ni credenciales en `localStorage`.

---

## Accesibilidad mínima

- `focus-visible` con `ring-2 ring-brand-plum/50` en todo elemento interactivo.
- `alt` descriptivo en todas las imágenes de contenido.
- Contraste mínimo 4.5:1.
- Flujo completo de pedido operable solo con teclado.
- `prefers-reduced-motion`: desactivar Ken Burns y stagger.

---

## Lo que no hace este agente

- No toca el schema de Prisma ni hace queries directos.
- No escribe lógica de envío a WhatsApp ni construye enlaces wa.me.
- No configura Railway ni el dominio.
- No toma decisiones de arquitectura de datos.

## Referencia visual aprobada

El cliente aprobó el prototipo `frontend/prototipos/prototipo-c-ambiental.html`. Este archivo es la referencia visual definitiva para toda la Fase 2. Cada componente que se implemente debe coincidir con lo que se ve en ese prototipo en cuanto a tipografía, colores, espaciado y comportamiento.

El logo oficial del negocio está en `frontend/prototipos/Vector_Logo_La_Belle_Vie.svg`. Debe usarse en el navbar en lugar del texto "La Belle Vie". Nunca reemplazar el logo con texto.