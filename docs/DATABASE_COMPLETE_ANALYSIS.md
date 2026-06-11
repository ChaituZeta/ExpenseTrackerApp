# FinTrack — Database Architecture & Schema Deep-Dive

This document details the Supabase PostgreSQL database architecture, custom SQL routines, Row Level Security (RLS) mechanisms, and the entity relationship structure.

---

## 1. Entity Relationship Diagram (ERD)

```
  +------------------+
  |    auth.users    |
  +--------+---------+
           |
           | 1
           |
           | 1
  +--------v---------+                    +------------------+
  | public.profiles  |<-------------------|   public.otps    |
  +----+---+---------+ 1                  +------------------+
       |   |                               (No explicit FK)
       | 1 | 1
       |   |
       |   +-----------------------+
       |                           |
       | *                         | *
+------v--------+           +------v--------+
|  categories   |<----------|    budgets    |
+------+--------+ 1         +---------------+
       |                      * (FK user_id, category_id)
       |
       | * (FK category_id)
+------v--------+
| transactions  |
+---------------+
  * (FK user_id)
```

---

## 2. Table Schemas & Constraints

### 2.1 Table: `profiles`
*   **Purpose:** Houses personal preference attributes linked to auth logins.
*   **Columns:**
    *   `id`: `UUID` (Primary Key, Foreign Key -> `auth.users.id` ON DELETE CASCADE)
    *   `email`: `VARCHAR(191)` (Unique, Not Null)
    *   `name`: `TEXT`
    *   `phone`: `TEXT`
    *   `role`: `TEXT` (Default: `'user'`, CHECK constraint: `role IN ('user', 'admin')`)
    *   `avatar_url`: `TEXT`
    *   `currency`: `TEXT` (Default: `'₹'`)
    *   `created_at`: `TIMESTAMPTZ` (Default: `NOW()`)
    *   `updated_at`: `TIMESTAMPTZ` (Default: `NOW()`)

### 2.2 Table: `categories`
*   **Purpose:** Customizable ledger categories.
*   **Columns:**
    *   `id`: `BIGINT` (Primary Key, Identity)
    *   `user_id`: `UUID` (Foreign Key -> `auth.users.id` ON DELETE CASCADE)
    *   `name`: `TEXT` (Not Null)
    *   `type`: `TEXT` (Not Null, CHECK: `type IN ('income', 'expense', 'adjustment')`)
    *   `icon`: `TEXT` (Lucide identifier string)
    *   `color`: `TEXT` (Hex code)
    *   `created_at`: `TIMESTAMPTZ` (Default: `NOW()`)

### 2.3 Table: `transactions`
*   **Purpose:** Primary ledger of balance entries.
*   **Columns:**
    *   `id`: `BIGINT` (Primary Key, Identity)
    *   `user_id`: `UUID` (Foreign Key -> `auth.users.id` ON DELETE CASCADE)
    *   `category_id`: `BIGINT` (Foreign Key -> `categories.id` ON DELETE SET NULL)
    *   `amount`: `DECIMAL(12,2)` (Not Null)
    *   `type`: `TEXT` (Not Null, CHECK: `type IN ('income', 'expense', 'adjustment')`)
    *   `description`: `TEXT`
    *   `date`: `DATE` (Default: `CURRENT_DATE`)
    *   `created_at`: `TIMESTAMPTZ` (Default: `NOW()`)

### 2.4 Table: `budgets`
*   **Purpose:** Target spending thresholds.
*   **Columns:**
    *   `id`: `BIGINT` (Primary Key, Identity)
    *   `user_id`: `UUID` (Foreign Key -> `auth.users.id` ON DELETE CASCADE)
    *   `category_id`: `BIGINT` (Foreign Key -> `categories.id` ON DELETE CASCADE)
    *   `amount`: `DECIMAL(12,2)` (Not Null)
    *   `month`: `TEXT` (Not Null, Format: `YYYY-MM`)
    *   `created_at`: `TIMESTAMPTZ` (Default: `NOW()`)
    *   *Constraint:* `UNIQUE (user_id, category_id, month)` prevents multiple budgets for the same category and month.

### 2.5 Table: `activity_logs`
*   **Purpose:** Track actions taken throughout the app.
*   **Columns:**
    *   `id`: `BIGINT` (Primary Key, Identity)
    *   `user_id`: `UUID` (Foreign Key -> `auth.users.id` ON DELETE SET NULL)
    *   `user_name`: `TEXT`
    *   `action`: `TEXT` (Not Null)
    *   `details`: `TEXT`
    *   `created_at`: `TIMESTAMPTZ` (Default: `NOW()`)

### 2.6 Table: `otps`
*   **Purpose:** Verifies single-use coordinates for password resets.
*   **Columns:**
    *   `email`: `TEXT` (Primary Key)
    *   `otp`: `TEXT` (Not Null, 6-digit numeric string)
    *   `expires_at`: `TIMESTAMPTZ` (Not Null)
    *   `created_at`: `TIMESTAMPTZ` (Default: `NOW()`)

---

## 3. Indexes & Constraints Optimization

To optimize query speeds, the system uses custom indexes on common query boundaries:
*   `b_idx_user_cat_month`: Unique, multi-column composite index on `budgets(user_id, category_id, month)`.
*   `t_idx_user_date`: Complex index sorting transactions matching indices: `transactions(user_id, date DESC)`.
*   `c_idx_user`: Indexes categories by owner: `categories(user_id)`.

---

## 4. Custom Database Functions & Active Triggers

### 4.1 Function: `public.is_admin()`
Evaluates whether the requesting user is an administrator:
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 Function: `public.handle_new_user()` & Active Trigger
Automatically provisions user profiles upon registrations within the internal Supabase engine:
```sql
-- Procedure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, currency)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    CASE WHEN new.email = 'cbogineni@gmail.com' THEN 'admin' ELSE 'user' END,
    '₹'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Setup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 5. Row Level Security (RLS) Policy Guide

Rather than restricting database accesses inside code queries, the platform applies fine-grained PostgreSQL policies natively:

| Table Name | Policy Name | Operation Scope | Condition Checked |
| :--- | :--- | :--- | :--- |
| **profiles** | "Self Read access" | SELECT | `auth.uid() = id` |
| **profiles** | "Administrative access" | SELECT | `public.is_admin()` |
| **profiles** | "Administrative writes" | UPDATE | `public.is_admin()` |
| **categories** | "Personal control" | ALL (CURD) | `auth.uid() = user_id` |
| **transactions**| "Personal transactions control"| ALL (CURD) | `auth.uid() = user_id` |
| **budgets** | "Personal budgets control" | ALL (CURD) | `auth.uid() = user_id` |
| **activity_logs**| "Administrative review" | SELECT | `public.is_admin()` |
