'use client';
import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { parseUnits, erc20Abi } from 'viem';
import { Wallet, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// "Fund from my wallet" — REAL client-side funding via the investor's Dynamic-connected
// wallet on Arc (alongside the server-funded path, which stays the default so the demo
// always works). The wallet approves USDC for the pool, then calls deposit(amount).
// Needs a funded Arc wallet; only rendered when Dynamic is enabled.
//
// NOTE: the pool's on-chain target is small USDC (dual-denomination), so this sends the
// pool-scale amount, not the displayed dollars.

const POOL_ABI = [
  { type: 'function', name: 'deposit', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
] as const;

const USDC_ADDRESS = (process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS ??
  '0x3600000000000000000000000000000000000000') as `0x${string}`;

export function WalletFundButton({
  poolAddress,
  amountUsdc,
  onFunded,
}: {
  poolAddress: string;
  amountUsdc: number; // pool-scale USDC (e.g. 2.04)
  onFunded?: (txHash: string) => void;
}) {
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function fund() {
    setError('');
    if (!primaryWallet) {
      setShowAuthFlow(true);
      return;
    }
    if (!isEthereumWallet(primaryWallet)) {
      setError('Connect an EVM wallet to fund from your wallet.');
      return;
    }
    if (!(amountUsdc > 0)) {
      setError('Enter an amount first.');
      return;
    }
    setBusy(true);
    try {
      const walletClient = await primaryWallet.getWalletClient();
      const account = primaryWallet.address as `0x${string}`;
      const pool = poolAddress as `0x${string}`;
      const amount = parseUnits(amountUsdc.toFixed(6), 6);

      // 1) approve the pool to pull USDC
      const approveHash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [pool, amount],
        account,
        chain: undefined,
      });
      // best-effort wait via the public client if available; otherwise proceed
      // (Dynamic's wallet client handles confirmation under the hood for most flows).
      await (walletClient as any).waitForTransactionReceipt?.({ hash: approveHash }).catch(() => {});

      // 2) deposit into the pool
      const depositHash = await walletClient.writeContract({
        address: pool,
        abi: POOL_ABI,
        functionName: 'deposit',
        args: [amount],
        account,
        chain: undefined,
      });

      setDone(true);
      onFunded?.(depositHash);
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? 'Wallet funding failed.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-sm text-brand">
        <CheckCircle2 size={14} /> Funded from your wallet ✓
      </p>
    );
  }

  return (
    <div>
      <Button type="button" variant="outline" className="w-full" onClick={fund} disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="mr-2 animate-spin" size={15} /> Confirm in your wallet…
          </>
        ) : (
          <>
            <Wallet size={15} className="mr-2" /> Fund from my wallet
          </>
        )}
      </Button>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
