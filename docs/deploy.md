# Resonance — Deployment Guide

## Services needed

| Service | What for | Free tier |
|---------|----------|-----------|
| Railway | FastAPI backend + ARQ worker | $5/mo hobby |
| Railway PostgreSQL | Database | included |
| Railway Redis | Session state + OTP | included |
| Vercel | React frontend | free |
| Tencent COS | Selfie storage | pay-per-use |
| Tencent SMS | OTP delivery | pay-per-SMS |
| Anthropic | Claude API | pay-per-token |

---

## Backend → Railway

### 1. Create project
```
railway login
railway init          # select "Empty project"
railway add           # add PostgreSQL + Redis plugins
```

### 2. Set environment variables (Railway dashboard → Variables)
```
DATABASE_URL          # auto-set by Railway PostgreSQL plugin
REDIS_URL             # auto-set by Railway Redis plugin
JWT_SECRET            # generate: openssl rand -hex 32
ANTHROPIC_API_KEY     # from console.anthropic.com
TENCENT_SECRET_ID     # from Tencent Cloud CAM
TENCENT_SECRET_KEY
SMS_SDK_APP_ID        # from 腾讯云短信 console
SMS_SIGN_NAME         # your approved SMS signature
SMS_TEMPLATE_ID       # approved OTP template ID
COS_SECRET_ID         # can reuse Tencent credentials
COS_SECRET_KEY
COS_BUCKET            # e.g. resonance-selfies-1234567890
COS_REGION            # e.g. ap-shanghai
```

### 3. Deploy backend
```
cd backend
railway up
```
Railway reads `railway.toml` — runs `alembic upgrade head` then starts uvicorn.

### 4. Deploy ARQ worker (separate Railway service)
Create a second Railway service in the same project, set start command to:
```
arq workers.arq_worker.WorkerSettings
```
Share the same env vars (DATABASE_URL, REDIS_URL, ANTHROPIC_API_KEY).

### 5. Verify
```
curl https://your-app.railway.app/health
# → {"status":"ok","version":"0.1.0"}
```

---

## Frontend → Vercel

### 1. Set environment variables (Vercel dashboard → Settings → Environment Variables)
```
VITE_API_URL=https://your-app.railway.app
```

### 2. Deploy
```
cd frontend
npm install
npx vercel --prod
```
Vercel auto-detects Vite. `vercel.json` handles SPA routing (all paths → index.html).

### 3. Update CORS on backend
In Railway, add:
```
FRONTEND_URL=https://your-app.vercel.app
```
And update `main.py` `allow_origins` to `[os.getenv("FRONTEND_URL", "*")]`.

---

## Tencent Cloud SMS Setup (腾讯云短信)

1. Go to https://console.cloud.tencent.com/smsv2
2. Create application → get `SmsSdkAppId`
3. Apply for signature (签名) — must match your product name
4. Apply for OTP template, e.g.:
   ```
   您的验证码为{1}，5分钟内有效，请勿泄露。
   ```
5. Copy `SMS_SDK_APP_ID`, `SMS_SIGN_NAME`, `SMS_TEMPLATE_ID` to Railway env vars.

---

## Tencent COS Setup

1. Go to https://console.cloud.tencent.com/cos
2. Create bucket → set region (e.g. ap-shanghai) → enable public read
3. Go to CAM → create sub-account with COS write permission
4. Copy `SecretId` + `SecretKey` → Railway env vars

---

## Local development

```bash
# Start PostgreSQL + Redis with Docker
docker compose up -d   # (see docker-compose.yml below)

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in JWT_SECRET + ANTHROPIC_API_KEY
alembic upgrade head
uvicorn main:app --reload

# ARQ worker (separate terminal)
arq workers.arq_worker.WorkerSettings

# Frontend
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
```

### docker-compose.yml (place in repo root)
```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: resonance
      POSTGRES_USER: resonance
      POSTGRES_PASSWORD: resonance
    ports: ["5432:5432"]
  redis:
    image: redis:7
    ports: ["6379:6379"]
```
