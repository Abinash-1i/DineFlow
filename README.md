# 🍽️ DineFlow
> **AI-Powered Restaurant Order Management & Sales Intelligence Platform**

DineFlow is a modern, enterprise-grade restaurant management suite tailored for authentic Kerala and Indian dining establishments. It unifies rapid Point-of-Sale (POS), interactive floor management, real-time Kitchen Display System (KDS), Indian GST-compliant billing with split payments, mobile table QR ordering, and Google Gemini AI sales forecasting.

---

## 🌟 Key Features

### 🍛 1. Authentic Kerala & Indian Menu Management
- Pre-seeded with signature specialties:
  - **Appetizers & Breads:** Malabar Porotta, Nadan Appam, Steamed Idiyappam, Malabar Beef Cutlets.
  - **Mains & Traditional Curries:** Malabar Chicken Dum Biryani, Thalassery Mutton Biryani, Kerala Beef Roast (Ularthiyathu), Karimeen Pollichathu, Alleppey Fish Moilee, Avial, Paneer Butter Masala.
  - **Beverages & Desserts:** Sulaimani, Kulukki Sarbath, Palada Pradhaman Payasam.
- Complete modal-driven CRUD with fields: Name, Category, Price (₹ INR), Spice Level (Mild to Very Spicy), Dietary Tag (Veg, Non-Veg, Vegan), Prep Time, and Image URL.
- One-click instant stock availability toggle (`In Stock` <-> `Out of Stock`) with real-time POS synchronization.

### 🛎️ 2. Order Taking & POS Floor Station
- Interactive visual floor selector for Tables 1 to 12 and Takeaway express stations with real-time occupancy status.
- Cart builder with inline dish modifiers: spice preference selection and custom kitchen notes (*"Extra gravy"*, *"Crisp & well done"*).
- Indian GST 5% computation live preview (2.5% CGST + 2.5% SGST).
- One-click **"Send to Kitchen (KDS)"** with sound feedback and instant SSE broadcast.

### 👨‍🍳 3. Real-Time Kitchen Display System (KDS)
- Synchronized multi-screen updates powered by **Server-Sent Events (SSE)** at `/api/kds/events`.
- Live elapsed preparation timers with color alerts:
  - 🟢 **Green (< 10 mins):** Normal flow
  - 🟡 **Amber (10 - 20 mins):** Warning threshold
  - 🔴 **Red (> 20 mins):** Urgent rush ticket
- One-click ticket status transitions: `Start Cooking` -> `Mark Ready` -> `Mark Served`.
- Web Audio API chime notifications on incoming orders.

### 🧾 4. Billing, Indian GST & Printable Invoices
- Automatic Indian restaurant GST computation (5% total: 2.5% CGST + 2.5% SGST).
- Split-bill calculation across 2, 3, 4, 5+ guests.
- Multi-mode payment support:
  - **UPI QR Code:** Dynamic QR code mockup for instant scanning (VPA: `dineflow@icici`).
  - **Cash:** Tendered amount calculator with exact change-due display.
  - **Card:** POS terminal status.
- Printable / downloadable branded tax invoice modal compliant with Kerala GSTIN (State 32) and FSSAI licensing.

### 🧠 5. Google Gemini AI Sales Intelligence & Operations
- Integrated with the official `@google/genai` SDK (`gemini-2.5-flash` model).
- **Gemini Sales Copilot:** Natural-language daily narrative, performance score (0-100), and operational highlights.
- **Predictive Demand & Kitchen Prep Schedule:** Forecasts lunch and dinner rush hours and provides advance prep schedules (e.g. Porotta dough resting, Biryani dum handi timing, fresh coconut milk extraction).
- **Smart Menu Optimization:** Identifies star vs underperforming dishes and proposes high-margin combo bundles.
- **Interactive Ask Copilot Chat:** Chefs and managers can ask real-time operational questions (e.g., *"How to reduce seafood wastage?"*, *"Suggest a weekend combo"*).
- **Visual Analytics:** Interactive Recharts graphs for hourly sales volume and dish velocity.

### 📱 6. Mobile Table QR Guest View (`/table/[id]`)
- Mobile-first interface for seated diners to browse the live menu, filter by Veg/Non-Veg, customize items, and transmit orders directly to the kitchen.

### 🛡️ 7. Role-Based Access Control (RBAC)
- Navbar role switcher for `Admin (Manager)`, `Cashier`, and `Kitchen Staff`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node.js 24 recommended)
- npm / yarn / pnpm

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Sync Prisma schema to SQLite database (instant local zero-config setup)
npx prisma db push

# 3. Seed database with Kerala dishes, floor tables, and historical orders
npx tsx prisma/seed.ts

# 4. Start development server
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🗄️ Database Strategy

- **Default (Local Development):** SQLite (`file:./dev.db`) for instant execution with zero external setup.
- **Production (Supabase / Neon PostgreSQL):** A production-ready schema is available at [`prisma/schema.postgresql.prisma`](prisma/schema.postgresql.prisma). Simply set `DATABASE_URL` in `.env` to your Supabase/Neon PostgreSQL connection string and run `npx prisma db push`.

---

## 🔑 Environment Variables (`.env`)

```env
DATABASE_URL="file:./dev.db"

# Optional: Google Gemini API Key for live Gemini 2.5 Flash intelligence
# If left empty, DineFlow uses its built-in heuristic analyst engine
GEMINI_API_KEY=""

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 📁 Architecture & Code Structure

```
DineFlow/
├── app/
│   ├── api/
│   │   ├── analytics/ai-insights/  # Gemini sales intelligence & Q&A endpoint
│   │   ├── billing/                # GST settlement & invoice generation
│   │   ├── kds/events/             # Server-Sent Events (SSE) real-time stream
│   │   ├── menu/                   # Menu CRUD & stock availability toggle
│   │   ├── orders/                 # Order creation & KDS lifecycle transitions
│   │   └── tables/                 # Floor tables & occupancy status
│   ├── analytics/page.tsx          # AI Sales Intelligence & Recharts dashboard
│   ├── billing/page.tsx            # Billing, GST calculation & printable invoice
│   ├── kds/page.tsx                # Real-Time Kitchen Display System
│   ├── menu/page.tsx               # Menu Management & stock toggle
│   ├── pos/page.tsx                # Order Taking & POS floor layout
│   ├── table/[id]/page.tsx         # Mobile Table QR Dine-In Ordering
│   ├── layout.tsx                  # Global layout & metadata
│   └── globals.css                 # Culinary dark theme & glassmorphism
├── components/
│   └── Navbar.tsx                  # Header navigation, KDS badge & RBAC switcher
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── gemini.ts                   # Google Gemini AI SDK & Copilot engine
│   ├── gst.ts                      # Indian Restaurant 5% GST & split-bill helpers
│   ├── kds-events.ts               # In-memory Pub/Sub event broadcaster for SSE
│   └── store.ts                    # Zustand POS & RBAC client state
└── prisma/
    ├── schema.prisma               # Local SQLite schema
    ├── schema.postgresql.prisma    # Production Supabase / Neon PostgreSQL schema
    └── seed.ts                     # Authentic Kerala cuisine database seed
```
