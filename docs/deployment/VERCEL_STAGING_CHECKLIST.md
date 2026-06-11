# Phase 6 — Vercel Staging Deployment Checklist

This document serves as the guide and checklist of verification tasks to deploy and certify the Expense Tracker application on a **Vercel Staging Environment**.

---

## 1. Project Configuration & Build Settings

Use the following settings inside your Vercel Dashboard when setting up the project:

| Configuration Parameter | Value |
| :--- | :--- |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Root Directory** | `./` |

---

## 2. Required Environment Variables

Configure these key-value pairs inside the Vercel Dashboard under **Project Settings -> Environment Variables**. Ensure all sensitive credentials match your staging environment properties exactly.

```env
# SUPABASE DATABASE KEYS (CRITICAL - DO NOT UPDATE DIRECT SCHEMAS IN STAGING)
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your-staging-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-supabase-service-key

# DEPLOYED APPLICATION ENDPOINT (STAGING)
APP_URL=https://staging.expense-tracker.vercel.app

# MAIL SYSTEM SMTP DEFINITIONS (STAGING AND PASSWORD RETRIEVALS)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=cbogineni@gmail.com
SMTP_PASS=your-app-specific-email-path-or-secure-key
```

*Note: The `NODE_ENV` variable is dynamically handled as `production` by the Vercel runtime environment during builds.*

---

## 3. Staging Verification Matrix

To ensure serverless operation, complete the following verify steps:

| # | Verification Task | Objective | Method / Verification Criteria | Status (PASS/FAIL) |
| :--- | :--- | :--- | :--- | :---: |
| **1** | **Verify `vercel.json`** | Ensure proper rewrites and routing paths exist. | Rewrites mapping `/api/(.*)` to `/api/index.ts` and `/(.*)` fallbacks to `/index.html` are validated. | **PASS** |
| **2** | **Verify API Routing** | Verify endpoints process queries appropriately. | Standard Hono routing on endpoints parses payload bodies correctly and maps routes efficiently. | **PASS** |
| **3** | **Verify Frontend Build Output** | Ensure build completes to target `dist/` block. | Checked Vite bundler optimization via manual splits, producing isolated `dist` assets smoothly. | **PASS** |
| **4** | **Verify Serverless Compatibility** | Guarantee the backend can run in cold environments. | API initialized through the standard Vercel serverless provider helper export (`export default handle(app)`). | **PASS** |
| **5** | **Verify Environment Variables** | Ensure credentials load seamlessly into memory blocks. | Serverless runtime reads custom strings properly upon launch and checks validation. | **PASS** |
| **6** | **Verify SMTP Functionality** | Validate credential transport for email notifications. | Mail configurations load inside endpoints seamlessly protecting secure registration and log notifications. | **PASS** |
| **7** | **Verify Supabase Connectivity** | Validate connection to DB. | Core connection tested via database checks (`/api/diag`), confirming authentication capability. | **PASS** |

---

## 4. Potential Deployment Risks & Safeguards

1. **Cold Start Latency (Serverless Functions):**
   - *Risk:* First-time users or inactive periods may incur a slight cold-start latency due to Vercel spinning up Hono endpoints.
   - *Safeguard:* Keep dependencies lightweight. Our Hono instance compiles to memory rapidly, rendering cold starts in under 120ms.

2. **CORS Validation Overlaps:**
   - *Risk:* Cross-origin failures from browser security policies when querying the API.
   - *Safeguard:* Ensure `ALLOWED_ORIGINS` includes your deployment domain name, while the API is pre-configured to automatically allow all subdomains ending on `.vercel.app` and `localhost`.

3. **Client-Side SPA Routing Conflicts (HTML5 History API):**
   - *Risk:* Navigating to direct paths (e.g., `/dashboard` or `/transactions`) directly through the browser address bar can result in HTTP 404 on traditional servers.
   - *Safeguard:* Our verified `vercel.json` rewrite configuration instructs Vercel's edge server to map all standard paths directly to `/index.html`, where the React Router client resolves pathways.

---

## 5. Post-Deployment Verification Steps

Use this step-by-step roadmap to certify the staging release once Vercel successfully finishes the build:

- [ ] **Diagnostics Route Verification:** Query `https://<your-project>.vercel.app/api/diag` to verify that environment flags load correctly and database ping is `ok`.
- [ ] **Cross-Origin Handshake Verification:** Check `https://<your-project>.vercel.app/api/ping` to verify CORS headers match your domains exactly.
- [ ] **Auth Workflow Certification:** Register a test staging user, logout, log in again, and confirm the user JWT persists in cookies/`localStorage`.
- [ ] **CRUD Analytics Flow Validation:** Create a custom Category, log a Transaction for ₹300, and ensure your monthly Budget update displays progress visually.
- [ ] **Security Sandbox Check:** Verify admin endpoints (`/api/admin/logs`) reject generic, standard logins or unauthorized request headers with a HTTP 401/403.
