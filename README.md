# DuChinese Reader

A local-first lesson reader and scraper for [DuChinese](https://www.duchinese.net/). Scrape your DuChinese lessons using your own account credentials and browse them in a locally-hosted React app with synchronized audio playback, pinyin annotations, and English translations.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- A [DuChinese](https://www.duchinese.net/) account with an active subscription

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ryanthompson/duchinese-reader.git
cd duchinese-reader

# Install dependencies
pnpm install

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
| `pnpm scrape` | Scrape lessons into `public/data/` (JSON only, for the reader app) |
| `pnpm scrape:full` | Full scrape into `scraper/output/` (includes text files) |
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | Run ESLint |

The scraper supports additional flags — run `pnpm scrape -- --help` for details.

## Project Structure

```
├── scraper/          # DuChinese API scraper (tsx)
│   └── src/
├── src/
│   ├── adapters/     # Data format adapters (DuChinese JSON → app models)
│   ├── components/   # React UI components
│   ├── context/      # React context providers
│   ├── hooks/        # Custom React hooks (audio, preferences)
│   ├── pages/        # Page-level components
│   └── types/        # TypeScript type definitions
├── public/data/      # Scraped lesson data (git-ignored)
└── package.json
```

## License

[MIT](LICENSE)
