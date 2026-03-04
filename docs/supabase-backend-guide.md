# BasoBas Supabase-Only Backend Guide
## Stack: Next.js App Router + Supabase (Auth, Postgres, Realtime, Storage)

This is the source-of-truth backend guide for BasoBas.

## 1. Decision

BasoBas uses **Supabase only** for backend infrastructure.

What this means:
- Supabase Postgres is the database.
- Supabase Auth handles identity/session tokens.
- Supabase Row Level Security (RLS) enforces data access.
- Supabase Realtime is used for live request/listing updates.
- Supabase Storage is used for listing image uploads.
- Next.js Route Handlers and Server Actions provide app-specific API endpoints.


## 2. Current Project Baseline

Installed packages:
- `@supabase/supabase-js` (v2)
- `@supabase/ssr` (for App Router server/client auth session support)

Existing project files:
- `lib/supabase/server.ts`
- `lib/supabase/check-connection.ts`

Connection status UI exists on:
- `app/page.tsx`

## 3. Environment Variables

Use `.env.local` for local development.

```env
# Required
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY

# Recommended for standard Supabase naming compatibility
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY

# Server-only (required for privileged operations only)
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Rules:
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser.
- Keep service-role usage in server-only files.
- Never commit real credentials.

## 4. Backend Architecture

Request flow:
1. User action in React UI.
2. Next.js Server Action or Route Handler receives request.
3. Server creates Supabase client.
4. RLS and policies enforce tenant/landlord permissions.
5. Response is returned to UI.

Layers in app:
- `app/api/*` or server actions: input/output and orchestration.
- `lib/supabase/*`: client creation and connectivity helpers.
- `lib/server/*` (optional): business rules, reusable backend service logic.

## 5. Supabase Client Patterns (Next.js App Router)

### 5.1 Server client

Use `createServerClient` from `@supabase/ssr` inside server contexts so cookies/session are handled correctly.

Current project implementation:
- `lib/supabase/server.ts`

### 5.2 Browser client (when needed)

If client components need direct Supabase calls, add a browser client helper using `createBrowserClient` from `@supabase/ssr`.

### 5.3 Admin client (service-role)

Use only for trusted server-side operations that must bypass RLS:
- backoffice actions
- scheduled cleanup jobs
- admin-only moderation flows

Never import admin client into client components.

## 6. Auth and Authorization Model

Primary identity source:
- Supabase Auth user id (`auth.uid()`).

Authorization model:
- App roles like `tenant` and `landlord` are stored in DB profile tables.
- RLS policies combine `auth.uid()` and role checks.
- Route Handlers still validate business rules before write operations.

Minimum auth checks per write:
1. authenticated user exists
2. role is valid for action
3. ownership relationship is valid (listing owner, request owner)

## 7. Database and Migrations

Use Supabase migrations as the only schema source.

Recommended workflow:
1. Create migration SQL with Supabase CLI.
2. Apply to local/dev project.
3. Validate with tests.
4. Promote same migration to staging/prod.

Suggested folder layout:
- `supabase/migrations/*.sql`
- `supabase/seed.sql` (optional)

Core DB constraints to keep:
- prevent duplicate active requests per tenant + listing
- enforce valid request status transitions
- enforce ownership consistency between listing and landlord
- normalize timestamps and default values in UTC

## 8. RLS Policy Strategy

RLS should be enabled on all app-facing tables.

Policy examples to enforce:
- Tenants can read/update only their own rental requests.
- Landlords can read/update rental requests only for their own listings.
- Users can manage only their own favorites.
- Listing write operations allowed only for listing owners.

Principles:
- Deny by default.
- Keep policies explicit and minimal.
- Use service-role only where RLS bypass is truly required.

## 9. API Endpoints (Suggested)

Listings:
- `POST /api/listings` (landlord only)
- `GET /api/listings` (search/filter)

Rental requests:
- `POST /api/requests` (tenant only)
- `PATCH /api/requests/:id` (approve/reject/cancel with ownership checks)

Profile data:
- `GET /api/profile/tenant/requests`
- `GET /api/profile/landlord/requests`

Favorites:
- `POST /api/favorites/:listingId`
- `DELETE /api/favorites/:listingId`

Validation standard:
- Validate request payloads with Zod.
- Return normalized error codes and HTTP status.

## 10. Realtime and Storage

Realtime:
- Enable realtime on request-related tables.
- Subscribe from relevant dashboard views.
- Refresh or patch UI state on change payloads.

Storage:
- Use Supabase Storage bucket(s) for listing images.
- Use signed upload/access flows where needed.
- Add file type/size validation before upload.

## 11. Observability and Operations

Minimum production readiness:
- Track failed writes and auth errors.
- Monitor query performance and slow endpoints.
- Keep a rollback path for each migration.
- Run staging verification before production rollout.

## 12. Security Checklist

- Do not expose service role key to client bundles.
- Derive user identity from Supabase session, never trust client `userId` fields.
- Re-check ownership on every write endpoint.
- Keep sensitive logic in server-only modules.
- Validate all request payloads.
- Apply least-privilege RLS policies.

## 13. Local Development Checklist

1. Ensure `.env.local` has valid Supabase values.
2. Start app with `pnpm dev`.
3. Confirm homepage Supabase status banner shows `Connected`.
4. Verify auth/session cookies work in route handlers.
5. Test one end-to-end protected write operation.

## 14. Migration From Previous Drizzle Plan

Previous plan references to remove/ignore:
- Drizzle schema/repository/migration flow
- `DATABASE_URL` and direct `postgres` runtime usage
- Drizzle kit generation commands

From now on:
- Supabase migrations + Supabase clients are the official backend path.

## 15. Definition of Done (Backend Tasks)

A backend task is complete only when:
1. Supabase schema/migration is applied.
2. RLS policies cover the new data path.
3. API or server action validates payload and auth.
4. Tenant/landlord permission behavior is tested.
5. Errors are handled with clear response codes.
