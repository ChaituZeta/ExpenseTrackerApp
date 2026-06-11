# FinTrack — Engineering Coding Standards

This document establishes the patterns, code formatting, style requirements, and optimization rules for our engineering team. All additions and modifications must conform strictly to these standards.

---

## 1. General Principles

*   **Explicit Type Declarations:** Avoid compiling any code with explicit or implicit `any` definitions. Use precise, named TypeScript interfaces.
*   **Prevent Runtime Crashes:** Wrap all asynchronous operations in comprehensive `try/catch` blocks. Implement clear fallback structures to ensure the application degrades gracefully when services fail.

---

## 2. Front-End React Implementation Guidelines

### 2.1 State Mutations & Re-render Prevention
*   **Rule:** Avoid placing functional declarations or non-primitive variables (arrays, objects) inside `useEffect` dependency clusters unless they are memoized. This prevents infinite re-render loops.
*   **Rule:** Keep logic modular instead of grouping all operations into `App.tsx`. Extract large operations into separate sub-components (such as `src/components/UserBadge.tsx`).
*   **Rule:** Maintain standard React hooks to guarantee predictable flow behaviors.

### 2.2 Visual Layout & Styling
*   **Rule:** Style layouts exclusively using Tailwind CSS utilities directly inside component markup. Avoid creating isolated CSS stylesheets or using inline styling structures.
*   **Rule:** Import icons exclusively from `lucide-react`. Never inline raw user-defined SVGs.
*   **Rule:** Integrate Framer Motion (via `motion/react`) to animate dynamic layouts, modal frames, or list shifts.

---

## 3. Back-End Hono/Node Implementation Guidelines

### 3.1 Synchronous Port Guarding
*   **Rule:** Configure all web servers to bind exclusively to port **`3000`** and host server addresses to **`0.0.0.0`** to support container load-balanced routing.
*   **Rule:** Place all core imports at the top of the file. Maintain standard imports and avoid dynamic destructuring where possible.

### 3.2 Secure API Routing Structures
*   **Rule:** Place all API routing definitions inside the `/api` route prefix.
*   **Rule:** Always sanitize payloads. Validate and clean input types before mapping variables to downstream data actions.
*   **Rule:** Wrap async responses inside reliable timeout utilities (such as our standard `withTimeout` block) to prevent unresponsive hung threads on slower mobile cellular networks.

```typescript
// Good Pattern: Enforces structural isolation and timeout safety
const withTimeout = (promise: Promise<any>, ms: number, message: string) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
};
```
