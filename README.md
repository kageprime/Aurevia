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

1. Set `VITE_CLERK_PUBLISHABLE_KEY` in the frontend environment.
2. Set `CLERK_SECRET_KEY` and the backend variables listed in [server/README.md](server/README.md).
3. Run `npm run build`.
4. Start the app with `npm start`.

When a built frontend exists in `dist/`, the backend serves it directly and falls back to `index.html` for client-side routes.

## Local development

- Frontend: `npm run dev`
- Backend: `npm run dev:backend`
- Both together: `npm run dev:all`

## Notes

- The admin panel uses `ADMIN_EMAIL` as an allowlist check.
- Legacy custom login/session variables were removed from the sample env because Clerk now owns authentication.