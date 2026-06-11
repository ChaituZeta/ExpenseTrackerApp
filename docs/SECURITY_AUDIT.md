# FinTrack — Security Audit Report

**Prepared By:** AppSec Technical Lead  
**Audit Target:** Codebase v2.0.2  
**Date:** June 9, 2026

---

## 1. Vulnerability Registry (Criticality Scale)

### 1.1 [CRITICAL] High-Exposure Token Plaintext Fallbacks
*   **Location:** `/api/index.ts` (lines 41-43, 61-63)
*   **Vulnerability:** If Supabase configurations or SMTP definitions are omitted from ambient cloud variables, the application gracefully degrades back to hardcoded production endpoints and direct credentials.
*   **Details:**
    ```typescript
    const url = envUrl || 'https://poeyhgmbbpovbmonoeqi.supabase.co';
    const anon = envAnon || 'eyJhbGciOiJIUzI1NiIsInR5cCI6...';
    // SMTP credentials
    user: process.env.SMTP_USER || "cbogineni@gmail.com",
    pass: process.env.SMTP_PASS || "zmel ckmu jfqn pqwc",
    ```
    An attacker can compile this source code, extract active Gmail app-passcodes and database schemas, execute unauthorized transactions, block genuine accounts, or fetch internal tables.
*   **Remediation:** Remove plain text string literals. Standardize on immediate runtime crash patterns if environment variables are not loaded:
    ```typescript
    if (!process.env.SUPABASE_URL) {
      throw new Error("CRITICAL: SUPABASE_URL environment variable is missing.");
    }
    ```

---

### 1.2 [HIGH] Lack of Cryptographic Verification on Hono API Bridge
*   **Location:** `/server.ts` (lines 36-78)
*   **Vulnerability:** The Express wrapper bridges active requests onto internal Hono endpoints without performing signature matching or local CORS filtering, permitting rogue administrative access if someone queries the Express endpoint from the open web directly.
*   **Remediation:** Enforce cryptographic authorization checking at the edge of `/server.ts` or route API traffic exclusively through an authenticated secure gateway.

---

### 1.3 [MEDIUM] Direct CORS Wildcard Access (`*`)
*   **Location:** `/api/index.ts` (lines 27-33)
*   **Vulnerability:** Hono applies a blanket wild CORS policy allowing standard requests from any origin:
    ```typescript
    app.use('*', async (c, next) => {
      c.header('Access-Control-Allow-Origin', '*');
      ...
    });
    ```
    This leaves users susceptible to cross-origin data stealing models if browser sessions do not completely clear security tokens upon tab closure.
*   **Remediation:** Explicitly list authorized domains (e.g., `https://fintrack.app` or specific development origins) inside dynamic environment records instead of the blanket wildcard.

---

### 1.4 [MEDIUM] Lack of Database Constraint validations on Input Schemas
*   **Location:** `/api/index.ts` `/api/auth/register` (lines 204-244) & `/api/admin/create-user` (lines 423-492)
*   **Vulnerability:** Standard request inputs (`JSON.parse` outputs or parsed request strings) are directly assigned into query structures without checking for type limits, potential length overrides, or script insertion elements.
*   **Remediation:** Integrate validator libraries (such as `zod` or local checking rules) to ensure fields like `name`, `phone`, and `email` strictly adhere to safe structures.

---

### 1.5 [LOW] Client Token Expiry and Session Refresh Handlers
*   **Location:** `/src/App.tsx` (lines 47-81)
*   **Vulnerability:** The UI listens to `onAuthStateChange`. A failsafe logout calls local routines upon `TOKEN_REFRESH_FAILED`. However, browser sessionStorage remains vulnerable to diagnostic sniffing if someone leaves the account open in a shared environment.
*   **Remediation:** Set session configuration explicitly with short-lived tokens and secure cookie state patterns in backend session contexts.

---

## 2. Secure Code Hardening Cheat Sheet

| Threat Vector | Current Status | Hardened Native Code Example |
| :--- | :--- | :--- |
| **Secrets Exposure** | Hardcoded literals | `const apiKey = process.env.API_KEY || throw new Error("Missing Key");` |
| **API Origin Guarding** | Open Wildcard (`*`) | `c.header('Access-Control-Allow-Origin', allowedOrigin);` |
| **Payload Injections** | Parsed directly | Use explicit type guards and validate payload parameters before pass-through. |
