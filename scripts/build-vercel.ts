import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { build } from 'esbuild';

const OUTPUT = '.vercel/output';
const API_FUNCTIONS = ['data', 'learned', 'recents', 'preferences'];

// Clean previous build output
rmSync(OUTPUT, { recursive: true, force: true });

// Build the app
console.log('\n  Building app...');
execSync('BUILD_PRIVATE_DATA=1 pnpm build', { stdio: 'inherit' });

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

console.log('\n  Bundling serverless functions...');
for (const name of API_FUNCTIONS) {
  const funcDir = `${OUTPUT}/functions/api/${name}.func`;
  mkdirSync(funcDir, { recursive: true });

  await build({
    entryPoints: [`api/${name}.ts`],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: `${funcDir}/index.mjs`,
  });

  if (name === 'data') {
    cpSync('.reader-data', `${funcDir}/.reader-data`, { recursive: true });
  }

  writeFileSync(`${funcDir}/.vc-config.json`, JSON.stringify({
    runtime: 'nodejs20.x',
    handler: 'index.mjs',
    launcherType: 'Nodejs',
  }, null, 2));
}

console.log('\n  Vercel build output ready.');
