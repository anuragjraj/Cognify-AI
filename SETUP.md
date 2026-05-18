# Cognify v2 — Complete Setup Guide

## Step 1 — Get all API Keys (15 min)

### Groq (Free LLM)
1. https://console.groq.com → Sign up → API Keys → Create key
2. Copy `gsk_...`

### Anthropic / Claude (Pro users)
1. https://console.anthropic.com → API Keys → Create key
2. Copy `sk-ant-...`
3. Add $5 credit to start

### YouTube Data API v3 (Free — 10,000 units/day)
1. https://console.cloud.google.com
2. New project → APIs & Services → Enable "YouTube Data API v3"
3. Credentials → Create API Key

### Supabase (Free PostgreSQL)
1. https://supabase.com → New project
2. Settings → Database → URI → copy `postgresql://...`

### Google OAuth (for Google login)
1. https://console.cloud.google.com → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID → Web application
3. Add authorized origins: http://localhost:5173, https://your-vercel-domain.vercel.app
4. Copy Client ID

### Stripe (for payments)
1. https://stripe.com → Dashboard → API Keys → copy Secret Key
2. Products → Create Product "Cognify Pro"
3. Add two prices:
   - ₹299/month recurring → copy Price ID → STRIPE_PRICE_MONTHLY
   - ₹1999/year recurring  → copy Price ID → STRIPE_PRICE_YEARLY
4. Webhooks → Add endpoint: https://your-backend.onrender.com/api/billing/webhook
   Events to listen: checkout.session.completed, customer.subscription.deleted, invoice.payment_succeeded
5. Copy webhook signing secret → STRIPE_WEBHOOK_SECRET

---

## Step 2 — Backend Setup

```bash
cd cognify-backend
npm install
cp .env.example .env
# Fill in all values in .env

npx prisma generate
npx prisma db push

npm run dev
# Backend running on http://localhost:4000
```

---

## Step 3 — Frontend Setup

```bash
cd cognify-frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:4000/api
# Set VITE_GOOGLE_CLIENT_ID=your_google_client_id

npm run dev
# Frontend running on http://localhost:5173
```

---

## Step 4 — Deploy Backend to Fly.io (Recommended)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# From cognify-backend folder
fly launch --name cognify-backend

# Set all environment variables
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set JWT_SECRET="your_secret"
fly secrets set GROQ_API_KEY="gsk_..."
fly secrets set ANTHROPIC_API_KEY="sk-ant-..."
fly secrets set YOUTUBE_API_KEY="AIzaSy..."
fly secrets set GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
fly secrets set STRIPE_SECRET_KEY="sk_live_..."
fly secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
fly secrets set STRIPE_PRICE_MONTHLY="price_..."
fly secrets set STRIPE_PRICE_YEARLY="price_..."
fly secrets set FRONTEND_URL="https://your-app.vercel.app"

# Run DB migrations
fly ssh console -C "npx prisma db push"

# Deploy
fly deploy
```

---

## Step 5 — Deploy Frontend to Vercel

```bash
npm install -g vercel
cd cognify-frontend
vercel --prod
```

In Vercel dashboard → Settings → Environment Variables, add:
- `VITE_API_URL` = `https://cognify-backend.fly.dev/api`
- `VITE_GOOGLE_CLIENT_ID` = your Google client ID

---

## Step 6 — Update Google OAuth origins

In Google Cloud Console → OAuth 2.0 Client → add:
- `https://your-app.vercel.app` to Authorized JavaScript origins
- `https://your-app.vercel.app` to Authorized redirect URIs

---

## Free vs Pro — What changes

| Thing          | Free                  | Pro                          |
|----------------|-----------------------|------------------------------|
| Modules        | 5 per course          | 9 per course                 |
| Courses        | Max 2                 | Unlimited                    |
| AI Model       | Groq llama-8b         | Claude claude-sonnet-4-20250514 |
| Transcript     | 2000 chars            | 8000 chars                   |
| Generation     | Parallel (fast)       | Sequential (better quality)  |
| Chat tutor     | ❌ Locked             | ✅ Claude-powered             |
| Final exam     | ❌ Locked             | ✅ 15 questions               |
| Q&A items      | 4 per module          | 8 per module                 |
| Quiz questions | 3 per module          | 6 per module                 |

---

## Supabase Schema Additions (run in SQL editor)

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS ai_model VARCHAR;
```

Or just run `npx prisma db push` — Prisma handles it automatically.
