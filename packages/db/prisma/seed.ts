/**
 * Seed data for local development.
 *
 * VT-109, Het (PT-1) fills this in: two fake elections and twenty fake ballots,
 * so that the frontend team has something to build against before anything is
 * deployed to Amoy.
 *
 * The one requirement that is easy to miss: running this twice must not error
 * and must not duplicate. Use `upsert` with a deterministic id rather than
 * `create`, because everyone will run it more than once.
 */

async function main() {
  console.log('Seed script is not implemented yet. See VT-109.')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
