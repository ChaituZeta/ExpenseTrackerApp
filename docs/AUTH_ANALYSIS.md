# FinTrack — Authentication Security Analysis

This manual documents the authentication lifecycles, JWT token handlers, OTP generation schemes, and user sessions of FinTrack.

---

## 1. Login & Session Lifecycle

The authentication system employs a hybrid flow. The user's credentials are verified server-side, but session status is maintained directly on the client using Supabase's native token handlers.

### 1.1 Step-by-Step Login Lifecycle

```
[ FRONTEND React Form ]                             [ BACKEND Hono Server ]             [ DATABASE Supabase Auth ]
          |                                                    |                                    |
  1. POST /api/auth/login ------------------------------------>|                                    |
     (Payload: email, password)                                |                                    |
          |                                                    | 2. Connect via Client              |
          |                                                    |    Supabase SDK                    |
          |                                                    |===> supabase.auth.signIn() =======>|
          |                                                    |                                    | 3. Validate
          |                                                    |<=== Return JWT Session & Profile ==|
          |                                                    |                                    |
          |<-- Returns Session, Profile JSON ------------------|                                    |
          |
  4. Parse Response JSON
  5. Ingest local session token:
     supabase.auth.setSession(res.session)
  6. Listen to Web Socket Auth State
     onAuthStateChange()
```

1.  **Submission:** The client submits plaintext email and password inputs via HTTPS to `/api/auth/login`.
2.  **API Verification:** The Hono server intercepts the payload, initializes a transient admin Supabase client, and calls `supabase.auth.signInWithPassword`.
3.  **Database Response:** Supabase Auth validates the credentials and returns a JSON payload containing an `access_token` (JWT), a `refresh_token`, and the user's metadata profile.
4.  **Local Sync:** Hono returns the session details to the React client.
5.  **Session Injection:** The frontend parses this response and imports the token back into the client-side Supabase SDK using `supabase.auth.setSession(res.session)`.
6.  **WebSocket Listener:** A global web socket event `onAuthStateChange()` is triggered, updating the React `AuthContext` and unlocking private routes.

---

## 2. User Registration & Profile Provisioning Flow

Registration requires a multi-step database transaction to guarantee database consistency:

```
[ FRONTEND Form ] ---> POST /api/auth/register ---> [ BACKEND API ]
                                                          |
                 +----------------------------------------+
                 |
                 +--> 1. supabase.auth.signUp()
                 |    (Creates entry in Internal Auth Registry)
                 |
                 +--> 2. Create User Profile via Admin Client Table Actions
                 |    (Profiles upsert linked to auth_id)
                 |
                 +--> 3. Send Activity Logs Event via API
```

1.  **Auth Registration:** The backend calls `signUp()` with the user's password, email, and metadata (phone, name).
2.  **Auth DB Insert:** Supabase adds the credentials to its database table (`auth.users`).
3.  **Automatic Trigger:** A PostgreSQL trigger `on_auth_user_created` runs `handle_new_user()`, automatically inserting a clean row into `public.profiles`.
4.  **Backend Fail-Safe Profile Upsert:** To prevent profile synchronization bugs on slower hosting servers, the Hono router performs a secondary profile `upsert` using its administrative service-role account.
5.  **Local Storage Ingestion:** The final session parameters are serialized and returned to the browser to initiate immediate sign-in.

---

## 3. Password Reset and OTP Password Lifecycle

Password recovery does not require third-party tools like Google Identity, instead utilizing the platform's custom **Nodemailer** engine.

```
[ FRONTEND Forgot Form ]                                    [ BACKEND API Node ]                       [ Supabase Database ]
          |                                                           |                                         |
  1. Input email address -------------------------------------------->|                                         |
          |                                                           | 2. Generate cryptographically           |
          |                                                           |    random 6-digit OTP code              |
          |                                                           |                                         |
          |                                                           | 3. UPSERT OTP records ----------------->|
          |                                                           |    (Set expires_at: NOW + 15 min)       |
          |                                                           |                                         |
          |                                                           | 4. Deliver verification OTP             |
          |                                                           |    code via SMTP (Nodemailer)           |
          |                                                           |                                         |
  5. User supplies verification code inside resetting card            |                                         |
  6. POST /api/auth/reset-password ---------------------------------->|                                         |
          |                                                           | 5. Verify email + OTP combination      |
          |                                                           |    and token expiration datetime ------>|
          |                                                           |                                         |
          |                                                           | 6. Call administrative sdk:             |
          |                                                           |    updateUserById() to reset password =>|
          |                                                           |                                         |
          |<-- Returns success message -------------------------------|                                         |
```

1.  **Request Reset:** The user submits their email address via the `/forgot-password` route.
2.  **Generate OTP:** Hono intercepts the query, generates a cryptographically random, 6-digit verification code (`Math.random()`), and defines an expiration timestamp 15 minutes in the future.
3.  **Store OTP:** Hono writes the OTP code and expiration time to the SQL table `otps`.
4.  **Send Email:** Hono compiles a styled HTML template and dispatches it using our Google SMTP App password.
5.  **Form Verification:** The user inputs the 6-digit code and their new password on the client.
6.  **Confirm Rewrite:** Hono checks that the submitted OTP is valid and has not expired. It then updates the user's password in Supabase's authentication tables using administrative privileges (`updateUserById`). Finally, it deletes the consumed OTP row.
