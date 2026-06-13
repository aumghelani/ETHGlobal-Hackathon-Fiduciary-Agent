// Retry transient connect failures (testnet RPC / Hedera / Unlink occasionally
// drop a request even on a stable network). Connect failures are pre-submission,
// so retrying is safe. ADR-016.
export async function withRetry<T>(fn: () => Promise<T>, tries = 3, delayMs = 2000): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}
