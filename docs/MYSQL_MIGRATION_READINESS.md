# FinTrack — MySQL Migration Architectural Impact Report

This document audits the system's dependencies on **Supabase (PostgreSQL)**, highlights potential disruption points when migrating to a self-hosted **MySQL** database, and estimates overall implementation effort.

---

## 1. Migration Complexity Profile

### Migration Complexity Score: 90/100 (Very High)

The current frontend uses a hybrid architecture that queries Supabase directly for standard CRUD operations (transactions, categories, budgets, and summaries) while routing edge operations (auth, mail OTPs, and admin controls) through the backend API.

Migrating to MySQL is highly complex because **all client-side direct database queries must be redirected through the Hono API**, as client browsers cannot query MySQL port sockets directly.

```
CURRENT DIRECT ARCHITECTURE (Direct Client Queries):
[ Client Browser React ] ===( Direct Client Queries )===> [ Supabase DB (PostgreSQL) ]

TARGET MYSQL ARCHITECTURE (Restructured Routing API):
[ Client Browser React ] ===( API Requests )===> [ Hono REST API ] ===> [ MySQL DB Server ]
```

---

## 2. Supabase Dependencies & Vulnerabilities Map

If Supabase is decoupled, the following active interfaces will break immediately:

### 2.1 The Client-Side Session Engines (`App.tsx` & `supabase.ts`)
*   **The Dependency:** React's dynamic listener component:
    `supabase.auth.onAuthStateChange(async (event, session) => ...)`
*   **What Breaks:** When Supabase is deleted, native session detection, automatic token refreshes, and private route validations fail immediately.
*   **The Fix:** Build a custom React hook that stores local JWT authorization scopes in `localStorage` and periodically checks session expiration states against custom backend authentication endpoints.

### 2.2 Client-Side Direct Schema Queries (`src/lib/api.ts`)
*   **The Dependency:** Direct queries nested in categories, transactions, budgets, and analytical summarizers:
    `const { data, error } = await supabase.from('transactions').select('*')`
*   **What Breaks:** Direct database access from client browsers will cease immediately.
*   **The Fix:** Create corresponding REST endpoints inside `/api/index.ts` for all database operations, and rewrite the client-side actions in `/src/lib/api.ts` to call these Hono endpoints.

### 2.3 Row Level Security & Isolation Profiles
*   **The Dependency:** PostgreSQL RLS policies that automatically isolate tenant data based on token sub-claims.
*   **What Breaks:** MySQL 8 does not support native out-of-the-box RLS schemas.
*   **The Fix:** Enforce tenant isolation in the backend API. Every MySQL query in Hono must include explicit user filtering:
    `SELECT * FROM transactions WHERE user_id = ?;`

---

## 3. Required Schema DDL & Token Structure

We will deploy a custom MySQL schema to replace PostgreSQL capabilities. This schema will store hashed credentials using `bcrypt` and use `jsonwebtoken` to sign access sessions.

### 3.1 Custom MySQL Tables Setup
```sql
CREATE DATABASE IF NOT EXISTS fintrack;
USE fintrack;

-- 1. Users Credentials (Replaces Supabase Auth registry)
CREATE TABLE IF NOT EXISTS users_credentials (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Profiles Table 
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url VARCHAR(2048),
  currency VARCHAR(10) DEFAULT '₹',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users_credentials(id) ON DELETE CASCADE
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense', 'adjustment')),
  icon VARCHAR(100),
  color VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users_credentials(id) ON DELETE CASCADE
);
```
