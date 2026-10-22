# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server at http://localhost:3000
npm run build     # Production build (also the main type-check)
npm run lint      # ESLint (flat config, eslint-config-next)
```

There is no test suite.

## Architecture

Admin panel for "Frame The World". Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui. Almost everything is a client component (`"use client"`), and all data comes from an external REST backend. There are no Next.js API routes or server actions.

### Backend and HTTP

- `lib/api/axios.ts` exports the shared `API` axios instance. `baseURL` is hardcoded to the staging backend (`https://api.staging.frametheworld.org`). It sends the fixed `devicemodel` / `deviceuniqueid` headers that the backend requires for admin sessions.
- The request interceptor attaches `Bearer <localStorage.authToken>`. On a 401 outside `/auth/*`, the response interceptor clears `authToken` and `authUser` from localStorage and hard-redirects to `/auth/login`.
- Backend responses are usually shaped `{ success, message, data, pagination? }`, with `pagination` = `{ itemsPerPage, currentPage, totalItems, totalPages }`. Pagination and filtering happen on the server through query params.

### Server state vs client state

- **TanStack Query** handles all API data. Each domain has a `lib/api/<domain>.api.ts` file that holds, in one place: the TS types for the payloads, a `<domain>Keys` query-key factory, plain async fetchers that use `API`, and exported `use<Domain>` / `use<Action><Domain>` hooks. Mutations call `qc.invalidateQueries` on success. `lib/api/users.api.ts` is the reference pattern. Defaults (5 min staleTime, retry 1) are in `lib/query-client.ts`. The providers and devtools are in `components/providers.tsx`.
- **Redux Toolkit** (`lib/store.ts`) is only for client state. Right now that is just `authSlice` (`isAuthenticated`, user, token).

### Auth and route guards

- The login flow stores `authToken` and `authUser` (JSON) in localStorage and dispatches `setCredentials`.
- `hooks/use-auth-init.ts` rehydrates Redux from localStorage on first render. `ProtectedRoute` and `PublicRoute` (in `components/`) wait for it before they redirect. The guards wrap `app/dashboard/layout.tsx` and `app/auth/layout.tsx`, not individual pages.

### Layout and navigation

- `app/dashboard/layout.tsx` builds the shell: sidebar, `SiteHeader`, and `SiteFooter`. Sidebar variant, collapsibility and side are runtime config from `SidebarConfigProvider` (`contexts/sidebar-context.tsx`, read with `useSidebarConfig()`).
- Nav items are a static `data.navGroups` array in `components/app-sidebar.tsx`. Add every new route there.

### Feature modules

Modules live under `app/dashboard/<module>/`: users, promo-codes, content-moderation, leaderboard, badges (+ `badges/management`), frames/`[frameId]`/posts, and users/`[id]`/content. Some modules keep their pieces in a colocated `components/` folder (users). Others are one large `page.tsx` (promo-codes and content-moderation run to hundreds of lines). The users module's `data-table.tsx` is the established `@tanstack/react-table` pattern. `app/heavy-charts`, `app/heavy-data` and `app/test-progress` are leftover demo/test pages from the template.

To add a module: create `lib/api/<module>.api.ts` (types + keys + hooks), then `app/dashboard/<module>/page.tsx`, then add a nav entry in `app-sidebar.tsx`.

## Conventions

- Always import with the `@/` alias (it maps to the project root).
- Tailwind v4 has no `tailwind.config.js`. Theme tokens are CSS variables in `app/globals.css`. Compose classes with `cn()` from `@/lib/utils`.
- `components/ui/` holds shadcn primitives (style `radix-vega`, base color `stone`, lucide icons). Add new ones with `npx shadcn add <component>` instead of writing them by hand.
- Charts use the shadcn chart primitives (`components/ui/chart.tsx`) with Recharts. Examples: https://ui.shadcn.com/charts/area. The dashboard chart components are in `components/charts-and-graphs/`.
- Forms use `react-hook-form` + `zod` (`@hookform/resolvers`). Toasts use `sonner`; the global `<Toaster>` and its styling are in `app/layout.tsx`.
