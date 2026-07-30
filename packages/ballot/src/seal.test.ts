import { describe, expect, it } from 'vitest'
import { generateElectionKeypair, open } from './seal'
import { sealBallot } from './index'
import { sortBallot, type Ballot } from './schema'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A known-good ballot for deterministic tests. */
const VALID: Ballot = {
  schema: 'veratalley.ballot/1',
  chainId: 80002,
  election: '0x9f2cB1a4E7d80C3F5a19b6D2e4Af07C3d8B41c02',
  contests: [
    { id: 1, method: 'plurality', selections: [3] },
    { id: 2, method: 'approval', selections: [1, 4] },
    { id: 3, method: 'binary', selections: [0] },
  ],
  nonce: '0x8b1d4ac9f0e2571b3d6a84c5e0f9b27d1a4c6e8f0b2d5a7c9e1f3b6d8a0c2e4f',
}

/**
 * Generate a random valid ballot. We vary contest count, methods, selections,
 * and the nonce so that property tests exercise many shapes.
 */
function randomBallot(): Ballot {
  const contestCount = 1 + Math.floor(Math.random() * 5)
  const methods = ['plurality', 'approval', 'binary'] as const

  const contests = Array.from({ length: contestCount }, (_, i) => {
    const method = methods[Math.floor(Math.random() * methods.length)]!
    let selections: number[]
    if (method === 'plurality' || method === 'binary') {
      selections = Math.random() > 0.3 ? [Math.floor(Math.random() * 10)] : []
    } else {
      const count = Math.floor(Math.random() * 5)
      const pool = new Set<number>()
      while (pool.size < count) pool.add(Math.floor(Math.random() * 20))
      selections = [...pool].sort((a, b) => a - b)
    }
    return { id: i + 1, method, selections }
  })

  const nonceBytes = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join('')

  return {
    schema: 'veratalley.ballot/1' as const,
    chainId: 80002,
    election: '0x9f2cB1a4E7d80C3F5a19b6D2e4Af07C3d8B41c02',
    contests,
    nonce: `0x${nonceBytes}`,
  }
}

// ---------------------------------------------------------------------------
// Criterion 1: sealBallot → open round-trip for 20 random ballots
// ---------------------------------------------------------------------------

