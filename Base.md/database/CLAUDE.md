# database/CLAUDE.md — Agente Base de Datos · La Choza de Laurel

## Rol
Ingeniero de base de datos senior. Responsable del schema, las migraciones, las relaciones y la integridad de los datos. Cualquier cambio al schema pasa por este agente primero.

Lee `CLAUDE.md` en la raíz y `menu.md` antes de empezar cualquier tarea — `menu.md` es la fuente de verdad de las categorías y platos reales del seed.

Este sistema es deliberadamente simple en su primera fase: sin pedidos, sin pagos, sin zonas de delivery, sin historial transaccional. La base de datos sostiene un sitio de consulta con panel de administración. La arquitectura debe estar preparada para crecer sin romper lo construido.

---

## Principios del schema

- `id` de tipo `Int` autoincremental (`@default(autoincrement())`) en todas las tablas. UUID se reserva para cuando haya múltiples servicios o datos expuestos públicamente en URLs. En este sistema, los IDs no se exponen en rutas públicas.
- Todas las tablas tienen `creadoEn` y `actualizadoEn` con valores por defecto.
- Soft delete con `eliminadoEn DateTime?`. Registro con `eliminadoEn` no nulo = eliminado lógicamente. Todas las queries filtran `where: { eliminadoEn: null }` por defecto.
- Precios en colones enteros, sin decimales. `7000` representa `₡7,000`.
- Campos de texto libre con longitud máxima definida (`@db.VarChar(n)`).
- Tablas y columnas en `snake_case` en PostgreSQL, mapeadas a `camelCase` en el código con `@map` / `@@map`. Nunca `camelCase` directo en SQL.
- Los campos bilingües se almacenan como pares de columnas: `nombreEs` / `nombreEn`, `descripEs` / `descripEn`. No hay tabla de traducciones separada: el volumen no lo justifica.
- Los tipos generados por `@prisma/client` son la fuente de verdad de tipos en TypeScript. No duplicar con interfaces manuales.
- **La imagen va en `Categoria`, no en `Plato`.** Decisión de producto: una sola foto por categoría, no una por cada plato. `Plato` no tiene ni tendrá campo de imagen en esta fase.

---

## Schema completo

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── MENU ────────────────────────────────────────────────────────────────────

model Categoria {
  id          Int       @id @default(autoincrement())
  slug        String    @unique @db.VarChar(60)
  nombreEs    String    @db.VarChar(100) @map("nombre_es")
  nombreEn    String    @db.VarChar(100) @map("nombre_en")
  imagenUrl   String?   @db.VarChar(500) @map("imagen_url")
  orden       Int       @default(0)
  activa      Boolean   @default(true)
  eliminadoEn DateTime? @map("eliminado_en")
  creadoEn    DateTime  @default(now()) @map("creado_en")
  actualizadoEn DateTime @updatedAt @map("actualizado_en")
  platos      Plato[]

  @@map("categorias")
}

model Plato {
  id          Int       @id @default(autoincrement())
  nombreEs    String    @db.VarChar(150) @map("nombre_es")
  nombreEn    String    @db.VarChar(150) @map("nombre_en")
  descripEs   String?   @db.VarChar(500) @map("descrip_es")
  descripEn   String?   @db.VarChar(500) @map("descrip_en")
  precio      Int
  activo      Boolean   @default(true)
  orden       Int       @default(0)
  eliminadoEn DateTime? @map("eliminado_en")
  categoriaId Int       @map("categoria_id")
  categoria   Categoria @relation(fields: [categoriaId], references: [id])
  creadoEn    DateTime  @default(now()) @map("creado_en")
  actualizadoEn DateTime @updatedAt @map("actualizado_en")

  @@map("platos")
}

// ─── CHILERAS ─────────────────────────────────────────────────────────────────

model Chilera {
  id          Int       @id @default(autoincrement())
  nombreEs    String    @db.VarChar(150) @map("nombre_es")
  nombreEn    String    @db.VarChar(150) @map("nombre_en")
  descripEs   String?   @db.VarChar(500) @map("descrip_es")
  descripEn   String?   @db.VarChar(500) @map("descrip_en")
  precio      Int       // según menu.md, las chileras sí tienen precio de venta en el local
  imagenUrl   String?   @db.VarChar(500) @map("imagen_url")
  activa      Boolean   @default(true)
  orden       Int       @default(0)
  eliminadoEn DateTime? @map("eliminado_en")
  creadoEn    DateTime  @default(now()) @map("creado_en")
  actualizadoEn DateTime @updatedAt @map("actualizado_en")

  @@map("chileras")
}

