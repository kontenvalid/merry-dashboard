# Merry Dashboard 🎉

Social media analytics dashboard with automated content research and carousel generation.

## Features

- 📊 **Analytics Dashboard** - Track followers, engagement, and performance across platforms
- 📱 **Multi-Platform** - Facebook, Instagram, YouTube, Meta Ads integration
- 🔄 **Auto-Sync** - Daily data sync via Vercel Cron jobs
- 🤖 **AI Research** - Automated AI news research (runs daily at 07:00 WIB)
- 🎨 **Carousel Generator** - Auto-generate social media images (runs daily at 08:00 WIB)

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Neon PostgreSQL
- **Auth**: NextAuth.js with Google OAuth
- **MCP**: Composio for social media integration
- **Hosting**: Vercel

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

**Required variables:**
- `COMPOSIO_API_KEY` - Get from [app.composio.com/settings/api-keys](https://app.composio.com/settings/api-keys)
- `META_TOKEN` - Meta/Facebook Graph API token
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `DATABASE_URL` - Neon PostgreSQL connection string

**Optional variables:**
- `GOOGLE_SHEETS_ID` - Spreadsheet ID for content schedule
- `GOOGLE_DRIVE_CAROUSEL_FOLDER_ID` - Drive folder for carousel images

### 3. Database Setup

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

## Automation

### Cron Jobs

| Cron | Schedule | Time Zone | Purpose |
|------|----------|-----------|---------|
| Sync | `0 6 * * *` | 06:00 UTC | Fetch social media data |
| Research | `0 0 * * *` | 00:00 UTC | AI news + update schedule |
| Carousel | `0 1 * * *` | 01:00 UTC | Generate carousel images |

Times in WIB (UTC+7):
- Sync: 13:00 WIB
- Research: 07:00 WIB
- Carousel: 08:00 WIB

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/cron/sync` | Sync social media analytics |
| `GET /api/cron/daily-research` | Research AI news, update GSheet |
| `GET /api/cron/daily-carousel` | Generate carousel images |

## Security

**Never commit credentials!** All secrets are managed via environment variables.

See [SECURITY.md](./SECURITY.md) for detailed security practices.

### Quick Security Checklist

- ✅ `.env.local` is in `.gitignore`
- ✅ No hardcoded credentials in source code
- ✅ Credentials set in Vercel Dashboard
- ✅ `.env.example` has placeholder values only

## Project Structure

```
src/
├── app/
│   ├── api/cron/          # Cron job endpoints
│   │   ├── sync/
│   │   ├── daily-research/
│   │   └── daily-carousel/
│   └── (dashboard)/       # Dashboard pages
├── components/            # React components
├── lib/                   # Utilities & API helpers
└── hooks/                 # Custom React hooks

scripts/
└── generate-carousel-html.ts   # Carousel HTML generator
```

## Scripts

```bash
npm run dev          # Development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

## License

Private project - All rights reserved
