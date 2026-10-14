# Deployment

Do not claim a live cloud deployment until health, login, and allocation have been verified on that host.

## Frontend (Vercel)

1. Root directory: `frontend`
2. Build: `npm run build`
3. Output: `dist`
4. Env: `VITE_API_URL=https://<backend-host>`
5. SPA fallback: `frontend/vercel.json` rewrites to `index.html`

Never put MongoDB URIs or JWT secrets in `VITE_*` variables.

## Backend (Render / Railway)

Start command:

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Required production env:

- `APP_ENV=production`
- `USE_MEMORY_DB=false`
- `SECRET_KEY` (long random string)
- `MONGODB_URI` (Atlas)
- `MONGODB_DB_NAME`
- `CORS_ORIGINS` (exact frontend origin)
- Change `DEMO_ADMIN_PASSWORD` before any public URL is shared

Health check: `/api/health`

## MongoDB Atlas

1. Create a cluster and database user.
2. Allow the backend host IP (or 0.0.0.0/0 only for a short demo, then restrict).
3. Put the connection string in `MONGODB_URI` on the server only.
4. Indexes are created at API startup via `ensure_indexes`.
5. Seed: `python scripts/seed_database.py` from the backend environment.

## Local without MongoDB

`USE_MEMORY_DB=true` (default in `.env.example`) uses mongomock. Data is lost when the process exits. Fine for judging on one machine; not for multi-instance hosting.
