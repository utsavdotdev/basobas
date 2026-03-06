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

1. Create local env file from template:

```bash
cp .env.example .env.local
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

## Vercel Environment Setup

Set these in `Vercel -> Project -> Settings -> Environment Variables`.

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PHONE_OTP_PEPPER`

Optional:
- `PHONE_OTP_MODE` (`simulate` or `webhook`, defaults to `simulate`)
- `PHONE_OTP_SMS_WEBHOOK_URL` (required when `PHONE_OTP_MODE=webhook`)
- `PHONE_OTP_SMS_WEBHOOK_TOKEN` (optional auth token for webhook)
- `NEXT_PUBLIC_SUPABASE_KEY` (legacy alias for anon key)

Recommended Vercel scopes:
- Add all required vars to `Production`, `Preview`, and `Development`.
- Use `PHONE_OTP_MODE=webhook` in `Production`.
- Keep `PHONE_OTP_MODE=simulate` only for prototype/testing environments.

After adding/updating env vars:
1. Trigger a redeploy from Vercel dashboard, or
2. Push a new commit to your connected branch.
