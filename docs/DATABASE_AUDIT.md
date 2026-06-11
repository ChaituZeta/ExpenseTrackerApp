# FinTrack — Database Audit Report

**Prepared By:** Database Engineering Lead  
**Engine:** Supabase (PostgreSQL 15+)  
**Date:** June 9, 2026

---

## 1. Relational Schema Blueprint

```
       +------------------+
       |    auth.users    | (Internal Supabase Auth Engine)
       +--------+---------+
                |
       +--------v---------+
       |     profiles     | (1-to-1 Profile Extension)
       +--------+---------+
                |
    +-----------+-----------+-----------------------+
    |           |           |                       |
+---v----+  +---v-----+  +--v---+            +------v--------+
|budgets |  |categories|  | otps |            | activity_logs |
+---+----+  +---+-----+  +------+            +---------------+
    |           |
    |     +-----v--------+
    +---->| transactions |
          +--------------+
```

### 1.1 Detailed Schema Inventory

#### Table 1: `profiles`
*   **Purpose:** Sync-point for user configurations and preferences linked to auth accounts.
*   **Columns:**
    *   `id`: `UUID` (Primary Key, Foreign Key -> `auth.users.id` ON DELETE CASCADE)
    *   `email`: `TEXT` (Unique, Not Null)
    *   `name`: `TEXT`
    *   `phone`: `TEXT`
    *   `role`: `TEXT` (Default: `'user'`, CHECK Constraint: `role IN ('user', 'admin')`)
    *   `avatar_url`: `TEXT`
    *   `currency`: `TEXT` (Default: `'₹'`)
    *   `created_at`: `TIMESTAMPTZ` (Default: `NOW()`)
    *   `updated_at`: `TIMESTAMPTZ` (Default: `NOW()`)

#### Table 2: `categories`
*   **Purpose:** Custom categorization tags for labeling transactions and assigning budgets.
*   **Columns:**
    *   `id`: `BIGINT` (Primary Key, Auto-increment Identity)
    *   `user_id`: `UUID` (Foreign Key -> `auth.users.id` ON DELETE CASCADE)
    *   `name`: `TEXT` (Not Null)
    *   `type`: `TEXT` (Not Null, CHECK: `type IN ('income', 'expense', 'adjustment')`)
    *   `icon`: `TEXT` (Lucide-react icon identifier)
    *   `color`: `TEXT` (Hex code color string)
    *   `created_at`: `TIMESTAMPTZ` (Default: `NOW()`)

#### Table 3: `transactions`
*   **Purpose:** Primary ledger for financial logging.
*   **Columns:**
    *   `id`: `BIGINT` (Primary Key, Identity)
    *   `user_id`: `UUID` (Foreign Key -> `auth.users.id` ON DELETE CASCADE)
    *   `category_id`: `BIGINT` (Foreign Key -> `categories.id` ON DELETE SET NULL)
    *   `amount`: `DECIMAL(12,2)` (Not Null)
    *   `type`: `TEXT` (Not Null, CHECK: `type IN ('income', 'expense', 'adjustment')`)
    *   `description`: `TEXT`
    *   `date`: `DATE` (Default: `CURRENT_DATE`)
    *   `created_at`: `TIMESTAMPTZ` (Default: `NOW()`)

#### Table 4: `budgets`
*   **Purpose:** Set monthly limits on categorical consumption categories.
*   **Columns:**
    *   `id`: `BIGINT` (Primary Key, Identity)
    *   `user_id`: `UUID` (Foreign Key -> `auth.users.id` ON DELETE CASCADE)
    *   `category_id`: `BIGINT` (Foreign Key -> `categories.id` ON DELETE CASCADE)
    *   `amount`: `DECIMAL(12,2)` (Not Null)
    *   `month`: `TEXT` (Not Null, Format: `YYYY-MM`)
    *   `created_at`: `TIMESTAMPTZ` (Default: `NOW()`)
    *   **Constraint:** `UNIQUE (user_id, category_id, month)` prevents duplicative budgets.

#### Table 5: `activity_logs`
*   **Purpose:** Comprehensive system-wide logging of platform operations.
*   **Columns:**
    *   `id`: `BIGINT` (Primary Key)
    *   `user_id`: `UUID` (Foreign Key -> `auth.users.id` ON DELETE SET NULL)
    *   `user_name`: `TEXT`
    *   `action`: `TEXT` (Not Null)
    *   `details`: `TEXT`
    *   `created_at`: `TIMESTAMPTZ` (Default: `NOW()`)

*Note: There is also an undocumented `otps` table referenced in our controllers, storing password reset vectors containing `email`, `otp`, and `expires_at` parameters.*

---

## 2. Row Level Security & Access Control Layout

FinTrack has fully activated Row Level Security (RLS) across all user tables to isolate tenant transactions. 

### 2.1 Role-Based Access Helper Function
The system evaluates administrative requests using a central PL/pgSQL function:
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    where id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.2 RLS Isolation Matrix

| Table | Policy Name | Permission Scope | Target Expression |
| :--- | :--- | :--- | :--- |
| **profiles** | "Users can view their own profile" | SELECT | `auth.uid() = id` |
| **profiles** | "Admins can view all profiles" | SELECT | `public.is_admin()` |
| **profiles** | "Admins can update all profiles" | UPDATE | `public.is_admin()` |
| **categories** | "Users can manage their own categories" | ALL | `auth.uid() = user_id` |
| **transactions**| "Users can manage their own transactions"| ALL | `auth.uid() = user_id` |
| **budgets** | "Users can manage their own budgets" | ALL | `auth.uid() = user_id` |

---

## 3. Database Triggers & Routines

### 3.1 New User Autonomic Synchronization Trigger
To guarantee profile objects are ready on registration, a database event runs immediately upon auth system signups:
*   **Function:** `public.handle_new_user()`
*   **Trigger:** `on_auth_user_created`
*   **Action:** Triggers `AFTER INSERT` on `auth.users` to automatically populate `public.profiles`. Special logic sets user `cbogineni@gmail.com` as an `admin` user on initial boot.
