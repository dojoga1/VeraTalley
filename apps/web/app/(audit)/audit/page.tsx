import Link from 'next/link'

import {
  getElectionAddresses,
  getElectionBallotCount,
  getElectionEndTime,
  getElectionName,
  getElectionPublicKey,
  getElectionStartTime,
  getElectionStatus,
} from '@/lib/audit'

export default async function AuditPage() {
  const electionAddresses = await getElectionAddresses()

  const elections = await Promise.all(
    electionAddresses.map(async (address) => {
      const [
        name,
        isVotingOpen,
        startTime,
        endTime,
        ballotCount,
        publicKey,
      ] = await Promise.all([
        getElectionName(address),
        getElectionStatus(address),
        getElectionStartTime(address),
        getElectionEndTime(address),
        getElectionBallotCount(address),
        getElectionPublicKey(address),
      ])

      const now = Math.floor(Date.now() / 1000)

      let displayStatus = 'Ended'

      if (now < Number(startTime)) {
        displayStatus = 'Upcoming'
      } else if (now <= Number(endTime)) {
        displayStatus = 'Open'
      }

      return {
        address,
        name,
        isVotingOpen,
        startTime,
        endTime,
        ballotCount,
        publicKey,
        displayStatus,
      }
    }),
  )

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold">
        Public Audit Dashboard
      </h1>

      <p className="mt-4">
        Found {elections.length} election(s).
      </p>

      <div className="mt-6 space-y-4">
        {elections.map((election) => (
          <div
            key={election.address}
            className="rounded-lg border border-gray-300 p-5 shadow-sm"
          >
            <h2 className="text-xl font-semibold">
              <Link
                href={`/audit/${election.address}`}
                className="underline"
              >
                {election.name}
              </Link>
            </h2>

            <p className="mt-2 break-all text-sm font-mono">
              <strong>Contract Address:</strong>
              <br />

              <a
                href={`https://amoy.polygonscan.com/address/${election.address}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                {election.address}
              </a>
            </p>

            <p className="mt-3">
              <strong>Status:</strong>{' '}
              {election.displayStatus === 'Open'
                ? '🟢 Open'
                : election.displayStatus === 'Upcoming'
                  ? '🟡 Upcoming'
                  : '🔴 Ended'}
            </p>

            <p className="mt-2">
              <strong>Start Time:</strong>{' '}
              {new Date(
                Number(election.startTime) * 1000,
              ).toLocaleString()}
            </p>

            <p className="mt-2">
              <strong>End Time:</strong>{' '}
              {new Date(
                Number(election.endTime) * 1000,
              ).toLocaleString()}
            </p>

            <p className="mt-2">
              <strong>Ballots:</strong>{' '}
              {Number(election.ballotCount)}
            </p>

            <p className="mt-2 break-all text-xs font-mono">
              <strong>Public Key:</strong>
              <br />
              {election.publicKey}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}