/**
 * Order Commitment Generator for MeroPools Demo
 *
 * IMPORTANT: For demo purposes, we store order data in plaintext within the commitment.
 * In production, this would use proper encryption and ZK proofs.
 
 */

import { OrderCommitment } from "../api/clientApi";

function stringToBytes(str: string): number[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes);
}

function createHash32(data: string): number[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);

  const hash = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i++) {
    hash[i % 32] ^= bytes[i];
  }

  for (let i = bytes.length; i < 32; i++) {
    hash[i] = (hash[i % bytes.length] + i) & 0xff;
  }

  return Array.from(hash);
}

/**
 * Store order details as plaintext JSON in bytes (for demo)
 * In production: Proper encryption with user's private key
 * Returns byte array
 */
function encodeOrderPayload(orderDetails: {
  token: string;
  amount: string;
  expectedToken: string;
  expectedPrice: string;
  vechainAddress: string;
}): number[] {
  const payload = JSON.stringify(orderDetails);
  return stringToBytes(payload);
}

/**
 * Generate order commitment for demo purposes
 *
 * @param orderDetails - Order information to commit
 * @returns OrderCommitment object ready for submission
 */
export function generateOrderCommitment(orderDetails: {
  token: string;
  amount: string;
  expectedToken: string;
  expectedPrice: string;
  vechainAddress: string;
  spread: number;
  timeLimit: number;
}): OrderCommitment {
  const now = Date.now() * 1_000_000;
  const expiry = now + orderDetails.timeLimit * 1_000_000_000;

  // 1. Create nullifier seed from order details (deterministic for demo)
  const nullifierData = `nullifier_${orderDetails.token}_${orderDetails.amount}_${now}`;
  const nullifier_seed = createHash32(nullifierData);

  // 2. Store order payload as plaintext JSON (for demo visibility)
  const encrypted_payload = encodeOrderPayload({
    token: orderDetails.token,
    amount: orderDetails.amount,
    expectedToken: orderDetails.expectedToken,
    expectedPrice: orderDetails.expectedPrice,
    vechainAddress: orderDetails.vechainAddress,
  });

  // 3. Create proof of funds hash (deterministic for demo)
  const proofData = `proof_${orderDetails.vechainAddress}_${orderDetails.amount}`;
  const proof_of_funds = createHash32(proofData);

  // 4. Create commitment hash from all components
  const commitmentData = `commit_${orderDetails.token}_${orderDetails.amount}_${orderDetails.expectedToken}_${now}`;
  const commitment_hash = createHash32(commitmentData);

  return {
    commitment_hash,
    encrypted_payload,
    nullifier_seed,
    proof_of_funds,
    timestamp: now,
    expiry: expiry,
  };
}

/**
 * Generate mock order commitment with realistic values for testing
 */
export function generateMockOrderCommitment(): OrderCommitment {
  return generateOrderCommitment({
    token: "VET",
    amount: "1000000000000000000",
    expectedToken: "VTHO",
    expectedPrice: "1000000000000000000",
    vechainAddress: "0x" + "0".repeat(40),
    spread: 200,
    timeLimit: 3600,
  });
}

export function validateOrderCommitment(commitment: OrderCommitment): boolean {
  try {
    if (
      !Array.isArray(commitment.commitment_hash) ||
      commitment.commitment_hash.length !== 32
    )
      return false;
    if (
      !Array.isArray(commitment.nullifier_seed) ||
      commitment.nullifier_seed.length !== 32
    )
      return false;
    if (
      !Array.isArray(commitment.proof_of_funds) ||
      commitment.proof_of_funds.length !== 32
    )
      return false;

    if (
      !Array.isArray(commitment.encrypted_payload) ||
      commitment.encrypted_payload.length === 0
    )
      return false;

    const allBytes = [
      ...commitment.commitment_hash,
      ...commitment.nullifier_seed,
      ...commitment.proof_of_funds,
      ...commitment.encrypted_payload,
    ];
    if (
      allBytes.some(
        (byte) => typeof byte !== "number" || byte < 0 || byte > 255
      )
    )
      return false;
  } catch {
    return false;
  }

  if (commitment.expiry <= commitment.timestamp) return false;

  return true;
}

/**
 * For production: This would integrate with:
 * 1. Zero-Knowledge proofs (zk-SNARKs) for privacy
 * 2. Poseidon hash for commitment
 * 3. EdDSA signatures for authentication
 * 4. Proper encryption (AES-GCM or similar)
 * 5. Merkle tree for batch verification
 *
 * Libraries to use in production:
 * - circomlibjs (Poseidon hash)
 * - snarkjs (ZK proofs)
 * - @noble/curves (EdDSA)
 * - tweetnacl (encryption)
 */
