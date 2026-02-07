# DuChinese Reader

A local-first lesson reader and scraper for [DuChinese](https://www.duchinese.net/). Scrape your DuChinese lessons using your own account credentials and browse them in a reader app that works with [Migaku](https://www.migaku.com/) and other browser-based language learning tools that don't support DuChinese natively. Features synchronized audio playback, pinyin annotations, and English translations.

> **Disclaimer:** This project is an independent, unofficial tool and is not affiliated with or endorsed by DuChinese. It requires an active DuChinese subscription and uses your own account credentials to access content you are already paying for. No lesson content is included in this repository. Use responsibly and in accordance with DuChinese's [terms of service](https://duchinese.net/legal).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ryanthompson/duchinese-reader&env=DUCHINESE_EMAIL,DUCHINESE_PASSWORD&envDescription=Your%20DuChinese%20account%20credentials&envLink=https://www.duchinese.net/&stores=[{"type":"kv"}])

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- A [DuChinese](https://www.duchinese.net/) account with an active subscription

## Quick Start

```bash
git clone https://github.com/ryanthompson/duchinese-reader.git
cd duchinese-reader
pnpm install
pnpm quickstart    # walks you through credentials, scraping, and deployment
```

The setup wizard will prompt for your DuChinese credentials, scrape your lessons, and optionally deploy to Vercel.

### Manual Setup

If you prefer to run each step yourself:

```bash
# Set your DuChinese credentials
export DUCHINESE_EMAIL=you@example.com
export DUCHINESE_PASSWORD=yourpass

# Scrape lessons into public/data/ for the reader app
pnpm scrape

# Start the dev server
pnpm dev
```

You can also create a `.env` file based on `.env.example` instead of exporting variables.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm quickstart` | Interactive setup wizard (credentials, scrape, deploy) |
| `pnpm scrape` | Scrape lessons into `public/data/` (JSON only, for the reader app) |
| `pnpm scrape:full` | Full scrape into `scraper/output/` (includes text files) |
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build |
| `pnpm deploy:vercel` | Build and deploy to Vercel |
| `pnpm redeploy` | Redeploy to Vercel (re-scrapes fresh lessons) |
| `pnpm lint` | Run ESLint |

The scraper supports additional flags — run `pnpm scrape -- --help` for details.

## Deployment

### One-Click Deploy (Recommended)

Click the **Deploy with Vercel** button at the top of this README. Vercel will prompt you for your `DUCHINESE_EMAIL` and `DUCHINESE_PASSWORD`, then handle everything — install, scrape, build, and deploy — automatically.

### CLI Deploy

```bash
pnpm deploy:vercel
```

This builds the app and deploys the `dist` directory to Vercel. On first run, the Vercel CLI will prompt you to link or create a project.

### Redeployment

- **Code changes**: Push to `main` and Vercel auto-deploys (re-scrapes during build).
- **Fresh lessons (no code change)**: Click **Redeploy** in the Vercel dashboard, or run `pnpm redeploy` locally.

### Docker

```bash
# Make sure lessons are scraped first
pnpm scrape

# Build and run
docker build -t duchinese-reader .
docker run -p 8080:80 duchinese-reader
```

### Other Static Hosts

Build the app with `pnpm build`, then serve the `dist` directory with any static file server. Make sure to configure SPA fallback (all routes → `index.html`).

## Cross-Device Sync (Optional)

The app can sync your learned-lesson progress across devices using [Upstash Redis](https://upstash.com/). Without it, progress is stored in your browser's localStorage only — the app works fine either way.

If you used the **Deploy with Vercel** button above, a KV store is automatically provisioned — no extra setup needed. For CLI or manual deployments, follow the steps below.

### Setting Up Upstash Redis

1. **Create an Upstash account** at [console.upstash.com](https://console.upstash.com/) (the free tier is more than sufficient)
2. **Create a Redis database** — click **Create Database**, give it a name (e.g. `duchinese-reader`), pick the region closest to your Vercel deployment, and click **Create**
3. **Copy your credentials** from the database details page: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### Connecting to Vercel

Pick whichever method you prefer — the API supports both `UPSTASH_REDIS_REST_*` and `KV_REST_API_*` variable names.

**Upstash Integration (recommended)** — go to the [Upstash Integration on Vercel](https://vercel.com/integrations/upstash), add it to your account, and link your Redis database to your project. This auto-populates `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as env vars.

**Vercel Dashboard** — open your project, go to **Storage** → **Create** → **KV (Upstash)**, and follow the prompts. This auto-populates `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

**Manual** — in your Vercel project **Settings** → **Environment Variables**, paste `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` directly from the Upstash console.

After connecting, redeploy with `pnpm redeploy`.

### Local Development

To test sync locally, add the credentials to your `.env` file:

```env
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### How It Works

- Learned lessons are stored as a set of lesson IDs in a single Redis key
- On app startup, the local and remote sets are merged — no data is lost
- Each time you mark/unmark a lesson, the change is saved to both localStorage and Redis
- If Redis is unreachable, the app continues working with localStorage alone

## Project Structure

```
├── api/              # Vercel serverless functions (sync API)
├── scripts/          # CLI tools (setup wizard)
├── scraper/          # DuChinese API scraper (tsx)
│   └── src/
├── src/
│   ├── adapters/     # Data format adapters (DuChinese JSON → app models)
│   ├── components/   # React UI components
│   ├── context/      # React context providers
│   ├── hooks/        # Custom React hooks (audio, preferences)
│   ├── lib/          # Utility modules (storage, sync)
│   ├── pages/        # Page-level components
│   └── types/        # TypeScript type definitions
├── public/data/      # Scraped lesson data (git-ignored)
└── package.json
```

## License

[MIT](LICENSE)