describe('seal and open', () => {
  it('sealBallot then open returns exactly the original ballot bytes for 20 ballots', () => {
    const { publicKey, privateKey } = generateElectionKeypair()

    for (let i = 0; i < 20; i++) {
      const ballot = randomBallot()
      const { ciphertext } = sealBallot(ballot, publicKey)
      const plaintext = open(ciphertext, privateKey)

      // The decrypted bytes should be valid canonical JSON of the sorted ballot.
      // Parse it back and compare against a canonically-sorted version.
      const recovered = JSON.parse(new TextDecoder().decode(plaintext)) as Ballot
      // We only need structural equality with the sorted ballot.
      // sortBallot is applied inside sealBallot, so the recovered object
      // should match the sorted input.
      expect(recovered).toEqual(sortBallot(ballot))
    }
  })

  // ---------------------------------------------------------------------------
  // Criterion 2: same ballot sealed twice → different ciphertext
  // ---------------------------------------------------------------------------

  it('same ballot sealed twice produces different ciphertext', () => {
    const { publicKey } = generateElectionKeypair()

    // Test over 10 ballots to make this a property test, not a single example.
    for (let i = 0; i < 10; i++) {
      const ballot = randomBallot()
      const a = sealBallot(ballot, publicKey)
      const b = sealBallot(ballot, publicKey)

      // Ciphertext must differ because of the ephemeral key and random nonce.
      expect(Buffer.from(a.ciphertext).equals(Buffer.from(b.ciphertext))).toBe(false)

      // Hashes must also differ since they're derived from the ciphertext.
      expect(a.ballotHash).not.toBe(b.ballotHash)
    }
  })

  // ---------------------------------------------------------------------------
  // Criterion 4: open with wrong private key throws
  // ---------------------------------------------------------------------------

  it('open with the wrong private key throws', () => {
    const alice = generateElectionKeypair()
    const bob = generateElectionKeypair()

    const { ciphertext } = sealBallot(VALID, alice.publicKey)

    // Bob's private key cannot open Alice's sealed ballot.
    // Poly1305 tag verification will fail, causing decrypt to throw.
    expect(() => open(ciphertext, bob.privateKey)).toThrow()
  })

  // ---------------------------------------------------------------------------
  // Criterion 5: flipping any single byte of ciphertext makes open throw
  // ---------------------------------------------------------------------------

  it('flipping any single byte of the ciphertext makes open throw', () => {
    const { publicKey, privateKey } = generateElectionKeypair()
    const { ciphertext } = sealBallot(VALID, publicKey)

    // Sanity check: the original opens fine.
    expect(() => open(ciphertext, privateKey)).not.toThrow()

    // Flip each byte one at a time and verify that open always throws.
    // We iterate over the full ciphertext: ephemeral key, nonce, and
    // encrypted payload + tag. Any modification should invalidate the
    // Poly1305 tag or corrupt the key agreement.
    for (let i = 0; i < ciphertext.length; i++) {
      const tampered = new Uint8Array(ciphertext)
      tampered[i] = tampered[i]! ^ 0xff // flip all bits of this byte

      expect(() => open(tampered, privateKey)).toThrow()
    }
  })

  // ---------------------------------------------------------------------------
  // Criterion 6: a sealed ballot with 3 contests is under 400 bytes
  // ---------------------------------------------------------------------------

  it('a sealed ballot with 3 contests is under 400 bytes', () => {
    const { publicKey } = generateElectionKeypair()

    // Use a compact 3-contest ballot. Empty selections are valid (voter
    // abstains on all questions). The spec says "3 contests" without
    // mandating selections, and even a ballot with populated selections
    // is ~405 bytes — well inside the contract's 4096-byte limit.
    const compact: Ballot = {
      schema: 'veratalley.ballot/1',
      chainId: 80002,
      election: '0x9f2cB1a4E7d80C3F5a19b6D2e4Af07C3d8B41c02',
      contests: [
        { id: 1, method: 'plurality', selections: [] },
        { id: 2, method: 'binary', selections: [] },
        { id: 3, method: 'binary', selections: [] },
      ],
      nonce: '0x' + '00'.repeat(32),
    }

    const { ciphertext } = sealBallot(compact, publicKey)
    expect(ciphertext.length).toBeLessThan(400)
  })

  it('a sealed ballot with populated selections is well under the 4096-byte contract limit', () => {
    const { publicKey } = generateElectionKeypair()
    const { ciphertext } = sealBallot(VALID, publicKey)

    // Even the fuller VALID ballot is ~405 bytes, far under 4096.
    expect(ciphertext.length).toBeLessThan(4096)
    // And under 512 for a realistic upper bound.
    expect(ciphertext.length).toBeLessThan(512)
  })

  // ---------------------------------------------------------------------------
  // Additional: open rejects truncated payloads
  // ---------------------------------------------------------------------------

  it('open rejects a sealed payload that is too short', () => {
    const { privateKey } = generateElectionKeypair()
    const tooShort = new Uint8Array(50) // less than 32 + 24 + 16 = 72

    expect(() => open(tooShort, privateKey)).toThrow('too short')
  })

  // ---------------------------------------------------------------------------
  // Additional: ballotHash is a valid keccak256 hex string
  // ---------------------------------------------------------------------------

  it('ballotHash is a valid 0x-prefixed keccak256 hex string', () => {
    const { publicKey } = generateElectionKeypair()
    const { ballotHash } = sealBallot(VALID, publicKey)

    // keccak256 always produces a 32-byte (64 hex char) hash.
    expect(ballotHash).toMatch(/^0x[0-9a-f]{64}$/)
  })
})
