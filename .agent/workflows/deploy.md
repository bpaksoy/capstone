---
description: How to deploy Wormie to production (backend + frontend)
---

# Deploy Wormie to Production

// turbo-all

## Full Stack Deployment

### 1. Deploy Backend (runs migrations + deploys to Cloud Run)
```bash
cd /Users/banupaksoy/Desktop/capstone/backend && ./deploy.sh
```

### 2. Deploy Frontend (builds React app + deploys to Firebase)
```bash
cd /Users/banupaksoy/Desktop/capstone/frontend && ./deploy.sh
```

### 3. Commit and push
```bash
cd /Users/banupaksoy/Desktop/capstone && git add . && git commit -m "Deploy to production" && git push origin main
```

---

## Backend Only

### Run migrations only (no deploy)
```bash
cd /Users/banupaksoy/Desktop/capstone/backend && ./deploy.sh --migrate
```

### Deploy to Cloud Run only (skip migrations)
```bash
cd /Users/banupaksoy/Desktop/capstone/backend && ./deploy.sh --deploy
```

## Frontend Only
```bash
cd /Users/banupaksoy/Desktop/capstone/frontend && ./deploy.sh
```

---

## Important Notes

- **Always run migrations before deploying backend code that includes new model fields.** The `deploy.sh` script does this automatically.
- The backend deploy script uses the Cloud SQL Proxy to connect to the production database. It requires `gcloud` to be authenticated (`gcloud auth login`).
- If the Cloud SQL Proxy is not installed, the script will install it automatically.
