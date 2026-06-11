# FinTrack — Progressive Development Roadmap

This roadmap schedules our technical milestones, product features, security upgrades, and migration paths over consecutive development quarters.

```
  Q1: Hardening & Clean      Q2: SQL Migration       Q3: Modular Separations    Q4: Mobile Offline Sync
+----------------------+   +-------------------+   +-----------------------+   +-----------------------+
| - Remove plaintext   |   | - Provision MySQL |   | - Create /frontend    |   | - IndexedDB storage   |
| - Setup strict CORS  |   | - Custom JWT Auth |   | - Create /backend     |   | - Synchronize queues  |
| - Add Zod payloads   |   | - Schema imports  |   | - Standalone builds   |   | - Native alerts       |
+----------------------+   +-------------------+   +-----------------------+   +-----------------------+
```

---

## Phase 1: Security Hardening (Short Term)
*   **Remove Plaintext Secrets:** Strip hardcoded credentials from `/api/index.ts` and set up immediate environment variable validation on server startup.
*   **Strict CORS Policy:** Replace the global CORS wildcard (`*`) with an environment-driven domain allow-list.
*   **Input Request Validation:** Implement `zod` schema checks across all POST endpoints (specifically user registration and transaction logging) to prevent SQL injections and malformed payloads.

---

## Phase 2: Supabase to MySQL Migration (Medium Term)
*   **Database Provisioning:** Deploy a robust, scalable cloud-hosted MySQL 8 server and execute our pre-validated DDL schema.
*   **Native Authorization Engine:** Implement custom auth routing inside our Express/Hono API using `bcryptjs` and `jsonwebtoken`. This completely replaces our dependency on Supabase Auth.
*   **Safe Data Migration:** Run data transform scripts to export existing Supabase tables (categories, transactions, budgets) into clean, MySQL-compliant CSV formats and import them securely.

---

## Phase 3: Modular Restructuring (Medium-Long Term)
*   **Directory Split:** Reorganize the flat repository structure into isolated `/frontend` and `/backend` containers to separate client and server code.
*   **Targeted Build Optimization:** Configure separate build systems for frontend assets (using Vite) and backend controllers (using esbuild), each with its own focused `package.json` configurations.
*   **Native App Packaging:** Point Capacitor and native wrappers to copy resources from the new `/frontend/dist` directory.

---

## Phase 4: Local Offline Synchronization (Long Term)
*   **Local Ledger Cache:** Integrate local browser storage (such as `IndexedDB` or SQLite) inside the React client.
*   **Offline Transaction Logging:** Support user actions offline (creation of categories, logging transactions) when native bridges detect lost cellular connections.
*   **Auto-Sync Background Engine:** Build an automatic background sync system that pushes queued offline transactions to the remote MySQL database once internet connectivity is restored.
