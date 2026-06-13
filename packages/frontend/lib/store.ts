import type { Invoice, Agent, Bid, Investor } from '@fiduciary/agents';

type Store = {
  invoices: Map<string, Invoice & {
    status: 'pending_auction' | 'funding' | 'funded' | 'settled';
    acceptedBid?: Bid;
    investors: Investor[];
  }>;
  bids: Map<string, Bid[]>;  // invoiceId -> bids
  agents: Map<string, Agent>;
};

declare global {
  // eslint-disable-next-line no-var
  var __fiduciary_store: Store | undefined;
}

export function getStore(): Store {
  if (!global.__fiduciary_store) {
    global.__fiduciary_store = {
      invoices: new Map(),
      bids: new Map(),
      agents: new Map(),
    };
    // Seed two agents
    global.__fiduciary_store.agents.set('veteran', {
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
    });
    global.__fiduciary_store.agents.set('newbie', {
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
    });
  }
  return global.__fiduciary_store;
}
