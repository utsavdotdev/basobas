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
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
# Optional backward-compatible alias if you already use this:
# NEXT_PUBLIC_SUPABASE_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

2. Install dependencies:

```bash
pnpm install
```

3. Run app:

```bash
pnpm dev
```

## Google Authentication Setup

1. Apply Supabase migration for auth profile/role tables only:

```bash
supabase db push
```

2. In Supabase dashboard:
- Go to `Authentication -> Providers -> Google` and enable Google.
- Set your Google OAuth `Client ID` and `Client Secret`.

3. In Google Cloud OAuth settings:
- Add authorized redirect URI:
  - `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`

4. In Supabase dashboard `Authentication -> URL Configuration`:
- Set `Site URL` to your app URL (local: `http://localhost:3000`).
- Add redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://your-production-domain.com/auth/callback`

After this, users can choose `tenant` or `landlord` in the login modal and continue with Google OAuth.
