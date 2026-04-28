# Nishpaksh AI

Nishpaksh AI is a full-stack fairness auditing platform for hiring, scholarship, and loan decision datasets.

## Tech stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Recharts
- Backend: FastAPI, scikit-learn, pandas

## Features

- Landing page with product overview
- CSV upload and fairness audit trigger
- Analytics dashboard with fairness KPIs
- Bias detection report (group confusion matrix + feature importance)
- What-if simulator for decision outcomes
- Recommendations page with action items

## Project structure

- `frontend/` - Next.js app
- `backend/` - FastAPI service

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

Set API URL if needed:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_HEALTH_POLL_MS=15000
```

## Run backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on `http://127.0.0.1:8000`.

Optional CORS override:

```bash
# backend/.env or exported env var
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Dataset requirements

Upload a CSV containing:
- A target decision column (default: `decision`)
- A sensitive attribute column (default: `gender`)

For custom column names, provide values in the upload form.
