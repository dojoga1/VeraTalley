import { z } from 'zod'

/**
 * Runtime validation of the environment.
 *
 * The point of doing this here rather than reading `process.env` directly at
 * the point of use is that a missing or malformed variable fails once, loudly,
 * at startup, with a message that says which variable and what was wrong.
 * Reading it inline gives you `undefined` deep inside a wallet call an hour
 * later, and that is genuinely hard to trace back.
 *
 * Anything prefixed `NEXT_PUBLIC_` is compiled into the browser bundle and is
 * therefore public. Never put a secret behind that prefix.
 */

const addressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, 'must be a 20 byte hex address starting 0x')

const publicEnvSchema = z.object({
  NEXT_PUBLIC_CHAIN_ID: z.coerce.number().int().positive().default(80002),
  NEXT_PUBLIC_EXPLORER_URL: z.url().default('https://amoy.polygonscan.com'),
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),

  // Written by VT-103 once the factory is deployed to Amoy. Optional until then
  // so that the skeleton runs before any contract exists.
  NEXT_PUBLIC_FACTORY_ADDRESS: addressSchema.optional(),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>

/**
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time only when it is
 * written out in full, so these cannot be looked up dynamically.
 */
function readPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  })

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(`Invalid public environment. Check your .env against .env.example:\n${issues}`)
  }

  return parsed.data
}

export const env = readPublicEnv()

/** Build an explorer link for a transaction hash. */
export function explorerTxUrl(txHash: string): string {
  return `${env.NEXT_PUBLIC_EXPLORER_URL}/tx/${txHash}`
}

/** Build an explorer link for a contract or wallet address. */
export function explorerAddressUrl(address: string): string {
  return `${env.NEXT_PUBLIC_EXPLORER_URL}/address/${address}`
}
