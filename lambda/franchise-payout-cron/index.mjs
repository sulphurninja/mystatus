/**
 * AWS Lambda: trigger daily franchise payouts on the EC2 Next.js app.
 *
 * Env (set in Lambda → Configuration → Environment variables):
 *   APP_BASE_URL                 https://mystatusads.com (no trailing slash)
 *   FRANCHISE_PAYOUT_CRON_SECRET shared secret (must match EC2 app .env)
 *   REQUEST_TIMEOUT_MS           optional, default 120000
 */

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_APP_BASE_URL = 'https://mystatusads.com';

export async function handler(event = {}) {
  const baseUrl = (process.env.APP_BASE_URL || DEFAULT_APP_BASE_URL).replace(/\/+$/, '');
  const secret = process.env.FRANCHISE_PAYOUT_CRON_SECRET || '';
  const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  if (!secret) {
    throw new Error('FRANCHISE_PAYOUT_CRON_SECRET is required');
  }

  const date = event.date || event?.detail?.date;
  const limit = event.limit ?? event?.detail?.limit;
  const body = {};
  if (date) body.date = date;
  if (limit !== undefined && limit !== null && limit !== '') body.limit = Number(limit);

  const url = `${baseUrl}/api/cron/franchise-payouts`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': secret,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      console.error('Franchise payout cron failed', {
        status: response.status,
        payload,
      });
      throw new Error(`Payout cron HTTP ${response.status}: ${text.slice(0, 500)}`);
    }

    console.log('Franchise payout cron succeeded', payload);
    return {
      ok: true,
      status: response.status,
      data: payload,
    };
  } finally {
    clearTimeout(timer);
  }
}
