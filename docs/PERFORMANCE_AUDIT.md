# FinTrack — Performance Audit Report

**Prepared By:** Chief Frontend & System Architect  
**Metrics Context:** React 19 Bundle + Hono Express Server Engine  
**Date:** June 9, 2026

---

## 1. Client-Side Rendering (CSR) Analysis

### 1.1 Unnecessary State Re-renders
*   **Assessment:** React 19 provides optimizations for state mutations. However, standard components (such as our core list items in transaction views) handle re-renders based on root state updates:
    *   State is managed globally in `/src/pages/Transactions.tsx` utilizing standard React Hook assignments. Changes like typing a search string can cause the entire ledger table (which may contain hundreds of records) to re-render.
*   **Recommendation:** Wrap row components in `React.memo` or use `useMemo` hooks to cache processed and filtered arrays:
    ```typescript
    const processedList = useMemo(() => {
      return transactions.filter(t => t.description.includes(searchTerm));
    }, [transactions, searchTerm]);
    ```

---

### 1.2 Bundle Size & Chunking Strategies
*   **Assessment:** The application is built using Vite v6.2.0. Large third-party libraries (specifically `recharts`, `lucide-react`, and `@supabase/supabase-js`) are bundled into a single massive javascript file on initial build:
    *   `recharts` is a fantastic tool for visualization but has a relatively high bundle size. It is imported entirely, even if we only use simple area curves and grid charts.
*   **Recommendation:** Implement dynamic lazy imports (`React.lazy`) or route-based code splitting so users do not load heavy charting modules until they navigate past the home page.
    ```typescript
    const Dashboard = React.lazy(() => import('./pages/Dashboard'));
    ```

---

## 2. Server-Side Execution & Network Latency

### 2.1 The Native Hono-Express Bridge Latency
*   **Assessment:** When serving api routes, requests traverse two middleware routers:
    1.  The parent Express routing frame (captures request body and generates standard JS Requests).
    2.  The internal Hono App execution router (`app.fetch(honoRequest)` inside `/server.ts`).
*   **Analysis:** This pipeline adds CPU parsing overhead and garbage collection cycles on every single API request, increasing response latency.
*   **Recommendation:** Migrate endpoints to a clean Express middleware model or run Hono standalone on port 3000 using `@hono/node-server` to eliminate the bridge layer entirely.

### 2.2 Serial Database Fetches
*   **Assessment:** On initial Dashboard mount, the client issues multiple parallel REST queries to Supabase. While the promises are asynchronous, they run over separate HTTP channels:
    1.  Fetch Transactions
    2.  Fetch Categories
    3.  Fetch Budgets
*   **Recommendation:** Consolidate these queries. Create a unified endpoint `/api/dashboard/summary` that performs bulk queries inside PostgreSQL and returns a single, neatly structured payload. This slashes round-trip latency and improves mobile load times.
