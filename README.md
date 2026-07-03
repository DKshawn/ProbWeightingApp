# ProbWeightingApp

React + FastAPI web experiment with a PWF module and a CI module for testing Prelec's Compound Invariance axiom.

Terminology note: the module formerly described as `utility-curvature` is now called the PWF module, because it is used to construct implied PWFs while estimating/controlling utility curvature. The module formerly described as Probability Weighting / PW is now called the CI module, because its Step 4 response is used to evaluate Compound Invariance. Code paths, storage keys, API routes, table names, and CSV fields now use the PWF/CI terminology.

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

- `experiment_sessions`: one row per experiment session, including generated CI trials
- `ci_results`: one row per CI trial result
- `pwf_results`: one row per PWF module task result

`ci_results` has a unique constraint on `(session_id, trial)`, and
`pwf_results` has a unique constraint on `(session_id, pwf_trial)`, so accidental
double submission updates the existing row instead of creating duplicates.

If older deployment tables are present, the schema setup copies legacy
`prob_sessions`, `trial_results`, and `utility_curvature_results` rows into the
new canonical tables.

## Useful Endpoints

- `POST /api/session/start`
- `POST /api/ci-results`
- `POST /api/pwf-results`
- `POST /api/session/{session_id}/pwf-complete`
- `GET /api/ci-results/{student_id}/csv`
- `GET /api/pwf-results/{student_id}/csv`
- `GET /api/ci-results/summary`
- `GET /api/health`
