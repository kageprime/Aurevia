# Aurevia WhatsApp Backend

## Run locally

```bash
npm run dev:backend
```

Backend URL defaults to `http://localhost:8787`.

## Deployment

The backend can serve the built frontend from `dist/` when `npm run build` has been run.
Use `npm start` after building for a single-process deployment.

## Required environment variables

- `WHATSAPP_BACKEND_PORT` (default `8787`)
- `FRONTEND_ORIGIN` (default `http://localhost:5173`)
- `VITE_CLERK_PUBLISHABLE_KEY` (frontend build-time env)
- `CLERK_SECRET_KEY` (backend auth verification)
- `ADMIN_EMAIL` (admin allowlist)
- `USE_POSTGRES` (default `false`)
- `DATABASE_URL` (required when `USE_POSTGRES=true`)
- `DB_AUTO_MIGRATE` (default `true`)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM` (example `whatsapp:+14155238886`)
- `WHATSAPP_NOTIFY_TO` (business recipient, example `whatsapp:+15551234567`)
- `WHATSAPP_BACKEND_API_KEY` (optional API-key fallback)
- `BANK_NAME`
- `BANK_ACCOUNT_NAME`
- `BANK_ACCOUNT_NUMBER`
- `BANK_SWIFT_CODE`

## Notes

- Clerk owns sign-in/sign-up and session transport.
- `ADMIN_EMAIL` is used as the admin allowlist for privileged routes.
- The legacy password/session env vars are no longer part of the deployment sample.