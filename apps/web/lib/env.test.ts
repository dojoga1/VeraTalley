import { describe, expect, it } from 'vitest'

import { env, explorerAddressUrl, explorerTxUrl } from './env'

/**
 * Smoke tests for the skeleton. They exist so `pnpm test` is green on day one
 * and a red run always means someone broke something real.
 */
describe('env', () => {
  it('defaults to Polygon Amoy', () => {
    expect(env.NEXT_PUBLIC_CHAIN_ID).toBe(80002)
  })

  it('defaults to the Amoy block explorer', () => {
    expect(env.NEXT_PUBLIC_EXPLORER_URL).toBe('https://amoy.polygonscan.com')
  })
})

describe('explorer links', () => {
  it('builds a transaction link', () => {
    expect(explorerTxUrl('0xabc')).toBe('https://amoy.polygonscan.com/tx/0xabc')
  })

  it('builds an address link', () => {
    expect(explorerAddressUrl('0xdef')).toBe('https://amoy.polygonscan.com/address/0xdef')
  })
})
