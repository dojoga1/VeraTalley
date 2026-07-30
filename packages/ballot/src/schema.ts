import { z } from 'zod'

/**
 * The ballot data shape. One of the project's three frozen contracts.
 *
 * Owner: BT-3, Utkarsh. Read by the Voter App and by the tally tool.
 * FROZEN as of Monday 27 July 2026.
 *
 * The Voter App builds a value of this shape in the browser. It is then
 * canonicalised, sealed, and only the sealed bytes ever leave the machine.
 * Nothing on our servers ever sees the inside of one of these.
 */

export const CONTEST_METHODS = ['plurality', 'approval', 'binary'] as const

/** How a contest is decided. */
export const contestMethodSchema = z.enum(CONTEST_METHODS)
export type ContestMethod = z.infer<typeof contestMethodSchema>

/**
 * One question on the ballot and what the voter chose.
 *
 * `selections` holds option indexes, not labels. Labels can be reworded after
 * an election opens without invalidating a ballot already cast; indexes cannot,
 * and must never be reordered once voting has started.
 */
export const contestSelectionSchema = z.object({
  id: z.number().int().positive(),
  method: contestMethodSchema,
  selections: z.array(z.number().int().nonnegative()),
})
export type ContestSelection = z.infer<typeof contestSelectionSchema>

export const ballotSchema = z.object({
  /** Schema version. Bump it if the shape ever changes; never reuse a version. */
  schema: z.literal('veratalley.ballot/1'),

  /** Chain the ballot is bound to. 80002 is Polygon Amoy. */
  chainId: z.number().int().positive(),

  /** The election contract this ballot is for, checksummed. */
  election: z.string().regex(/^0x[0-9a-fA-F]{40}$/),

  /** One entry per question, sorted by `id` ascending. */
  contests: z.array(contestSelectionSchema),

  /**
   * 32 random bytes, as a 0x-prefixed hex string.
   *
   * Without this, two voters who chose identically would produce identical
   * ciphertext, and anyone could tell they voted the same way without
   * decrypting anything. This one field is the difference between real ballot
   * secrecy and the illusion of it. It is never optional and never reused.
   */
  nonce: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
})

export type Ballot = z.infer<typeof ballotSchema>

/**
 * Ordering rules that are part of the contract rather than suggestions.
 *
 * Canonicalisation only produces byte identical output if the input is already
 * in canonical order, so this runs before sealing, every time.
 */
export const orderedBallotSchema = ballotSchema
  .refine(
    (ballot) => ballot.contests.every((c, i) => i === 0 || c.id > ballot.contests[i - 1]!.id),
    { message: 'contests must be sorted by id, ascending, with no duplicates' },
  )
  .refine(
    (ballot) =>
      ballot.contests.every((c) =>
        c.selections.every((s, i) => i === 0 || s > c.selections[i - 1]!),
      ),
    { message: 'selections must be sorted ascending, with no duplicates' },
  )
  .refine(
    (ballot) => ballot.contests.every((c) => c.method !== 'binary' || c.selections.length <= 1),
    {
      message: 'a binary contest accepts at most one selection',
    },
  )
  .refine(
    (ballot) => ballot.contests.every((c) => c.method !== 'plurality' || c.selections.length <= 1),
    { message: 'a plurality contest accepts at most one selection' },
  )

/** Put a ballot into canonical order. Does not validate. */
export function sortBallot(ballot: Ballot): Ballot {
  return {
    ...ballot,
    contests: [...ballot.contests]
      .sort((a, b) => a.id - b.id)
      .map((contest) => ({
        ...contest,
        selections: [...contest.selections].sort((a, b) => a - b),
      })),
  }
}
