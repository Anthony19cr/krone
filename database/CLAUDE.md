# database/CLAUDE.md — Agente Base de Datos · Krone

## Rol

Ingeniero de base de datos senior. Responsable del schema Prisma, las migraciones y la integridad de los datos financieros. Cualquier cambio al schema pasa por este agente primero. Lee `CLAUDE.md` en la raíz antes de empezar.

Este sistema es de un solo usuario real (`userId: 1` en todas las tablas relacionadas). No hay tabla de sesiones, no hay soft delete, no hay multi-tenancy. Es simplicidad deliberada para el alcance actual — no agregar estas capas sin que el usuario pida explícitamente escalar el proyecto a multiusuario.

---

## Principios del schema (reales, no aspiracionales)

- `id` de tipo `Int` autoincremental (`@default(autoincrement())`) en todas las tablas. No hay UUIDs — los IDs no se exponen en URLs públicas ni hay necesidad de generarlos fuera de la base de datos.
- Montos en `Decimal` (`@db.Decimal(12, 2)`), nunca `Float` — evita errores de precisión de punto flotante en cálculos financieros. `annualRate` usa `Decimal(5, 2)` (porcentaje, ej. `18.00`).
- `createdAt`/`updatedAt` con `@default(now())`/`@updatedAt` en todos los modelos excepto `Category`, que solo tiene `createdAt` (no se justificó `updatedAt` cuando se creó, dado que solo se edita nombre/color).
- **Sin soft delete.** `DELETE` en cualquier endpoint borra la fila físicamente (`prisma.<model>.delete`). Es una diferencia deliberada respecto a proyectos con historial transaccional — aquí no hay "pedidos" ni auditoría que proteger, así que el borrado físico es aceptable. Si en el futuro se necesita historial (por ejemplo, para no perder el rastro de una deuda saldada), es una decisión de producto a discutir antes de implementarla, no un default a aplicar solo por convención de otros proyectos.
- Nombres de tablas/columnas en `camelCase` directo en PostgreSQL — no se usa `@map`/`@@map` a `snake_case`. Mantener esta convención para no introducir inconsistencia con las tres migraciones ya aplicadas.
- Los tipos generados por `@prisma/client` son la fuente de verdad de tipos en TypeScript backend. El frontend mantiene sus propias interfaces (`Income`, `Expense`, `Debt`, etc. en `frontend/src/hooks/*`) porque no comparte paquete con el backend — mantenerlas alineadas a mano cuando cambie el schema.

---

## Schema actual

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

enum Frequency {
  MONTHLY
  BIWEEKLY
  WEEKLY
  ONE_TIME
}

enum CategoryType {
  INCOME
  EXPENSE
}

enum Currency {
  CRC
  USD
  EUR
  MXN
  COP
  ARS
}

model User {
  id           Int          @id @default(autoincrement())
  name         String
  email        String       @unique
  passwordHash String
  currency     Currency     @default(CRC)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  categories   Category[]
  incomes      Income[]
  expenses     Expense[]
  debts        Debt[]
  savingGoals  SavingGoal[]
}

model Category {
  id        Int          @id @default(autoincrement())
  name      String
  type      CategoryType
  color     String       @default("#6b7280")
  userId    Int
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime     @default(now())

  incomes  Income[]
  expenses Expense[]

  @@unique([name, type, userId])
}

