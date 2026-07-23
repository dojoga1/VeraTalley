import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { network } from 'hardhat'

/**
 * Proves the TypeScript side of the test harness works: a simulated chain
 * starts, a contract deploys, and viem can read from it.
 *
 * Solidity tests are usually the right place for contract behaviour. Use a
 * TypeScript test like this one when you need to drive several contracts, or
 * when you want to assert on decoded event arguments.
 */
describe('ElectionFactory', async () => {
  const { viem } = await network.create()

  it('deploys with the deployer as administrator', async () => {
    const [deployer] = await viem.getWalletClients()
    assert.ok(deployer, 'expected a funded wallet client on the simulated chain')

    const factory = await viem.deployContract('ElectionFactory', [deployer.account.address])
    const owner = await factory.read.owner()

    assert.equal(owner.toLowerCase(), deployer.account.address.toLowerCase())
  })

  it('starts with no elections', async () => {
    const [deployer] = await viem.getWalletClients()
    assert.ok(deployer, 'expected a funded wallet client on the simulated chain')

    const factory = await viem.deployContract('ElectionFactory', [deployer.account.address])

    assert.equal(await factory.read.electionCount(), 0)
    assert.deepEqual(await factory.read.getElections(), [])
  })
})
