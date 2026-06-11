# Expense Tracker — Project Audit Report

**Author:** Tech Lead & Security Auditor  
**Date:** June 9, 2026  
**Status:** DRAFT (Ready for Review)  
**Version:** v2.0.2

---

## 1. Executive Summary

This report presents a thorough architecture, security, database, API, UI/UX, and performance audit of the **FinTrack (Expense Tracker)** full-stack application.
FinTrack is designed to provide seamless financial budgeting, transaction logging, classification, and administration capabilities. The application uses a decoupled hybrid design: a client-side single-page React interface that interacts with a serverless/containerized backend hosted with Hono and powered by a Supabase (PostgreSQL) datastore.

Recent changes implemented high-performance native-bridge support via Capacitor with context-aware URL proxies so that native Android builds run seamlessly without asset resolution errors.

---

## 2. Global Architecture Analysis

```
                      +-------------------+
                      |   Mobile Engine   |
                      | (Capacitor/Native)|
                      +---------+---------+
                                |
                                v
+------------------+     +------+------+     +---------------------+
|  Vite Single     |     |   Local     |     |  Express Proxy      |
|  Page React App  +---->+ HTTPS Proxy +---->+  Server (server.ts) |
+------------------+     +-------------+     +----------+----------+
                                                        |
                                                        | (API Bridge)
                                                        v
                                             +----------+----------+
                                             |  Hono Backend API   |
                                             |    (/api/index.ts)  |
                                             +----------+----------+
                                                        |
                                                        | (Postgres Client)
                                                        v
                                             +----------+----------+
                                             |  Supabase Datastore |
                                             |    Backend Cloud    |
                                             +---------------------+
```

### 2.1 Core Stack Checklist
*   **Frontend Framework:** React v19.0.0, bundled with Vite v6.2.0, utilizing React Router v7.13.1.
*   **Backend Framework:** Hono v4.12.10 running inside Node.js, bridged into Express v4.21.2 via a custom Request/Response generator (`server.ts`).
*   **Database Engine:** Supabase DB (PostgreSQL backend) utilizing the official `@supabase/supabase-js` v2.99.1 client library with Client-Side authentication persistence.
*   **Asset Bundler:** Vite v6.2.0 for client-side assets; custom ESM to CommonJS compiler script utilizing `esbuild` to generate the production `dist/server.cjs` backend.
*   **Styling Engine:** Tailwind CSS v4.1.14 (Vite plugin `@tailwindcss/vite`, global CSS `@import "tailwindcss"`).
*   **Mobile Engine:** Ionic Capacitor v8.3.4 powering hybrid native iOS/Android builds.
*   **Third-party Integrations:**
    *   `recharts` (Data visualization on dashboards).
    *   `lucide-react` (SVG icons).
    *   `nodemailer` (Auth code delivery over SMTP).
    *   `motion` (Tailwind-integrated animation choreography).

### 2.2 Core Folder Structure
```
project-root/
├── api/
│   └── index.ts                 # Hono API Entry point & Router
├── public/
│   └── (Static icons / pictures)
├── src/
│   ├── components/              # Shared component designs (Modals, badges)
│   ├── lib/                     # Client utilities (Supabase initialization, API proxies)
│   ├── pages/                   # Main views (Dashboard, Budgets, Analytics)
│   ├── types.ts                 # Clean TypeScript interface blueprints
│   ├── main.tsx                 # Client entry point
│   └── index.css                # Tailwind import, custom theme variables
├── server.ts                    # Production express app to bridge Vite and API Hono logic
└── scripts/
    └── build-server.js          # Custom script compiling server.ts into CJS
```

### 2.3 Environmental Variable Dependency Matrix
*   `SUPABASE_URL` / `VITE_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`: Target Cloud instance.
*   `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Global database validation.
*   `SUPABASE_SERVICE_ROLE_KEY`: Required for administrative operations (creating profiles, fetching entire user directories).
*   `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`: Mail transfer agent for OTP deliveries.
*   `VITE_MOBILE_API_URL`: Override base address for Android build API synchronization.

---

## 3. Major Findings & Recommendations

### Finding 1: Leftover Modules
*   **Issue:** `package.json` specifies `"sqlite": "^5.1.1"` and `"sqlite3": "^6.0.1"` as global dependencies. A codebase-wide scan demonstrates zero imports or usages. This bloats production install sizes and node_module footprints.
*   **Recommendation:** Perform `npm uninstall sqlite sqlite3` to prune unused artifacts.

### Finding 2: Hybrid Server Overheads
*   **Issue:** The app boots a native Express server (`server.ts`) which manually translates standard requests to Hono fetch formats. This double-layer adds middleware translation delays (Hono Bridge Error risk) and latency.
*   **Recommendation:** Unify endpoints. Run a standalone Hono server natively using `@hono/node-server` directly in `server.ts` or leverage Express routes entirely for backend APIs, deleting Hono if Express is preferred for enterprise backends.

### Finding 3: SMTP Fallbacks
*   **Issue:** SMTP credentials fallback to absolute plaintext literals (the tech lead's personal inbox and app-specific key) in `/api/index.ts` if environment parameters are absent.
*   **Recommendation:** Strip all hardcoded fallbacks and enforce environment parameter validation during server bootstrapping.