// ─── HISTORIA (seccion "Nuestra historia" en Inicio, editable desde el panel) ─

model HistoriaFila {
  id            Int      @id @default(autoincrement())
  orden         Int      @unique
  textoEs       String   @db.VarChar(800) @map("texto_es")
  textoEn       String   @db.VarChar(800) @map("texto_en")
  imagenUrl     String?  @db.VarChar(500) @map("imagen_url")
  activa        Boolean  @default(true)
  creadoEn      DateTime @default(now()) @map("creado_en")
  actualizadoEn DateTime @updatedAt @map("actualizado_en")

  @@map("historia_filas")
}

// ─── CONTENIDO LIVIANO (gestionado vía Prisma Studio, sin pantalla de admin) ──

model Evento {
  id          Int       @id @default(autoincrement())
  tituloEs    String    @db.VarChar(150) @map("titulo_es")
  tituloEn    String    @db.VarChar(150) @map("titulo_en")
  descripEs   String?   @db.VarChar(500) @map("descrip_es")
  descripEn   String?   @db.VarChar(500) @map("descrip_en")
  fechaInicio DateTime  @map("fecha_inicio")
  fechaFin    DateTime? @map("fecha_fin")
  activo      Boolean   @default(true)
  eliminadoEn DateTime? @map("eliminado_en")
  creadoEn    DateTime  @default(now()) @map("creado_en")
  actualizadoEn DateTime @updatedAt @map("actualizado_en")

  @@map("eventos")
}

model Testimonio {
  id          Int       @id @default(autoincrement())
  autor       String    @db.VarChar(150)
  texto       String    @db.VarChar(500)
  calificacion Int      @map("calificacion") // 1-5
  fuente      FuenteTestimonio
  activo      Boolean   @default(true)
  eliminadoEn DateTime? @map("eliminado_en")
  creadoEn    DateTime  @default(now()) @map("creado_en")
  actualizadoEn DateTime @updatedAt @map("actualizado_en")

  @@map("testimonios")
}

enum FuenteTestimonio {
  GOOGLE
  TRIPADVISOR
}

model PublicacionDestacada {
  id          Int       @id @default(autoincrement())
  url         String    @db.VarChar(500)
  imagenUrl   String    @db.VarChar(500) @map("imagen_url")
  plataforma  PlataformaPublicacion
  activo      Boolean   @default(true)
  orden       Int       @default(0)
  eliminadoEn DateTime? @map("eliminado_en")
  creadoEn    DateTime  @default(now()) @map("creado_en")
  actualizadoEn DateTime @updatedAt @map("actualizado_en")

  @@map("publicaciones_destacadas")
}

// ─── PANEL ADMIN ──────────────────────────────────────────────────────────────

model Publicacion {
  id          Int                 @id @default(autoincrement())
  fecha       DateTime
  plataforma  PlataformaPublicacion
  descripcion String              @db.VarChar(500)
  estado      EstadoPublicacion   @default(PROGRAMADA)
  notas       String?             @db.VarChar(500)
  creadoEn    DateTime            @default(now()) @map("creado_en")
  actualizadoEn DateTime          @updatedAt @map("actualizado_en")

  @@map("publicaciones")
}

enum PlataformaPublicacion {
  INSTAGRAM
  FACEBOOK
  AMBAS
}

enum EstadoPublicacion {
  PROGRAMADA
  PUBLICADA
}

