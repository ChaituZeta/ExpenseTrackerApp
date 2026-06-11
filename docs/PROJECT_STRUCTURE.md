# FinTrack — Project Structure Reference

This document maps out the current file layout and outlines our target enterprise structure. This provides structural clarity as our development team transitions to a larger, multi-developer codebase.

---

## 1. Current File Tree Inventory

```
project-root/
├── api/
│   └── index.ts                 # Hono API Router (End-points, controllers)
├── docs/                        # Complete System Audits & Plans
├── public/                      # Static branding assets
├── scripts/
│   └── build-server.js          # Node code builder converting server TS to CJS
├── src/                         # Unified React Client Source Code
│   ├── components/              # Shared elements (badges, splash counters)
│   ├── lib/                     # Client connections (API calls, Supabase endpoints)
│   ├── pages/                   # User views (Dashboard, Profiles, budgets)
│   ├── types.ts                 # Central TS interface definitions
│   ├── main.tsx                 # Base DOM attaching script
│   └── index.css                # Global CSS imports (Tailwind setups)
├── server.ts                    # Main node entry point
├── package.json                 # Dependency list & NPM actions
└── tsconfig.json                # TypeScript compilation config
```

---

## 2. Target Enterprise Layout Architecture

To accommodate rapid scale, team expansion, and clear separation of concerns, the project will be restructured into dedicated `frontend` and `backend` directories. This isolates client interface code from server business logic.

```
project-root/
│
├── frontend/                     # Pure Single-Page React Container
│   ├── public/                   # Static mock assets
│   ├── src/
│   │   ├── assets/               # Local icons, illustrations, styles
│   │   ├── components/           # Generic visual blocks (buttons, inputs)
│   │   ├── pages/                # High-level layouts (Budgets, Ledgers)
│   │   ├── hooks/                # Reusable React custom state engines
│   │   ├── services/             # HTTP clients proxying server interfaces
│   │   ├── utils/                # Date calculators, string formatters
│   │   ├── contexts/             # Global session structures (Auth contexts)
│   │   ├── types/                # Component and visual TS state shapes
│   │   └── main.tsx              # DOM mounting and application entry
│   ├── package.json              # Client-exclusive dependencies
│   └── vite.config.ts            # Vite compiler configurations
│
├── backend/                      # Decoupled Hono/Node API Container
│   ├── src/
│   │   ├── controllers/          # Endpoint middleware handlers
│   │   ├── services/             # Core business calculations (SMTP, PDF, Sync)
│   │   ├── repositories/         # Database access abstraction layers
│   │   ├── middleware/           # RBAC checks, rate limiters, security guards
│   │   ├── routes/               # Modular Express/Hono route mapping
│   │   ├── validators/           # Zod schema checks for API payloads
│   │   └── config/               # Database pool and environment hooks
│   ├── package.json              # Server dependencies (Express, Nodemailer)
│   └── tsconfig.json             # Backend server compiler choices
│
├── docs/                         # Specifications & Systems manual
├── database/                     # Migration scripts & seeding files
└── scripts/                      # Infrastructure helpers (Capacitor compilations)
```

**Restructuring Execution Steps:**
1.  **Step 1:** Establish directories `frontend/` and `backend/`.
2.  **Step 2:** Relocate React code to `/frontend/src/` and dependencies in parent configuration layers.
3.  **Step 3:** Migrate api controllers to `/backend/src/` as modular routes.
4.  **Step 4:** Set up standard build processes inside the root project directory.
5.  **Step 5:** Configure Capacitor to ingest output static elements exclusively from `/frontend/dist`.
