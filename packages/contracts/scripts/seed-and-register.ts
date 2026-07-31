/**
 * VT-112 — seed the real factory with three elections and register the test
 * voters on the open one.
 *
 * The three lifecycle states (upcoming / open / closed) are what the frontend
 * tickets (VT-105, VT-108) render and test against.
 *
 * Timing note that matters: VoterRegistry.registerVoters reverts once
 * `block.timestamp >= startTime`, and castBallot needs `startTime <= now`. You
 * therefore cannot register and vote in the same instant. So the "open"
 * election is created starting a short buffer in the future; voters are
 * registered while it is still upcoming; then this script waits for the window
 * to open so the ballot can be cast immediately afterwards.
 *
 * Inputs from the environment:
 *   RPC_URL_AMOY, DEPLOYER_PRIVATE_KEY   the deploying/admin wallet
 *   FACTORY_ADDRESS                      the deployed ElectionFactory
 *   ELECTION_PUBLIC_KEY                  X25519 public key (0x-hex, 32 bytes)
 *
 *   npx tsx scripts/seed-and-register.ts
 */

import { createPublicClient, createWalletClient, defineChain, http, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { electionAbi, electionFactoryAbi } from '../abi/index.js'

function required(name: string): string {
  const v = process.env[name]
  if (v === undefined || v === '') throw new Error(`Missing required environment variable: ${name}`)
  return v
}

const RPC_URL = required('RPC_URL_AMOY')
const DEPLOYER_PRIVATE_KEY = required('DEPLOYER_PRIVATE_KEY') as Hex
const FACTORY_ADDRESS = required('FACTORY_ADDRESS') as Hex
const ELECTION_PUBLIC_KEY = required('ELECTION_PUBLIC_KEY') as Hex

const DAY = 86_400
const OPEN_BUFFER_SECONDS = 120 // how far ahead the open election starts

// The team members who sent their addresses, plus the deployer so it can vote.
const TEAM_VOTERS: Hex[] = [
  '0x814FCF38b8a17EF6B992e9A2Fa794cEB0c55881a', // Tirthesh Kode
  '0x292cEC3f1668750E17a9AbDF2f8831Bbbb41D623', // Niharika Yerra
  '0xAABE5c852137c4660A0a309f56e923fadA4A9C77', // Adarsh Rao
  '0x38627B4Cf65daF162087438e6E03dd4C3a8aDE40', // Varshitha Reddy Kondeti
  '0xF6C8cc0075b238d8b39e791e877Ff2E7B4f51deC', // Het Desai
]

const amoy = defineChain({
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com' } },
})

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main(): Promise<void> {
  const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY)
  const publicClient = createPublicClient({ chain: amoy, transport: http(RPC_URL) })
  const walletClient = createWalletClient({ account, chain: amoy, transport: http(RPC_URL) })

  const now = Math.floor(Date.now() / 1000)
  const openStart = now + OPEN_BUFFER_SECONDS

  const plan = [
    {
      label: 'upcoming',
      name: 'Riverside Ward Council, Autumn 2026',
      start: now + 7 * DAY,
      end: now + 14 * DAY,
    },
    { label: 'open', name: 'UTA Student Government 2026', start: openStart, end: now + 7 * DAY },
    {
      label: 'closed',
      name: 'Housing Society Committee, Summer 2026',
      start: now - 14 * DAY,
      end: now - 7 * DAY,
    },
  ]

  console.log('Factory:', FACTORY_ADDRESS)
  console.log('Admin:  ', account.address)

  // --- Task 4: create the three elections -----------------------------------
  for (const e of plan) {
    const hash = await walletClient.writeContract({
      address: FACTORY_ADDRESS,
      abi: electionFactoryAbi,
      functionName: 'createElection',
      args: [e.name, BigInt(e.start), BigInt(e.end), ELECTION_PUBLIC_KEY],
    })
    await publicClient.waitForTransactionReceipt({ hash })
    console.log(`  created ${e.label.padEnd(8)} "${e.name}"  (tx ${hash})`)
  }

  // Addresses in creation order: [upcoming, open, closed].
  const elections = (await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi: electionFactoryAbi,
    functionName: 'getElections',
  })) as Hex[]

  if (elections.length !== 3) throw new Error(`Expected 3 elections, got ${elections.length}`)
  const [upcoming, open, closed] = elections
  console.log('\nElection addresses:')
  console.log('  upcoming:', upcoming)
  console.log('  open:    ', open)
  console.log('  closed:  ', closed)

  // --- Task 5: register voters on the OPEN election (still upcoming for now) --
  const voters = [...TEAM_VOTERS, account.address]
  console.log(`\nRegistering ${voters.length} voters on the open election...`)
  const regHash = await walletClient.writeContract({
    address: open!,
    abi: electionAbi,
    functionName: 'registerVoters',
    args: [voters],
  })
  await publicClient.waitForTransactionReceipt({ hash: regHash })

  const registeredCount = await publicClient.readContract({
    address: open!,
    abi: electionAbi,
    functionName: 'registeredCount',
  })
  console.log('  registerVoters tx:', regHash)
  console.log('  registeredCount: ', registeredCount)
  if (Number(registeredCount) !== voters.length) {
    throw new Error(`registeredCount ${registeredCount} != expected ${voters.length}`)
  }

  // --- Wait until the open election's window actually opens ------------------
  console.log(`\nWaiting for the open election window (starts in ~${OPEN_BUFFER_SECONDS}s)...`)
  const deadline = Date.now() + 240_000
  for (;;) {
    const votingOpen = await publicClient.readContract({
      address: open!,
      abi: electionAbi,
      functionName: 'isVotingOpen',
    })
    if (votingOpen === true) break
    if (Date.now() > deadline) throw new Error('Timed out waiting for the voting window to open')
    await sleep(10_000)
  }
  console.log('  the open election is now accepting ballots.')

  // Emit machine-readable lines for the next step to pick up.
  console.log('\n=== RESULT ===')
  console.log(`UPCOMING_ELECTION=${upcoming}`)
  console.log(`OPEN_ELECTION=${open}`)
  console.log(`CLOSED_ELECTION=${closed}`)
}

main().catch((error: unknown) => {
  console.error('FAILED:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
