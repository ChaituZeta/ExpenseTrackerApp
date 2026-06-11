# FinTrack — System Dependency Analysis Report

This document audits all dependencies registered in the project's root `package.json`, classifying their actual usage and noting opportunities for optimization and removal.

---

## 1. Production Dependencies

| Package Name | Ver | Purpose | Where Used | Used? | Safe to Remove? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **@capacitor/android** | `^8.3.4` | Android runtime packages | `android/*` compilation | Yes | No (if mobile is needed) |
| **@capacitor/cli** | `^8.3.4` | Android build commands | Android shell configurations | Yes | No (if mobile is needed) |
| **@capacitor/core** | `^8.3.4` | Mobile bridge layer | Client native triggers | Yes | No (if mobile is needed) |
| **@google/genai** | `^1.29.0` | AI assistance bindings | *None (Unused)* | **No** | **Yes** (Dead Dependency) |
| **@hono/node-server** | `^1.19.12` | Runs Hono in Node environment | `/server.ts` | Yes | No |
| **@supabase/supabase-js** | `^2.99.1` | Database database clients | Direct queries & `/api/index.ts`| Yes | No |
| **@tailwindcss/vite** | `^4.1.14` | Integrate Tailwind v4 compilation | `/vite.config.ts` | Yes | No |
| **@vitejs/plugin-react** | `^5.0.4` | Vite compilation for React | `/vite.config.ts` | Yes | No |
| **bcryptjs** | `^3.0.3` | Pass hash calculations | *None (Unused)* | **No** | **Yes** (Supabase handles it) |
| **clsx** | `^2.1.1` | Conditional styling helper | *None (Unused)* | **No** | **Yes** |
| **cookie-parser** | `^1.4.7` | Parses cookies in Express | *None (Unused)* | **No** | **Yes** |
| **cors** | `^2.8.6` | CORS mapping middleware | *None (Unused)* | **No** | **Yes** (Hono handles CORS) |
| **date-fns** | `^4.1.0` | Manipulate and format date strings| `/src/lib/dateUtils.ts` | Yes | No |
| **dotenv** | `^17.2.3` | Load server config variables | `/server.ts` | Yes | No |
| **esbuild** | `^0.28.0` | Compile server code to CJS | `/scripts/build-server.js` | Yes | No |
| **express** | `^4.21.2` | Server entry bridging Vite/Hono | `/server.ts` | Yes | No |
| **hono** | `^4.12.10` | Router engine serving endpoints | `/api/index.ts` | Yes | No |
| **jsonwebtoken** | `^9.0.3` | Custom session validator | *None (Unused)* | **No** | **Yes** (Supabase handles it) |
| **lucide-react** | `^0.546.0` | Visual vector icon systems | `/src/components/*`, pages | Yes | No |
| **motion** | `^12.23.24` | Layer rendering smooth transitions | Throughout layouts and lists | Yes | No |
| **nodemailer** | `^8.0.2` | Deliver OTP reset email codes | `/api/index.ts` | Yes | No |
| **react** | `^19.0.0` | Main client interface framework | Throughout user interface | Yes | No |
| **react-dom** | `^19.0.0` | Render React structures to DOM | `/src/main.tsx` | Yes | No |
| **react-router-dom**| `^7.13.1` | Virtual URL routing | `/src/App.tsx` | Yes | No |
| **recharts** | `^3.8.0` | Graphical dashboard visualizers | `/src/pages/Dashboard.tsx` | Yes | No |
| **sqlite** | `^5.1.1` | Local SQLite manager client | *None (Unused)* | **No** | **Yes** |
| **sqlite3** | `^6.0.1` | Native SQLite driver | *None (Unused)* | **No** | **Yes** |
| **tailwind-merge** | `^3.5.0` | Concat styling utilities safely | `/src/components/UserBadge.tsx` | Yes | No |
| **tsx** | `^4.21.0` | Runtime TypeScript executor | `scripts.dev` trigger | Yes | No |
| **vite** | `^6.2.0` | Build engine and dynamic dev proxy| `scripts.build` & `/server.ts` | Yes | No |
| **xlsx** | `^0.18.5` | Exports grid transactions to Excel | `/src/pages/Transactions.tsx`| Yes | No |

---

## 2. Development Dependencies

| Package Name | Ver | Purpose | Where Used | Used? | Safe to Remove? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **@types/bcryptjs** | `^2.4.6` | TypeScript type declarations | Dev Type Checking | Yes | No |
| **@types/cookie-parser**| `^1.4.10` | TypeScript type declarations | Dev Type Checking | No | Yes |
| **@types/express** | `^4.17.21` | TypeScript type declarations | Dev Type Checking | Yes | No |
| **@types/jsonwebtoken** | `^9.0.10` | TypeScript type declarations | Dev Type Checking | No | Yes |
| **@types/node** | `^22.14.0` | Node.js type interfaces | Compiler variables | Yes | No |
| **@types/nodemailer**| `^7.0.11` | TypeScript type declarations | Dev Type Checking | Yes | No |
| **@types/react** | `^19.2.14` | React type declarations | Compiler interfaces | Yes | No |
| **@types/react-dom**| `^19.2.3` | React-DOM type declarations | Compiler interfaces | Yes | No |
| **@vercel/node** | `^5.7.0` | Support serverless compilations | Vercel Deployment | Yes | No |
| **autoprefixer** | `^10.4.21` | Style postfix prefix elements | Style configurations | Yes | No |
| **tailwindcss** | `^4.1.14` | Compiles styling files | Vite CSS preprocessor | Yes | No |
| **typescript** | `~5.8.2` | Enforces structural typing checks | Compiler core | Yes | No |

---

## 3. Flagged Packages (Technical Debt Categories)

1.  **Dead Packages (Unused imports/runtimes, ready to prune):**
    *   `@google/genai`: Added for AI features, but no active endpoints use it.
    *   `sqlite` & `sqlite3`: Remains in `package.json` from a defunct local caching concept.
    *   `bcryptjs` & `jsonwebtoken`: Unused because authorizations rely strictly on the Supabase authentication client. (Note: These will become essential during a MySQL migration but are dead weight under the current Supabase architecture).
    *   `clsx`: Duplicate utility. The codebase already relies on `tailwind-merge` which handles class resolving more robustly.
    *   `cookie-parser` & `express-cors` (implicit): Unused because Hono processes cookie headers and handles CORS on the node server natively.
2.  **Duplicate Systems:**
    *   `clsx` and `tailwind-merge` serve overlapping purposes. We should standardize strictly on `tailwind-merge`.
