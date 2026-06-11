# FinTrack — Security Deep Audit Report

This report evaluates potential security vulnerabilities in Codebase v2.0.2 / v2.0.4, analyzing issues by severity and documenting mitigation progress.

> **Status Alert (2026-06-09):** The critical vulnerability vectors identified in Codebase v2.0.2 have been completely resolved in v2.0.4. Plaintext fallbacks are fully removed, Zod schemas enforce structured payload constraints, and CORS headers use environment-based matching.

---

## 1. Vulnerability Registry (Security Risk Metrics)

### 1.1 CRITICAL: Hardcoded Production Fallback Credentials
*   **Vulnerability Location:** `/api/index.ts` (lines 41-43, 61-63)
*   **Vulnerability Description:** If dynamic environment configuration variables cannot be loaded on server boot, the application falls back to direct plaintext Supabase URL indices, administrative anon keys, and dynamic Google SMTP Gmail configurations.
*   **Detailed Risk Analysis:** An attacker could easily extract these values, gain full administrative access to the database, manipulate transactions, extract client PII, or exploit the Gmail SMTP credentials to send phishing emails.
*   **Complexity to Exploit:** Low (Relies on basic decompilation).
*   **Targeted Remediation Code Code Fix:**
    ```typescript
    // Enforce instant runtime errors on startup instead of fallback literals
    const getSupabase = (c: any, isAdminAction = false) => {
      const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!url || !anon) {
        throw new Error("SECURE_CRITICAL_BOOT_ERROR: Missing Supabase datastore configurations.");
      }

      if (isAdminAction) {
        if (!service) throw new Error("SECURE_CRITICAL_BOOT_ERROR: Missing Service Role credentials.");
        return createClient(url, service, { auth: { persistSession: false } });
      }

      return createClient(url, anon, { auth: { persistSession: false } });
    };
    ```

---

### 1.2 HIGH: Express-to-Hono Bridge Signature Lack
*   **Vulnerability Location:** `/server.ts` (lines 36-78)
*   **Vulnerability Description:** The Express entry point pipes all raw `/api/*` requests directly to Hono's `app.fetch()`. However, Hono does not verify that the request originated from the local Express instance, exposing the Hono endpoint directly to the open web.
*   **Detailed Risk Analysis:** Exploiting this gap allows attackers to bypass Express routing entirely, perform unauthorized queries, or manipulate transactional variables directly on Hono's ports.
*   **Complexity to Exploit:** Medium.
*   **Targeted Remediation Code Code Fix:**
    Enforce microservice authorization handshakes or inject unique secret signature headers in the local proxy bridge:
    ```typescript
    // Inside server.ts (Express proxy bridge)
    const BRIDGE_SECRET = process.env.BRIDGE_SECRET_KEY || "fallback_high_entropy_token";
    headers.set('X-Bridge-Signature', BRIDGE_SECRET);

    // Inside api/index.ts (Hono router middleware)
    app.use('/api/*', async (c, next) => {
      const signature = c.req.header('X-Bridge-Signature');
      if (signature !== process.env.BRIDGE_SECRET_KEY) {
        return c.json({ error: "Access Denied: Rogue Direct Request Intercepted" }, 403);
      }
      await next();
    });
    ```

---

### 1.3 MEDIUM: Open CORS Wildcard Settings
*   **Vulnerability Location:** `/api/index.ts` (lines 27-33)
*   **Vulnerability Description:** Hono applies a blanket wild CORS policy allowing standard requests from any origin:
    ```typescript
    app.use('*', async (c, next) => {
      c.header('Access-Control-Allow-Origin', '*');
      ...
    });
    ```
*   **Detailed Risk Analysis:** Permitting access from any endpoint exposes users to cross-site scripting (XSS) vectors and cross-site request forgery (CSRF) data-stealing schemes.
*   **Complexity to Exploit:** Medium.
*   **Targeted Remediation Code Code Fix:**
    Map explicitly authorized domains using environment-configured origin lists:
    ```typescript
    const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['https://fintrack.app', 'http://localhost:3000'];

    app.use('*', async (c, next) => {
      const origin = c.req.header('Origin');
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        c.header('Access-Control-Allow-Origin', origin);
      }
      c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (c.req.method === 'OPTIONS') return c.text('', 204);
      await next();
    });
    ```

---

### 1.4 MEDIUM: Missing Schema Input Sanitization or Type Checks
*   **Vulnerability Location:** `/api/index.ts` (Registration and user invitation endpoints)
*   **Vulnerability Description:** Accepts input values directly into logic execution parameters without verifying data structural formats (such as validating email addresses, string limits, etc.).
*   **Detailed Risk Analysis:** Attackers could exploit this gap by injecting excessively long values or malicious script payloads into text fields (e.g., profiles names, transaction descriptions), leading to potential Cross-Site Scripting (XSS) risks.
*   **Complexity to Exploit:** Low.
*   **Targeted Remediation Code Code Fix:**
    Initialize **Zod** validation checks before piping data to Supabase:
    ```typescript
    import { z } from 'zod';

    const RegisterSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1).max(100),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional()
    });

    app.post('/api/auth/register', async (c) => {
      const rawBody = await c.req.json().catch(() => ({}));
      const parseResult = RegisterSchema.safeParse(rawBody);
      if (!parseResult.success) {
        return c.json({ error: "Invalid Payload", details: parseResult.error.format() }, 400);
      }
      // Continue execution with sanitized variables: parseResult.data
    });
    ```
