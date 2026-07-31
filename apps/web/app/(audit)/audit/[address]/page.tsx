import { notFound } from 'next/navigation'

import {
  getElectionAddresses,
  getElectionBallotCount,
  getElectionEndTime,
  getElectionName,
  getElectionStartTime,
} from '@/lib/audit'

type AuditElectionPageProps = {
  params: Promise<{
    address: string
  }>
}

export default async function AuditElectionPage({
  params,
}: AuditElectionPageProps) {
  const { address } = await params

  const electionAddresses = await getElectionAddresses()

  const electionAddress = electionAddresses.find(
    (item) => item.toLowerCase() === address.toLowerCase(),
  )

  if (!electionAddress) {
    notFound()
  }

  const [name, startTime, endTime, ballotCount] = await Promise.all([
    getElectionName(electionAddress),
    getElectionStartTime(electionAddress),
    getElectionEndTime(electionAddress),
    getElectionBallotCount(electionAddress),
  ])

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold">{name}</h1>

      {/* Election Details */}
      <div className="mt-6 space-y-4 rounded-lg border p-5">
        <p>
          <strong>Start Time:</strong>{' '}
          {new Date(Number(startTime) * 1000).toLocaleString()}
        </p>

        <p>
          <strong>End Time:</strong>{' '}
          {new Date(Number(endTime) * 1000).toLocaleString()}
        </p>

        <p>
          <strong>Current Turnout:</strong>{' '}
          {Number(ballotCount)} ballots
        </p>

        <p className="break-all">
          <strong>Contract Address:</strong>
          <br />
          <a
            href={`https://amoy.polygonscan.com/address/${electionAddress}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {electionAddress}
          </a>
        </p>
      </div>

      {/* Verify Panel */}
      <section className="mt-6 rounded-lg border border-blue-300 bg-blue-50 p-5">
        <h2 className="text-xl font-semibold">
          Verify this yourself
        </h2>

        <p className="mt-3">
          You do not have to trust this dashboard. All election information is
          stored on the Polygon blockchain and can be verified independently.
        </p>

        <p className="mt-2">
          Open the contract events below and compare the blockchain records with
          the information displayed on this page.
        </p>

        <a
          href={`https://amoy.polygonscan.com/address/${electionAddress}#events`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-blue-700 underline"
        >
          View Contract Events on PolygonScan →
        </a>
      </section>

      {/* Ballot Log */}
      <section className="mt-6">
        <h2 className="mb-4 text-xl font-semibold">Ballot Log</h2>

        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Sequence</th>
                <th className="border px-4 py-2 text-left">Ballot Hash</th>
                <th className="border px-4 py-2 text-left">Time</th>
                <th className="border px-4 py-2 text-left">Transaction</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No ballot events available yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}