'use client'

import { useReadContract, useAccount, useConnect } from 'wagmi'

import { electionAbi } from '../../../../../../packages/contracts/abi'
import { useParams } from 'next/navigation'

export default function ElectionDetailsPage() {
  const params = useParams()
  const address = params.address as `0x${string}`

  const { address: walletAddress, isConnected } = useAccount()

  const { connectors, connect } = useConnect()

  const { data: name } = useReadContract({
    address,
    abi: electionAbi,
    functionName: 'name',
    chainId: 80002,
  })

  const { data: startTime } = useReadContract({
    address,
    abi: electionAbi,
    functionName: 'startTime',
    chainId: 80002,
  })

  const { data: endTime } = useReadContract({
    address,
    abi: electionAbi,
    functionName: 'endTime',
    chainId: 80002,
  })

  const { data: isRegistered, isLoading: registrationLoading } = useReadContract({
    address,
    abi: electionAbi,
    functionName: 'isRegistered',
    args: walletAddress ? [walletAddress] : undefined,
    chainId: 80002,
    query: {
      enabled: !!walletAddress,
    },
  })

  let status = 'Loading...'

  if (startTime && endTime) {
    const now = Math.floor(Date.now() / 1000)
    const start = Number(startTime)
    const end = Number(endTime)

    if (now < start) {
      status = 'Upcoming'
    } else if (now >= start && now <= end) {
      status = 'Open'
    } else {
      status = 'Closed'
    }
  }

  return (
    <main>
      <h1>Election Details</h1>

      <div
        style={{
          border: '1px solid #ccc',
          padding: '16px',
          marginTop: '16px',
          borderRadius: '8px',
        }}
      >
        <h2>{name ?? 'Loading...'}</h2>

        <p>Status: {status}</p>

        <p>
          Start Time:
          <br />
          {startTime ? new Date(Number(startTime) * 1000).toLocaleString() : 'Loading...'}
        </p>

        <p>
          End Time:
          <br />
          {endTime ? new Date(Number(endTime) * 1000).toLocaleString() : 'Loading...'}
        </p>

        <p>
          Contract Address:
          <br />
          {address}
        </p>

        <hr />

        <h3>Voter Wallet</h3>

        {isConnected ? (
          <>
            <p>
              Connected Wallet:
              <br />
              {walletAddress}
            </p>

            <p>
              Registration Status:
              <br />
              {registrationLoading
                ? 'Checking...'
                : isRegistered
                  ? 'Registered ✅'
                  : 'Not Registered ❌'}
            </p>
          </>
        ) : (
          <button
            onClick={() => {
              const connector = connectors[0]
              if (!connector) return
              connect({ connector })
            }}
            disabled={!connectors.length}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: connectors.length ? '#2563eb' : '#9ca3af',
              color: 'white',
              border: 'none',
              cursor: connectors.length ? 'pointer' : 'not-allowed',
              fontWeight: '600',
            }}
          >
            {connectors.length ? 'Connect Wallet' : 'No Wallet Available'}
          </button>
        )}
      </div>
    </main>
  )
}