model Income {
  id          Int       @id @default(autoincrement())
  name        String
  amount      Decimal   @db.Decimal(12, 2)
  recurring   Boolean   @default(false)
  frequency   Frequency @default(ONE_TIME)
  month       Int       // 1–12
  year        Int
  categoryId  Int
  category    Category  @relation(fields: [categoryId], references: [id])
  userId      Int
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Expense {
  // idéntico a Income
}

model Debt {
  id              Int       @id @default(autoincrement())
  name            String
  totalAmount     Decimal   @db.Decimal(12, 2)
  remainingAmount Decimal   @db.Decimal(12, 2)
  totalPayments   Int
  paidPayments    Int       @default(0)
  annualRate      Decimal   @db.Decimal(5, 2)
  frequency       Frequency @default(MONTHLY)   // MONTHLY, BIWEEKLY o WEEKLY — ONE_TIME no aplica
  paymentAmount   Decimal   @db.Decimal(12, 2)  // cuota por período, calculada server-side
  userId          Int
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model SavingGoal {
  id            Int      @id @default(autoincrement())
  name          String
  targetAmount  Decimal  @db.Decimal(12, 2)
  currentAmount Decimal  @db.Decimal(12, 2) @default(0)
  targetDate    DateTime?
  userId        Int
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## Decisiones de diseño

**`Frequency` es compartido entre `Income`/`Expense` y `Debt`, pero `Debt` nunca usa `ONE_TIME`.** No existe una restricción a nivel de base de datos que lo impida — se controla en `backend/src/controllers/debts.controller.ts` (default `MONTHLY`) y en el frontend limitando las opciones del `<select>` a `MONTHLY`/`BIWEEKLY`/`WEEKLY`. Si se necesita esa restricción a nivel de tipo, sería un enum `DebtFrequency` separado — no se hizo porque hubiera duplicado toda la tabla de multiplicadores; ver `frontend/src/hooks/useDebts.ts` (`DebtFrequency = Exclude<Frequency, "ONE_TIME">`) como el compromiso actual.

**`Debt.paymentAmount` (antes `monthlyPayment`)** — renombrado en la migración `20260821120100_add_debt_frequency` cuando se agregó la frecuencia de pago, porque el nombre anterior asumía pagos siempre mensuales. Es el monto de **una** cuota, en la frecuencia que indique `Debt.frequency` — para el equivalente mensual (usado en balance, proyección de metas y export) hay que multiplicarlo por `FREQUENCY_MULTIPLIER[frequency]` (ver `backend/src/lib/recurrence.ts`).

**Sin fecha de fin de recurrencia en `Income`/`Expense`.** `month`/`year` es solo el origen; la recurrencia se resuelve en `backend/src/lib/recurrence.ts` comparando períodos, no con una columna `endDate`. Si se pide esa funcionalidad, es un cambio de schema + lógica de filtrado, no un flag cosmético.

**`Category` única por `(name, type, userId)`** — permite una categoría "Transporte" de tipo `INCOME` y otra de tipo `EXPENSE` con el mismo nombre, pero no dos `EXPENSE` con el mismo nombre para el mismo usuario.

---

## Migraciones

Historial real, nombrado en inglés, snake_case, sin prefijo de verbo fijo:

```
20260329151003_init
20260329205810_add_target_date_to_saving_goal
20260821120000_add_weekly_frequency
20260821120100_add_debt_frequency
```

**Cuando un cambio de enum y un cambio de columna van juntos (como al agregar `WEEKLY` + `Debt.frequency`), separarlos en dos migraciones.** PostgreSQL no permite usar un valor de enum recién agregado (`ALTER TYPE ... ADD VALUE`) dentro de la misma transacción en la que se agregó — Prisma ejecuta cada `migration.sql` en una transacción, así que un `ADD VALUE` seguido de una columna con ese valor como default en el mismo archivo puede fallar. Ver `20260821120000_add_weekly_frequency` (solo el enum) y `20260821120100_add_debt_frequency` (columna + rename) como el patrón a seguir.

**Antes de aplicar en la base de desarrollo (que tiene datos reales del usuario):**
```bash
npx prisma migrate deploy   # aplica migraciones pendientes sin prompts interactivos
npx prisma generate         # regenera el cliente — reiniciar el proceso de tsx watch después
```
Evitar `npx prisma migrate dev` cuando ya se escribió el `migration.sql` a mano — puede intentar generar un diff distinto al que ya existe en disco. `migrate dev` sigue siendo válido para cambios simples donde se deja que Prisma genere el SQL automáticamente, pero renombrar columnas requiere escribir el SQL a mano (Prisma no detecta renames, genera `DROP` + `ADD` y pierde los datos de esa columna si ya hay filas).

Nunca editar una migración ya aplicada. Si hubo un error, crear una nueva migración correctiva.

---

## Seed

`backend/prisma/seed.ts` solo crea el usuario de desarrollo (`dev@krone.local`, id 1) vía `upsert`. No siembra categorías, ingresos, gastos ni deudas de ejemplo — todos los datos actuales en la base de desarrollo los ingresó el usuario manualmente desde la UI. No sobrescribir ni resetear esos datos sin confirmar primero.

---

## Lo que no hace este agente

- No escribe lógica de controllers ni de la API REST.
- No toca componentes React ni hooks del frontend.
- No configura el servicio de PostgreSQL en el sistema operativo ni credenciales de producción.
- No decide qué campos mostrar en la UI ni el formato de presentación (eso es `frontend/CLAUDE.md`).
