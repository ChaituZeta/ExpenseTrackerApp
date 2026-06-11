# FinTrack — Progressive Enterprise Restructuring Plan

This plan outlines the roadmap to reorganize the current flat repository into a decoupled, enterprise-grade architecture.

---

## 1. Target Directory Layout

To improve modularity and team scaling, the project will be divided into dedicated front-end (React) and back-end (Hono/Express) workspaces:

```
project-root/
│
├── frontend/                     # Pure Single-Page React App (Vite)
│   ├── public/                   # Static branding files (SVG icons, splash logos)
│   ├── src/
│   │   ├── assets/               # Local styles and styling images
│   │   ├── components/           # Generic visual components (Buttons, Badge)
│   │   ├── contexts/             # Global session contexts (AuthContext.tsx)
│   │   ├── hooks/                # Custom React state hooks (useLocalStorage.ts)
│   │   ├── pages/                # View layouts (Dashboard, Budgets, Profile)
│   │   ├── services/             # HTTP clients proxying server interfaces
│   │   ├── utils/                # Number/currency formatters
│   │   ├── types/                # Strict static type models
│   │   ├── main.tsx              # React mounting entry point
│   │   └── App.tsx               # Client router
│   ├── package.json              # Client-exclusive dependencies
│   ├── tsconfig.json             # Frontend TypeScript compiler options
│   └── vite.config.ts            # Frontend Vite config
│
├── backend/                      # Decoupled Hono/Node REST API
│   ├── src/
│   │   ├── controllers/          # Hono request handoff controllers
│   │   ├── middleware/           # CORS settings and admin auth checks
│   │   ├── routes/               # Modular path routing index
│   │   ├── services/             # Core business calculations (SMTP mail, CSV exports)
│   │   ├── validators/           # Zod schema validation checks
│   │   ├── config/               # DB connections and pool configs
│   │   └── server.ts             # Express wrapper listening on 3000
│   ├── package.json              # Server-exclusive dependencies
│   └── tsconfig.json             # Backend TypeScript compiler options
│
├── database/                     # DB schemas and migrations
│   ├── schemas/                  # PostgreSQL / MySQL DDL creation schemas
│   ├── seeds/                    # Mock transaction records and category seeds
│   └── migrations/               # Historical schema alterations
│
├── docs/                         # Platform blueprint manuals and guides
├── scripts/                      # Deploy/CI/CD helpers and wrapper scripts
└── package.json                  # Root runner script orchestrator (NPM Workspaces)
```

---

## 2. Restructuring Step-by-Step Roadmap

To prevent code degradation, the reorganization will be executed in three chronological steps:

```
Step 1: Directory Setup        Step 2: Frontend Migration     Step 3: Backend Relocation
+-----------------------+      +-----------------------+      +-----------------------+
| - Create folder shells| ---> | - Move /src and assets| ---> | - Move Hono /api paths|
| - Root workspace init |      | - Update paths        |      | - Move esbuild scripts|
| - Setup workspaces    |      | - Standardize client  |      | - Bind server to CWR  |
+-----------------------+      +-----------------------+      +-----------------------+
```

### 2.1 Step 1: Initialize Workspaces
1.  Initialize **NPM Workspaces** in the root `package.json` to organize dependencies across folders:
    ```json
    {
      "name": "fintrack-workspace",
      "private": true,
      "workspaces": [
        "frontend",
        "backend"
      ]
    }
    ```
2.  Create directory shells: `mkdir frontend backend database scripts`.

### 2.2 Step 2: Migrate React Frontend
1.  Relocate `/src` to `/frontend/src` and copy `/public` to `/frontend/public`.
2.  Relocate `vite.config.ts`, `tsconfig.json`, and `index.html` to the `/frontend` directory.
3.  Rewrite client-side relative paths.
4.  Point mobile packaging scripts (Capacitor) to copy compiled frontend assets exclusively from `/frontend/dist`.

### 2.3 Step 3: Migrate Node Backend
1.  Move `/api/index.ts` to `/backend/src/routes/api.router.ts`.
2.  Move `/server.ts` to `/backend/src/server.ts`.
3.  Configure backend bundling (using `esbuild`) to package compilation files strictly within `/backend/dist`.
4.  Set up root NPM commands to run both frontend & backend workspaces in parallel during development:
    ```json
    "dev": "npm run dev --workspaces"
    ```
