# Deployment Guide: Local Workstation Development

Follow these steps to configure your local hardware workstation or temporary virtual cloud sandbox for execution.

---

## 1. Local Prerequisites
- **Node.js** v20.x or v22.x LTS installed.
- **npm** package manager installed.

Verify using:
```bash
node -v
npm -v
```

---

## 2. Bootstrapping Steps

1. Clone or download your application source tree.
2. Install all development and runtime dependencies:
   ```bash
   npm install
   ```

3. Setup environment configuration:
   ```bash
   cp .env.example .env
   # Update variables using any standard text editor
   ```

---

## 3. Testing Quality Gates

Run all Vitest integrations, unit, and E2E simulation suites cleanly:

```bash
# Execute standard tests
npm run test

# Inspect statement/line coverage percentages
npm run test:coverage
```

---

## 4. Launching the App
Depending on your intent, run one of the primary development or production cycles:

### Option A: Development Environment (Hot-reloaded)
Boot development server. This runs Node Hono with TypeScript file tracking:
```bash
npm run dev
```
Open a browser and navigate to `http://localhost:3000`.

### Option B: Production Environment (Optimized assets)
Build, compile, and run optimized static files and server entry points:
```bash
npm run build
npm run start
```
This serves unified assets from `dist/` and runs the backend process optimally on port `3000`.
