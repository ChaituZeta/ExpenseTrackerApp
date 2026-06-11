# FinTrack — API Documentation Reference

All API routes in this application are handled natively using **Hono**, which are bridged from the parent Express server (`server.ts`) inside development and production runtimes. All requests are routed through the `/api/*` context.

---

## 1. System & Diagnostic Routing

### 1.1 Server Ping Check
*   **Endpoint:** `/api/ping`
*   **Method:** `GET`
*   **Authentication:** None Required
*   **Request Schema:** No payload.
*   **Response Schema (200 OK):**
    ```json
    {
      "status": "ok",
      "version": "2.0.1",
      "time": "2026-06-09T12:00:00.000Z"
    }
    ```

### 1.2 Interactive Database Diagnostic Check
*   **Endpoint:** `/api/diag`
*   **Method:** `GET`
*   **Authentication:** None Required
*   **Response Schema (200 OK):**
    ```json
    {
      "db": "ok",
      "db_error": null,
      "version": "2.0.2",
      "url_masked": "https://poeyhgm...",
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

---

## 2. Authentication System

### 2.1 User Login
*   **Endpoint:** `/api/auth/login`
*   **Method:** `POST`
*   **Request Schema (JSON):**
    ```json
    {
      "email": "user@example.com",
      "password": "passcode_literal"
    }
    ```
*   **Response Schema (200 OK):**
    ```json
    {
      "v": "2.0.2",
      "session": {
        "access_token": "jwt_token_string",
        "refresh_token": "refresh_token_string",
        "expires_in": 3600
      },
      "user": {
        "id": "user_id_uuid",
        "email": "user@example.com",
        "name": "Jane Doe",
        "phone": "+919876543210",
        "avatar_url": null,
        "currency": "₹",
        "role": "user"
      }
    }
    ```

### 2.2 User Registration
*   **Endpoint:** `/api/auth/register`
*   **Method:** `POST`
*   **Request Schema (JSON):**
    ```json
    {
      "email": "new@example.com",
      "password": "strong_password",
      "name": "John Doe",
      "phone": "+918123456789"
    }
    ```
*   **Response Schema (200 OK):**
    ```json
    {
      "user": { "id": "uuid_new_user", "email": "new@example.com" },
      "session": null
    }
    ```

### 2.3 Password Reset Request (Send OTP)
*   **Endpoint:** `/api/auth/forgot-password`
*   **Method:** `POST`
*   **Request Schema (JSON):**
    ```json
    {
      "email": "user@example.com"
    }
    ```
*   **Response Schema (200 OK):**
    ```json
    { "message": "OTP sent" }
    ```

### 2.4 Complete Password Reset (Submit OTP)
*   **Endpoint:** `/api/auth/reset-password`
*   **Method:** `POST`
*   **Request Schema (JSON):**
    ```json
    {
      "email": "user@example.com",
      "otp": "123456",
      "newPassword": "brand_new_strong_password"
    }
    ```
*   **Response Schema (200 OK):**
    ```json
    { "message": "Password reset successful" }
    ```

---

## 3. General Analytics & Activity Logging

### 3.1 Write Activity Log
*   **Endpoint:** `/api/logs/create`
*   **Method:** `POST`
*   **Authentication:** Requires Header `Authorization: Bearer <JWT_ACCESS_TOKEN>`
*   **Request Schema (JSON):**
    ```json
    {
      "action": "View Transactions",
      "details": "User accessed ledger index view"
    }
    ```
*   **Response Schema (200 OK):**
    ```json
    { "success": true }
    ```

---

## 4. Administration Endpoints (RBAC Enforced)

All endpoints in this segment mandate a Bearer token belonging to a profile labeled with `role: "admin"` or matched to the primary developer email record.

### 4.1 Collect All Profiles
*   **Endpoint:** `/api/admin/users`
*   **Method:** `GET`
*   **Authentication:** Bearer Admin Token
*   **Response Schema (200 OK):**
    ```json
    [
      {
        "id": "uuid_string",
        "email": "client@example.com",
        "name": "Alex Carter",
        "role": "user",
        "currency": "₹",
        "created_at": "2026-05-10T14:30:00.000Z"
      }
    ]
    ```

### 4.2 Aggregate Global Transactions
*   **Endpoint:** `/api/admin/transactions`
*   **Method:** `GET`
*   **Authentication:** Bearer Admin Token
*   **Response Schema (200 OK):**
    ```json
    [
      {
        "id": 48,
        "user_id": "uuid_string",
        "category_id": 12,
        "amount": 4200.00,
        "type": "expense",
        "description": "Server Maintenance Hosting fee",
        "date": "2026-06-08",
        "category": {
          "id": 12,
          "name": "Infrastructure",
          "color": "#ff0000",
          "theme_icon": "Server"
        }
      }
    ]
    ```

### 4.3 Aggregate Security Activity Logs
*   **Endpoint:** `/api/admin/logs`
*   **Method:** `GET`
*   **Authentication:** Bearer Admin Token
*   **Response Schema (200 OK):**
    ```json
    [
      {
        "id": 105,
        "user_id": "uuid_string",
        "user_name": "Alex Carter",
        "action": "Admin Login",
        "details": "Logged into administration deck",
        "created_at": "2026-06-09T10:15:30.000Z"
      }
    ]
    ```

### 4.4 Autonomic Admin User Creation
*   **Endpoint:** `/api/admin/create-user`
*   **Method:** `POST`
*   **Authentication:** Bearer Admin Token
*   **Request Schema (JSON):**
    ```json
    {
      "email": "employee@fintrack.app",
      "password": "temporary_strong_pass",
      "name": "Jane S.",
      "role": "user"
    }
    ```
*   **Response Schema (200 OK):**
    ```json
    { "message": "User created and profile synced successfully" }
    ```
