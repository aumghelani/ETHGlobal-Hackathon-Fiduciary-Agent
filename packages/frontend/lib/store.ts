import type { Invoice, Agent, Bid } from '@fiduciary/agents';
import { Redis } from '@upstash/redis';

// Serverless-safe store. On Vercel, the process memory isn't shared across function
// instances, so the demo state must live in a shared backing store. We use Upstash Redis
// (REST, serverless-friendly) when configured, and fall back to a process-global in-memory
// store locally (dev keeps working without Redis — same behavior as before).
//
// The route code accesses the store SYNCHRONOUSLY (store.invoices.get/set/values/entries),
// so PersistentMap keeps that exact sync interface: hydrated from a Redis hash up front,
// write-through on .set. getStore() is async (hydrates), and store.flush() awaits all
// pending writes so a serverless function never returns before its writes have landed.

type InvoiceRecord = Invoice & {
  status: 'pending_auction' | 'funding' | 'funded' | 'settled';
  acceptedBid?: Bid;
  investors: any[];
};

export type Store = {
  invoices: PersistentMap<InvoiceRecord>;
  bids: PersistentMap<Bid[]>;
  agents: PersistentMap<Agent>;
  // World ID Sybil resistance: the set of World ID nullifier hashes that have already
  // factored an invoice. Keyed by nullifier_hash; presence means "this unique human has
  // already been through". Enforces one-per-human (THREAT_MODEL Layer 1).
  nullifiers: PersistentMap<{ at: string }>;
  flush: () => Promise<void>;
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const STORE_BACKEND = redis ? 'redis' : 'memory';

// A Map with the same sync surface the routes use, backed by an optional Redis hash.
// Hydrated once (async, before use); .set writes through to Redis (tracked for flush).
class PersistentMap<V> {
  private mem = new Map<string, V>();
  private pending = new Set<Promise<unknown>>();

  constructor(private hashKey: string) {}

  async hydrate(): Promise<void> {
    if (!redis) return;
    const all = (await redis.hgetall<Record<string, V>>(this.hashKey)) ?? {};
    this.mem = new Map(Object.entries(all));
  }

  get(k: string): V | undefined {
    return this.mem.get(k);
  }
  has(k: string): boolean {
    return this.mem.has(k);
  }
  values(): IterableIterator<V> {
    return this.mem.values();
  }
  entries(): IterableIterator<[string, V]> {
    return this.mem.entries();
  }
  get size(): number {
    return this.mem.size;
  }

  set(k: string, v: V): this {
    this.mem.set(k, v);
    if (redis) {
      // Upstash auto-serializes JSON values. Track the write so flush() can await it.
      const p = redis.hset(this.hashKey, { [k]: v as any }).catch((e) => {
        console.error(`[store] redis hset ${this.hashKey}/${k} failed:`, e);
      });
      this.pending.add(p);
      p.finally(() => this.pending.delete(p));
    }
    return this;
  }

  async flush(): Promise<void> {
    if (this.pending.size) await Promise.all([...this.pending]);
  }
}

const AGENT_SEED: Agent[] = [
  {
    id: 'veteran',
    name: 'Veteran Agent',
    reputation: {
      score: 4.8,
      completedDeals: 500,
      totalVolume: 1_000_000,
      successfulSettlements: 495,
      disputedSettlements: 5,
      averageInvoiceSize: 2000,
      daysSinceLastDeal: 2,
    },
    minimumRiskScore: 0.5,
    hederaAccountId: process.env.VETERAN_AGENT_HEDERA_ID || '0.0.0',
    arcAddress: process.env.VETERAN_AGENT_ARC_ADDRESS || '0x0',
  },
  {
    id: 'newbie',
    name: 'Newbie Agent',
    reputation: {
      score: 0.5,
      completedDeals: 0,
      totalVolume: 0,
      successfulSettlements: 0,
      disputedSettlements: 0,
      averageInvoiceSize: 0,
      daysSinceLastDeal: 0,
    },
    minimumRiskScore: 0.1,
    hederaAccountId: process.env.NEWBIE_AGENT_HEDERA_ID || '0.0.0',
    arcAddress: process.env.NEWBIE_AGENT_ARC_ADDRESS || '0x0',
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __fiduciary_store: Store | undefined;
}

function buildStore(): Store {
  const invoices = new PersistentMap<InvoiceRecord>('fid:invoices');
  const bids = new PersistentMap<Bid[]>('fid:bids');
  const agents = new PersistentMap<Agent>('fid:agents');
  const nullifiers = new PersistentMap<{ at: string }>('fid:nullifiers');
  return {
    invoices,
    bids,
    agents,
    nullifiers,
    flush: async () => {
      await Promise.all([invoices.flush(), bids.flush(), agents.flush(), nullifiers.flush()]);
    },
  };
}

// Async: hydrate the maps (from Redis when configured) and seed agents if missing. Locally
// (no Redis) the global store persists across requests in-process, so we hydrate + seed once.
export async function getStore(): Promise<Store> {
  if (redis) {
    // Serverless: rebuild + hydrate per request (no shared process memory).
    const store = buildStore();
    await Promise.all([
      store.invoices.hydrate(),
      store.bids.hydrate(),
      store.agents.hydrate(),
      store.nullifiers.hydrate(),
    ]);
    if (!store.agents.has('veteran')) {
      for (const a of AGENT_SEED) store.agents.set(a.id, a);
      await store.agents.flush();
    }
    return store;
  }

  // Local: one process-global store (in-memory, seeded once).
  if (!global.__fiduciary_store) {
    const store = buildStore();
    for (const a of AGENT_SEED) store.agents.set(a.id, a);
    global.__fiduciary_store = store;
  }
  return global.__fiduciary_store;
}
