# database/CLAUDE.md — Agente Base de Datos

## Rol
Ingeniero de base de datos senior. Responsable del schema, migraciones, relaciones e integridad de los datos. Cualquier cambio al schema pasa por este agente primero.

Lee `CLAUDE.md` en la raíz antes de empezar cualquier tarea.

---

## Principios del schema

- `id` de tipo `uuid` generado por la DB (`@default(uuid())`) en todas las tablas.
- Todas las tablas tienen `createdAt` y `updatedAt` con valores por defecto.
- Soft delete con `deletedAt DateTime?`. Registro con `deletedAt` no nulo = eliminado. Todas las queries filtran `where: { deletedAt: null }` por defecto.
- Precios en colones enteros (sin decimales).
- Campos de texto libre con longitud máxima definida (`@db.VarChar(n)`).
- Tablas y columnas en snake_case en PostgreSQL, mapeadas a camelCase en código con `@map` / `@@map`. Nunca camelCase directo en SQL.
- Los tipos generados por `@prisma/client` son la fuente de verdad. No duplicar con interfaces manuales.

---

## Schema completo

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Categoria {
  id          String     @id @default(uuid())
  nombre      String     @db.VarChar(100)
  descripcion String?    @db.VarChar(300)
  orden       Int        @default(0)
  activa      Boolean    @default(true)
  deletedAt   DateTime?  @map("deleted_at")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  productos   Producto[]
  @@map("categorias")
}

model Producto {
  id              String           @id @default(uuid())
  nombre          String           @db.VarChar(150)
  descripcion     String?          @db.VarChar(500)
  precio          Int
  imagenUrl       String?          @db.VarChar(500) @map("imagen_url")
  activo          Boolean          @default(true)
  llevaLeche      Boolean          @default(false)   @map("lleva_leche")
  orden           Int              @default(0)
  deletedAt       DateTime?        @map("deleted_at")
  categoriaId     String           @map("categoria_id")
  categoria       Categoria        @relation(fields: [categoriaId], references: [id])
  extras          Extra[]          @relation("ProductoExtras")
  acompañamientos Acompañamiento[]
  itemsPedido     ItemPedido[]
  ofertas         Oferta[]
  presentaciones  Presentacion[]
  opciones        OpcionProducto[]
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  @@map("productos")
}

model Extra {
  id                 String            @id @default(uuid())
  nombre             String            @db.VarChar(100)
  precio             Int               @default(0)
  requerido          Boolean           @default(false)
  activo             Boolean           @default(true)
  esLecheAlternativa Boolean           @default(false) @map("es_leche_alternativa")
  deletedAt          DateTime?         @map("deleted_at")
  productos          Producto[]        @relation("ProductoExtras")
  itemsPedido        ItemPedidoExtra[]
  createdAt          DateTime          @default(now()) @map("created_at")
  updatedAt          DateTime          @updatedAt @map("updated_at")
  @@map("extras")
}

model OpcionProducto {
  id         String    @id @default(uuid())
  productoId String    @map("producto_id")
  producto   Producto  @relation(fields: [productoId], references: [id])
  grupo      String    @db.VarChar(100)
  valor      String    @db.VarChar(100)
  orden      Int       @default(0)
  activo     Boolean   @default(true)
  deletedAt  DateTime? @map("deleted_at")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt      @map("updated_at")
  @@map("opciones_producto")
}

model Acompañamiento {
  id          String       @id @default(uuid())
  nombre      String       @db.VarChar(100)
  activo      Boolean      @default(true)
  deletedAt   DateTime?    @map("deleted_at")
  productoId  String       @map("producto_id")
  producto    Producto     @relation(fields: [productoId], references: [id])
  itemsPedido ItemPedido[]
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")
  @@map("acompañamientos")
}

