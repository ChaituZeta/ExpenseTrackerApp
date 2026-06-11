# FinTrack — Backend API Reference Manual

This document provides a technical specification for all Hono/Node API endpoints available on the platform.

---

## 1. API Route Dependency Tree

The backend endpoints are divided into **Public Utility**, **User Actions**, and **Restricted Administrative Actions**:

```
                                [ Hono Router Entry ]
                                          |
                +-------------------------+-------------------------+
                |                         |                         |
       [ Public Utility ]          [ User Actions ]          [ Admin Actions ]
       - GET /api/ping             (Auth Bearer Needed)     (Auth Bearer + role == 'admin')
       - GET /api/diag             - POST /api/logs/create  - GET /api/admin/users
       - POST /api/auth/login                               - GET /api/admin/transactions
       - POST /api/auth/register                            - GET /api/admin/logs
       - POST /api/auth/forgot-password                     - POST /api/admin/create-user
       - POST /api/auth/reset-password                      - POST /api/admin/sync-profiles
```

---

## 2. Comprehensive Endpoint Reference

### 2.1 Public Utility Endpoints

#### `GET /api/ping`
*   **Purpose:** Simple endpoint to perform fast health checks.
*   **Authorization:** None (Public).
*   **Response Body (JSON - 200 OK):**
    ```json
    {
      "status": "ok",
      "version": "2.0.1",
      "time": "2026-06-09T12:00:00.000Z"
    }
    ```

#### `GET /api/diag`
*   **Purpose:** Verification diagnostics monitoring environment variables and testing direct database connection.
*   **Authorization:** None (Public).
*   **Response Body (JSON - 200 OK):**
    ```json
    {
      "db": "ok",
      "db_error": null,
      "version": "2.0.2",
      "url_masked": "https://poeyhg...",
      "key_masked": "eyJhbGciOi...",
      "env": {
        "VITE_URL": true,
        "NEXT_URL": false,
        "SUPA_URL": true,
        "VITE_KEY": true,
        "NEXT_KEY": false,
        "SUPA_KEY": true,
        "SERVICE_KEY": true
      }
    }
    ```

#### `POST /api/auth/login`
*   **Purpose:** Proxies credentials securely to authenticate login requests and sign sessions.
*   **Authorization:** None (Public).
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword"
    }
    ```
*   **Response Body (JSON - 200 OK):**
    ```json
    {
      "v": "2.0.2",
      "session": {
        "access_token": "jwt_token_string",
        "refresh_token": "refresh_token_string",
        "expires_in": 3600
      },
      "user": {
        "id": "uuid_string",
        "email": "user@example.com",
        "name": "Jane Doe",
        "phone": "+919999999999",
        "avatar_url": "https://...",
        "currency": "₹",
        "role": "user"
      }
    }
    ```
*   **Validation & Logic:** Requires both fields. Passes arguments directly to the Supabase client SDK. If credentials are correct, it retrieves the user profile and generates response tokens.

#### `POST /api/auth/register`
*   **Purpose:** Registers a user and creates an administrative profile record.
*   **Authorization:** None (Public).
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword",
      "name": "Jane Doe",
      "phone": "+919999999999"
    }
    ```
*   **Response Body (JSON - 200 OK):**
    ```json
    {
      "user": { "id": "uuid_string", "email": "user@example.com" },
      "session": { "access_token": "jwt..." }
    }
    ```

#### `POST /api/auth/forgot-password`
*   **Purpose:** Generates a single-use 6-digit confirmation code and sends recovery templates via email.
*   **Authorization:** None (Public).
*   **Request Body (JSON):**
    ```json
    {
      "identifier": "user@example.com"
    }
    ```
*   **Response Body (JSON - 200 OK):**
    ```json
    {
      "message": "OTP sent"
    }
    ```

#### `POST /api/auth/reset-password`
*   **Purpose:** Verifies recovery OTP codes and updates user credentials.
*   **Authorization:** None (Public).
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com",
      "otp": "123456",
      "newPassword": "newsecurepassword123"
    }
    ```
*   **Response Body (JSON - 200 OK):**
    ```json
    {
      "message": "Password reset successful"
    }
    ```

---

### 2.2 User-Specific Endpoints

#### `POST /api/logs/create`
*   **Purpose:** Dispatches user activity messages to database trackers.
*   **Authorization:** Required (`Authorization: Bearer <token>`).
*   **Request Body (JSON):**
    ```json
    {
      "action": "Update Profile",
      "details": "User edited contact parameters"
    }
    ```
*   **Response Body (JSON - 200 OK):**
    ```json
    {
      "success": true
    }
    ```

---

### 2.3 Restricted Administrative Endpoints
*All actions in this category require checking client identities off Bearer tokens and verify permissions.*

#### `GET /api/admin/users`
*   **Purpose:** Returns a list of all user profiles registered on the platform.
*   **Authorization:** Admin Required (`Authorization: Bearer <token>`).
*   **Response Body (JSON - 200 OK):**
    ```json
    [
      {
        "id": "uuid...",
        "email": "user@ex.com",
        "name": "User",
        "role": "user",
        "currency": "₹"
      }
    ]
    ```

#### `GET /api/admin/transactions`
*   **Purpose:** Returns transaction records from all users to audit platform performance.
*   **Authorization:** Admin Required (`Authorization: Bearer <token>`).

#### `GET /api/admin/logs`
*   **Purpose:** Lists the last 100 system-wide activity log records.
*   **Authorization:** Admin Required (`Authorization: Bearer <token>`).

#### `POST /api/admin/create-user`
*   **Purpose:** Provisions an account and profile with specified roles, and sends a welcome template via email.
*   **Authorization:** Admin Required (`Authorization: Bearer <token>`).
*   **Request Body (JSON):**
    ```json
    {
      "email": "client@example.com",
      "password": "initialpassword",
      "name": "Jane User",
      "role": "user"
    }
    ```

#### `POST /api/admin/sync-profiles`
*   **Purpose:** Repairs profile sync errors by comparing `auth.users` against `public.profiles` and writing missing rows in bulk.
*   **Authorization:** Admin Required (`Authorization: Bearer <token>`).
