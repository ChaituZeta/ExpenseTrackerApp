# FinTrack — Setup Guide

Follow this guide to get FinTrack running on your local machine for development and testing.

---

## 1. System Requirements

*   **Node.js:** v18.0.0 or higher (LTS recommended)
*   **NPM:** v9.0.0 or higher
*   **Database:** A Supabase project (instance URL and public anonymous key)
*   **Optional:** A SMTP mail account (Gmail App-password or custom mail relay)

---

## 2. Dynamic Variable Configuration (`.env`)

Create a local `.env` configuration file in the project's root folder using our sample template `.env.example`:

```env
# 1. Supabase Datastore Identifiers
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anonymous-key-string
SUPABASE_SERVICE_ROLE_KEY=your-secret-administrative-role-key

# 2. SMTP Delivery Setup (For Forgot Password Reset OTP Codes)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-secure-app-password
```

---

## 3. Installation Steps

1.  **Clone or UnZIP the Project Directory:**
    ```bash
    cd fintrack
    ```

2.  **Install Base NPM Dependencies:**
    Initialize node packages across the front-end and back-end integration modules:
    ```bash
    npm install
    ```

3.  **Boot the Consolidated Development Server:**
    Vite and the Hono express proxy bridge boot in parallel with HMR logs:
    ```bash
    npm run dev
    ```
    The application is now accessible at **`http://localhost:3000`**.

---

## 4. Troubleshooting Development Common Errors

### "Hono Bridge Error: Internal server error in API bridge"
*   **Cause:** The backend Hono controller threw an unhandled error, or environment settings were not loaded properly.
*   **Solution:** Check that your `.env` variables are correctly assigned and verify console logs inside the server console window.

### "JAVA_HOME is not set" (Android builds)
*   **Cause:** Compiling native platforms with Capacitor requires standard Java dependencies.
*   **Solution:** Install JDK 17, and set your environment PATH variable to point to the correct JDK binary folders.
```bash
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk"
```
