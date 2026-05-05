# Perpetum App Architecture Rules

This file defines the architecture and coding standards for all apps built from the Perpetum template.
These rules MUST be followed by any AI assistant (Claude, Lovable, Cursor, etc.) generating or modifying code.

**Architecture pattern**: Clean Architecture (Martin, 2017) adapted for React SPA with Feature-Sliced principles.

---

## Project Structure (MANDATORY)

```
src/
├── pages/              # Route-level components ONLY (one per route)
├── components/         # Reusable UI components (NO business logic)
│   ├── ui/             # shadcn/ui primitives (DO NOT EDIT)
│   └── [feature]/      # Feature-specific components (grouped by domain)
├── hooks/              # Custom React hooks (data fetching, auth, state)
├── services/           # External API integrations & business logic
├── lib/                # Pure utilities, helpers, constants
├── integrations/       # Auto-generated code (Supabase types, etc.)
├── store/              # Zustand stores (client-only state)
├── types/              # Shared TypeScript type definitions
└── assets/             # Static files (images, fonts)
```

### Rules:
- **Pages** contain layout composition only — delegate logic to hooks and components
- **Components** are pure UI — they receive props, render JSX, emit events
- **Hooks** own all data fetching and state management logic
- **Services** encapsulate external API calls (never call APIs directly from components)
- **One component per file** — file name matches the exported component name
- **Colocate types** with their module unless shared across 3+ files

---

## Data Flow & State Management

### Server State (React Query)
- ALL data from Supabase/APIs MUST use React Query (`@tanstack/react-query`)
- NEVER use `useState` for data that comes from an API
- Use query keys that include all dependencies: `['apps', { domain, status }]`
- Mutations must invalidate related queries on success

### Client State (Zustand)
- ONLY for UI state that doesn't come from the server (favorites, sidebar open, theme)
- Keep stores small and focused — one store per concern
- Persist to localStorage only when necessary (user preferences)

### Auth State
- ALWAYS use the `useAuth()` hook — never access Supabase auth directly in components
- Never store tokens manually — the AuthProvider handles session management
- Use `hasAccess` and `currentAppRole` for authorization decisions in UI

### Data Flow Direction
```
User Action → Component → Hook (mutation) → Service → Supabase
                                                          ↓
UI Update  ← Component ← Hook (query)   ← React Query Cache
```

---

## Security Rules (NON-NEGOTIABLE)

### Authentication & Authorization
- Every protected route MUST be wrapped in `ProtectedRoutes` (see App.tsx)
- Set `APP_SLUG` in App.tsx for per-app access control
- NEVER bypass auth checks — no "temporary" disabling of auth
- Azure AD SSO (MSAL) is the primary auth method for production

### Data Access
- ALL database tables MUST have Row-Level Security (RLS) enabled
- NEVER use `service_role` key in frontend code
- Access control logic belongs in PostgreSQL policies, NOT in frontend code
- Use `SECURITY DEFINER` functions for complex authorization checks

### Secrets & Environment Variables
- NEVER hardcode secrets, API keys, or credentials in source code
- Frontend env vars (`VITE_*`) are PUBLIC — never put secrets there
- Server-side secrets go in Edge Functions or backend services only
- The `.env` file is gitignored — use `.env.example` as documentation

### Input & Output
- Validate ALL user input at the boundary with Zod schemas
- NEVER use `dangerouslySetInnerHTML` — if absolutely needed, sanitize with DOMPurify
- Escape user-generated content in all rendered output
- Use parameterized queries (Supabase client handles this — never build raw SQL)

### Dependencies
- Keep dependencies minimal — justify every new package
- Run `npm audit` before adding dependencies
- Prefer well-maintained packages with >1000 weekly downloads
- NEVER install packages that require `--force` or `--legacy-peer-deps`

---

## Styling & Design System

### Perpetum Brand
- Use the CSS variables defined in `src/index.css` — NEVER hardcode colors
- Perpetum color palette: blue, light-blue, teal, sage, yellow, orange, navy
- Font: Archivo (headings), Segoe UI (body)
- Radius: `var(--radius)` = 0.5rem

### Component Styling
- Use Tailwind CSS utility classes — no custom CSS unless absolutely necessary
- Use `cn()` from `@/lib/utils` for conditional classes
- Use shadcn/ui components for all standard UI patterns (buttons, dialogs, forms, etc.)
- Dark mode: always test both themes — use `bg-background`, `text-foreground`, etc.

### Layout
- Sidebar + Main content layout via `MainLayout` component
- Responsive: mobile-first, breakpoints at `sm`, `md`, `lg`, `xl`
- Consistent spacing: `p-6 lg:p-8` for page content

---

## TypeScript Standards

- Strict mode is the goal — avoid `any` type (use `unknown` + type guards)
- Define interfaces for all props, API responses, and state shapes
- Export types from the module that owns them
- Use discriminated unions for state machines (loading/error/success)

```typescript
// GOOD: Typed hook return
interface UseAppsResult {
  apps: App[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// BAD: Loose typing
const useApps = (): any => { ... }
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Pages | PascalCase | `DashboardPage.tsx` |
| Components | PascalCase | `UserCard.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Services | camelCase | `analyticsService.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `AppTypes.ts` |
| Stores | camelCase | `sidebarStore.ts` |
| Tests | `*.test.ts(x)` | `useAuth.test.ts` |

---

## Routing

- Define all routes in `App.tsx` — no dynamic route registration
- Use React Router v6 patterns: nested routes, outlets, loaders
- Protected routes go inside `ProtectedRoutes` component
- Public routes (auth, no-access, 404) go at top level

---

## Error Handling

- Use React Error Boundaries around async content sections
- Show user-friendly error states — never expose raw error messages
- Log errors to console in development, to monitoring service in production
- Handle loading states for ALL data-dependent UI (use Skeleton components)

---

## Testing

- Unit tests for hooks and services (`vitest`)
- Component tests for critical user flows (`@testing-library/react`)
- Test file lives next to the code it tests: `useAuth.test.ts` beside `useAuth.ts`
- Mock Supabase client in tests — never hit real database

---

## What NOT to Do

- DO NOT add `console.log` in production code (use proper error handling)
- DO NOT disable TypeScript errors with `@ts-ignore` or `@ts-nocheck`
- DO NOT install state management libraries beyond Zustand + React Query
- DO NOT create "god components" with >200 lines — split into smaller pieces
- DO NOT put business logic in event handlers — extract to hooks/services
- DO NOT use `useEffect` for data fetching — use React Query
- DO NOT store sensitive data in localStorage or sessionStorage
- DO NOT modify files in `src/components/ui/` — these are shadcn/ui managed
- DO NOT use inline styles — use Tailwind classes
- DO NOT skip loading/error states

---

## Supabase Patterns

### Querying Data (in a hook)
```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useItems(departmentId: string) {
  return useQuery({
    queryKey: ["items", departmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("department_id", departmentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!departmentId,
  });
}
```

### Mutations (in a hook)
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: CreateItemInput) => {
      const { data, error } = await supabase
        .from("items")
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
```

---

## Deployment Checklist

Before deploying to Azure:
1. `APP_SLUG` is set correctly in `App.tsx`
2. All `VITE_*` environment variables configured in Azure Static Web App settings
3. RLS policies verified on all tables
4. No `console.log` statements in production build
5. `npm run build` succeeds without errors
6. `npm audit` shows no high/critical vulnerabilities
