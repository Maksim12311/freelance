# StudentPro

**Students Helping Students.** A **private** Vienna marketplace for **verified university students** — tutoring, design, moving, technology, and everyday help. Guests can view marketing pages only; requests, profiles, messaging, and posting require login + student verification.

StudentPro is a digital intermediary only. It does **not** employ students, provide services itself, process payments for services, hold customer money, set mandatory prices, guarantee quality, or automatically assign workers.

> No Stripe / escrow / wallet / commission flows are implemented in this MVP.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Auth, Postgres, Storage, RLS
- Zod validation + Server Actions

## Prerequisites

- Node.js 20+
- A Supabase project (Auth + Postgres + Storage)
- npm

## Setup

```bash
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and service role key
npm install
```

### Supabase database

1. Create a Supabase project.
2. In the SQL editor (or via Supabase CLI), run migrations in order:
   - `supabase/migrations/20260322000001_initial_schema.sql`
   - `supabase/migrations/20260322000002_verification_sync_trigger.sql`
   - `supabase/migrations/20260322000003_privileged_helpers.sql`
   - `supabase/migrations/20260322000004_private_marketplace_rls.sql`
3. Run `supabase/seed.sql` for universities, approved email domains, categories, and skills.
4. Confirm Storage buckets `verification-documents` (private), `avatars`, and `request-images` exist (created by the initial migration when `storage.buckets` is available).
5. In Auth settings, add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`
   - your production equivalents

### Environment variables

See `.env.example`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin operations (account deletion, never ship to browser) |
| `NEXT_PUBLIC_SITE_URL` | Auth redirect base URL |
| `DOCUMENT_RETENTION_DAYS` | Guidance for verification document retention cleanup |

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm run build
npm start
```

## Admin setup

1. Sign up normally through `/signup`.
2. In Supabase SQL editor, promote the account **only via trusted operators**:

```sql
update public.profiles
set is_admin = true
where email = 'your-admin@example.com';
```

Users cannot set `is_admin` themselves (enforced by trigger + RLS).

3. Open `/admin` to review verifications, moderate reports, manage categories/domains, and view audit logs.

## Deployment

1. Push to GitHub and deploy on Vercel (or similar).
2. Set the same environment variables in the host.
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
4. Apply SQL migrations + seed to the production Supabase project.
5. Configure Auth redirect allowlist for production callbacks.
6. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

## Security checklist

- [x] Supabase Auth email signup / login / password reset
- [x] Server-side session refresh via Next.js `proxy.ts`
- [x] Protected routes for dashboard, messages, settings, verification, new requests, admin
- [x] RLS on all application tables
- [x] Users cannot self-grant admin or self-verify
- [x] Verification documents in private storage (no public URLs)
- [x] Input validation with Zod on server actions
- [x] File type/size checks for enrollment uploads
- [x] Basic in-memory rate limiting on sensitive actions
- [x] No service-role key in client bundles
- [ ] Replace in-memory rate limiting with Redis/Upstash for multi-instance production
- [ ] Configure CSP / additional edge hardening for production
- [ ] Schedule verification document retention cleanup job

## Known limitations

- End-to-end auth/messaging/verification flows require real Supabase credentials (not included).
- In-memory rate limiter is single-process only.
- University email verification submits domain-allowlisted addresses for admin review; a dedicated mailbox confirmation OTP can be extended later.
- Realtime message subscriptions are optional; the MVP uses request/response messaging with revalidation.
- Account deletion soft-disables the profile and deletes the auth user when the service role key is configured.
- Demo/seed content must never be presented as real users or genuine reviews.
- Dark mode is available via `next-themes` but light theme is the default brand presentation.

## Legal review required before public launch

Mark these as drafts needing a qualified Austrian legal professional:

1. Terms of Service (`/legal/terms`)
2. Privacy Policy (`/legal/privacy`) — GDPR, retention, DPIA as needed
3. Impressum (`/legal/impressum`) — operator identity/UID
4. Community Guidelines (`/legal/community-guidelines`)
5. Reporting & Moderation Policy (`/legal/moderation`) — DSA alignment
6. Work eligibility status wording (not government authorization)
7. Student verification disclaimer language
8. Consumer / e-commerce disclosures if applicable
9. Platform intermediary positioning vs employment risk
10. Cross-border data transfer / hosting disclosures

## Product notes

- Currency: EUR (€)
- Language: English
- Location focus: Vienna, Austria
- Verified students can publish requests, apply, and message
- No service payment processing in MVP
