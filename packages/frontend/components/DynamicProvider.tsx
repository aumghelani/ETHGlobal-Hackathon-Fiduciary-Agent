'use client';
import type { ReactNode } from 'react';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';

// Dynamic wallet/auth — login (incl. MPC embedded wallets) + a connected wallet that can
// sign on Arc. GRACEFUL DEGRADATION: with no NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID set, we
// render children WITHOUT the provider, so the app works exactly as before until the env
// ID is added (same pattern as the World ID gate). The env ID is a free Sandbox key from
// app.dynamic.xyz.

const ENV_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

export const DYNAMIC_ENABLED = !!ENV_ID;

// Register Arc testnet as a custom EVM network so the connected/embedded wallet operates
// on it. chainId 5042002. (Arc pays gas in USDC; nativeCurrency here is the EVM-level
// placeholder — set precisely if Arc exposes a distinct native token.)
const arcNetwork = {
  blockExplorerUrls: ['https://testnet.arcscan.app'],
  chainId: 5042002,
  chainName: 'Arc Testnet',
  iconUrls: ['https://app.dynamic.xyz/assets/networks/eth.svg'],
  name: 'Arc',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  networkId: 5042002,
  rpcUrls: ['https://rpc.testnet.arc.network'],
  vanityName: 'Arc Testnet',
};

export function DynamicProvider({ children }: { children: ReactNode }) {
  if (!DYNAMIC_ENABLED) {
    return <>{children}</>;
  }
  return (
    <DynamicContextProvider
      settings={{
        environmentId: ENV_ID!,
        walletConnectors: [EthereumWalletConnectors],
        overrides: { evmNetworks: [arcNetwork] },
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
