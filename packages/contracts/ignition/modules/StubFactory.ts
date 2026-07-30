import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

/**
 * Deploys the throwaway stub factory and seeds it with three elections, one in
 * each lifecycle state.
 *
 * Owner: Bhargav. Run once, over the weekend, before the team starts.
 *
 *   pnpm --filter @veratalley/contracts deploy:stub:amoy
 *
 * Why this exists: VT-105 (elections list) and VT-108 (audit dashboard) both
 * need a real factory address with real elections in it before they can build
 * anything. Without it, two frontend developers spend the first week of five
 * waiting on a contracts developer writing their first Solidity. Deploying this
 * on Sunday removes that dependency completely.
 *
 * The three states are chosen to match what those two issues test against:
 * VT-105 criterion 2 needs one Upcoming, one Open and one Closed, and VT-108
 * criterion 1 needs a list with a turnout figure.
 *
 * VT-112 replaces all of it on the Thursday of Week 1. Because the read
 * interface is identical, neither frontend issue changes a line when it does.
 *
 * Try it locally first, which needs no key and no network:
 *
 *   npx hardhat node                                         # one terminal
 *   pnpm --filter @veratalley/contracts deploy:stub:local     # another
 */

const DAY = 24 * 60 * 60

/**
 * Windows are computed from the clock at the moment the module is built, so two
 * runs produce different arguments and Ignition treats them as different
 * deployments. That is fine, and in fact wanted: this is deployed once by hand
 * and thrown away. Do not copy this pattern into `Factory.ts`, where a
 * reproducible deployment actually matters.
 *
 * Pass `--parameters` to pin the values if you ever need a repeatable run.
 */
const now = Math.floor(Date.now() / 1000)

// Any non-empty bytes. Nothing is ever sealed to these, and the stub cannot
// accept a ballot, so this is a placeholder and not a key anyone could misuse.
const PLACEHOLDER_KEY = `0x${'11'.repeat(32)}`

export default buildModule('StubFactoryModule', (m) => {
  const factory = m.contract('StubElectionFactory', [])

  // Starts in a week. Renders as `Upcoming`.
  const upcoming = m.call(
    factory,
    'createElection',
    [
      m.getParameter('upcomingName', 'Riverside Ward Council, Autumn 2026'),
      m.getParameter('upcomingStart', now + 7 * DAY),
      m.getParameter('upcomingEnd', now + 14 * DAY),
      PLACEHOLDER_KEY,
    ],
    { id: 'seedUpcoming' },
  )

  // Started yesterday, runs for another week. Renders as `Open`.
  const open = m.call(
    factory,
    'createElection',
    [
      m.getParameter('openName', 'UTA Student Government 2026'),
      m.getParameter('openStart', now - 1 * DAY),
      m.getParameter('openEnd', now + 6 * DAY),
      PLACEHOLDER_KEY,
    ],
    { id: 'seedOpen', after: [upcoming] },
  )

  // Ended last week. Renders as `Closed`.
  m.call(
    factory,
    'createElection',
    [
      m.getParameter('closedName', 'Housing Society Committee, Summer 2026'),
      m.getParameter('closedStart', now - 14 * DAY),
      m.getParameter('closedEnd', now - 7 * DAY),
      PLACEHOLDER_KEY,
    ],
    { id: 'seedClosed', after: [open] },
  )

  return { factory }
})
