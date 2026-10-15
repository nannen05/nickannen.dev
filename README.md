# Outreach system

This repo now contains Vercel Functions backed by Supabase. The existing Vite site remains the public landing page.

## Start safely

1. Run `npm run dev:vercel` for local full-stack development. This uses Vercel's local runtime so `/admin` and `/api/*` work alongside the Vite site. `npm run dev` starts the frontend only and does not provide API routes.
2. Copy `.env.example` to `.env`; set a strong `OUTREACH_ADMIN_PASSWORD`, a real postal address, and use `https://www.nickannenofficial.com` for both `OUTREACH_WEBSITE_URL` and `OUTREACH_API_URL`.
3. In Supabase, apply `supabase/migrations/20261015150000_outreach.sql` using the Supabase CLI or SQL editor.
4. Deploy this repository to Vercel. The admin dashboard is at `/admin` and uses HTTP Basic authentication.
5. Review lead status and explicitly enroll approved contacts. Campaigns seed as **paused**, dry-run, and live delivery is locked behind `OUTREACH_LIVE_SENDING=true` plus a configured Resend credential.

## Deployment requirements

- A Supabase project connected to Vercel and the migration applied before the first deploy.
- Vercel Cron invokes `/api/cron/outreach`; configure a strong `CRON_SECRET`. On Vercel Hobby, Cron runs only once daily, so use a suitable plan for more frequent outreach scheduling.
- An authenticated Resend sender domain and `RESEND_API_KEY` if live sending is approved.
- An inbound-email webhook/mailbox connection is still required before live use. Configure it to POST normalized `{ from, text, body }` payloads to `/webhooks/inbound` with `x-outreach-secret`; it stops human-reply sequences and records classification. Treat any webhook-sync outage as a sending pause operationally.
- Calendly webhook credentials are required for automatic booking attribution; otherwise reconcile bookings manually.

## Safety model

The database is the source of truth. Contacts deduplicate by email, Apollo id, or LinkedIn URL; suppressions persist globally. Each enrolled contact gets durable subject and website assignments. Website and opt-out links share the public Vercel origin; the API is available beneath `/api`. Workers atomically claim each pending step, check stops before delivery, and never auto-enable a campaign.

Run `npm test` and `npm run build` before deployment.
