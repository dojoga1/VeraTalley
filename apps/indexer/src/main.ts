/**
 * The event indexer.
 *
 * Owner: PT-1, Het. Week 2 work, not Week 1. The package exists now so that the
 * workspace shape is settled and nobody has to invent a home for it later.
 *
 * What it will do: watch `BallotCast` on every election the factory knows
 * about, write each one into PostgreSQL, and record how far it has read in
 * `IndexerState` so a restart resumes instead of starting over.
 *
 * Three things to get right when you build it, because they are the ones that
 * bite in production rather than in testing:
 *
 *   1. Backfill and live-follow are the same code path. Read from
 *      `lastProcessedBlock` to head in batches, then keep going. Writing them
 *      separately means two things to keep correct.
 *   2. Writes must be idempotent. Chain reorganisations replay blocks, and the
 *      indexer will be restarted mid-batch more than once. Upsert on
 *      (electionAddress, sequence), which is unique for exactly this reason.
 *   3. Advance `lastProcessedBlock` only after the batch has committed. The
 *      other order silently loses ballots on a crash, and you find out weeks
 *      later when a turnout number does not match the explorer.
 */

console.log('Indexer is not implemented yet. Week 2, PT-1.')
