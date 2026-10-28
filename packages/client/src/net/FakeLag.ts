/**
 * Dev tool: `?online&lag=150` delays every message this client sends by that
 * many ms, to feel and test online play as if the server were far away.
 * Only outgoing messages are delayed, so it simulates about half a round trip
 * of that size. Ignored in production builds.
 */
export function fakeLagMs(): number {
  if (!import.meta.env.DEV) return 0;
  const value = Number(new URLSearchParams(location.search).get('lag'));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Runs `send` now, or after `lagMs` if a fake lag is set. Order is preserved. */
export function sendWithLag(lagMs: number, send: () => void): void {
  if (lagMs > 0) setTimeout(send, lagMs);
  else send();
}
