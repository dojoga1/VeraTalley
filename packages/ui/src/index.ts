/**
 * The shared design system.
 *
 * VT-106 (Sakshi, AT-3) fills this in: shadcn/ui components themed with the
 * project tokens, plus StatusBadge, AddressChip and EmptyState, all shown on
 * the `/design` route.
 *
 * One rule, and CI is not what enforces it, you are: nothing in this package
 * may import from `apps/web`. The dependency goes one way only. The moment it
 * goes both ways, neither can be built or tested on its own.
 */

/** Election lifecycle status, shared by the voter app and the audit dashboard. */
export type ElectionStatus = 'upcoming' | 'open' | 'closed'

/**
 * Work out an election's status from its window.
 *
 * The window is [startTime, endTime): an election that ends at 17:00:00 is
 * closed at 17:00:00 exactly. This matches `isVotingOpen()` on the contract,
 * and the two must not drift apart, or the UI will offer a vote the chain
 * rejects.
 *
 * @param startTime unix seconds, inclusive
 * @param endTime   unix seconds, exclusive
 * @param now       unix seconds, defaults to the current time
 */
export function electionStatus(
  startTime: number,
  endTime: number,
  now: number = Math.floor(Date.now() / 1000),
): ElectionStatus {
  if (now < startTime) return 'upcoming'
  if (now >= endTime) return 'closed'
  return 'open'
}

/**
 * Shorten a wallet address for display, as `0x4d1a...3e57`.
 *
 * Always render the shortened form next to a copy action that copies the full
 * address. A truncated address that cannot be recovered is worse than useless
 * when someone is trying to check a receipt.
 */
export function shortenAddress(address: string, leading = 6, trailing = 4): string {
  if (address.length <= leading + trailing) return address
  return `${address.slice(0, leading)}...${address.slice(-trailing)}`
}
