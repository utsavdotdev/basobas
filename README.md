# BasoBas

Rental accommodation web app built with Next.js.

## Backend Direction

BasoBas now uses **Supabase-only backend infrastructure**.

- Database: Supabase Postgres
- Auth: Supabase Auth
- Access control: Supabase RLS
- Realtime: Supabase Realtime
- File uploads: Supabase Storage

## Docs

- [Supabase-Only Backend Guide](./docs/supabase-backend-guide.md)

## Quick Start

1. Create `.env.local`:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

2. Install dependencies:

```bash
pnpm install
```

3. Run app:

```bash
pnpm dev
```

Homepage shows a Supabase connection status banner (`Connected` or `Not connected`).
