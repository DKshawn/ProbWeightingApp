# ProbWeightingApp

React + FastAPI web experiment for testing Prelec's Compound Invariance axiom.

## Vercel + Neon Deployment

This repository is configured to deploy as a single Vercel project:

- Frontend: Vite build output from `frontend/dist`
- Backend: FastAPI app exposed through `api/index.py`
- Data storage: Neon Postgres via `DATABASE_URL`

Set these environment variables in Vercel:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

If you use the Vercel Marketplace Neon integration, Vercel will inject the
database connection string for the project. For serverless deployments, prefer
Neon's pooled connection string when available.

No `VITE_API_BASE_URL` is required on Vercel. The frontend calls same-origin
`/api/...` routes, which Vercel rewrites to the FastAPI function.

## Local Development

Start the FastAPI backend:

```bash
cd backend
pip install -r requirements.txt
DATABASE_URL="postgresql://..." uvicorn main:app --reload --port 8000
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

For local UI-only development without Neon, set:

```bash
ALLOW_MEMORY_STORAGE=1
```

Do not use `ALLOW_MEMORY_STORAGE=1` in production because serverless memory is
ephemeral and experiment results will be lost.

## Database Tables

The API creates tables automatically on first database use:

- `prob_sessions`: one row per experiment session, including generated trials
- `trial_results`: one row per trial result

`trial_results` has a unique constraint on `(session_id, trial)`, so accidental
double submission updates the existing trial row instead of creating duplicates.

## Useful Endpoints

- `POST /api/session/start`
- `POST /api/results`
- `GET /api/results/{student_id}/csv`
- `GET /api/results/summary`
- `GET /api/health`
