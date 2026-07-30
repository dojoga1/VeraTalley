import { describe, expect, it } from 'vitest'

import { canonicalJson } from './canonical'
import { sortBallot, type Ballot } from './schema'

/**
 * Helper: build a random valid ballot for property-based testing.
 *
 * We vary the number of contests (1–5), the contest method, and the
 * selections, but always produce structurally valid ballots. The goal is
 * to exercise canonicalJson over a range of shapes, not just one hardcoded
 * example.
 */
function randomBallot(): Ballot {
  const contestCount = 1 + Math.floor(Math.random() * 5)
  const methods = ['plurality', 'approval', 'binary'] as const

  const contests = Array.from({ length: contestCount }, (_, i) => {
    const method = methods[Math.floor(Math.random() * methods.length)]!
    let selections: number[]
    if (method === 'plurality' || method === 'binary') {
      // At most one selection for these methods.
      selections = Math.random() > 0.3 ? [Math.floor(Math.random() * 10)] : []
    } else {
      // Approval: 0–4 unique selections.
      const count = Math.floor(Math.random() * 5)
      const pool = new Set<number>()
      while (pool.size < count) pool.add(Math.floor(Math.random() * 20))
      selections = [...pool].sort((a, b) => a - b)
    }
    return { id: i + 1, method, selections }
  })

  // Random 32-byte nonce as 0x-prefixed hex.
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

describe('canonicalJson', () => {
  it('produces byte-identical output for objects with same content but different key order', () => {
    // Manually construct two objects with the same data but different
    // property insertion order. RFC 8785 sorts keys, so the output must
    // match regardless of insertion order.
    const a = { z: 1, a: 2, m: 3 }
    const b = { a: 2, m: 3, z: 1 }

    const bytesA = canonicalJson(a)
    const bytesB = canonicalJson(b)

    expect(bytesA).toEqual(bytesB)
    // Also verify the keys are actually sorted in the output string.
    const json = new TextDecoder().decode(bytesA)
    expect(json).toBe('{"a":2,"m":3,"z":1}')
  })

  it('produces identical bytes for selections [1,4] vs [4,1] after sorting', () => {
    const ballot1: Ballot = {
      schema: 'veratalley.ballot/1',
      chainId: 80002,
      election: '0x9f2cB1a4E7d80C3F5a19b6D2e4Af07C3d8B41c02',
      contests: [{ id: 1, method: 'approval', selections: [1, 4] }],
      nonce: '0x' + '00'.repeat(32),
    }

    const ballot2: Ballot = {
      ...ballot1,
      contests: [{ id: 1, method: 'approval', selections: [4, 1] }],
    }

    // sortBallot normalises selection order, then canonicalJson serialises.
    const bytes1 = canonicalJson(sortBallot(ballot1))
    const bytes2 = canonicalJson(sortBallot(ballot2))

    expect(bytes1).toEqual(bytes2)
  })

  it('produces identical output for 20 randomly generated ballots with shuffled keys', () => {
    for (let i = 0; i < 20; i++) {
      const ballot = sortBallot(randomBallot())

      // Canonical bytes from the original object.
      const original = canonicalJson(ballot)

      // Build a copy with reversed key order. Object.entries + reverse +
      // Object.fromEntries gives us a structurally identical object whose
      // internal property order differs.
      const reversed = Object.fromEntries(Object.entries(ballot).reverse()) as unknown as Ballot

      const shuffled = canonicalJson(reversed)

      expect(shuffled).toEqual(original)
    }
  })

  it('throws for undefined input', () => {
    expect(() => canonicalJson(undefined)).toThrow('not JSON-serialisable')
  })
})
