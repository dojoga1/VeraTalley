/**
 * VT-112 — end-to-end proof: seal a ballot, cast it on a public chain, read it
 * back FROM THE CHAIN, decrypt it, and assert the round trip is byte-identical.
 *
 * This is the whole premise of VeraTalley in one script: a ballot is encrypted
 * in the browser, recorded on a public blockchain where anyone can confirm it
 * was cast but nobody can read it, and decrypted correctly at tally time to
 * recover exactly what the voter chose. It doubles as a worked example for
 * whoever continues the project.
 *
 * It reads all of its inputs from the environment so it hard-codes no secrets:
 *
 *   RPC_URL_AMOY          provider endpoint for Polygon Amoy
 *   DEPLOYER_PRIVATE_KEY  the wallet that sends the castBallot transaction
 *   ELECTION_ADDRESS      the open election to vote in
 *   ELECTION_PUBLIC_KEY   the election's X25519 public key  (0x-hex, 32 bytes)
 *   ELECTION_PRIVATE_KEY  the election's X25519 private key (0x-hex, 32 bytes)
 *
 * Run it:
 *   npx tsx scripts/cast-and-verify.ts
 *
 * Exit code 0 means the full pipeline verified; non-zero means it did not.
 */

import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  hexToBytes,
  keccak256,
  parseEventLogs,
  toHex,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { canonicalJson, open, sealBallot, sortBallot, type Ballot } from '@veratalley/ballot'

import { electionAbi } from '../abi/index.js'

// ---------------------------------------------------------------------------
// Config from the environment
// ---------------------------------------------------------------------------

function required(name: string): string {
  const value = process.env[name]
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const RPC_URL = required('RPC_URL_AMOY')
const DEPLOYER_PRIVATE_KEY = required('DEPLOYER_PRIVATE_KEY') as Hex
const ELECTION_ADDRESS = required('ELECTION_ADDRESS') as Hex
const ELECTION_PUBLIC_KEY = required('ELECTION_PUBLIC_KEY') as Hex
const ELECTION_PRIVATE_KEY = required('ELECTION_PRIVATE_KEY') as Hex

const EXPLORER = 'https://amoy.polygonscan.com'

const amoy = defineChain({
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: 'PolygonScan', url: EXPLORER } },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomNonce(): Hex {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY)
  const publicClient = createPublicClient({ chain: amoy, transport: http(RPC_URL) })
  const walletClient = createWalletClient({ account, chain: amoy, transport: http(RPC_URL) })

  console.log('Voter (deployer):', account.address)
  console.log('Election:        ', ELECTION_ADDRESS)

  // --- Step 1: build the ballot in the frozen schema --------------------------
  const ballot: Ballot = {
    schema: 'veratalley.ballot/1',
    chainId: 80002,
    election: ELECTION_ADDRESS,
    contests: [
      { id: 1, method: 'plurality', selections: [2] },
      { id: 2, method: 'approval', selections: [0, 3] },
      { id: 3, method: 'binary', selections: [1] },
    ],
    nonce: randomNonce(),
  }

  // --- Step 2: seal it --------------------------------------------------------
  const { ciphertext, ballotHash } = sealBallot(ballot, hexToBytes(ELECTION_PUBLIC_KEY))
  console.log('\nSealed ballot:', ciphertext.length, 'bytes, hash', ballotHash)

  // --- Step 3: cast it on chain ----------------------------------------------
  console.log('\nSending castBallot...')
  const txHash = await walletClient.writeContract({
    address: ELECTION_ADDRESS,
    abi: electionAbi,
    functionName: 'castBallot',
    args: [toHex(ciphertext)],
  })

  // --- Step 4: receipt + BallotCast event ------------------------------------
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  const events = parseEventLogs({ abi: electionAbi, eventName: 'BallotCast', logs: receipt.logs })
  if (events.length !== 1) {
    throw new Error(`Expected exactly one BallotCast event, got ${events.length}`)
  }
  const event = events[0]!.args as {
    voter: Hex
    ballotHash: Hex
    sequence: number
    castAt: bigint
    ciphertext: Hex
  }

  console.log('\n--- Receipt ---')
  console.log('Transaction:', txHash)
  console.log('Explorer:   ', `${EXPLORER}/tx/${txHash}`)
  console.log('Block:      ', receipt.blockNumber.toString())
  console.log('Ballot hash:', event.ballotHash)
  console.log('Sequence:   ', event.sequence)
  console.log('Cast at:    ', new Date(Number(event.castAt) * 1000).toISOString())

  // --- Step 5: read the ciphertext back FROM THE CHAIN, not local memory ------
  const onChainCiphertextHex = event.ciphertext
  const onChainCiphertext = hexToBytes(onChainCiphertextHex)

  // --- Step 6: decrypt with the election private key --------------------------
  const decrypted = open(onChainCiphertext, hexToBytes(ELECTION_PRIVATE_KEY))

  // --- Step 7: assert byte-identical to what we sealed ------------------------
  const expected = canonicalJson(sortBallot(ballot))
  const roundTripOk = bytesEqual(decrypted, expected)
  const hashOk =
    keccak256(onChainCiphertextHex) === event.ballotHash && event.ballotHash === ballotHash

  console.log('\n--- Verification ---')
  console.log('Ciphertext read back from the chain event log:', onChainCiphertext.length, 'bytes')
  console.log('keccak256 matches on-chain ballotHash:        ', hashOk ? 'yes' : 'NO')
  console.log('Decrypted ballot byte-identical to sealed:    ', roundTripOk ? 'yes' : 'NO')

  if (roundTripOk && hashOk) {
    console.log('\nRESULT: PASS — the full encrypt → chain → decrypt pipeline is verified.')
    console.log('Decrypted plaintext:', new TextDecoder().decode(decrypted))
  } else {
    console.log('\nRESULT: FAIL')
    process.exitCode = 1
  }
}

main().catch((error: unknown) => {
  console.error('\nRESULT: FAIL —', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
