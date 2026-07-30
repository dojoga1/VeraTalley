/**
 * Ballot sealing.
 *
 * Owner: BT-3, Utkarsh. VT-111, Week 1.
 *
 * The schema in `./schema` is written and frozen, because the Voter App builds
 * against it from Week 2 and the tally tool reads it in Week 4. The rest of the
 * library is VT-111:
 *
 *   canonical.ts  canonicalJson(ballot): Uint8Array, RFC 8785. Wrap the
 *                 `canonicalize` package rather than writing it yourself.
 *   seal.ts       generateElectionKeypair, seal, open. X25519 from
 *                 `@noble/curves`, XChaCha20-Poly1305 from `@noble/ciphers`.
 *   index.ts      sealBallot(ballot, electionPublicKey) returning
 *                 { ciphertext, ballotHash }, with keccak256 from viem.
 *
 * All four dependencies are already installed, so `pnpm install` is all you
 * need before starting.
 *
 * This is scheduled in Week 1 rather than Week 4 on purpose. It is the riskiest
 * piece in the plan, and if it turns out harder than expected we want to know
 * with four weeks left rather than one. It also has no dependencies at all: no
 * chain, no database, no UI, pure TypeScript.
 *
 * Until it lands the project runs with the ballot unsealed. That fallback is
 * item 5 on the cut list and needs Bhargav's sign off, and it is exactly why
 * the on-chain interface takes opaque bytes: turning sealing on changes nothing
 * for the other three teams.
 */

export {
  ballotSchema,
  contestMethodSchema,
  contestSelectionSchema,
  orderedBallotSchema,
  sortBallot,
  CONTEST_METHODS,
} from './schema'

export type { Ballot, ContestMethod, ContestSelection } from './schema'