model Metrica {
  id              Int      @id @default(autoincrement())
  mes             Int      // 1–12
  anio            Int      @map("anio")
  visitasSitio    Int?     @default(0) @map("visitas_sitio")
  seguidoresIg    Int?     @default(0) @map("seguidores_ig")
  alcanceTotal    Int?     @default(0) @map("alcance_total")
  publicaciones   Int?     @default(0)
  ratingGoogle    Float?   @map("rating_google")
  posicionTrip    Int?     @map("posicion_trip")      // posicion en TripAdvisor Liberia
  notas           String?  @db.VarChar(500)
  creadoEn        DateTime @default(now()) @map("creado_en")
  actualizadoEn   DateTime @updatedAt @map("actualizado_en")

  @@unique([mes, anio])
  @@map("metricas")
}
```

---

## Decisiones de diseño

**Imagen a nivel de categoría, no de plato** — decisión de producto explícita: el sitio muestra una sola foto representativa por categoría (banner con degradado y nombre superpuesto), y los platos se listan debajo en formato de lista editorial (nombre, descripción, precio) sin foto individual. Esto reduce el trabajo de contenido para Anthony (una foto por categoría en vez de una por cada uno de los ~60+ platos reales) y evita que el panel admin necesite subida de imagen en el formulario de plato.

**Campos bilingues como pares de columnas** — `nombreEs` / `nombreEn` y `descripEs` / `descripEn` en cada tabla que tiene texto visible en el sitio. El servicio devuelve ambos campos; el frontend elige cuál mostrar según el idioma activo. No hay tabla de traducciones separada porque el catálogo es pequeño y estático.

**`slug` en Categoria** — identificador legible en URL para el filtro del menú (`/es/menu?cat=carnes`). Se define al crear la categoría y no cambia. El menú real tiene 17 categorías (ver `menu.md` para el listado completo con sus slugs sugeridos: `entradas`, `carnes`, `cortes-especiales`, `especiales`, `pastas`, `mariscos`, `pollo`, `nachos`, `comidas-rapidas`, `tacos`, `vegetarianos`, `sopas`, `muy-tipicos`, `gallos`, `nuggets`, `postres`, `bebidas`) — no las 7 originalmente estimadas antes de tener el menú físico.

**Soft delete con `eliminadoEn`** — aplica a Categoria, Plato, Chilera, Evento, Testimonio y PublicacionDestacada. Un registro con `eliminadoEn != null` no existe para el sistema público ni para el panel. Los registros no se eliminan físicamente. Las tablas Publicacion y Metrica no tienen soft delete: son registros operativos sin historial crítico.

**`orden` en Categoria y Plato** — controla el orden de aparición en el menú. El administrador puede reordenar desde el panel. El seed los inicializa en secuencias de 10 (`10, 20, 30...`) para dejar espacio sin renumerar todo.

**Las Chileras no se crean desde el panel** — las tres variedades se cargan en el seed y solo se gestionan por estado (`activa`) y contenido (nombre, descripción, precio, imagen). En esta fase no hay opción de agregar una cuarta.

**`HistoriaFila` — sin `eliminadoEn`, a propósito.** Son 5 filas fijas (`orden` 1-5, `@unique`) cargadas una sola vez en el seed para la sección "Nuestra historia" de Inicio; el panel (`/panel/historia`) solo edita texto/imagen y activa/desactiva, igual que Chileras — nunca crea ni elimina filas, así que el soft delete no aplica aquí. Una fila inactiva simplemente no aparece en `GET /api/historia`.

**Evento, Testimonio y PublicacionDestacada no tienen pantalla en el panel admin** — Anthony las gestiona directamente vía Prisma Studio (`npx prisma studio`). Son "valor agregado no facturado" (ver `context.md`) y se mantienen livianas a propósito: sin integración en vivo con APIs externas, sin costo operativo variable. El backend solo expone endpoints públicos de lectura para las tres.

**`Evento` con `fechaInicio`/`fechaFin`** — el servicio público filtra por `activo: true` y por fecha vigente (`fechaInicio` ya pasó o es hoy, y `fechaFin` no ha pasado, o es nulo). Si el resultado es un arreglo vacío, el frontend no renderiza la sección — no es un estado vacío visible.

**Metrica con restricción unique `[mes, anio]`** — garantiza un solo registro por mes. El servicio usa `upsert` al actualizar métricas: si existe el registro del mes, lo actualiza; si no, lo crea.

**Publicacion sin relación a platos o categorías** — las publicaciones del calendario editorial son registros editoriales simples. El desarrollador las completa manualmente desde el panel. No hay lógica automática que genere publicaciones a partir del menú.

**Sin modelo de administrador en DB** — las credenciales del único administrador viven en variables de entorno (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`). No hay tabla `Admin` porque una sola cuenta sin registro público no justifica una tabla. Si en el futuro se necesitan múltiples administradores, se agrega la tabla entonces.

---

## Migraciones

Nombres descriptivos en español, en infinitivo:

```bash
npx prisma migrate dev --name crear-schema-inicial
npx prisma migrate dev --name mover-imagen-de-plato-a-categoria
npx prisma migrate dev --name agregar-precio-a-chilera
npx prisma migrate dev --name agregar-tablas-eventos-testimonios-publicaciones-destacadas
```

Nunca editar una migración ya aplicada en producción. Si hubo un error, crear una nueva migración correctiva. Antes de ejecutar cualquier migración en producción, revisar el SQL generado con:

