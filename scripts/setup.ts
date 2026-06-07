import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const LESSONS_PATH = 'public/data/lessons.json';
const ENV_PATH = '.env';

interface MaskableReadline {
  _writeToOutput: (text: string) => void;
}

function runCommand(command: string, args: string[], options: Parameters<typeof spawnSync>[2] = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed`);
  }
}

function addVercelEnv(name: string, value: string) {
  const result = spawnSync('npx', ['vercel', 'env', 'add', name, 'production', '--force'], {
    input: `${value}\n`,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (result.status !== 0) {
    throw new Error(`Failed to set ${name}`);
  }
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log('\n  DuChinese Reader — Setup\n');

  // Check for existing credentials in .env
  let email = process.env.DUCHINESE_EMAIL ?? '';
  let password = process.env.DUCHINESE_PASSWORD ?? '';
  let basicAuthUser = process.env.BASIC_AUTH_USER ?? '';
  let basicAuthPassword = process.env.BASIC_AUTH_PASSWORD ?? process.env.APP_PASSWORD ?? '';

  if (existsSync(ENV_PATH)) {
    const envContents = readFileSync(ENV_PATH, 'utf-8');
    for (const line of envContents.split('\n')) {
      const match = line.match(/^(\w+)=(.*)$/);
      if (!match) continue;
      if (match[1] === 'DUCHINESE_EMAIL' && !email) email = match[2];
      if (match[1] === 'DUCHINESE_PASSWORD' && !password) password = match[2];
      if (match[1] === 'BASIC_AUTH_USER' && !basicAuthUser) basicAuthUser = match[2];
      if ((match[1] === 'BASIC_AUTH_PASSWORD' || match[1] === 'APP_PASSWORD') && !basicAuthPassword) {
        basicAuthPassword = match[2];
      }
    }
  }

  // Prompt for credentials
  if (!email) {
    email = await rl.question('? DuChinese email: ');
  } else {
    console.log(`? DuChinese email: ${email} (from .env)`);
  }

  if (!password) {
    // Mute readline echo for password, write prompt ourselves
    stdout.write('? DuChinese password: ');
    const maskedReadline = rl as unknown as MaskableReadline;
    const origWrite = maskedReadline._writeToOutput;
    maskedReadline._writeToOutput = () => {};
    password = await rl.question('');
    maskedReadline._writeToOutput = origWrite;
    stdout.write('\n');
  } else {
    console.log('? DuChinese password: ******** (from .env)');
  }

  if (!email || !password) {
    console.error('\n  Error: Email and password are required.');
    rl.close();
    process.exit(1);
  }

  if (!basicAuthUser) basicAuthUser = 'reader';

  if (!basicAuthPassword) {
    basicAuthPassword = randomBytes(24).toString('base64url');
    console.log(`? Reader login: ${basicAuthUser} / generated password`);
  } else {
    console.log(`? Reader login: ${basicAuthUser} / ******** (from env)`);
  }

  // Save to .env
  const saveAnswer = await rl.question('? Save credentials to .env for next time? (Y/n): ');
  if (saveAnswer.toLowerCase() !== 'n') {
    let envContent = '';
    if (existsSync(ENV_PATH)) {
      envContent = readFileSync(ENV_PATH, 'utf-8');
      if (envContent.match(/^DUCHINESE_EMAIL=.*/m)) {
        envContent = envContent.replace(/^DUCHINESE_EMAIL=.*/m, `DUCHINESE_EMAIL=${email}`);
      } else {
        envContent += `\nDUCHINESE_EMAIL=${email}`;
      }
      if (envContent.match(/^DUCHINESE_PASSWORD=.*/m)) {
        envContent = envContent.replace(/^DUCHINESE_PASSWORD=.*/m, `DUCHINESE_PASSWORD=${password}`);
      } else {
        envContent += `\nDUCHINESE_PASSWORD=${password}`;
      }
      if (envContent.match(/^BASIC_AUTH_USER=.*/m)) {
        envContent = envContent.replace(/^BASIC_AUTH_USER=.*/m, `BASIC_AUTH_USER=${basicAuthUser}`);
      } else {
        envContent += `\nBASIC_AUTH_USER=${basicAuthUser}`;
      }
      if (envContent.match(/^BASIC_AUTH_PASSWORD=.*/m)) {
        envContent = envContent.replace(/^BASIC_AUTH_PASSWORD=.*/m, `BASIC_AUTH_PASSWORD=${basicAuthPassword}`);
      } else {
        envContent += `\nBASIC_AUTH_PASSWORD=${basicAuthPassword}`;
      }
    } else {
      envContent = [
        `DUCHINESE_EMAIL=${email}`,
        `DUCHINESE_PASSWORD=${password}`,
        `BASIC_AUTH_USER=${basicAuthUser}`,
        `BASIC_AUTH_PASSWORD=${basicAuthPassword}`,
        '',
      ].join('\n');
    }
    writeFileSync(ENV_PATH, envContent.replace(/\n{3,}/g, '\n\n').trim() + '\n');
    console.log('  Saved to .env\n');
  }

  // Scrape step
  let shouldScrape = true;
  if (existsSync(LESSONS_PATH)) {
    const rescrape = await rl.question('? Lessons already scraped. Re-scrape? (y/N): ');
    shouldScrape = rescrape.toLowerCase() === 'y';
  }

  if (shouldScrape) {
    console.log('\n  Scraping lessons...');
    try {
      runCommand('pnpm', ['scrape'], {
        env: { ...process.env, DUCHINESE_EMAIL: email, DUCHINESE_PASSWORD: password },
      });
      console.log('  Scraping complete.\n');
    } catch {
      console.error('\n  Error: Scraping failed. Check your credentials and try again.');
      rl.close();
      process.exit(1);
    }
  } else {
    console.log('  Skipping scrape.\n');
  }

  // Deploy step
  const deployAnswer = await rl.question('? Deploy to Vercel? (Y/n): ');
  if (deployAnswer.toLowerCase() !== 'n') {
    console.log('\n  Building and deploying...');
    try {
      // Push credentials to Vercel so Git-triggered builds can scrape automatically
      console.log('  Setting Vercel environment variables...');
      addVercelEnv('DUCHINESE_EMAIL', email);
      addVercelEnv('DUCHINESE_PASSWORD', password);
      addVercelEnv('BASIC_AUTH_USER', basicAuthUser);
      addVercelEnv('BASIC_AUTH_PASSWORD', basicAuthPassword);
      console.log('  Vercel env vars set.\n');

      runCommand('pnpm', ['deploy:vercel']);
      console.log('\n  Deployment complete!');
    } catch {
      console.error('\n  Error: Deployment failed. Check the output above for details.');
      rl.close();
      process.exit(1);
    }
  }

  rl.close();
  console.log('\n  Setup complete!\n');
}

main();
