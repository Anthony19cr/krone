# Krone

Personal finance management system built for clarity, precision, and scale.

Krone helps individuals track income, expenses, debts, and savings goals — with a clean dashboard, smart alerts, multi-currency support, and exportable reports. Designed to run locally for personal use and deployable as a multi-user SaaS product.

---

## Features

- **Dashboard** — Monthly metrics, cash flow charts, category breakdown, and 6-month trend analysis
- **Income tracking** — Multiple sources, recurring (monthly / biweekly) or one-time, fully categorized
- **Expense tracking** — Recurring and one-time expenses with budget threshold alerts
- **Debt management** — French amortization calculation, payment progress tracking, auto-included in monthly totals
- **Savings goals** — Progress tracking with estimated completion date based on current savings pace
- **Custom categories** — Separate category sets for income and expenses, each with a custom color
- **Monthly history** — Month-by-month comparison with historical charts
- **Export** — Download reports as PDF or Excel
- **Multi-currency** — Select your currency when setting up your account
- **Themes** — Default silver & gold palette plus four monochromatic color themes (green, blue, violet, gray)
- **Responsive** — Desktop-first, fully functional on mobile
- **Multi-user ready** — JWT authentication included for production deployment (Phase 2)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Charts | Recharts |
| Auth | JSON Web Tokens (JWT) |
| Export | pdfkit + exceljs |

---

## Project Structure

```
krone/
├── frontend/                  # Next.js application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx           # Inicio (dashboard)
│   │   │   │   ├── ingresos/
│   │   │   │   ├── gastos/
│   │   │   │   ├── deudas/
│   │   │   │   ├── metas/
│   │   │   │   ├── historial/
│   │   │   │   └── categorias/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/            # Reusable UI primitives
│   │   │   ├── charts/        # Chart components (Recharts)
│   │   │   └── layout/        # Sidebar, topbar, navigation
│   │   ├── lib/
│   │   │   └── api.ts         # HTTP client to backend
│   │   └── types/
│   │       └── index.ts       # Shared TypeScript types
│
└── backend/                   # Express API
    ├── src/
    │   ├── routes/            # Endpoint definitions
    │   ├── controllers/       # Request handlers
    │   ├── services/          # Business logic (amortization, alerts, projections)
    │   ├── middlewares/       # Auth, error handling
    │   └── app.ts
    └── prisma/
        └── schema.prisma
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/Anthony19cr/krone
cd krone
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/krone"
JWT_SECRET="your-secret-key"
PORT=3001
```

Run database migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start the backend server:

```bash
npm run dev
```

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

Create a `.env.local` file inside `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
```

The app will be running at `http://localhost:3000`.

---

## Color Themes

Krone ships with a default **silver & gold** palette and four additional monochromatic themes. The active theme is stored in `localStorage` and applied via CSS variables — no page reload required.

| Theme | Primary | Secondary | Accent |
|---|---|---|---|
| Krone (default) | `#6b7280` | `#e5e7eb` | `#c9a84c` |
| Green | `#1a6b4a` | `#2aab73` | `#e6f5ee` |
| Blue | `#1a3f6b` | `#2a72ab` | `#e6f0f5` |
| Violet | `#3d1a6b` | `#7a2aab` | `#f0e6f5` |
| Gray | `#2a2a2a` | `#555555` | `#f0f0f0` |

---

## Roadmap

- [x] Project planning and architecture
- [ ] Database schema and migrations
- [ ] Backend CRUD — income, expenses, categories
- [ ] Debt module with amortization logic
- [ ] Savings goals with projections
- [ ] Dashboard and charts
- [ ] Alert system
- [ ] Monthly history
- [ ] PDF and Excel export
- [ ] Multi-currency support
- [ ] Theme switcher
- [ ] Responsive layout
- [ ] JWT authentication (multi-user)
- [ ] Production deployment

---

## License

MIT