```bash
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

---

## Seed inicial

El archivo `prisma/seed.ts` crea los datos mínimos para que el sistema sea funcional desde el primer deploy. Toda lógica de negocio del seed va en TypeScript puro usando el cliente Prisma, no en SQL crudo. **Usar `menu.md` como fuente de datos real** — no inventar precios ni descripciones.

El seed es idempotente: si los datos ya existen, no falla. Usar `upsert` o verificar existencia antes de insertar.

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Categorías del menú en orden de aparición — ver menu.md para las 17 completas
  const categorias = [
    { slug: 'entradas',          nombreEs: 'Entradas',          nombreEn: 'Appetizers',       orden: 10 },
    { slug: 'carnes',             nombreEs: 'Carnes',            nombreEn: 'Beef',              orden: 20 },
    { slug: 'cortes-especiales',  nombreEs: 'Cortes especiales', nombreEn: 'Beef specialties',  orden: 30 },
    { slug: 'especiales',         nombreEs: 'Especiales',        nombreEn: 'Specials',          orden: 40 },
    { slug: 'pastas',             nombreEs: 'Pastas',            nombreEn: 'Noodles',           orden: 50 },
    { slug: 'mariscos',           nombreEs: 'Mariscos',          nombreEn: 'Seafood',           orden: 60 },
    { slug: 'pollo',              nombreEs: 'Pollo',             nombreEn: 'Chicken',           orden: 70 },
    { slug: 'nachos',             nombreEs: 'Nachos',            nombreEn: 'Nachos',            orden: 80 },
    { slug: 'comidas-rapidas',    nombreEs: 'Comidas rápidas',   nombreEn: 'Fast food',         orden: 90 },
    { slug: 'tacos',              nombreEs: 'Tacos',             nombreEn: 'Tacos',             orden: 100 },
    { slug: 'vegetarianos',       nombreEs: 'Vegetarianos',      nombreEn: 'Vegetarians',       orden: 110 },
    { slug: 'sopas',              nombreEs: 'Sopas',             nombreEn: 'Soups',             orden: 120 },
    { slug: 'muy-tipicos',        nombreEs: 'Muy típicos',       nombreEn: 'Costa Rican choices', orden: 130 },
    { slug: 'gallos',             nombreEs: 'Gallos',            nombreEn: 'Gallos',            orden: 140 },
    { slug: 'nuggets',            nombreEs: 'Nuggets',           nombreEn: 'Nuggets',           orden: 150 },
    { slug: 'postres',            nombreEs: 'Postres',           nombreEn: 'Desserts',          orden: 160 },
    { slug: 'bebidas',            nombreEs: 'Bebidas',           nombreEn: 'Drinks',            orden: 170 },
  ];
  // Cada categoría lleva imagenUrl con la foto representativa una vez que Anthony
  // la tenga lista — no bloquea el seed, se completa con un update posterior.

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where:  { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 2. Platos por categoría — cargar desde menu.md, no desde datos inventados.
  const entradas = await prisma.categoria.findUniqueOrThrow({ where: { slug: 'entradas' } });

  const platosEntradas = [
    {
      nombreEs: 'Ceviche mixto',
      nombreEn: 'Mixed ceviche',
      descripEs: 'Camarones y pescado marinados en jugo de limón y jugo de tomate.',
      descripEn: 'Shrimp and fish marinated in lime juice and tomato juice.',
      precio: 7800,
      orden: 10,
      categoriaId: entradas.id,
    },
    {
      nombreEs: 'Ceviche con patacón',
      nombreEn: 'Ceviche with patacón',
      descripEs: 'Pescado marinado en jugo de limón, servido con patacón frito.',
      descripEn: 'Fish marinated in lime juice with fried plantain "patacón".',
      precio: 5200,
      orden: 20,
      categoriaId: entradas.id,
    },
  ];

  for (const plato of platosEntradas) {
    const existe = await prisma.plato.findFirst({
      where: { nombreEs: plato.nombreEs, categoriaId: plato.categoriaId, eliminadoEn: null },
    });
    if (!existe) {
      await prisma.plato.create({ data: plato });
    }
  }

  // Repetir el mismo patrón para las 15 categorías restantes con los datos de menu.md.

  // 3. Chileras — con precio real según menu.md
  const chilerasData = [
    {
      nombreEs: 'Chile rojo artesanal',
      nombreEn: 'Artisan red hot sauce',
      descripEs: 'Salsa picante roja, receta artesanal de la casa.',
      descripEn: 'Artisan red hot sauce, house recipe.',
      precio: 3950,
      orden: 10,
    },
    {
      nombreEs: 'Chile ahumado artesanal',
      nombreEn: 'Artisan smoked hot sauce',
      descripEs: 'Salsa picante ahumada, receta artesanal de la casa.',
      descripEn: 'Artisan smoked hot sauce, house recipe.',
      precio: 2750,
      orden: 20,
    },
    {
      nombreEs: 'Chile verde artesanal',
      nombreEn: 'Artisan green hot sauce',
      descripEs: 'Salsa picante verde, receta artesanal de la casa.',
      descripEn: 'Artisan green hot sauce, house recipe.',
      precio: 2750,
      orden: 30,
    },
  ];

  for (const chilera of chilerasData) {
    const existe = await prisma.chilera.findFirst({
      where: { nombreEs: chilera.nombreEs, eliminadoEn: null },
    });
    if (!existe) {
      await prisma.chilera.create({ data: chilera });
    }
  }

  // 4. Métrica inicial del mes en curso
  const ahora = new Date();
  await prisma.metrica.upsert({
    where: { mes_anio: { mes: ahora.getMonth() + 1, anio: ahora.getFullYear() } },
    update: {},
    create: {
      mes: ahora.getMonth() + 1,
      anio: ahora.getFullYear(),
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Agregar al `package.json`:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Ejecutar:

```bash
npx prisma db seed
```

---

## Queries de referencia

**Menú público completo (solo activos), con imagen a nivel de categoría:**

```typescript
await prisma.categoria.findMany({
  where: { activa: true, eliminadoEn: null },
  orderBy: { orden: 'asc' },
  select: {
    id: true,
    slug: true,
    nombreEs: true,
    nombreEn: true,
    imagenUrl: true,
    platos: {
      where: { activo: true, eliminadoEn: null },
      orderBy: { orden: 'asc' },
      select: {
        id: true,
        nombreEs: true,
        nombreEn: true,
        descripEs: true,
        descripEn: true,
        precio: true,
      },
    },
  },
});
```

**Platos de una categoría por slug:**

```typescript
await prisma.categoria.findFirst({
  where: { slug: categoriaSlug, activa: true, eliminadoEn: null },
  include: {
    platos: {
      where: { activo: true, eliminadoEn: null },
      orderBy: { orden: 'asc' },
    },
  },
});
```

**Chileras públicas:**

```typescript
await prisma.chilera.findMany({
  where: { activa: true, eliminadoEn: null },
  orderBy: { orden: 'asc' },
});
```

**Eventos vigentes (para Inicio):**

```typescript
const ahora = new Date();
await prisma.evento.findMany({
  where: {
    activo: true,
    eliminadoEn: null,
    OR: [{ fechaFin: null }, { fechaFin: { gte: ahora } }],
  },
  orderBy: { fechaInicio: 'asc' },
});
```

**Testimonios activos:**

```typescript
await prisma.testimonio.findMany({
  where: { activo: true, eliminadoEn: null },
  orderBy: { creadoEn: 'desc' },
});
```

**Publicaciones destacadas (para `/redes`):**

```typescript
await prisma.publicacionDestacada.findMany({
  where: { activo: true, eliminadoEn: null },
  orderBy: { orden: 'asc' },
});
```

**Desactivar un plato (nunca eliminar físicamente):**

```typescript
await prisma.plato.update({
  where: { id: platoId },
  data: { activo: false },
});
```

**Eliminar lógicamente un plato:**

```typescript
await prisma.plato.update({
  where: { id: platoId },
  data: { eliminadoEn: new Date() },
});
```

**Publicaciones del calendario editorial del mes actual:**

```typescript
const inicio = new Date(anio, mes - 1, 1);
const fin    = new Date(anio, mes, 1);

await prisma.publicacion.findMany({
  where: { fecha: { gte: inicio, lt: fin } },
  orderBy: { fecha: 'asc' },
});
```

**Upsert de métricas del mes:**

```typescript
await prisma.metrica.upsert({
  where: { mes_anio: { mes, anio } },
  update: { ...camposActualizados },
  create: { mes, anio, ...camposActualizados },
});
```

---

## Lo que no hace este agente

- No escribe lógica de controllers ni services de Express.
- No toca componentes React.
- No configura la conexión en Railway ni las variables de entorno en producción.
- No decide qué datos mostrar en la UI ni en qué idioma.
- No define los endpoints de la API. Si un servicio necesita un campo que no existe en el schema, reporta al agente de backend antes de que ese agente escriba código que lo use.
- No gestiona la carga de imágenes de categoría, chileras ni logo — eso es tarea del agente de frontend/seguridad al implementar la subida.
