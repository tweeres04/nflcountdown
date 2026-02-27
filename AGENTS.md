# AGENTS.md

Welcome agent! This file provides essential information for working effectively in the **nflcountdown** repository. This document outlines the project structure, development workflows, and coding standards to ensure consistency and quality.

## Project Overview

- **Framework:** Remix (Vite-based)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn/UI (Radix UI)
- **State Management:** Remix Loaders/Actions + React Context for specific features (e.g., LeagueContext)
- **Deployment:** Manual via `deploy.sh` (Node.js production server using `remix-serve`)

---

## Product Positioning & Guardrails

**Core value proposition:** Team Countdown is about the *feeling* of anticipation -- "get pumped for the next game." It's emotional and experiential, not informational.

**What we are:**
- A countdown timer that builds excitement for the next game
- Instant home screen access (PWA) so fans can check in with one tap
- Beautiful, team-branded design that feels like putting on your jersey

**What we are NOT:**
- A schedule site (ESPN, team sites already do this)
- A scores/stats site (big companies own this space)
- A sports news aggregator

**Guardrails for feature decisions:**
- Every feature should amplify the "get pumped" feeling, not just deliver information
- If a feature exists primarily to provide schedules, scores, or stats, we don't build it
- Copy and UX should feel like a fan talking to a fan, not a database serving results
- When in doubt, ask: "Does this make someone more excited for the next game?"

**Guardrails for copy/framing:**
- Lean into emotion and anticipation, not utility and information
- Example: "Get hyped on game day" not "Get schedule reminders"
- Example: "Never miss kickoff" not "View upcoming games"

---

## 1. Development & Build Commands

### Essential Commands

- **Dev Server:** `npm run dev` - Starts the Vite-based development server.
- **Build:** `npm run build` - Builds the application for production (client and server).
- **Typecheck:** `npm run typecheck` - Runs `tsc` to verify types across the project.
- **Lint:** `npm run lint` - Executes ESLint to check for code style and potential issues.
- **Deploy:** `./deploy.sh` - Custom script for production deployment. Do not deploy on your own. Let the user handle deploys.

### Automation & Maintenance Scripts

- **Screenshots:** `npm run countdown_screenshots` - Uses Puppeteer to generate marketing/preview images.
- **NBA Schedule:** `npm run get_schedule:nba` - Updates the NBA schedule data.
- **NFL Schedule:** Managed via scripts in the `cron/` directory.

### Running Tests

- **Current State:** No traditional unit/integration test suite (Vitest/Jest) is currently configured.
- **Verification:** For now, verify changes by running the dev server and performing manual regression testing on relevant routes.
- **Future:** If you are instructed to add tests, use **Vitest** for unit/integration tests and **Playwright** for E2E tests, following standard Remix patterns.

---

## 2. Code Style & Conventions

Follow these rules strictly. They are enforced by ESLint and the project's `.prettierrc`.

### Formatting

- **Indentation:** Use **Tabs** (not spaces). Tab width is set to 2.
- **Quotes:** Use **Single Quotes** for strings in TypeScript/TSX files.
- **Semicolons:** **No semicolons**. This is a strict project preference.
- **Trailing Commas:** Use ES5 style trailing commas.
- **Line Length:** Aim for a reasonable line length (approx. 80-100 characters), but prioritize readability.

### TypeScript & Typing

- **Strict Mode:** Always enabled. Avoid using `any`; prefer `unknown` if a type is truly dynamic.
- **Interfaces vs. Types:**
  - Use `interface` for object shapes and component props.
  - Use `type` for unions, intersections, and aliases.
- **Shared Types:** Domain models (Game, Team, League) must be imported from `app/lib/types.ts`.
- **Path Aliases:** Use the `~/*` alias for all imports from the `app/` directory (e.g., `import { cn } from '~/lib/utils'`).

### Naming Conventions

- **Files:**
  - Components: `PascalCase.tsx` (e.g., `GameList.tsx`).
  - Utilities/Hooks: `camelCase.ts` or `camelCase.tsx` (e.g., `utils.ts`, `useLeague.ts`).
  - Routes: Follow Remix flat-file routing or folder-based routing conventions.
- **Variables/Functions:** `camelCase`.
- **Constants:** `UPPER_SNAKE_CASE` for global constants.
- **Components:** `PascalCase`.

### React & Remix Patterns

- **Functional Components:** Only use functional components with hooks.
- **Data Fetching:**
  - Use `loader` functions for all GET requests.
  - Use `action` functions for POST/PUT/DELETE requests.
  - Utilize `useLoaderData<typeof loader>()` for fully typed data access in components.
- **Styling:**
  - Exclusively use Tailwind CSS utility classes.
  - Use the `cn()` utility for combining classes conditionally (e.g., `className={cn('base', active && 'active')}`).
  - Low-level UI components are located in `app/components/ui/` and follow Shadcn patterns.
- **Navigation:** Use `<Link>` or `<NavLink>` from `@remix-run/react` for all internal routing.

### Error Handling

- **Route Errors:** Implement or update `ErrorBoundary` exports in route files to handle unexpected failures gracefully.
- **API Resilience:** When calling external services (e.g., Gemini AI), always wrap calls in `try/catch` and provide sensible fallbacks or user-friendly error messages.
- **Logging:** Use `console.error` on the server side for capturing stack traces during development and production.

---

## 3. Project Structure & Key Directories

- **`app/routes/`**: Route definitions. Handles leagues (NFL, MLB, NBA) and team-specific pages.
- **`app/lib/`**: Core business logic, shared utilities, and service clients.
  - `types.ts`: Central repository for TypeScript definitions.
  - `gemini-service.ts`: AI summary generation logic.
  - `utils.ts`: General purpose utilities (including `cn`).
- **`app/components/`**:
  - `ui/`: Base UI components (Button, Input, Badge, etc.).
  - Top-level: Feature-specific components like `GameList`, `Countdown`, etc.
- **`cron/`**: Scripts and logic for periodic data updates (schedules, scores).
- **`public/`**: Static assets. Logos are organized by league (e.g., `/public/logos/mlb/`).
- **`data/`**: JSON files containing schedule and team data.

---

## 4. API & Service Integrations

### Gemini AI

- Implementation: `app/lib/gemini-service.ts`.
- Purpose: Generates game previews and storylines.
- Model: Currently uses `gemini-2.5-flash-lite`.

### Sports Data

- Data is periodically refreshed and stored in JSON files or served via Remix loaders.
- Check `cron/` scripts to understand how data is transformed from external providers.

---

## 5. Proactive Guidelines for Agents

- **Modularity:** Keep components small and focused. Extract logic into hooks or utility functions in `app/lib/` if it can be reused.
- **Verification:** Always run `npm run typecheck` after modifying types or complex logic.
- **Performance:** Be mindful of heavy computations in loaders; use caching (as seen in `gemini-service.ts`) where appropriate.
- **Consistency:** When adding new UI elements, check `app/components/ui/` first to see if a similar component already exists.
- **Remix Standards:** Follow "The Remix Way"—leverage platform APIs (Request/Response, FormData) whenever possible.

---

_Note: This file is intended for agentic consumption. Ensure all modifications adhere to these standards to maintain the integrity of the codebase._
