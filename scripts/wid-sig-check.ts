// One-off diagnostic: derive the public key from WORLDID_SIGNING_KEY and prove the signature
// the /api/worldid/context route produces is self-consistent. The derived pubkey must match
// what's registered for WORLDID_RP_ID in the World Developer Portal — a mismatch is the cause
// of `invalid_rp_signature`. Run: npx tsx scripts/wid-sig-check.ts
import { config as loadEnv } from 'dotenv';
import { signRequest, computeRpSignatureMessage } from '@worldcoin/idkit-server';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

// Replicate idkit-server's EIP-191 hashing: keccak256("\x19Ethereum Signed Message:\n"+len+msg)
const ETHEREUM_MESSAGE_PREFIX = '\x19Ethereum Signed Message:\n';
const enc = new TextEncoder();
function hashEthereumMessage(message: Uint8Array): Uint8Array {
  const prefix = enc.encode(`${ETHEREUM_MESSAGE_PREFIX}${message.length}`);
  return keccak_256(Uint8Array.from([...prefix, ...message]));
}

loadEnv({ path: 'D:/ETHGlobal Hackathon/.env.local' });

const signingKeyHex = process.env.WORLDID_SIGNING_KEY!;
const action = process.env.WORLDID_ACTION ?? 'factor-invoice';
const rpId = process.env.WORLDID_RP_ID;

const toHex = (u: Uint8Array) => '0x' + Buffer.from(u).toString('hex');
const fromHex = (h: string) => Uint8Array.from(Buffer.from(h.replace(/^0x/, ''), 'hex'));

console.log('rp_id:', rpId);
console.log('action:', action);
console.log(
  'signingKey present:', !!signingKeyHex,
  '| hex len:', signingKeyHex?.replace(/^0x/, '').length,
  '| 0x-prefixed:', signingKeyHex?.startsWith('0x')
);

const priv = fromHex(signingKeyHex);

const pubCompressed = secp256k1.getPublicKey(priv, true);
const pubUncompressed = secp256k1.getPublicKey(priv, false);
console.log('\n--- DERIVED PUBLIC KEY (must match the portal registration for this rp_id) ---');
console.log('compressed   (33b):', toHex(pubCompressed));
console.log('uncompressed (65b):', toHex(pubUncompressed));

// Sign exactly as the route does.
const sig = signRequest({ signingKeyHex, action });
console.log('\n--- SIGN OUTPUT (matches /api/worldid/context) ---');
console.log('nonce:', sig.nonce);
console.log('createdAt:', sig.createdAt, '| expiresAt:', sig.expiresAt, '| ttl(s):', sig.expiresAt - sig.createdAt);
console.log('sig:', sig.sig);

// Reconstruct the signed message and verify locally with the derived pubkey. If this is true,
// the key + message format are internally consistent and the ONLY remaining cause is that the
// portal has a DIFFERENT public key registered for this rp_id.
const nonceBytes = fromHex(sig.nonce);
const msg = computeRpSignatureMessage(nonceBytes, sig.createdAt, sig.expiresAt, action);
console.log('\nsigned message length:', msg.length, 'bytes');

// The sig is 65 bytes = 64-byte (r||s) + 1 recovery byte (Ethereum-style). Strip the recovery
// byte for raw secp256k1 verification.
const sigFull = fromHex(sig.sig);
const sig64 = sigFull.length === 65 ? sigFull.slice(0, 64) : sigFull;
console.log('sig bytes:', sigFull.length, '(stripped to', sig64.length, 'for verify)');

// The library hashes with keccak256 over the EIP-191-prefixed message — replicate exactly.
const msgHash = hashEthereumMessage(msg);

const ok = (() => {
  try {
    return secp256k1.verify(sig64, msgHash, pubUncompressed);
  } catch (e) {
    return 'threw — ' + (e as Error).message;
  }
})();
console.log('\nlocal self-verify (keccak256 + EIP-191):', ok);

// Recover the pubkey from the signature+recovery byte. If it matches our derived key, the
// signature is DEFINITIVELY produced by THIS signing key — so any invalid_rp_signature from
// World means the PORTAL has a different pubkey registered for this rp_id (key mismatch).
try {
  const recId = sigFull.length === 65 ? sigFull[64] : 0;
  const normRec = recId >= 27 ? recId - 27 : recId;
  const sigObj = secp256k1.Signature.fromBytes(sig64, 'compact').addRecoveryBit(normRec & 1);
  const recovered = sigObj.recoverPublicKey(msgHash).toBytes(false);
  const matches = toHex(recovered) === toHex(pubUncompressed);
  console.log('recovered pubkey == derived:', matches);
  if (matches) {
    console.log(
      '\n✅ Signature is INTERNALLY CONSISTENT — the signing key, message format, and hashing\n' +
        '   all match what idkit-server produces. If World returns invalid_rp_signature, the\n' +
        '   PORTAL has a DIFFERENT public key registered for rp_id ' + rpId + '.\n' +
        '   → Re-register / rotate the RP signer so the portal pubkey matches the DERIVED key above.'
    );
  }
} catch (e) {
  console.log('recovery check: threw —', (e as Error).message);
}
