import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { build } from 'esbuild';

const OUTPUT = '.vercel/output';

// Clean previous build output
rmSync(OUTPUT, { recursive: true, force: true });

// Build the app
console.log('\n  Building app...');
execSync('pnpm build', { stdio: 'inherit' });

// Copy static files
mkdirSync(`${OUTPUT}/static`, { recursive: true });
cpSync('dist', `${OUTPUT}/static`, { recursive: true });

// Route config
writeFileSync(`${OUTPUT}/config.json`, JSON.stringify({
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' },
  ],
}, null, 2));

// Bundle serverless function (esbuild inlines @upstash/redis, externalizes node builtins)
const funcDir = `${OUTPUT}/functions/api/learned.func`;
mkdirSync(funcDir, { recursive: true });

console.log('\n  Bundling serverless function...');
await build({
  entryPoints: ['api/learned.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: `${funcDir}/index.mjs`,
});

writeFileSync(`${funcDir}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
}, null, 2));

console.log('\n  Vercel build output ready.');
