/**
 * Ballot sealing.
 *
 * Owner: BT-3, Utkarsh. Week 2 brings the first cut of the encryption library,
 * Week 4 the tally tool.
 *
 * The schema in `./schema` is frozen now, because the Voter App builds against
 * it from Week 2 and the tally tool reads it in Week 4. `seal` and `canonical`
 * are not written yet, and until they are the project runs with the ballot
 * unsealed. That fallback is item 5 on the cut list and needs Bhargav's sign
 * off, which is exactly why the on-chain interface takes opaque bytes: turning
 * encryption on later changes nothing for the other three teams.
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
