# FinTrack — Vercel Serverless Readiness Report

This report evaluates FinTrack's compatibility with serverless deployments on **Vercel**, identifies architectural risks, and provides a target readiness score.

---

## 1. Readiness Audit Metrics & Final Score

### Vercel Serverless Hosting Score: 85/100

| Evaluation Metric | Status | Risk Rating | Architectural Impact |
| :--- | :--- | :--- | :--- |
| **Serverless API Routing** | Fully Compatible | None | Hono routes cleanly to `/api/index.ts` using `handle(app)`. |
| **Asset Delivery** | Fully Compatible | None | Vite static compiler bundles React into `/dist` seamlessly. |
| **File Writing Limits** | **Incompatible** | **High** | Under serverless containers, standard file systems are read-only. |
| **Execution Delay Tolerance**| **Risky** | **Medium** | Vercel enforces a 10s gateway limit on Hobby subscriptions. |
| **Standalone Bypass** | Configured | None | Vercel's edge routers bypass `/server.ts` entirely. |

---

## 2. Identified Blockers & Mitigation Roadmap

### 2.1 Blocker: Read-Only Filesystem Violations (`server.ts` line 16)
*   **The Issue:** The Express wrapper uses `fs.appendFileSync` to write startup debugging info directly to the current working directory (`startup_debug.txt`). This will cause immediate crashes on Vercel as the host filesystem is strictly read-only.
*   **The Solution:** Wrap log systems in safe try-catch blocks or check environments on startup:
    ```typescript
    const log = (msg: string) => {
      console.log(msg);
      try {
        if (process.env.NODE_ENV !== "production") {
          fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
        }
      } catch (e) {
        // Silently capture write-exceptions in read-only environments
      }
    };
    ```

### 2.2 Blocker: Severe Gateways Limits (10s Timeouts)
*   **The Issue:** Vercel Hobby subscriptions terminate functions that take longer than 10 seconds. In modern cold-starts (Supabase DB spin-ups combined with SMTP handshakes), register/login API calls occasionally exceed this limit, leading to 504 Gateway Timeouts.
*   **The Solution:** Optimize active requests by separating tasks:
    1.  Dispatch welcome email actions as non-blocking background routines.
    2.  Use lightweight database schemas and verify connection timeouts inside `/api/index.ts`.

### 2.3 Blocker: Secondary Wrapper Server Bypass (`/server.ts`)
*   **The Issue:** Vercel natively redirects `/api/*` traffic straight to `/api/index.ts` as specified in `/vercel.json`. This bypasses Express (`/server.ts`) entirely in production, meaning any custom Express middleware, signatures, or startup routines will not execute on Vercel.
*   **The Solution:** Shift trace logic, CORS settings, and environment variables validation directly into our Hono API file `/api/index.ts`. This ensures consistent behavior across both server architectures.
