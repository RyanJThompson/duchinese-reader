# DuChinese Reader

A local-first lesson reader and scraper for [DuChinese](https://www.duchinese.net/). Scrape your DuChinese lessons using your own account credentials and browse them in a locally-hosted React app with synchronized audio playback, pinyin annotations, and English translations.

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

Cross-device sync for learned lessons uses Upstash Redis (Vercel KV).

**One-click deploy**: A KV store is automatically provisioned when you use the Deploy button above — no extra setup needed.

**Manual / CLI deploy**: Add a KV store from the Vercel dashboard:

1. Go to your project → Storage → Create → KV (Upstash)
2. Link the store to your project (this auto-populates the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables)
3. Redeploy with `pnpm redeploy`

If Redis is not configured, the app falls back to localStorage only — no errors, no impact.

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
