# Aurevia WhatsApp Backend

## Run locally

```bash
npm run dev:backend
```

Backend URL defaults to `http://localhost:8787`.

## Deployment

The backend can serve the built frontend from `dist/` when `npm run build` has been run.
Use `npm start` after building for a single-process deployment.
Run the project on Node.js 20.19.0 or newer. Node 18 will emit engine warnings and is not a supported runtime for the current dependency set.
On Railway, set the start command to `npm start` and rely on the platform-provided `PORT` value. Set `FRONTEND_ORIGIN` to your Vercel URL, and copy the Clerk/Twilio/database variables from `.env.example` into Railway variables.

## Backend-only Railway setup

1. Create a Railway service from this repo and set the root directory to `app`.
2. Leave the start command as `npm start` or let Railway read the included [Procfile](../Procfile).
3. Set `PORT` automatically through Railway; do not hardcode a port.
4. Set `FRONTEND_ORIGIN` to your deployed frontend URL, for example `https://aurevia-alpha.vercel.app`. This is the browser origin the backend uses for CORS.
5. Add `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `ADMIN_EMAIL`, `USE_POSTGRES`, `DATABASE_URL`, and any Twilio/bank variables you need.
6. If you keep the backend API public, set `VITE_WHATSAPP_API_URL` in the frontend to the Railway service URL.

## Required environment variables

- `WHATSAPP_BACKEND_PORT` (default `8787`)
- `FRONTEND_ORIGIN` (default `http://localhost:5173`)
- `VITE_CLERK_PUBLISHABLE_KEY` (frontend build-time env)
- `CLERK_PUBLISHABLE_KEY` (backend Clerk middleware)
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