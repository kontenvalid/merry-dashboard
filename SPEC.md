# Social Media Dashboard - Specification

## Overview
A real-time social media monitoring dashboard with beautiful charts and role-based access control. Integrates with Composio connected apps to display insights and digital product information.

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts (colorful, responsive)
- **Auth**: NextAuth.js (Google OAuth)
- **Database**: Neon PostgreSQL
- **Composio**: Multi-app integration (Facebook, Instagram, YouTube, Meta Ads, Google Drive, Gmail)
- **Deployment**: Vercel + GitHub

## Features

### 1. Theme System (Dark/Light Mode)
- **Light Mode**: White background, dark text, colorful charts
- **Dark Mode**: Black background, light text, vibrant chart colors
- Toggle button in navbar
- Persist preference in localStorage

### 2. Connected Platforms (via Composio)
- **Facebook Page**: @kontenval.id
  - Follower count, engagement, reach
  - Post performance analytics
- **Instagram**: @kontenval.id
  - Followers, reach, impressions
  - Media insights (posts, reels)
- **YouTube**: @kontenvalid
  - Subscriber count, total views
  - Video performance
- **Meta Ads**: 3 accounts
  - Ad spend, impressions, clicks
  - Campaign performance & ROAS
- **Google Drive**: Composio/Ebook folder
  - Digital product listing
  - File metadata & download links
- **Gmail**: kontenval.id@gmail.com
  - Messages count, threads

### 3. Dashboard Metrics
- **Overview Cards**: 
  - Total followers (all platforms)
  - Engagement rate
  - Total reach
  - Ad spend (when available)
- **Charts**:
  - Follower growth by platform (Line chart)
  - Engagement comparison (Bar chart)
  - Reach trends (Area chart)
  - Ad performance - spend vs results (Multi-line chart)
  - Content distribution by platform (Pie chart)
  - Digital products from GDrive (Table/List)

### 4. Role Management
- **Admin**: Full access, can manage users
- **Member**: View-only access
- **First Admin**: kontenval.id@gmail.com (from Google OAuth)

### 5. Pages
- **Dashboard** (`/dashboard`)
  - Overview cards with key metrics
  - Platform comparison chart
  - Quick stats from all connected apps
- **Analytics** (`/dashboard/analytics`)
  - Detailed insights per platform
  - Time-series data visualization
  - Engagement breakdown
- **Social Media** (`/dashboard/social`)
  - Facebook insights & posts
  - Instagram media & insights
  - YouTube channel stats
- **Ads Manager** (`/dashboard/ads`)
  - Meta Ads campaigns overview
  - Spend & performance charts
  - Campaign-level breakdown
- **Products** (`/dashboard/products`)
  - Google Drive file list (Composio/Ebook)
  - Digital product cards
  - Download links
- **Settings** (`/dashboard/settings`)
  - Profile management
  - Theme preferences
  - Connected accounts status

## Composio Integration

### API Endpoints
- `GET /api/composio/facebook` - Facebook Page insights
- `GET /api/composio/instagram` - Instagram insights
- `GET /api/composio/youtube` - YouTube analytics
- `GET /api/composio/metaads` - Meta Ads performance
- `GET /api/composio/gdrive` - Google Drive files
- `GET /api/composio/gmail` - Gmail stats
- `GET /api/composio/overview` - Aggregated dashboard data

### Data Flow
1. Frontend calls Composio API route
2. Server-side Composio SDK fetches data
3. Data normalized and cached (5 min TTL)
4. Returned to frontend as JSON

## Color Palette

### Light Mode
```
Background: #FFFFFF
Surface: #F8FAFC
Text Primary: #0F172A
Text Secondary: #64748B
Border: #E2E8F0
```

### Dark Mode
```
Background: #0F172A
Surface: #1E293B
Text Primary: #F8FAFC
Text Secondary: #94A3B8
Border: #334155
```

### Chart Colors (both modes - vibrant & readable)
```
Facebook: #1877F2 (Blue)
Instagram: #E4405F (Pink-Red) + #FCAF45 (Orange gradient)
YouTube: #FF0000 (Red)
Meta Ads: #0668E1 (Dark Blue)
Google Drive: #4285F4 (Google Blue)
Gmail: #EA4335 (Google Red)
Success: #22C55E (Green)
Warning: #F59E0B (Amber)
```

## Database Schema

### Tables
1. `users` - User accounts with roles
2. `social_accounts` - Connected social media
3. `analytics` - Daily analytics data
4. `ad_performance` - Meta Ads data

## Security
- Google OAuth only
- Role-based access control
- Protected API routes
- `.env` files excluded from git

## Project Progress

### ✅ Modul 1: Setup & Layout - COMPLETED
- [x] Theme system (dark/light mode)
- [x] Chart colors (adaptive to theme)
- [x] Root layout with providers
- [x] Login page with Google OAuth
- [x] Dashboard layout with navbar
- [x] Home page redirect logic
- [x] Auth middleware protection
- [x] Dashboard page with demo data

### ✅ Modul 2: UI Components - COMPLETED
- [x] Button component
- [x] Card component
- [x] Avatar component
- [x] Badge component
- [x] Input component
- [x] Select component
- [x] Table component
- [x] Dropdown menu

### ✅ Modul 3: Chart Components - COMPLETED
- [x] Line chart (follower growth)
- [x] Bar chart (engagement)
- [x] Area chart (reach)
- [x] Pie chart (content distribution)
- [x] Multi-line chart (ad performance)
- [x] Demo page untuk test semua chart

### ✅ Modul 4: Database & Auth - COMPLETED
- [x] Prisma schema setup
- [x] NextAuth configuration
- [x] Google OAuth setup
- [x] Role management (admin/member)
- [x] API routes

### 🔄 Modul 5: Pages & Integration - IN PROGRESS
- [ ] Analytics page
- [ ] Social media page
- [ ] Ads manager page
- [ ] Products page (GDrive)
- [ ] Settings page
- [ ] Composio API integration
- [ ] Real data fetching
- [ ] GitHub push & Vercel deploy
