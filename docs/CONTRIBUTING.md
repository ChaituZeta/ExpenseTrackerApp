# FinTrack — Developer Contributing Standards

Welcome, contributors! This guide outlines our standard working procedures to keep code reliable, safe, and easily maintainable.

---

## 1. Branching Strategy & Pull Request (PR) Workflow

We use a standard branching strategy to protect our core production environments:

*   `main`: The clean, production-ready codebase. Never commit directly to `main`.
*   `develop`: The stability branch for active integrations.
*   `feature/your-detailed-action`: Private development branch for specific enhancements.

### 1.1 Preparing a Contribution PR
1.  Fork the repository and create an isolated feature branch off `develop`:
    ```bash
    git checkout -b feature/interactive-budgets
    ```
2.  Develop your features or write fixes following our shared [Coding Standards](./CODING_STANDARDS.md).
3.  Execute our diagnostic suite (Linting + TS checks) to prevent regressions:
    ```bash
    npm run lint
    ```
4.  Commit your changes using structured, semantic commit prefixes.
5.  Submit a Pull Request pointing towards our `develop` branch. At least one Senior Architect must review and approve your PR before merging.

---

## 2. Structured Commit Messages

We enforce semantic commit formatting so that our changelogs can be generated automatically.

Format structure: `<type>(<scope>): <short descriptive summary>`

*   **`feat`**: Adding a new feature (e.g., `feat(budgets): add real-time spending progress bars`).
*   **`fix`**: Resolving a bug or error (e.g., `fix(auth): correct token extraction on mobile devices`).
*   **`docs`**: Modifying documentation files (e.g., `docs(setup): update local database credentials templates`).
*   **`refactor`**: Cleaning code structures without changing functionality (e.g., `refactor(hono): isolate request parsers`).
*   **`perf`**: Improving performance profiles (e.g., `perf(ledger): memoize transaction filter ranges`).

---

## 3. Pull Request Review Checklist

Before approving any PR, reviewers must verify:
- [ ] No regression issues are introduced, confirmed by running local builds (`npm run build`).
- [ ] Code strictly passes TypeScript compilation checks (`npm run lint`).
- [ ] Security practices are met (zero hardcoded credential keys or wild authorization settings).
- [ ] The user interface conforms to accessibility requirements (proper contrast scores, keyboard controls).
- [ ] Accompanying documentation files are updated to reflect the new states.
