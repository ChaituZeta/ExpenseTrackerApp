# Changelog

All notable changes to this project will be documented in this file.

## [Phase 7] - 2026-06-11

### Added
- Implemented `GET /api/health` providing real-time status, version, and database validation (`connected`/`disconnected`).
- Added robust, automated Request Logger middleware to Hono tracking HTTP verbs, path variables, status codes, and execution duration.
- Created active startup diagnostics inside `server.ts` logging environment flags, port allocations, and dependencies state.
- Integrated structured error telemetry inside global server handlers.
- Documented operational and monitoring designs inside `/docs/deployment/PRODUCTION_MONITORING.md`.

## [Phase 6] - 2026-06-09

### Added
- Created complete Vercel serverless staging guidelines and verification profiles.
- Added `/docs/deployment/VERCEL_STAGING_CHECKLIST.md` detailing staging environment variables, build outputs, and risks safeguards.

## [Phase 5] - 2026-06-09

### Added
- Configured a comprehensive testing suite utilizing **Vitest** for isolated, mock-driven validation.
- Engineered 11 distinct test files covering 30 separate Unit, Integration, and full End-to-End simulation cases.
- Installed `@vitest/coverage-v8` for test suite analytics, achieving **41.72% Statement Coverage** and **43.85% Line Coverage**.
- Created standardized Docker environment configurations (`docker/Dockerfile`, `docker/docker-compose.yml`, and `docker/.dockerignore`) bound natively to container PORT 3000.
- Formulated an exhaustive application Deployment Readiness Audit report detailing target environments, risks, and deployment checklists.
- Added comprehensive walkthrough guidelines for deploying on Vercel, Hostinger VPS, Docker, and local workstation clusters inside `/docs/deployment/`.

## [Phase 4] - 2026-06-09

### Changed
- Centralized all frontend database access inside `/frontend/src/lib/api.ts` to call backend proxy endpoints instead of querying Supabase directly.
- Migrated 18 direct database queries utilizing `supabase.from()` to standardized HTTP network fetch calls against enterprise-grade Hono backend routes `/api/*`.
- Retained temporary frontend client usage of `supabase.auth` and state change listener subscriptions (`onAuthStateChange()`) untouched.

### Added
- Created backend endpoint `PUT /api/admin/users/:id` for administration update actions.
- Created backend endpoint `DELETE /api/admin/users/:id` for administration deletion actions.
- Created backend endpoint `POST /api/budgets/upsert` for multi-constraint budget uploads on conflict.

### Security & Verification
- Confirmed zero direct database connection instances `supabase.from()` on the client application.
- Verified live Supabase deployment status is untouched and safe. No schema migrators or direct DDL/DML SQL scripts executed.
- Confirmed production compilation build succeeds gracefully.
- Confirmed full static code lint analysis passes cleanly.
