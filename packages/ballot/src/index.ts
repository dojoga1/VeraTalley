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

import { keccak256, toHex } from 'viem'

import { canonicalJson } from './canonical'
import { orderedBallotSchema, sortBallot } from './schema'
import type { Ballot } from './schema'
import { seal } from './seal'

export {
  ballotSchema,
  contestMethodSchema,
  contestSelectionSchema,
  orderedBallotSchema,
  sortBallot,
  CONTEST_METHODS,
} from './schema'

export type { Ballot, ContestMethod, ContestSelection } from './schema'

export { canonicalJson } from './canonical'
export { generateElectionKeypair, seal, open } from './seal'

/**
 * The public entry point for sealing a ballot.
 *
 * This is the function Niharika's Voter App calls in Week 2. She passes
 * a `Ballot` object and the election public key; she gets back opaque
 * ciphertext and a keccak256 hash of that ciphertext (which goes on-chain
 * as the ballot's identifier).
 *
 * Internally this:
 * 1. Validates the ballot against the ordered schema (throws if invalid).
 * 2. Sorts contests and selections into canonical order.
 * 3. Serialises to canonical JSON bytes (RFC 8785).
 * 4. Seals with X25519 + XChaCha20-Poly1305.
 * 5. Hashes the ciphertext with keccak256 for the on-chain reference.
 *
 * @param ballot           - A valid ballot object.
 * @param electionPublicKey - The election's X25519 public key (32 bytes).
 * @returns `ciphertext` (sealed bytes) and `ballotHash` (keccak256 hex).
 */
export function sealBallot(
  ballot: Ballot,
  electionPublicKey: Uint8Array,
): { ciphertext: Uint8Array; ballotHash: `0x${string}` } {
  // Step 1: Validate. This catches malformed ballots, out-of-order contests,
  // overvotes in plurality/binary, etc. Throwing here is intentional — the
  // caller should never be sealing an invalid ballot.
  orderedBallotSchema.parse(sortBallot(ballot))

  // Step 2: Sort into canonical order so that canonicalJson produces
  // deterministic output regardless of the order the caller built the object.
  const sorted = sortBallot(ballot)

  // Step 3: Canonical JSON → bytes.
  const plaintext = canonicalJson(sorted)

  // Step 4: Seal. Each call generates a fresh ephemeral keypair, so the
  // ciphertext is always different even for identical ballots.
  const ciphertext = seal(plaintext, electionPublicKey)

  // Step 5: Hash the ciphertext for on-chain storage.
  // `toHex` converts Uint8Array to a 0x-prefixed hex string, which is what
  // viem's keccak256 expects. We use keccak256 rather than SHA-256 because
  // the hash must match what Solidity computes on-chain.
  const ballotHash = keccak256(toHex(ciphertext))

  return { ciphertext, ballotHash }
}
