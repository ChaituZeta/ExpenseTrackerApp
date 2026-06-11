# FinTrack — Backend Architecture Reference Manual

This document details the backend server architecture, focusing on the hybrid Express-to-Hono service model, security middleware, and request lifecycles.

---

## 1. The Express-to-Hono Proxy Bridge

FinTrack employs a hybrid backend architecture that combines the strengths of **Express** and **Hono**:
1.  **Express (`server.ts`):** Serves as the primary Node.js process and HTTP server (listening on port 3000). In development, it hosts Vite middleware; in production, it serves static web files.
2.  **Hono (`api/index.ts`):** Processes endpoints, routes, middleware, and business logic using lightweight web standards.

```
+--------------------------------------------------------------------------+
|                            NODE.JS CONTAINER                             |
|                                                                          |
|                     [ Incoming Client HTTP Request ]                     |
|                                    |                                     |
|                       [ Express Server (Port 3000) ]                     |
|                                    |                                     |
|                      Does Request Match '/api/*'?                        |
|                                    |                                     |
|                      +-------------+-------------+                       |
|                      | Yes                       | No                    |
|                      v                           v                       |
|           [ Hono Request Converter ]   [ Static Content/Vite ]           |
|         (Headers, Method, JSON Body)   (Serve client SPA files)          |
|                      |                                                   |
|                      v                                                   |
|            [ Hono Router Engine ]                                        |
|         (CORS, Error Handlers, Routes)                                   |
+--------------------------------------------------------------------------+
```

### 1.1 The Bridge Mechanics (`server.ts` lines 36-78)
When a request hits an `/api/*` route, Express intercepts it and constructs a Web-standard `Request` object:
*   **Header Re-mapping:** Evaluates and formats system headers. Explicitly drops `content-length` and `transfer-encoding` values to allow the downstream fetch API to dynamically recalculate body lengths.
*   **Hono Invocation:** Invokes `app.fetch(honoRequest)` directly within the node thread process.
*   **Response Stream Mapping:** Extracts statuses, iterates headers, decodes text bodies, and pipes output states back into Express.

---

## 2. API Router Lifecycle and Request Flow

Every backend operation follows a predictable, highly-fortified request pipeline inside the Hono engine:

```
[ Incoming Request URL ]
         |
         v
[ Middleware: CORS Wildcard ] ---> Inject CORS Headers (Allow-Origin: '*')
         |
         v
  [ Route Matching ]
         |
         +----------------------------+
         |                            |
  [ Public Actions ]          [ Admin Actions ]
  - Login / Register                 |
  - Forgot Password/OTP              v
                              [ isAdmin Check ]
                              - Extracts Authorization Bearer Token
                              - Validates token against Supabase Auth
                              - Queries active Profile role attribute
                              - Rejects if role != 'admin' (403 Forbidden)
                                     |
                                     v
                             [ Execute Core Action ]
                             - Interface database
                             - Nodemailer dispatch
```

### 2.1 The Administration Privilege Check (`api/index.ts` lines 84-98)
The admin validator performs strict verification:
1.  Reads the incoming `Authorization` header.
2.  Splits the bearer syntax to isolate the JWT access token.
3.  Queries Supabase to verify session validity.
4.  Fetches the corresponding user profile matching `id = user.id`.
5.  Grants access only if `profile.role === 'admin'` or if the email matches the primary owner: `cbogineni@gmail.com`.

---

## 3. Global Error Handling Strategy

Hono includes a global error boundary catcher (`api/index.ts` lines 12-15) that handles server-side errors automatically:
*   System failures during calculations or data-fetching are caught, logged with full stack traces in our node system, and returned as clean JSON response payloads: `{ error: err.message }` with a 500 status code.
*   This prevents server-crash loops and avoids exposing internal file paths to client browsers.

---

## 4. Enterprise Refactored Layers (Controller-Service-Repository)

The backend code is divided into three distinct functional boundaries:

### 4.1 Controllers (`/backend/src/controllers/`)
*   **Purpose:** Accepts incoming Hono request contexts, parses body payloads (text fallback-aware), triggers schema validations (via stringent Zod structures), and resolves tokens.
*   **Behavior:** Delegates calculations to services. Never communicates with the database directly.

### 4.2 Services (`/backend/src/services/`)
*   **Purpose:** Houses critical business systems, workflows, timeout constraints, administrative calculations, and active template compilers.
*   **Interactions:** Uses `EmailService` to connect with Nodemailer SMTP transporters and queries database records exclusively using isolated Repositories.

### 4.3 Repositories (`/backend/src/repositories/`)
*   **Purpose:** The ONLY layer permitted to communicate with Supabase. Initializes standard or service-role clients through `SupabaseClient.ts` factories, executes Postgrest/Auth queries, and returns raw, type-safe data arrays.

