# DuChinese Reader

A local-first lesson reader and scraper for [DuChinese](https://www.duchinese.net/). Scrape your DuChinese lessons using your own account credentials and browse them in a reader app that works with [Migaku](https://www.migaku.com/) and other browser-based language learning tools that don't support DuChinese natively. Features synchronized audio playback, pinyin annotations, and English translations.

> **Disclaimer:** This project is an independent, unofficial tool and is not affiliated with or endorsed by DuChinese. It requires an active DuChinese subscription and uses your own account credentials to access content you are already paying for. No lesson content is included in this repository. Use responsibly and in accordance with DuChinese's [terms of service](https://duchinese.net/legal).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRyanJThompson%2Fduchinese-reader&env=DUCHINESE_EMAIL,DUCHINESE_PASSWORD,BASIC_AUTH_USER,BASIC_AUTH_PASSWORD&envDescription=Your%20DuChinese%20credentials%20plus%20a%20private%20reader%20login&envLink=https%3A%2F%2Fwww.duchinese.net%2F&project-name=duchinese-reader&repository-name=duchinese-reader)

## One-Click Deploy (Recommended)

Click the **Deploy with Vercel** button above. Vercel will prompt you for your `DUCHINESE_EMAIL`, `DUCHINESE_PASSWORD`, `BASIC_AUTH_USER`, and `BASIC_AUTH_PASSWORD`, then handle everything — install, scrape, build, and deploy — automatically.

Generate a long reader password locally with:

```bash
openssl rand -base64 32
```

The Vercel deployment is protected with HTTP Basic Auth middleware. A fresh visitor must enter your reader username and password before the app, JavaScript bundle, assets, or lesson API can load. Keep this deployment private and only share it with people who should have access to content scraped from your DuChinese subscription.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
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
| `pnpm scrape:server` | Scrape lessons into `.reader-data/` for Vercel API-backed production builds |
| `pnpm scrape:full` | Full scrape into `scraper/output/` (includes text files) |
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm test` | Run reader fixture regressions |
| `pnpm preview` | Preview the production build |
| `pnpm deploy:vercel` | Build and deploy to Vercel |
| `pnpm redeploy` | Redeploy to Vercel (re-scrapes fresh lessons) |
| `pnpm lint` | Run ESLint |

The scraper supports additional flags — run `pnpm scrape -- --help` for details.

## Deployment

### CLI Deploy

```bash
READER_USER="reader"
READER_PASSWORD="$(openssl rand -base64 32)"

printf "%s\n" "$DUCHINESE_EMAIL" | npx vercel env add DUCHINESE_EMAIL production --force
printf "%s\n" "$DUCHINESE_PASSWORD" | npx vercel env add DUCHINESE_PASSWORD production --force
printf "%s\n" "$READER_USER" | npx vercel env add BASIC_AUTH_USER production --force
printf "%s\n" "$READER_PASSWORD" | npx vercel env add BASIC_AUTH_PASSWORD production --force

pnpm deploy:vercel
```

This scrapes lesson data into `.reader-data/`, builds the app without copying `public/data/` into `dist/`, and serves lesson JSON through the Vercel `/api/data` route behind the same Basic Auth login. On first run, the Vercel CLI will prompt you to link or create a project.

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

For local/private static hosting, run `pnpm scrape`, build the app with `pnpm build`, then serve the `dist` directory with any static file server. Make sure to configure SPA fallback (all routes → `index.html`). Static hosts expose `public/data/` directly, so only use this path for local or otherwise private hosting.

## Cross-Device Sync

The deployed app stores learned lessons, recents, and reader preferences in each browser's localStorage by default. This avoids needing Upstash, Redis, or another backend for normal personal use.

The serverless sync endpoints still exist, but they require a separate server-only `SYNC_ACCESS_TOKEN`. Do not expose this token through a `VITE_` environment variable. If you want cross-device sync, enable Upstash Redis and keep the app behind Basic Auth or another real access-control layer.

### Upstash Redis

1. **Create an Upstash account** at [console.upstash.com](https://console.upstash.com/) (the free tier is more than sufficient)
2. **Create a Redis database** — click **Create Database**, give it a name (e.g. `duchinese-reader`), pick the region closest to your Vercel deployment, and click **Create**
3. **Copy your credentials** from the database details page: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### Connecting to Vercel

Pick whichever method you prefer — the API supports both `UPSTASH_REDIS_REST_*` and `KV_REST_API_*` variable names.

**Upstash Integration (recommended)** — go to the [Upstash Integration on Vercel](https://vercel.com/integrations/upstash), add it to your account, and link your Redis database to your project. This auto-populates `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as env vars.

**Vercel Dashboard** — open your project, go to **Storage** → **Create** → **KV (Upstash)**, and follow the prompts. This auto-populates `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

**Manual** — in your Vercel project **Settings** → **Environment Variables**, paste `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` directly from the Upstash console.

Also set a server-only `SYNC_ACCESS_TOKEN` if you are protecting the app and intentionally enabling sync API access. After connecting, redeploy with `pnpm redeploy`.

### Local Development

To test the sync API locally, add the credentials and server-only sync token to your `.env` file, then call the API with `Authorization: Bearer <SYNC_ACCESS_TOKEN>`:

```env
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
SYNC_ACCESS_TOKEN=your-random-sync-token
```

### How It Works

- Learned lessons are stored with timestamps and delete tombstones so unlearned lessons do not come back from stale devices
- Recents sync includes a clear timestamp so clearing history is not overwritten by older local state
- Each time you mark/unmark a lesson or update recents, the change is saved locally
- The Redis-backed sync API returns empty local-only fallbacks unless the request includes `SYNC_ACCESS_TOKEN`
- If Redis is unreachable, the app continues working with localStorage alone

## Project Structure

```
├── api/              # Vercel serverless functions (data + sync API)
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
├── public/data/      # Local dev scraped lesson data (git-ignored)
├── .reader-data/     # Vercel production scraped lesson data (git-ignored)
└── package.json
```

## License

[MIT](LICENSE)
