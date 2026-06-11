# FinTrack — System Project Inventory

This document maps out the precise, audited file tree of the platform.

---

## 1. Directory Tree Visualization

```
project-root/
├── android/                     # Gradle based Native Android Container (Capacitor)
├── api/
│   └── index.ts                 # Hono API Router (End-points, controllers, and database bridges)
├── docs/                        # Complete System Audits, Planning & Blueprint manuals
├── public/                      # Static branding assets
├── scripts/
│   └── build-server.js          # Build script compiling server TS entry point into CommonJS
├── src/                         # Unified React Client Source Code
│   ├── components/              # Extracted reusable visual sub-components
│   │   ├── ErrorBoundary.tsx    # Safe UI crash protector
│   │   ├── IconRenderer.tsx     # Dynamics lucide-react asset picker
│   │   ├── LoadingSpinner.tsx   # Visual request progress indicator
│   │   ├── SplashScreen.tsx     # Startup app-logo entry screen
│   │   └── UserBadge.tsx        # High-contrast visual role indicator
│   ├── lib/                     # Client connections and utilities
│   │   ├── api.ts               # Core HTTP API clients and Supabase integrations
│   │   ├── dateUtils.ts         # Central utility manipulating localized dates
│   │   └── supabase.ts          # Direct client-side Supabase configuration
│   ├── pages/                   # Main viewport components
│   │   ├── AdminDashboard.tsx   # User management boards and activity trackers
│   │   ├── Budgets.tsx          # Spending controls and progress bars
│   │   ├── Categories.tsx       # Custom asset tagging configurations
│   │   ├── Dashboard.tsx        # Aggregated balance graphs and spend metrics
│   │   ├── ForgotPassword.tsx   # Single-OTP reset initialization forms
│   │   ├── Home.tsx             # Static marketing landing view
│   │   ├── Login.tsx            # Session authorization forms
│   │   ├── NotFound.tsx         # HTTP 404 Fallback routing card
│   │   ├── Profile.tsx          # Personal account and preference managers
│   │   ├── Register.tsx         # Secure account registering forms
│   │   ├── ResetPassword.tsx    # OTP password finalizing form
│   │   ├── Transactions.tsx     # Ledger logs with ledger entries
│   │   └── UserReview.tsx       # Admin tool auditing specific user ledgers
│   ├── App.tsx                  # Core React router layout and session provider
│   ├── index.css                # Global CSS stylesheet importing Tailwind v4
│   ├── main.tsx                 # Base DOM attachment script
│   └── types.ts                 # Central TS interface definitions
├── .env.example                 # Environment variables specification template
├── .gitignore                   # Ignored files configuration
├── capacitor.config.ts          # Capacitor bundle packages metadata
├── index.html                   # HTML entry page served by the browser
├── metadata.json                # Application permissions and title metadata
├── package.json                 # Core NPM dependencies and scripts
├── server.ts                    # Main node entry point bridging Express, Vite, and Hono
├── supabase_schema.sql          # Base raw Postgres tables, triggers and RLS policies
├── tsconfig.json                # TypeScript compilation config
├── vercel.json                  # Vercel serverless functions rewrite configurations
├── vite.config.ts               # Vite configuration with chunk split optimizations
├── worker.ts                    # Cloudflare workers script wrapper
├── wrangler.jsonc               # Cloudflare workers configuration
└── startup_debug.txt            # Runtime server startup troubleshooting logs
```

---

## 2. Component Inventory & Mapping

### 2.1 Reusable Components (`/src/components/`)
1.  **`ErrorBoundary.tsx`:** Acts as a safety harness. Intercepts frontend crashes, preventing whitescreening, and showing a professional fallback state.
2.  **`IconRenderer.tsx`:** Resolves Lucide component functions dynamically by lookup strings to support arbitrary user category symbols.
3.  **`LoadingSpinner.tsx`:** Standard loader displaying messages during page transitions and server updates.
4.  **`SplashScreen.tsx`:** Immersive entry logo and animation displayed while verifying auth sessions on application startup.
5.  **`UserBadge.tsx`:** Pill badge reflecting active user roles (`Admin` vs. `User`).

### 2.2 Client-Side Routing Views (`/src/pages/`)
1.  **`Home.tsx`:** Visually rich introduction and entrance panel with options to log in or register.
2.  **`Login.tsx`:** Authenticates users through our backend API pipeline.
3.  **`Register.tsx`:** Collects and registers client data, with custom inputs for name, email, phone, and password.
4.  **`ForgotPassword.tsx`:** Initiates password reset emails containing a 6-digit verification code.
5.  **`ResetPassword.tsx`:** Consumes reset codes and hashes new credentials.
6.  **`Dashboard.tsx`:** Main analytical board complete with total balances, category breakdowns using Recharts, and date range slices.
7.  **`Transactions.tsx`:** Master financial ledger, with pagination, sorting, filters, and export-to-Excel (XLSX) features.
8.  **`Categories.tsx`:** Category customizer with customizable icons and color palettes.
9.  **`Budgets.tsx`:** Monthly categorical spending thresholds incorporating real-time execution progress bars.
10. **`Profile.tsx`:** Updates names, contact details, currency, and avatar URLs.
11. **`AdminDashboard.tsx`:** Restricted control panel allowing user listing, profile synchronization, log analysis, and administrative user creations.
12. **`UserReview.tsx`:** Multi-tenant auditor giving administrators direct search views into user transaction logs.
13. **`NotFound.tsx`:** Router fallback view displaying safe home triggers.

---

## 3. Backend Implementation (`/api/`)
*   **`/api/index.ts`:** Consolidated backend engine using **Hono**. Maps out security headers, CORS permissions, body parsing, auth, administrative scopes, activity tracking APIs, and nodemailer actions.

---

## 4. System Configuration Files
1.  **`package.json`:** Manages unified dependencies across React and Hono environments. Contains explicit split build definitions.
2.  **`vite.config.ts`:** Optimized compiler using specialized Rollup configurations (`vendor-react`, `vendor-ui`, `vendor-charts`, `vendor-utils`) to control code chunks. Integrates `@tailwindcss/vite` (Tailwind v4).
3.  **`tsconfig.json`:** Compiles ES2022 structures utilizing modern bundler pattern resolutions.
4.  **`vercel.json`:** Standardizes serverless execution routing `/api/*` requests cleanly to `/api/index.ts`.
5.  **`capacitor.config.ts`:** Points capacitor native compilation to output in `/dist`.
6.  **`wrangler.jsonc` & `worker.ts`:** Standardizes optional deployment to Cloudflare Edge Workers platforms.
