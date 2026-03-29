# Aurevia Beauty

A React + Vite storefront with a Node/Express backend, Clerk auth, and a manual transfer checkout flow.

## Scripts

```bash
npm run dev
npm run dev:backend
npm run dev:all
npm run build
npm start
npm run lint
```

## Deployment

Use Node.js 20.19.0 or newer for install/build/deploy. The Clerk and Vite packages in this repo do not support Node 18.

1. Set `VITE_CLERK_PUBLISHABLE_KEY` in the frontend environment.
2. Set `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and the backend variables listed in [server/README.md](server/README.md).
3. Run `npm run build:prod` to verify live keys and build.
4. Start the app with `npm start`.

When a built frontend exists in `dist/`, the backend serves it directly and falls back to `index.html` for client-side routes.

For a backend-only Railway deployment, use `npm start` with the included [Procfile](Procfile) and point the frontend at the Railway service URL.

## Clerk production cutover

If the login UI shows "Development mode", your frontend is still using a test Clerk publishable key.

1. In Clerk, create or select your production instance.
2. Add your production domains (`aureviacare.com.ng` and `www.aureviacare.com.ng`) as allowed origins/redirects.
3. In Vercel project environment variables, set `VITE_CLERK_PUBLISHABLE_KEY` to a `pk_live_...` key.
4. In your backend host (Railway/Render/etc), set `CLERK_SECRET_KEY` to a `sk_live_...` key from the same Clerk instance.
5. Redeploy frontend and backend, then verify sign-in on `/account/login`.

## Local development

- Frontend: `npm run dev`
- Backend: `npm run dev:backend`
- Both together: `npm run dev:all`

## Notes

- The admin panel uses `ADMIN_EMAIL` as an allowlist check.
- Legacy custom login/session variables were removed from the sample env because Clerk now owns authentication.