import { createPublicClient, http } from 'viem'
import { polygonAmoy } from 'viem/chains'

import { electionFactoryAbi, electionAbi } from '@veratalley/contracts/abi'
import { env } from '@/lib/env'

export const auditClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(process.env.RPC_URL_AMOY),
})

export async function getElectionAddresses() {
  if (!env.NEXT_PUBLIC_FACTORY_ADDRESS) {
    throw new Error('NEXT_PUBLIC_FACTORY_ADDRESS is not configured')
  }

  return auditClient.readContract({
    address: env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    abi: electionFactoryAbi,
    functionName: 'getElections',
  })
}

export async function getElectionName(address: `0x${string}`) {
  return auditClient.readContract({
    address,
    abi: electionAbi,
    functionName: 'name',
  })
}

export async function getElectionStatus(address: `0x${string}`) {
  return auditClient.readContract({
    address,
    abi: electionAbi,
    functionName: 'isVotingOpen',
  })
}

export async function getElectionStartTime(address: `0x${string}`) {
  return auditClient.readContract({
    address,
    abi: electionAbi,
    functionName: 'startTime',
  })
}

export async function getElectionEndTime(address: `0x${string}`) {
  return auditClient.readContract({
    address,
    abi: electionAbi,
    functionName: 'endTime',
  })
}

export async function getElectionBallotCount(address: `0x${string}`) {
  return auditClient.readContract({
    address,
    abi: electionAbi,
    functionName: 'ballotCount',
  })
}

export async function getElectionOwner(address: `0x${string}`) {
  return auditClient.readContract({
    address,
    abi: electionAbi,
    functionName: 'owner',
  })
}

export async function getElectionPublicKey(address: `0x${string}`) {
  return auditClient.readContract({
    address,
    abi: electionAbi,
    functionName: 'electionPublicKey',
  })
}

export async function getRegisteredCount(address: `0x${string}`) {
  return auditClient.readContract({
    address,
    abi: electionAbi,
    functionName: 'registeredCount',
  })
}