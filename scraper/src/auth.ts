/**
 * Authenticates with DuChinese via direct HTTP (Rails/Devise session login).
 */

export async function authenticate(email: string, password: string): Promise<string> {
  // Step 1: GET sign_in page
  const r1 = await fetch('https://duchinese.net/accounts/sign_in', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
    redirect: 'manual',
  });

  const html = await r1.text();
  const getCookies = r1.headers.getSetCookie().map(h => h.split(';')[0]);

  // Extract CSRF token from form hidden input
  const formToken = html.match(/name="authenticity_token" value="([^"]+)"/)?.[1];
  const metaToken = html.match(/name="csrf-token" content="([^"]+)"/)?.[1];
  const token = formToken || metaToken;

  if (!token) {
    throw new Error('Authentication failed: could not find CSRF token');
  }

  // Step 2: POST credentials
  const body = new URLSearchParams({
    'authenticity_token': token,
    'account[email]': email,
    'account[password]': password,
  });

  const r2 = await fetch('https://duchinese.net/accounts/sign_in', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': getCookies.join('; '),
    },
    body: body.toString(),
    redirect: 'manual',
  });

  // Merge cookies
  const postCookies = r2.headers.getSetCookie().map(h => h.split(';')[0]);
  const cookieMap = new Map<string, string>();
  for (const c of [...getCookies, ...postCookies]) {
    const i = c.indexOf('=');
    if (i > 0) cookieMap.set(c.slice(0, i), c.slice(i + 1));
  }

  // Devise redirects (302/303) on success. A failed login either re-renders the
  // form with HTTP 200 OR redirects back to the sign-in page (lockout / captcha /
  // rate-limit) — both must be treated as failure so we never proceed with an
  // anonymous session and silently scrape an empty catalog.
  const location = r2.headers.get('location') || '';
  const redirected = r2.status === 302 || r2.status === 303;
  const bouncedToSignIn = /sign_in|\/login(\b|\/|$)/i.test(location);

  if (!redirected || bouncedToSignIn) {
    const text = await r2.text().catch(() => '');
    const msg =
      text.match(/alert[^>]*>([^<]+)</)?.[1]?.trim() ||
      (bouncedToSignIn
        ? 'redirected back to sign-in (bad credentials, lockout, or captcha)'
        : `status ${r2.status}`);
    throw new Error(`Authentication failed: ${msg}`);
  }

  return Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}
