# FinTrack — Changelog Reference

This document tracks all version iterations, technical upgrades, and security fixes implemented across the FinTrack platform.

---

## [2.2.0] - 2026-06-09
### Added
*   **Controller-Service-Repository Layers**: Decoupled the entire backend into isolated architectural boundaries under `/backend/src/controllers`, `/backend/src/services`, and `/backend/src/repositories`.
*   **Encapsulated Supabase Query Engine**: Created a unified database factory in `/backend/src/repositories/SupabaseClient.ts` and encapsulated 31 unique queries across dedicated repository classes, keeping Supabase communication completely separated from routing endpoints.
*   **Consolidated Workflows & Emails**: Implemented centralized operations for account signups, resetting credentials, administrative sync routines, and error thresholds under dedicated Service classes, introducing a reusable `/backend/src/services/EmailService.ts`.
*   **Unified Request Handlers**: Converted raw endpoints on `/backend/src/api/index.ts` to forward incoming connections to dedicated Controller classes, enforcing uniform Zod checks and token/admin-level permission checks.
*   **Promise Timeout Utility**: Centralized promise expiration boundaries inside `/backend/src/utils/timeout.ts` to gracefully manage API operation limits.

---

## [2.1.0] - 2026-06-09
### Changed
*   **Directory Layout Reorganization**: Transitioned the repository to a decoupled, production-ready structure cleanly separating frontend, backend, and database resources.
*   **Frontend Modularization**: Consolidated all React components, router definitions, and styling resources under `/frontend/src` and public assets under `/frontend/public`.
*   **Backend Relocation**: Consolidated the Hono API routes, Nodemailer configurations, and server scripts under `/backend/src`.
*   **Database Schema Preservation**: Categorized DDL files under `/database/schemas/` without executing any SQL migrations or making any database schema or table modifications.
*   **Build & Compiler Realignment**: Re-mapped paths inside `vite.config.ts`, `tsconfig.json`, `index.html`, and `scripts/build-server.js` while maintaining flawless root-level compile and lint passes.

---

## [2.0.4] - 2026-06-09
### Added
*   **Environment Validation Config**: Introduced `/backend/src/config/env.ts` utilizing Zod validation, ensuring a fail-safe application startup if required database or SMTP credentials are unconfigured.
*   **Secure Input Sanitization via Zod**: Added structured validation constraints on `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/logs/create`, and `/api/admin/create-user`.
*   **Dynamic CORS Mapping**: Designed real-time check validations matching origins against comma-separated white-lists, while allowing developers access from `localhost` and `*.vercel.app` testing branches.

### Changed
*   **Removed Hardcoded Credentials**: Eliminated all plaintext fallbacks for Supabase connection endpoints, Service Roles, SMTP host addresses, port parameters, and Gmail passwords.

---

## [2.0.3] - 2026-06-09
### Added
*   **Master Project Discovery & Architecture Audit**: Generated a comprehensive suite of 13 system manuals mapping out folder inventories, dependency metrics, client/server routing layouts, detailed database schemas, security audit logs, Vercel readiness matrices, MySQL migrations, and progressive decoupling plans.
*   Documented system dependencies to identify and flag unused, dead, and duplicate packages.

---

## [2.0.2] - 2026-06-09
### Added
*   Highly responsive search filter mechanism inside the **Categories Page** allows lookups of custom metadata icons in real-time.
*   Comprehensive suite of documentation schemas detailing API layouts, security profiles, performance audits, and project restructuring roads.
*   Capacitor dynamic config setups for cross-compiling high-fidelity native layouts.

### Changed
*   Clean path checks within API proxy blocks prioritize Capacitor configurations over browser routes to ensure native Android systems route API calls correctly.

---

## [2.0.1] - 2026-05-27
### Added
*   Integrate full-stack ionic capacitor frameworks creating a dynamic standalone workspace.
*   Created custom synchronizing task engines copying built assets natively inside local gradle folders.

### Fixed
*   Resolved complex environment resolution issues on client-side Supabase systems, prioritizing production URLs over hardcoded configurations.

---

## [2.0.0] - 2024-11-20
### Added
*   Bootstrap Hono API with full-stack endpoints for system registers and audits.
*   Enable administrative boards managing global logs and registers.
*   Row-Level security profiles on Postgres database databases.
