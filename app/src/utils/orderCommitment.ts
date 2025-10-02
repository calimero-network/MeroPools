/**
 * Order Commitment Generator for MeroPools Demo
 *
 * IMPORTANT: The Rust smart contract expects byte arrays [u8; 32] for hash fields,
 * not base58-encoded strings. All hash fields are now returned as number[] arrays.
 *
 * In production, this should use proper cryptographic libraries and ZK proofs.
 * For demo purposes, we use simplified hashing and random generation.
 */

import { OrderCommitment } from "../api/clientApi";

/**
 * Simple hash function for demo (replace with proper crypto in production)
 * Returns byte array [u8; 32] matching Rust contract expectations
 */
function simpleHash(data: string): number[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  // Pad or truncate to exactly 32 bytes to match [u8; 32] in Rust
  const hash = new Uint8Array(32);
  hash.set(bytes.slice(0, 32));
  return Array.from(hash);
}

/**
 * Generate a random 32-byte array [u8; 32]
 */
function generateRandomBytes32(): number[] {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes);
}

/**
 * Encrypt order details (simplified for demo)
 * In production: Use proper encryption with user's private key
 * Returns byte array
 */
function encryptOrderPayload(orderDetails: {
  token: string;
  amount: string;
  expectedToken: string;
  expectedPrice: string;
  vechainAddress: string;
}): number[] {
  const payload = JSON.stringify(orderDetails);
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);

  // For demo: return as byte array (in production, encrypt this first)
  return Array.from(payloadBytes);
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
  const now = Date.now() * 1_000_000; // Convert to nanoseconds
  const expiry = now + orderDetails.timeLimit * 1_000_000_000; // timeLimit in seconds

  // 1. Generate nullifier seed (unique per order) as [u8; 32] array
  const nullifier_seed = generateRandomBytes32();

  // 2. Encrypt order payload as byte array
  const encrypted_payload = encryptOrderPayload({
    token: orderDetails.token,
    amount: orderDetails.amount,
    expectedToken: orderDetails.expectedToken,
    expectedPrice: orderDetails.expectedPrice,
    vechainAddress: orderDetails.vechainAddress,
  });

  // 3. Generate proof of funds (demo: random, production: real proof) as [u8; 32] array
  const proof_of_funds = generateRandomBytes32();

  // 4. Create commitment hash from all components as [u8; 32] array
  const commitmentData = JSON.stringify({
    nullifier_seed,
    encrypted_payload,
    proof_of_funds,
    timestamp: now,
    expiry,
  });

  const commitment_hash = simpleHash(commitmentData);

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
    amount: "1000000000000000000", // 1 VET in wei
    expectedToken: "VTHO",
    expectedPrice: "1000000000000000000", // 1:1 exchange rate
    vechainAddress: "0x" + "0".repeat(40),
    spread: 200, // 2% spread (200 basis points)
    timeLimit: 3600, // 1 hour
  });
}

/**
 * Validate order commitment structure
 */
export function validateOrderCommitment(commitment: OrderCommitment): boolean {
  // Validate byte arrays
  try {
    // Check hash fields are exactly 32 bytes
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

    // Check encrypted payload exists
    if (
      !Array.isArray(commitment.encrypted_payload) ||
      commitment.encrypted_payload.length === 0
    )
      return false;

    // Check all bytes are valid (0-255)
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

  // Check timestamps are valid
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
