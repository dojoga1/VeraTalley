#!/usr/bin/env node
/**
 * Reads a deployed factory over RPC and writes what it finds to
 * `deployments/<network>.json`.
 *
 *   node scripts/record-deployment.js <network> <factoryAddress> [rpcUrl]
 *
 * For example, after deploying the weekend stub:
 *
 *   node scripts/record-deployment.js amoy 0xABC... "$RPC_URL_AMOY"
 *
 * Two reasons this is a script rather than something done by hand.
 *
 * It reads the elections back off the chain rather than trusting whatever the
 * deploy printed, so the recorded file describes what is actually deployed. A
 * deployment record that was typed out is a deployment record that is wrong the
 * first time somebody makes a typo, and it is read by three other people.
 *
 * And it is the same command for the stub on Sunday and for the real factory in
 * VT-112 on Thursday, so the step that matters is not being improvised on the
 * day.
 *
 * The RPC URL is read from the argument or from RPC_URL_AMOY. It is never
 * written into the output file, because it carries a provider key.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const [, , network, factoryAddress, rpcArg] = process.argv

if (!network || !factoryAddress) {
  console.error('Usage: node scripts/record-deployment.js <network> <factoryAddress> [rpcUrl]')
  process.exit(1)
}

if (!/^0x[0-9a-fA-F]{40}$/.test(factoryAddress)) {
  console.error(`Not a valid address: ${factoryAddress}`)
  process.exit(1)
}

const DEFAULT_RPC = { localhost: 'http://127.0.0.1:8545', hardhat: 'http://127.0.0.1:8545' }
const rpcUrl = rpcArg ?? process.env.RPC_URL_AMOY ?? DEFAULT_RPC[network]

if (!rpcUrl) {
  console.error(`No RPC URL. Pass one as the third argument, or set RPC_URL_AMOY.`)
  process.exit(1)
}

let nextId = 1

async function rpc(method, params) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params }),
  })

  if (!response.ok) throw new Error(`RPC ${method} failed: HTTP ${response.status}`)

  const body = await response.json()
  if (body.error) throw new Error(`RPC ${method} failed: ${body.error.message}`)

  return body.result
}

const call = (to, data) => rpc('eth_call', [{ to, data }, 'latest'])

/** Four byte function selectors, so this script needs no ABI file. */
const SELECTOR = {
  getElections: '0x9f3a7f52',
  electionCount: '0x997d2830',
  owner: '0x8da5cb5b',
  name: '0x06fdde03',
  startTime: '0x78e97925',
  endTime: '0x3197cbb6',
}

const decodeAddress = (word) => `0x${word.slice(-40)}`
const decodeUint = (word) => BigInt(`0x${word}`)

function words(hex) {
  const body = hex.slice(2)
  const out = []
  for (let i = 0; i < body.length; i += 64) out.push(body.slice(i, i + 64))
  return out
}

/** Decode a single dynamic `string` return value. */
function decodeString(hex) {
  const w = words(hex)
  const length = Number(decodeUint(w[1] ?? '0'))
  const data = w.slice(2).join('')
  return Buffer.from(data.slice(0, length * 2), 'hex').toString('utf8')
}

/** Decode an `address[]` return value. */
function decodeAddressArray(hex) {
  const w = words(hex)
  const length = Number(decodeUint(w[1] ?? '0'))
  return w.slice(2, 2 + length).map(decodeAddress)
}

function statusOf(startTime, endTime, now) {
  if (now < startTime) return 'upcoming'
  if (now >= endTime) return 'closed'
  return 'open'
}

const chainId = Number(decodeUint((await rpc('eth_chainId', [])).slice(2)))
const blockNumber = decodeUint((await rpc('eth_blockNumber', [])).slice(2))
const now = Math.floor(Date.now() / 1000)

const owner = decodeAddress(await call(factoryAddress, SELECTOR.owner))
const count = Number(decodeUint((await call(factoryAddress, SELECTOR.electionCount)).slice(2)))
const addresses = decodeAddressArray(await call(factoryAddress, SELECTOR.getElections))

const elections = []
for (const address of addresses) {
  const name = decodeString(await call(address, SELECTOR.name))
  const startTime = Number(decodeUint((await call(address, SELECTOR.startTime)).slice(2)))
  const endTime = Number(decodeUint((await call(address, SELECTOR.endTime)).slice(2)))

  elections.push({
    address,
    name,
    startTime,
    endTime,
    startTimeIso: new Date(startTime * 1000).toISOString(),
    endTimeIso: new Date(endTime * 1000).toISOString(),
    statusAtRecording: statusOf(startTime, endTime, now),
  })
}

const record = {
  network,
  chainId,
  factory: factoryAddress,
  owner,
  // True until VT-112 swaps in the real contracts. Read by nothing: it is here
  // so a human opening this file knows what they are looking at.
  isStub: undefined,
  recordedAtBlock: blockNumber.toString(),
  recordedAt: new Date().toISOString(),
  electionCount: count,
  elections,
}

record.isStub = process.env.VERATALLEY_STUB === '1'

const outputDir = join(packageRoot, 'deployments')
const outputFile = join(outputDir, `${network}.json`)

mkdirSync(outputDir, { recursive: true })
writeFileSync(outputFile, `${JSON.stringify(record, null, 2)}\n`, 'utf8')

console.log(`Recorded ${count} election(s) to deployments/${network}.json`)
for (const e of elections) {
  console.log(`  ${e.statusAtRecording.padEnd(8)} ${e.address}  ${e.name}`)
}
