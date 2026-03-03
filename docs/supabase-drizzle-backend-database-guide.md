# BasoBas Complete Backend + Database Guide
## Stack: Next.js + Supabase (PostgreSQL) + Drizzle ORM

This is the single source-of-truth documentation for backend setup and database implementation.

---

## 1. Goal

Build a production-ready backend for BasoBas with:
- Supabase PostgreSQL as database
- Drizzle ORM for type-safe queries
- Next.js route handlers/server actions for API
- Realtime request updates for tenant/landlord dashboards

Core business rules:
- landlord cannot submit rental request
- long-term rental model only (`moveInDate` + `stayDurationMonths`)
- no duplicate active request for same tenant + listing

---

## 2. Final Architecture

1. Client UI calls Next.js API route/server action.
2. API validates request (Zod) and checks auth.
3. Service layer applies business rules.
4. Repository layer executes Drizzle queries.
5. Database constraints/triggers act as final safety layer.
6. Realtime signals update landlord/tenant request cards.

Keep this layering:
- `app/api/*`: HTTP input/output only
- `lib/server/services/*`: business logic + transaction orchestration
- `lib/server/repositories/*`: database access only
- `lib/server/db/*`: db client + schema

---

## 3. Prerequisites

- Node.js 20+
- pnpm
- Supabase project (or local Supabase)
- Access to Postgres direct connection string and pooled connection string

Install packages:

```bash
pnpm add drizzle-orm postgres @supabase/supabase-js zod
pnpm add -D drizzle-kit tsx dotenv
```

---

## 4. Environment Variables

Create `.env.local`:

```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

DATABASE_URL=your_pooled_postgres_url
DATABASE_URL_DIRECT=your_direct_postgres_url
```

Rules:
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client.
- Use `DATABASE_URL` for runtime app queries.
- Use `DATABASE_URL_DIRECT` for migrations/admin operations.

---

## 5. Backend Project Structure

```text
lib/server/db/client.ts
lib/server/db/schema.ts
lib/server/db/relations.ts
lib/server/repositories/user.repository.ts
lib/server/repositories/listing.repository.ts
lib/server/repositories/request.repository.ts
lib/server/repositories/favorite.repository.ts
lib/server/services/request.service.ts
lib/server/services/listing.service.ts
lib/server/services/profile.service.ts
lib/server/auth/session.ts
app/api/listings/route.ts
app/api/requests/route.ts
app/api/requests/[id]/route.ts
app/api/profile/tenant/requests/route.ts
app/api/profile/landlord/requests/route.ts
```

---

## 6. Supabase + Drizzle Setup

### Step 1: Configure Supabase

1. Create project for `dev` (and later `staging/prod`).
2. Enable Postgres extensions needed by schema:
   - `pgcrypto`
   - `citext`
   - `pg_trgm`
3. Keep timezone in UTC.

### Step 2: Create Drizzle DB Client

Use `postgres.js` driver with Drizzle in server-only code.

Example pattern:

```ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const queryClient = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  prepare: false,
});

export const db = drizzle(queryClient);
```

### Step 3: Drizzle Config

Create `drizzle.config.ts` with:
- schema file path
- output folder for generated artifacts
- `DATABASE_URL_DIRECT` for migration operations

---

## 7. Migration Strategy (Important)

Use one migration strategy only.

Recommended in this project:
- SQL-first migrations (because advanced constraints/triggers/indexes are required)
- Drizzle for query layer and types

Migration flow:
1. Create migration SQL file (versioned: `0001_init.sql`, `0002_x.sql`).
2. Apply migration in dev database.
3. Run validation tests.
4. Apply same migration in staging.
5. Apply same migration in production.

Do not manually edit production schema outside migrations.

---

## 8. Database Design

### 8.1 Tables

1. `users`
2. `listings`
3. `listing_images`
4. `listing_favorites`
5. `rental_requests`
6. `rental_request_events`

### 8.2 Enum Types

- `user_role`: `tenant`, `landlord`
- `listing_type`: `single`, `double`, `studio`, `apartment`
- `rental_request_status`: `pending`, `approved`, `rejected`, `cancelled`
- `rental_request_event_type`: `created`, `status_changed`, `message_updated`, `note_added`, `cancelled`

### 8.3 Relationships

- one landlord (`users`) -> many `listings`
- one listing -> many `listing_images`
- many-to-many `users` <-> `listings` via `listing_favorites`
- one listing -> many `rental_requests`
- one rental request -> many `rental_request_events`

### 8.4 Required Constraints

- `tenant_user_id <> landlord_user_id`
- `landlord_user_id` must match listing owner
- phone format in E.164 where applicable
- `stay_duration_months >= 1`
- status/timestamp consistency for request lifecycle

### 8.5 Required Indexes

- search index for listing discovery (title/location/description)
- landlord inbox index (`landlord_user_id`, `status`, `created_at`)
- tenant requests index (`tenant_user_id`, `created_at`)
- unique active request index (`tenant_user_id`, `listing_id`) where status in pending/approved
- unique approved request per listing index where status = approved

---

## 9. API Plan

### Listings
- `POST /api/listings` (landlord only)
- `GET /api/listings` (filters: search, location, type, facilities, price)

### Rental Requests
- `POST /api/requests` (tenant only)
- `PATCH /api/requests/:id` (approve/reject/cancel)

### Profile Request Views
- `GET /api/profile/tenant/requests`
- `GET /api/profile/landlord/requests`

### Favorites
- `POST /api/favorites/:listingId`
- `DELETE /api/favorites/:listingId`

All writes must pass:
1. Zod validation
2. auth check
3. role check
4. transaction-safe service method

---

## 10. Realtime Booking Updates

### Recommended: Supabase Realtime

1. Enable realtime replication for `rental_requests`.
2. Tenant UI subscribes to own request updates.
3. Landlord UI subscribes to incoming request updates for owned listings.
4. On realtime event, refresh request list query.

## 11. Security Rules

1. Service role key only on server.
2. Never trust client-provided `landlordId`/`userId`; derive from session.
3. Re-check ownership on every update/delete action.
4. Keep sensitive operations in server-only modules.
5. Return normalized error codes (`VALIDATION_ERROR`, `FORBIDDEN_ROLE`, `CONFLICT`, etc.).

---

## 12. Testing Plan

Must-have integration tests:

1. Landlord cannot create tenant request.
2. Tenant cannot approve/reject requests.
3. Duplicate active request blocked.
4. Approve/reject/cancel transitions work and timestamps are correct.
5. One listing cannot have multiple approved active requests.
6. Incoming request list only shows landlord-owned listings.

---

## 13. Deployment Checklist

1. Backup database before each migration.
2. Apply migration in staging first.
3. Run integration tests against staging.
4. Verify critical endpoints and realtime flows.
5. Apply migration in production.
6. Monitor errors/slow queries.

---

## 14. Team Work Split (4 Members)

### Member 1: Infra + Migration Owner

- Supabase env setup (dev/staging/prod)
- migration pipeline and release sequencing
- backup/rollback process

### Member 2: DB + Drizzle Schema Owner

- table/enums/relations mapping in Drizzle
- repository layer for listings/favorites/users
- query performance checks

### Member 3: Request Workflow API Owner

- rental request service and API routes
- approve/reject/cancel business logic
- auth and role enforcement in services

### Member 4: Realtime + QA + Docs Owner

- Supabase realtime subscriptions in frontend/backend
- integration tests and edge-case testing
- documentation maintenance and release checklist
