import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const LESSONS_PATH = 'public/data/lessons.json';
const ENV_PATH = '.env';

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log('\n  DuChinese Reader — Setup\n');

  // Check for existing credentials in .env
  let email = process.env.DUCHINESE_EMAIL ?? '';
  let password = process.env.DUCHINESE_PASSWORD ?? '';

  if (existsSync(ENV_PATH)) {
    const envContents = readFileSync(ENV_PATH, 'utf-8');
    for (const line of envContents.split('\n')) {
      const match = line.match(/^(\w+)=(.*)$/);
      if (!match) continue;
      if (match[1] === 'DUCHINESE_EMAIL' && !email) email = match[2];
      if (match[1] === 'DUCHINESE_PASSWORD' && !password) password = match[2];
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
    const origWrite = (rl as any)._writeToOutput;
    (rl as any)._writeToOutput = () => {};
    password = await rl.question('');
    (rl as any)._writeToOutput = origWrite;
    stdout.write('\n');
  } else {
    console.log('? DuChinese password: ******** (from .env)');
  }

  if (!email || !password) {
    console.error('\n  Error: Email and password are required.');
    rl.close();
    process.exit(1);
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
    } else {
      envContent = `DUCHINESE_EMAIL=${email}\nDUCHINESE_PASSWORD=${password}\n`;
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
      execSync('pnpm scrape', {
        stdio: 'inherit',
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
      execSync('pnpm deploy:vercel', { stdio: 'inherit' });
      console.log('\n  Deployment complete!');

      // Push credentials to Vercel so Git-triggered builds can scrape automatically
      console.log('  Setting Vercel environment variables...');
      execSync(`echo "${email}" | npx vercel env add DUCHINESE_EMAIL production --force`, { stdio: 'inherit' });
      execSync(`echo "${password}" | npx vercel env add DUCHINESE_PASSWORD production --force`, { stdio: 'inherit' });
      console.log('  Vercel env vars set.\n');
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
