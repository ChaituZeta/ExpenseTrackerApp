# FinTrack — Frontend Architecture Reference Manual

This document outlines the architecture, layout system, routing guards, state managers, and component hierarchies of the FinTrack client application.

---

## 1. Routing Model & Authorization Guards

FinTrack uses `react-router-dom` (v7) to structure dynamic URL patterns. Active path definitions are divided into three distinct permission layers:

```
                          [ BrowserRouter Router ]
                                     |
                +--------------------+--------------------+
                |                                         |
         [ Public Pages ]                         [ Protected Pages ]
     (Home, Login, Register,                       (PrivateRoute Guard)
     ForgotPassword, ResetPassword)                       |
                                                    [ Layout Wrapper ]
                                           (Desktop Sidebar / Mobile Header)
                                                          |
                                      +-------------------+-------------------+
                                      |                                       |
                              [ Tenant Pages ]                  [ Admin-Only Views ]
                            (Dashboard, Budgets,                (AdminRoute Guard)
                           Transactions, Categories,                      |
                                  Profile)                        (Admin panel,
                                                                   User Review)
```

### 1.1 Guard Implementations
*   **PrivateRoute (`App.tsx` lines 97-101):** Intercepts active requests. Verifies authentication; redirects to `/login` if unauthenticated.
*   **AdminRoute (`App.tsx` lines 103-107):** Restricts nested children strictly to sessions where `user.role === 'admin'`. Unauthorized users are routed back to the root (`/`).

---

## 2. Session Auth Flow & Client State Managers

Client state is managed without heavy store engines like Redux by leveraging a highly efficient combination of **React Context** (`AuthContext`) and Supabase's native WebSocket-driven stream listener:

```
[ App.tsx AuthProvider Load ]
              |
              +----> (Check Local Session) --[ api.auth.me() ]--> Populate Active Profile
              |
              +----> (Listen to Auth Events) --[ supabase.auth.onAuthStateChange() ]
                            |
           +----------------+----------------+
           |                                 |
  [ Event: SIGNED_IN ]             [ Event: SIGNED_OUT ]
           |                                 |
  Load profile attributes          Purge cache & reset state
```

### 2.1 The Token Refresh Fail-Safe
If a token fails to refresh, `onAuthStateChange` captures the `TOKEN_REFRESH_FAILED` event, logs out the user, purges local credentials, and returns them safely to the sign-in screen.

---

## 3. Dynamic API Communication Model

To maximize speed and accessibility across web surfaces and native environments, the application uses a hybrid communication strategy:

```
                  [ Client API Trigger (api.ts) ]
                                 |
                     Is Capacitor Native Environment?
                                 |
                 +---------------+---------------+
                 | Yes                           | No
                 v                               v
    Prefix URL with Absolute            Use Relative Routes
    VITE_MOBILE_API_URL                  (Proxy to Local Endpoint)
                 |                               |
                 +---------------+---------------+
                                 v
                Try Direct Client Supabase Call
                                 |
                     Did direct client query fail?
                                 |
                 +---------------+---------------+
                 | Yes                           | No
                 v                               v
         Route to Backend API            Return results directly 
          Proxy Bridge and use             from the client SDK
          Nodemailer / Admin sdk
```

---

## 4. Component Hierarchy Diagram

The physical compilation tree arranges components from foundational layout nodes down to modular rendering components:

```
App.tsx (Configures Router, Context state, ErrorBoundary boundaries)
 └── AuthProvider (Injects user profiles)
      └── Pages (Viewports containing page layouts)
           ├── Dashboard
           │    ├── LoadingSpinner (Renders grid states in-transit)
           │    └── Recharts Graphing Components (Visualizes expense charts)
           ├── Transactions
           │    ├── Save-to-Excel (Extracts XLSX reports)
           │    └── IconRenderer (Applies corresponding categories symbols)
           ├── Categories
           │    └── IconRenderer (Decodes lucide symbols dynamically)
           ├── Budgets
           │    └── Budget Progress Bars (Reflects usage margins)
           └── AdminDashboard
                ├── Profile Synchronizer (Maps users tables)
                └── Activity Logs Panel (Monitored system triggers)
```

---

## 5. Theme and Responsive Layout Engine

*   **Color Theme:** Styled with Tailwind CSS v4 using a dominant dark branding theme (Primary: deep navy slate indices, Contrast Accents: vivid violet scales) with consistent responsive font scaling.
*   **Responsive Framework:** Accommodates high-resolution desktop terminals and native viewport frames with ease:
    *   *Desktop Layout:* Side navigation rails that scale smoothly, keeping secondary information grouped in side grids.
    *   *Mobile Layout:* Compact header layouts with animated drawer menus managed via Framer Motion's `AnimatePresence`. Keeps touch targets at a finger-friendly minimum of 44px.
*   **Mobile Compilation (Capacitor):** Configured to copy compiler output files from `/dist` directly into Android gradle compilation folders, utilizing client-side token structures.
