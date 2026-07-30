/**
 * Sealed-box encryption for ballots.
 *
 * Implements a "sealed box" pattern similar to NaCl's `crypto_box_seal`:
 *
 *   1. The election administrator generates a long-lived X25519 keypair.
 *      The public key is published; the private key is held offline until
 *      tally time.
 *
 *   2. Each voter's browser calls `seal()`, which:
 *        a. Generates a fresh ephemeral X25519 keypair (new randomness every
 *           call — this is why two seals of the same ballot always differ).
 *        b. Derives a shared secret via Diffie-Hellman between the ephemeral
 *           private key and the election public key.
 *        c. Encrypts the plaintext with XChaCha20-Poly1305 using the shared
 *           secret as the symmetric key and a random 24-byte nonce.
 *        d. Outputs:  ephemeralPublicKey (32 B) || nonce (24 B) || ciphertext+tag
 *
 *   3. At tally time, `open()` reverses the process using the election
 *      private key.
 *
 * We chose XChaCha20-Poly1305 over AES-GCM for two reasons:
 *   - The 24-byte nonce is large enough to generate randomly without
 *     birthday-collision risk. AES-GCM's 12-byte nonce is dangerously small
 *     for random generation at scale (2^32 messages hits ~50% collision).
 *   - Poly1305 authentication means any tampering (wrong key, bit flip)
 *     causes `decrypt` to throw, giving us acceptance criteria 4 and 5 free.
 *
 * Both `@noble/curves` and `@noble/ciphers` are audited by Cure53.
 * We never implement our own cryptographic primitives.
 */

import { x25519 } from '@noble/curves/ed25519.js'
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js'
import { randomBytes } from '@noble/ciphers/utils.js'

/** Byte lengths for the sealed wire format. */
const EPHEMERAL_PK_LEN = 32
const NONCE_LEN = 24 // XChaCha20 uses a 24-byte nonce
const TAG_LEN = 16 // Poly1305 authentication tag

/** Minimum sealed payload: ephemeral key + nonce + tag (no plaintext). */
const MIN_SEALED_LEN = EPHEMERAL_PK_LEN + NONCE_LEN + TAG_LEN

/**
 * Generate a long-lived X25519 keypair for an election.
 *
 * The public key is distributed to voters (e.g. embedded in the election
 * contract or served by the API). The private key is kept offline and only
 * used at tally time to decrypt sealed ballots.
 *
 * Under the hood this calls `x25519.utils.randomSecretKey()`, which draws
 * 32 bytes from the platform CSPRNG and applies Curve25519 clamping (clear
 * the three lowest bits, clear bit 255, set bit 254). Clamping ensures the
 * scalar is in the correct range and avoids small-subgroup attacks.
 */
export function generateElectionKeypair(): {
  publicKey: Uint8Array
  privateKey: Uint8Array
} {
  const privateKey = x25519.utils.randomSecretKey()
  const publicKey = x25519.getPublicKey(privateKey)
  return { publicKey: Uint8Array.from(publicKey), privateKey: Uint8Array.from(privateKey) }
}

/**
 * Seal plaintext bytes so only the holder of the matching X25519 private key
 * can read them.
 *
 * Wire format:
 * ```
 * ┌──────────────────┬───────────────┬─────────────────────────┐
 * │ ephemeralPubKey   │    nonce      │   ciphertext + tag      │
 * │     32 bytes      │   24 bytes    │   payload + 16 bytes    │
 * └──────────────────┴───────────────┴─────────────────────────┘
 * ```
 *
 * @param plaintext  - The data to encrypt (canonical ballot JSON bytes).
 * @param publicKey  - The election's X25519 public key (32 bytes).
 * @returns Sealed bytes in the format above.
 */
export function seal(plaintext: Uint8Array, publicKey: Uint8Array): Uint8Array {
  // Step 1: Fresh ephemeral keypair — ensures non-deterministic output.
  // Even if the plaintext and election public key are identical between two
  // calls, the shared secret will differ because the ephemeral key differs.
  const ephemeralPrivateKey = x25519.utils.randomSecretKey()
  const ephemeralPublicKey = x25519.getPublicKey(ephemeralPrivateKey)

  // Step 2: Diffie-Hellman key agreement.
  // The shared secret is the X25519 output: the x-coordinate of
  // ephemeralPrivateKey * publicKey on Curve25519.
  const sharedSecret = x25519.getSharedSecret(ephemeralPrivateKey, publicKey)

  // Step 3: Random 24-byte nonce for XChaCha20-Poly1305.
  // 24 bytes = 192 bits of randomness. Birthday bound is ~2^96 messages
  // before a 50% chance of nonce collision, so random generation is safe.
  const nonce = randomBytes(NONCE_LEN)

  // Step 4: Encrypt. The return value includes the 16-byte Poly1305 tag
  // appended to the ciphertext.
  const ciphertextWithTag = xchacha20poly1305(sharedSecret, nonce).encrypt(plaintext)

  // Step 5: Assemble wire format.
  const sealed = new Uint8Array(EPHEMERAL_PK_LEN + NONCE_LEN + ciphertextWithTag.length)
  sealed.set(ephemeralPublicKey, 0)
  sealed.set(nonce, EPHEMERAL_PK_LEN)
  sealed.set(ciphertextWithTag, EPHEMERAL_PK_LEN + NONCE_LEN)

  return sealed
}

/**
 * Open a sealed payload using the election's X25519 private key.
 *
 * @param sealed     - Bytes in the wire format produced by `seal()`.
 * @param privateKey - The election's X25519 private key (32 bytes).
 * @returns The original plaintext.
 * @throws If the ciphertext was tampered with, truncated, or the wrong
 *         private key is used. Poly1305 tag verification makes this
 *         automatic: you never get garbage output, only a thrown error.
 */
export function open(sealed: Uint8Array, privateKey: Uint8Array): Uint8Array {
  if (sealed.length < MIN_SEALED_LEN) {
    throw new Error(
      `open: sealed payload too short (${sealed.length} bytes, minimum ${MIN_SEALED_LEN})`,
    )
  }

  // Parse wire format.
  const ephemeralPublicKey = sealed.slice(0, EPHEMERAL_PK_LEN)
  const nonce = sealed.slice(EPHEMERAL_PK_LEN, EPHEMERAL_PK_LEN + NONCE_LEN)
  const ciphertextWithTag = sealed.slice(EPHEMERAL_PK_LEN + NONCE_LEN)

  // Reconstruct the same shared secret the sealer computed.
  const sharedSecret = x25519.getSharedSecret(privateKey, ephemeralPublicKey)

  // Decrypt. If the tag doesn't match (wrong key, tampered data), this throws.
  return Uint8Array.from(xchacha20poly1305(sharedSecret, nonce).decrypt(ciphertextWithTag))
}
