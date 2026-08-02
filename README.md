# SME E-Commerce & POS SaaS Platform for Bangladesh (Merchant OS)

> **Enterprise-grade, Multi-Tenant SaaS platform tailored for SME merchants in Bangladesh, integrating E-Commerce Storefronts, POS Point of Sale Terminals, Order Management, Customer CRM & Loyalty, Inventory & Barcode Studio, and Financial Reports & P&L Analytics.**

---

## 🚀 Key Modules & Feature Highlights (Phases 1 - 15)

1. **Multi-Tenant SaaS Architecture (Phase 1 & 2):** Subdomain resolution (`storename.merchantos.bd`), database tenant context isolation, custom domain bindings, and subscription tiers (Basic, Professional, Enterprise).
2. **Platform Admin & Merchant Control Panel (Phase 3 - 6):** Subscription management, tenant provisioning, merchant onboarding, and store builder settings.
3. **Inventory Management & Barcode Studio (Phase 7 - 9):** Multi-warehouse stock tracking, low stock alerts, barcode generation (EAN-13, Code-128), bulk sticker printing, and inventory audit logs.
4. **POS Point of Sale System (Phase 10):** Fast barcode scanner integration, offline cart caching (IndexedDB), hold/resume sales, split payment options (Cash, bKash, Nagad, Card), and thermal receipt printing.
5. **Customer E-Commerce Website & Storefront (Phase 11):** Dynamic storefront builder, instant auto-complete product search, Bangladesh location-based shipping engine (Inside Dhaka ৳70, Outside Dhaka ৳130), guest checkout, and public order tracking.
6. **Unified Order Management Engine (Phase 12):** Order state lifecycle machine (`PENDING` -> `PROCESSING` -> `PACKED` -> `SHIPPED` -> `DELIVERED`), automatic restocking on cancellation, local courier integrations (Steadfast & Pathao), and PDF invoice compiler.
7. **Customer CRM, RFM Auto-Segmentation & Loyalty (Phase 13):** Lifetime Value (LTV) analytics, automated tier upgrades (Bronze 🥉, Silver 🥈, Gold 🥇, Platinum 💎), reward points allocation/redemption, birthday promo automation, staff internal notes, and 360-degree profile drawer.
8. **Financial Reports & P&L Analytics Engine (Phase 14):** Automated Profit & Loss (P&L) statements with Cost of Goods Sold (COGS) margins, expense tracker, interactive SVG charts, printable A4 PDF compiler, and Microsoft Excel spreadsheet exporter.
9. **Final Polish, Security & Performance (Phase 15):** In-memory TTL caching, Next.js image optimization, security headers (CSP, HSTS, X-Frame-Options), CORS guard, endpoint rate limiting, input sanitization, WCAG 2.1 AA accessibility, Jest unit & integration tests, Playwright E2E tests, multi-stage Docker build, and Nginx reverse proxy.

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL**: v14.x or higher
- **Redis**: v7.x or higher

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/merchant-os/sme-platform.git
cd sme-platform

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Run Prisma database migrations
npx prisma migrate dev --name init

# 5. Generate Prisma Client
npx prisma generate

# 6. Start development server
npm run dev
```

The application will be running locally at `http://localhost:3000`.

---

## 📑 Environment Variables Reference (`.env`)

| Variable Name | Description | Example Value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/merchant_db` |
| `REDIS_URL` | Redis cache connection string | `redis://localhost:6379` |
| `NEXTAUTH_SECRET` | JWT session signing secret | `super_secret_jwt_key` |
| `NEXTAUTH_URL` | Root platform URL | `http://localhost:3000` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Root platform domain | `merchantos.bd` |

---

## 🐳 Docker Deployment Setup

```bash
# Build and run multi-container stack (App + Postgres + Redis + Nginx)
docker-compose up -d --build
```

---

## 🧪 Running Automated Tests

```bash
# Run Unit & Integration Tests (Jest)
npm test

# Run End-to-End Flow Tests (Playwright)
npx playwright test
```
