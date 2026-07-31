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
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  await prisma.election.upsert({
    where: {
      address: '0x1111111111111111111111111111111111111111',
    },
    update: {},
    create: {
      address: '0x1111111111111111111111111111111111111111',
      name: 'Student Council Election',
      startTime: new Date('2026-08-01T09:00:00Z'),
      endTime: new Date('2026-08-07T17:00:00Z'),
      publicKey: 'public-key-election-1',
      createdAtBlock: '100000',
    },
  })

  await prisma.election.upsert({
    where: {
      address: '0x2222222222222222222222222222222222222222',
    },
    update: {},
    create: {
      address: '0x2222222222222222222222222222222222222222',
      name: 'Board Member Election',
      startTime: new Date('2026-09-01T09:00:00Z'),
      endTime: new Date('2026-09-10T17:00:00Z'),
      publicKey: 'public-key-election-2',
      createdAtBlock: '200000',
    },
  })

  console.log('✅ Seeded elections')

  for (let i = 1; i <= 10; i++) {
    await prisma.voter.upsert({
      where: {
        electionAddress_walletAddress: {
          electionAddress: "0x1111111111111111111111111111111111111111",
          walletAddress: `0x10000000000000000000000000000000000000${i.toString().padStart(2, "0")}`,
        },
      },
      update: {},
      create: {
        electionAddress: "0x1111111111111111111111111111111111111111",
        walletAddress: `0x10000000000000000000000000000000000000${i.toString().padStart(2, "0")}`,
        registeredAtBlock: "100000",
        revokedAtBlock: null,
      },
    })
  }

  for (let i = 1; i <= 10; i++) {
    await prisma.voter.upsert({
      where: {
        electionAddress_walletAddress: {
          electionAddress: "0x2222222222222222222222222222222222222222",
          walletAddress: `0x20000000000000000000000000000000000000${i.toString().padStart(2, "0")}`,
        },
      },
      update: {},
      create: {
        electionAddress: "0x2222222222222222222222222222222222222222",
        walletAddress: `0x20000000000000000000000000000000000000${i.toString().padStart(2, "0")}`,
        registeredAtBlock: "200000",
        revokedAtBlock: null,
      },
    })
  }

  console.log("✅ Seeded voters")

}



main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })