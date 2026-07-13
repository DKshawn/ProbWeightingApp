# ProbWeightingApp

React + FastAPI web experiment with a PWF module and a CI module for testing Prelec's Compound Invariance axiom.

Terminology note: the module formerly described as `utility-curvature` is now called the PWF module, because it is used to construct implied PWFs while estimating/controlling utility curvature. The module formerly described as Probability Weighting / PW is now called the CI module, because its Step 4 response is used to evaluate Compound Invariance. Code paths, storage keys, API routes, table names, and CSV fields now use the PWF/CI terminology.

## Experiment Design

The experiment consists of a PWF module and a CI module.

The PWF module currently activates only the Bruhin et al. (2010) block for every
participant. The Abdellaoui (2000), Choi et al. (2022), Study 2, and Gonzalez &
Wu block definitions remain in the source as inactive designs; student IDs do
not determine the PWF block assignment.

The CI module elicits the responses needed to test Compound Invariance. Each CI
trial includes four steps; its payment details are recorded, and one CI trial is
randomly selected for the CI module's final payment.

For the formal CI study, the server assigns new sessions in randomly ordered
four-person blocks: `N=2 × low amount`, `N=2 × high amount`, `N=3 × low
amount`, and `N=3 × high amount`. Assignment is persisted with the session, so
it is unchanged on resume. Participants start immediately; they do not wait for
the other three positions in their block. Pilot sessions preserve the fixed
`N=2` design and balance only the two amount levels in two-person blocks.

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

The backend stores a SHA-256 `student_id_hash` alongside the original
`student_id` so records can be linked without replacing the original identifier.

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
- `ci_assignment_slots`: server-owned CI condition slots and their claimed sessions
- `ci_results`: one row per CI trial result
- `pwf_results`: one row per PWF module task result
- `pwf_comprehension_events`: one immutable row per comprehension submission or valid staff unlock

`ci_results` has a unique constraint on `(session_id, trial)`, and
`pwf_results` has a unique constraint on `(session_id, pwf_trial)`, so accidental
double submission updates the existing row instead of creating duplicates.
Comprehension events use a client-generated UUID, making cumulative replay
idempotent. Sessions created with the current questionnaire version must have a
server-validated passing event before PWF completion; the iframe waits for the
database acknowledgement before starting formal tasks. Pre-existing sessions,
whose questionnaire version is null, retain the legacy resume behavior.
The current questionnaire is `2026-07-11-comprehension-v2`; the backend still
accepts v1 events from already-open legacy sessions. Its practice sequence is
the original switching-list task, a Step 1 amount match, and a Step 4 choice.

Use the app root (`/`) for participant sessions so records go through the API.
Opening `/pwf/index.html` redirects there; the local-only standalone view now
requires the explicit `?standalone=1` development flag.

Older deployment tables such as `prob_sessions`, `trial_results`, and
`utility_curvature_results` are treated as retired tables. The app no longer
reads from or migrates them; new data is written only to the canonical tables
above.

## Local Neon Data Administration

Use `scripts/neon_admin.py` to inspect or export Neon data locally, without
opening the Neon SQL editor. The script connects directly to `DATABASE_URL` and
does not start the API or run schema migrations.

Create a local-only file named `.env.db.local` in the project root. It is
ignored by Git. Add the production Neon connection string to it:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
```

For this project, `vercel env pull` currently downloads only
`VERCEL_OIDC_TOKEN`, not a Postgres connection string. That token is useful to
Vercel's runtime integration, but it is not a `psycopg` database credential.
Get the direct URL from Neon instead: open the Neon project, select the
production branch, click **Connect**, and copy the pooled connection string.

Keep Vercel's pulled OIDC token separate if you need it for local deployment
work:

```bash
npx vercel env pull .env.neon.local --environment=production
```

Do not put `DATABASE_URL` in `.env.neon.local`, because this command replaces
that file each time it runs. Never share or commit either local file.

Then use the project virtual environment:

```bash
cd /Users/dk/Documents/expcode/prelec/ProbWeightingApp

# List all public tables and their exact row counts.
./.venv/bin/python scripts/neon_admin.py tables

# Inspect the columns of a table.
./.venv/bin/python scripts/neon_admin.py describe experiment_sessions

# Inspect one or more participants across session, CI, and PWF records.
./.venv/bin/python scripts/neon_admin.py show 8723126 8724123

# Export the four research tables for selected participants.
./.venv/bin/python scripts/neon_admin.py export --ids 8723126 8724123 --out exports/selected

# Export all completed sessions.
./.venv/bin/python scripts/neon_admin.py export --completed-only --out exports/completed

# Run one read-only query locally. Add --csv PATH to save its output.
./.venv/bin/python scripts/neon_admin.py sql --sql "SELECT student_id, status FROM experiment_sessions"
```

The `sql` command accepts only one read-only `SELECT`, `WITH`, `EXPLAIN`, or
`SHOW` statement and runs it inside a read-only database transaction. For
intentional participant cleanup, `delete-student` requires both an explicit
`--study-mode` and `--confirm`:

```bash
./.venv/bin/python scripts/neon_admin.py delete-student 8723126 --study-mode full --confirm
```

Deleting an `experiment_sessions` row also deletes that session's CI, PWF, and
PWF comprehension records through the database's `ON DELETE CASCADE` constraints. Do not use the
delete command against production data unless the IDs and study mode have been
checked first.

## Useful Endpoints

- `POST /api/session/start`
- `POST /api/ci-results`
- `POST /api/pwf-results`
- `POST /api/session/{session_id}/pwf-complete`
- `GET /api/ci-results/{student_id}/csv`
- `GET /api/pwf-results/{student_id}/csv`
- `GET /api/ci-results/summary`
- `GET /api/health`