model Oferta {
  id           String    @id @default(uuid())
  titulo       String    @db.VarChar(150)
  descripcion  String?   @db.VarChar(500)
  precioOferta Int       @map("precio_oferta")
  productoId   String    @map("producto_id")
  producto     Producto  @relation(fields: [productoId], references: [id])
  inicio       DateTime
  fin          DateTime
  activa       Boolean   @default(true)
  deletedAt    DateTime? @map("deleted_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  @@map("ofertas")
}

model ZonaDelivery {
  id        String   @id @default(uuid())
  nombre    String   @db.VarChar(150)
  tarifa    Int
  activa    Boolean  @default(true)
  pedidos   Pedido[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("zonas_delivery")
}

model Pedido {
  id             String        @id @default(uuid())
  nombreCliente  String        @db.VarChar(150) @map("nombre_cliente")
  telefono       String?       @db.VarChar(20)
  notaGeneral    String?       @db.VarChar(500) @map("nota_general")
  total          Int
  estado         EstadoPedido  @default(RECIBIDO)
  tipoEntrega    TipoEntrega   @default(RETIRO_EN_LOCAL) @map("tipo_entrega")
  latitud        Float?
  longitud       Float?
  direccionTexto String?       @db.VarChar(500) @map("direccion_texto")
  zonaDeliveryId String?       @map("zona_delivery_id")
  zonaDelivery   ZonaDelivery? @relation(fields: [zonaDeliveryId], references: [id])
  metodoPago     MetodoPago?   @map("metodo_pago")
  pagoConfirmado Boolean       @default(false) @map("pago_confirmado")
  referenciaPago String?       @db.VarChar(100) @map("referencia_pago")
  whatsappEnviado Boolean      @default(false) @map("whatsapp_enviado")
  whatsappError  String?       @db.VarChar(500) @map("whatsapp_error")
  items          ItemPedido[]
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")
  @@map("pedidos")
}

enum EstadoPedido {
  RECIBIDO
  EN_PREPARACION
  LISTO
  EN_CAMINO    // reservado para módulo de flotilla propia
  ENTREGADO
  CANCELADO
}

enum TipoEntrega {
  RETIRO_EN_LOCAL
  DELIVERY
}

enum MetodoPago {
  EFECTIVO
  SINPE
  TARJETA      // reservado para integración futura
}

model ItemPedido {
  id                    String            @id @default(uuid())
  pedidoId              String            @map("pedido_id")
  pedido                Pedido            @relation(fields: [pedidoId], references: [id])
  productoId            String            @map("producto_id")
  producto              Producto          @relation(fields: [productoId], references: [id])
  nombreSnapshot        String            @db.VarChar(150) @map("nombre_snapshot")
  precioSnapshot        Int               @map("precio_snapshot")
  cantidad              Int
  omisiones             String[]
  opcionesSeleccionadas String[]          @default([]) @map("opciones_seleccionadas")
  notaEspecial          String?           @db.VarChar(300) @map("nota_especial")
  acompañamientoId      String?           @map("acompañamiento_id")
  acompañamiento        Acompañamiento?   @relation(fields: [acompañamientoId], references: [id])
  extras                ItemPedidoExtra[]
  createdAt             DateTime          @default(now()) @map("created_at")
  @@map("items_pedido")
}

model ItemPedidoExtra {
  id             String     @id @default(uuid())
  itemPedidoId   String     @map("item_pedido_id")
  itemPedido     ItemPedido @relation(fields: [itemPedidoId], references: [id])
  extraId        String     @map("extra_id")
  extra          Extra      @relation(fields: [extraId], references: [id])
  nombreSnapshot String     @db.VarChar(100) @map("nombre_snapshot")
  precioSnapshot Int        @map("precio_snapshot")
  @@map("items_pedido_extras")
}

model Nosotros {
  id        String   @id @default(uuid())
  historia  String?  @db.Text
  galeria   String[]
  telefono  String?  @db.VarChar(20)
  correo    String?  @db.VarChar(150)
  direccion String?  @db.VarChar(300)
  instagram String?  @db.VarChar(150)
  facebook  String?  @db.VarChar(150)
  tiktok    String?  @db.VarChar(150)
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("nosotros")
  // Un solo registro. Se crea en la migración inicial y solo se actualiza.
}
```

---

## Decisiones de diseño

**Snapshots en ItemPedido / ItemPedidoExtra:** `nombreSnapshot` y `precioSnapshot` congelan el estado al momento del pedido. Cambios posteriores de precio o nombre no afectan el historial.

**Total como snapshot en Pedido:** incluye subtotal de productos + tarifa de delivery. El backend siempre recalcula antes de guardar, nunca confía en el total del frontend.

**Omisiones como `String[]`:** texto libre, sin estructura fija, no son entidades.

**`opcionesSeleccionadas` como `String[]`:** almacena las opciones elegidas por el cliente en formato `"grupo=valor"` (ej: `"Sabor=Vainilla"`, `"Chocolate=70%"`). No modifican el precio; solo se registran para el mensaje de WhatsApp y el historial.

**`llevaLeche` en Producto:** cuando es `true`, los extras marcados como `esLecheAlternativa` aparecen automáticamente en el menú público y son válidos en `POST /api/pedidos` sin necesidad de estar en la relación explícita `ProductoExtras`.

**`esLecheAlternativa` en Extra:** marca extras como Leche deslactosada, Leche de almendra, Leche de avena. Se incluyen automáticamente para productos con `llevaLeche = true`.

**`OpcionProducto`:** opciones sin costo agrupadas por `grupo`. Cada grupo es obligatorio al confirmar el pedido. El campo `grupo` agrupa opciones mutuamente excluyentes (ej: `"Sabor"`, `"Chocolate"`, `"Fruta"`). Soft delete con `deletedAt`.

**Un solo registro en Nosotros:** siempre `update`, nunca `create` después de la migración inicial.

**Soft delete con `deletedAt`:** aplica a Categoría, Producto, Extra, Acompañamiento, Oferta. Los pedidos no tienen `deletedAt`, solo cambian de estado. Las zonas de delivery no tienen `deletedAt`, se desactivan con `activa` para no romper integridad referencial.

**`requerido` en Extra:** indica selecciones obligatorias al personalizar (sabor de latte, fruta de colada). El frontend bloquea agregar al carrito si hay un extra requerido sin seleccionar.

**Coordenadas en Pedido:** `latitud`, `longitud`, `direccionTexto` y `zonaDeliveryId` son obligatorios cuando `tipoEntrega = DELIVERY`. El barrio determina la tarifa pero no reemplaza la ubicación exacta. Los nombres de barrios de Liberia no coinciden con reverse geocoding, por eso el cliente selecciona de la lista.

**Campos de pago (`metodoPago`, `pagoConfirmado`, `referenciaPago`):** nullable, reservados para el módulo futuro de pagos automáticos. No se usan en la UI actual.

**Sin modelo Cliente:** nombre y teléfono van directo en `Pedido` como texto plano. Cuando se implemente fidelización, se agrega la tabla `clientes` y un `clienteId?` nullable en `Pedido`. Los pedidos anteriores quedan con `clienteId: null`. No hacer backfill por matching de teléfono (un número puede haber cambiado de titular). La implementación requiere cumplir Ley 8968 de Costa Rica.

---

## Migraciones

Nombres descriptivos en inglés:

```bash
npx prisma migrate dev --name add-zona-delivery-model
```

Nunca editar una migración ya aplicada en producción. Si hubo un error, crear una nueva migración correctiva.

---

## Seed inicial

El archivo `database/seed.ts` debe crear:
1. El registro único de `Nosotros`.
2. Al menos una categoría y un producto de ejemplo.
3. Las zonas de delivery con barrios y tarifas confirmados por Cristofher.

Las tarifas están pendientes hasta que Anthony suba la imagen con los precios de la agencia. Placeholder hasta entonces:

```typescript
{ nombre: 'Centro de Liberia', tarifa: 0 } // tarifa pendiente
```

---

## Queries de referencia

**Menú público completo:**
```typescript
await prisma.categoria.findMany({
  where: { activa: true, deletedAt: null },
  orderBy: { orden: 'asc' },
  include: {
    productos: {
      where: { activo: true, deletedAt: null },
      orderBy: { orden: 'asc' },
      include: {
        extras: { where: { activo: true, deletedAt: null } },
        opciones: { where: { activo: true, deletedAt: null }, orderBy: [{ grupo: 'asc' }, { orden: 'asc' }] },
        acompañamientos: { where: { activo: true, deletedAt: null } },
        ofertas: {
          where: {
            activa: true, deletedAt: null,
            inicio: { lte: new Date() },
            fin: { gte: new Date() },
          },
        },
      },
    },
  },
});
// En el servicio: los extras de leche alternativa se añaden automáticamente
// para productos con llevaLeche=true. Las opciones se agrupan por 'grupo'.
```

**Crear pedido con items (transacción):**
```typescript
await prisma.$transaction(async (tx) => {
  const pedido = await tx.pedido.create({ data: { ...camposPedido } });
  for (const item of items) {
    const itemPedido = await tx.itemPedido.create({ data: { pedidoId: pedido.id, ...camposItem } });
    for (const extra of item.extras) {
      await tx.itemPedidoExtra.create({ data: { itemPedidoId: itemPedido.id, ...camposExtra } });
    }
  }
  return pedido;
});
```

**Historial paginado:**
```typescript
const [pedidos, total] = await Promise.all([
  prisma.pedido.findMany({
    skip: (pagina - 1) * porPagina,
    take: porPagina,
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { extras: true } }, zonaDelivery: true },
  }),
  prisma.pedido.count(),
]);
```

---

## Lo que no hace este agente

- No escribe lógica de controllers ni services de Express.
- No toca componentes React.
- No configura la conexión en Railway.
- No decide qué datos mostrar en la UI.