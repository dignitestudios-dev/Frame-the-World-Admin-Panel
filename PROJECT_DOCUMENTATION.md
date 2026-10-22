# Frame The World - Admin Panel
## Project Documentation

This document provides a comprehensive overview of the "Frame The World" Admin Panel architecture, folder structure, state management, API integration, and styling to assist in further development, module addition, and bug fixing.

### 1. Technology Stack
- **Framework**: Next.js 16.1.1 (App Router paradigm)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4, `shadcn/ui` (Radix UI primitives, Base UI)
- **State Management**: Redux Toolkit (global state) & TanStack React Query v5 (server state & caching)
- **Form Handling**: `react-hook-form` with `zod` schema validation
- **Data Visualization**: `recharts`
- **HTTP Client**: `axios`

### 2. Folder Structure Overview
The project follows a standard Next.js App Router structure with feature-based encapsulation.

- `app/`
  - `auth/`: Contains authentication pages (login, forgot-password, reset-password, verification).
  - `dashboard/`: Contains the main application dashboard and its modules.
    - `badges/`: Badge Management module.
    - `content-moderation/`: Content Moderation module.
    - `frames/`: Frame Management module.
    - `leaderboard/`: Leaderboard module.
    - `promo-codes/`: Promo Code module.
    - `users/`: User Management module.
- `components/`
  - `auth/`: Specific components for the authentication flow.
  - `charts-and-graphs/`: Recharts wrapper components for the dashboard overview.
  - `ui/`: Reusable `shadcn/ui` primitives (buttons, inputs, dialogs, etc.).
  - *Layout Components*: `app-sidebar.tsx`, `nav-main.tsx`, `nav-user.tsx`, `site-header.tsx`, `site-footer.tsx`.
  - *Route Guards*: `ProtectedRoute.tsx`, `PublicRoute.tsx`.
- `lib/`
  - `api/`: API service files separated by domain (e.g., `auth.api.ts`, `users.api.ts`, `analytics.api.ts`). Contains the Axios instance (`axios.ts`).
  - `slices/`: Redux Toolkit slices (e.g., `authSlice.ts`).
  - `store.ts`: Redux store configuration.
  - `query-client.ts`: TanStack Query client configuration.
  - `utils.ts`: Tailwind CSS utility functions (`cn` function for `clsx` and `tailwind-merge`).
- `contexts/` & `hooks/`:
  - Contains context providers (e.g., theme, sidebar) and custom React hooks (`use-auth-init.ts`, `use-mobile.ts`).

### 3. API Integration Details
- **Base URL**: `https://api.staging.frametheworld.org` (currently pointing to staging).
- **Axios Configuration** (`lib/api/axios.ts`):
  - Includes custom headers `devicemodel: "Admin_Session"` and `deviceuniqueid` hardcoded for backend identification.
  - **Request Interceptor**: Injects the Bearer token from `localStorage.getItem("authToken")`.
  - **Response Interceptor**: Catches `401 Unauthorized` responses globally. If a 401 occurs outside the `/auth/` routes, it clears `localStorage` and redirects the user to `/auth/login`.

### 4. State Management
- **Server State (React Query)**: Used for all API data fetching, caching, and mutations (e.g., `useAnalyticsOverview()` from `analytics.api.ts`).
- **Client State (Redux Toolkit)**: Mainly used for synchronous global UI states or storing the authenticated user's session data across the app (managed in `authSlice.ts`).

### 5. Routing and Protection
- Next.js layouts (`layout.tsx`) wrap specific route segments.
- `ProtectedRoute.tsx` and `PublicRoute.tsx` in `components/` are used to guard routes, ensuring authenticated users can't visit login pages and unauthenticated users are bumped from the dashboard.

### 6. Preparation for New Modules & Fixes
When adding a new module (e.g., `reports`), the standard operating procedure should be:
1. **API Layer**: Create a new API service in `lib/api/new-module.api.ts` exposing React Query hooks (`useQuery`, `useMutation`).
2. **Components**: Add module-specific components in a new folder or under `components/new-module/`.
3. **Routing**: Create the route under `app/dashboard/new-module/page.tsx`.
4. **Navigation**: Update `components/app-sidebar.tsx` or `nav-main.tsx` to include the new route link.
