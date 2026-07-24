import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

/**
 * Deploys the real ElectionFactory.
 *
 * Owner: VT-103, Rahul. You write and test this module. You do not run it
 * against Amoy: that needs the deployer private key, which only Bhargav holds.
 * VT-112 runs it on the Thursday of Week 1.
 *
 * Test it against a local node, which needs no key and no network:
 *
 *   npx hardhat node                                    # in one terminal
 *   pnpm --filter @veratalley/contracts deploy:local    # in another
 *
 * Ignition is resumable. If a deployment fails halfway, rerun the same command
 * and it continues from where it stopped rather than starting again.
 *
 * Until VT-103 is merged, what is actually live on Amoy is the throwaway in
 * `ignition/modules/StubFactory.ts`. Both deploy something that answers the
 * same read calls, so the frontend does not change when they are swapped.
 */
export default buildModule('FactoryModule', (m) => {
  // The administrator defaults to the deploying account, which is the wallet
  // behind DEPLOYER_PRIVATE_KEY. Override it with:
  //   --parameters '{"FactoryModule":{"administrator":"0x..."}}'
  const administrator = m.getParameter('administrator', m.getAccount(0))

  const factory = m.contract('ElectionFactory', [administrator])

  return { factory }
})
