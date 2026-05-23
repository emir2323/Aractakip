/**
 * Keep-alive utility for Render Free Tier.
 * 
 * Render free tier sleeps after 15 minutes of inactivity.
 * This module pings /api/health every 10 minutes to prevent cold starts.
 * Start after login, stop on logout.
 */

import { API_BASE } from '../api/client';

let intervalId: ReturnType<typeof setInterval> | null = null;

const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

async function ping() {
  try {
    // Use the health endpoint — a lightweight GET
    const baseUrl = API_BASE.replace(/\/api$/, '');
    await fetch(`${baseUrl}/api/health`, { method: 'GET' });
  } catch {
    // Silently ignore — this is a best-effort keep-alive
  }
}

/** Start pinging. Safe to call multiple times (idempotent). */
export function startKeepAlive() {
  if (intervalId) return; // Already running
  ping(); // Immediate first ping to wake up the server
  intervalId = setInterval(ping, PING_INTERVAL);
}

/** Stop pinging and clear the interval. */
export function stopKeepAlive() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
