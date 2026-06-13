import {
  Client,
  TokenCreateTransaction,
  CustomFractionalFee,
  AccountId,
  Hbar,
} from "@hashgraph/sdk";

export interface MintInvoiceTokenParams {
  client: Client;
  tokenName: string;
  tokenSymbol: string;
  // Invoice face value in whole dollars (e.g. 5000 for $5,000).
  amount: number;
  // Agent management fee as a percent (e.g. 1.5 for 1.5%).
  feePercent: number;
  // Account that collects the custom fee — the winning agent.
  feeCollectorId: string;
  // Treasury holding initial supply. Defaults to the client operator.
  treasuryId?: string;
}

// Tokens use 2 decimals (cents), so $1 = 100 base units.
const DECIMALS = 2;
const BASE_UNITS_PER_DOLLAR = 100;
// Fractional fee denominator: numerator/10000 expresses basis points,
// so a 1.5% fee is 150/10000.
const FEE_DENOMINATOR = 10000;

export async function mintInvoiceToken(
  params: MintInvoiceTokenParams
): Promise<string> {
  const {
    client,
    tokenName,
    tokenSymbol,
    amount,
    feePercent,
    feeCollectorId,
    treasuryId,
  } = params;

  const operatorId = client.operatorAccountId;
  if (operatorId === null) {
    throw new Error(
      "Hedera client has no operator set — call getClient() before minting."
    );
  }

  const treasury = treasuryId ? AccountId.fromString(treasuryId) : operatorId;

  const customFee = new CustomFractionalFee()
    .setNumerator(Math.round(feePercent * 100))
    .setDenominator(FEE_DENOMINATOR)
    .setFeeCollectorAccountId(feeCollectorId);

  const tx = new TokenCreateTransaction()
    .setTokenName(tokenName)
    .setTokenSymbol(tokenSymbol)
    .setDecimals(DECIMALS)
    .setInitialSupply(amount * BASE_UNITS_PER_DOLLAR)
    .setTreasuryAccountId(treasury)
    .setCustomFees([customFee])
    // Token creation with custom fees is costly (~40 ℏ); 20 ℏ was too low
    // and the network returned INSUFFICIENT_TX_FEE. 50 ℏ is a safe ceiling
    // (only the actual assessed cost is charged).
    .setMaxTransactionFee(new Hbar(50));

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);

  if (receipt.tokenId === null) {
    throw new Error(
      `Token creation succeeded but receipt has no tokenId (status: ${receipt.status.toString()}).`
    );
  }

  return receipt.tokenId.toString();
}
