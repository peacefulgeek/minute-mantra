# Minute Mantra

> One mantra. One minute. Every morning.

A profoundly beautiful Progressive Web App (PWA) that delivers one new mantra each morning. The user learns the mantra, hears its pronunciation, and chants it for 60 seconds.

**Live:** https://minutemantra.com  
**CDN:** https://minute-mantra.b-cdn.net  
**Owner:** Paul Wagner / Creative Lab Agency LLC

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS + Framer Motion |
| Backend | Node.js + Express |
| Database | MySQL (Railway managed) |
| Hosting | Railway (auto-deploy from `main` branch) |
| CDN | Bunny CDN (`minute-mantra.b-cdn.net`) |
| Payments | Square Web Payments SDK + Subscriptions API |
| Email | Nodemailer (direct SMTP) |
| Push | Web Push API (VAPID) |
| Auth | JWT in httpOnly cookies |

---

## Project Structure

```
minute-mantra/
├── client/          React PWA frontend
├── server/          Express API backend
├── seeds/           Database seed data (365 mantras)
├── scripts/         Utility scripts (audio gen, image gen, asset upload)
├── prisma/          Prisma config (raw mysql2 queries used in practice)
├── .env.example     Environment variable template
└── railway.json     Railway deployment config
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- pnpm
- MySQL 8.0+

### Setup

```bash
# Clone
git clone https://github.com/peacefulgeek/minute-mantra.git
cd minute-mantra

# Install dependencies
pnpm install
cd server && pnpm install
cd ../client && pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Create database and seed mantras
mysql -u root -p < seeds/schema.sql
node seeds/seed.js

# Generate VAPID keys
node scripts/generate-vapid.js

# Start development
pnpm dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values. See the file for documentation.

**Required before launch:**
- `DATABASE_URL` — Railway MySQL connection string
- `JWT_SECRET` — Random 64-char string
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — SMTP credentials (Wildman provides)
- `SQUARE_ACCESS_TOKEN` — Square API key (Wildman provides)
- `SQUARE_MONTHLY_PLAN_ID`, `SQUARE_ANNUAL_PLAN_ID` — Create plans in Square Dashboard first
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — Generate with `node scripts/generate-vapid.js`

---

## Audio Generation

Audio pronunciations are generated via ElevenLabs Multilingual v2 API.

```bash
# Test voices first (pick the best for Sanskrit)
ELEVENLABS_API_KEY=xxx node scripts/generate-audio.js --test-voices

# Generate all 365 audio files
ELEVENLABS_API_KEY=xxx node scripts/generate-audio.js

# Generate for a specific tradition
ELEVENLABS_API_KEY=xxx node scripts/generate-audio.js --tradition vedic_shiva

# Generate for a specific day
ELEVENLABS_API_KEY=xxx node scripts/generate-audio.js --day 1
```

Failed files are logged to `seeds/audio-review-failures.txt`. Missing audio shows phonetic guide text instead.

---

## Image Generation

Hero images are generated via DALL-E 3 and uploaded to Bunny CDN as WebP.

```bash
# Generate all hero images
OPENAI_API_KEY=xxx node scripts/generate-images.js

# Generate for specific tradition
OPENAI_API_KEY=xxx node scripts/generate-images.js --tradition buddhist
```

---

## Deployment

Railway auto-deploys from the `main` branch. Environment variables are set in the Railway dashboard.

**DNS (Porkbun):**
- `minutemantra.com` → Railway deployment URL (A record or CNAME)
- `cdn.minutemantra.com` → `minute-mantra.b-cdn.net` (CNAME)

---

## Subscription Plans (Square)

Create these plans in Square Dashboard before launch:
- **Monthly:** $1.97/month
- **Annual:** $16.95/year

Add the plan IDs to Railway environment variables as `SQUARE_MONTHLY_PLAN_ID` and `SQUARE_ANNUAL_PLAN_ID`.

---

## Free vs Premium

| Feature | Free | Premium |
|---------|------|---------|
| Daily mantra + context card | ✅ | ✅ |
| 60-second timer with sacred geometry | ✅ | ✅ |
| Audio pronunciation | ✅ | ✅ |
| Morning notifications (email + push) | ✅ | ✅ |
| Streak tracking + calendar heatmap | ✅ | ✅ |
| Up to 5 favorites | ✅ | ✅ |
| Go Deeper links | ✅ | ✅ |
| Extended timers (2/5/10 min) | ❌ | ✅ |
| Mala counter (108 beads) | ❌ | ✅ |
| Unlimited favorites | ❌ | ✅ |
| Full mantra library (browse/filter) | ❌ | ✅ |
| Singing bowl ambient sound | ❌ | ✅ |

---

## Sacred Geometry Types

| Tradition | Geometry |
|-----------|---------|
| Vedic Shiva, Vedic Shakti | Sri Yantra |
| Vedic Vishnu, Vedic Solar | Flower of Life |
| Buddhist | Lotus |
| Vedic Ganesha, Sikh, Universal | Seed of Life |

---

## Content

365 unique mantras across 8 traditions:
- **Vedic (all sub-traditions):** ~182 mantras
- **Buddhist:** 68 mantras
- **Universal:** 91 mantras
- **Sikh:** 24 mantras

---

## Legal

- **Entity:** Creative Lab Agency LLC (Wyoming S-corp)
- **Contact:** paul@paulwagner.com
- **Privacy Policy:** https://minutemantra.com/privacy
- **Terms of Service:** https://minutemantra.com/terms

---

*Built by [Paul Wagner](https://paulwagner.com) · Spiritual teacher and devotee of Amma*
