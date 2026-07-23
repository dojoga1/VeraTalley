import { describe, expect, it } from 'vitest'

import { ballotSchema, orderedBallotSchema, sortBallot, type Ballot } from './schema'

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

describe('ballotSchema', () => {
  it('accepts the worked example from the handbook', () => {
    expect(ballotSchema.parse(VALID)).toEqual(VALID)
  })

  it('rejects a nonce that is not 32 bytes', () => {
    expect(() => ballotSchema.parse({ ...VALID, nonce: '0xdeadbeef' })).toThrow()
  })

  it('rejects an election that is not an address', () => {
    expect(() => ballotSchema.parse({ ...VALID, election: 'not-an-address' })).toThrow()
  })

  it('rejects an unknown schema version', () => {
    expect(() => ballotSchema.parse({ ...VALID, schema: 'veratalley.ballot/2' })).toThrow()
  })
})

describe('orderedBallotSchema', () => {
  it('accepts a correctly ordered ballot', () => {
    expect(orderedBallotSchema.parse(VALID)).toEqual(VALID)
  })

  it('rejects contests that are out of order', () => {
    const scrambled = { ...VALID, contests: [...VALID.contests].reverse() }
    expect(() => orderedBallotSchema.parse(scrambled)).toThrow()
  })

  it('rejects selections that are out of order', () => {
    const scrambled: Ballot = {
      ...VALID,
      contests: [
        VALID.contests[0]!,
        { id: 2, method: 'approval', selections: [4, 1] },
        VALID.contests[2]!,
      ],
    }
    expect(() => orderedBallotSchema.parse(scrambled)).toThrow()
  })

  it('rejects more than one selection in a plurality contest', () => {
    const overvoted: Ballot = {
      ...VALID,
      contests: [{ id: 1, method: 'plurality', selections: [1, 2] }],
    }
    expect(() => orderedBallotSchema.parse(overvoted)).toThrow()
  })
})

describe('sortBallot', () => {
  it('puts a scrambled ballot into canonical order', () => {
    const scrambled: Ballot = {
      ...VALID,
      contests: [
        { id: 3, method: 'binary', selections: [0] },
        { id: 2, method: 'approval', selections: [4, 1] },
        { id: 1, method: 'plurality', selections: [3] },
      ],
    }

    expect(sortBallot(scrambled)).toEqual(VALID)
  })

  it('produces something the ordered schema accepts', () => {
    const scrambled: Ballot = { ...VALID, contests: [...VALID.contests].reverse() }
    expect(() => orderedBallotSchema.parse(sortBallot(scrambled))).not.toThrow()
  })
})
