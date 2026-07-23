import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

/**
 * Deploys the ElectionFactory.
 *
 * Everything else in the system is discovered from this one address, so this is
 * the only deployment that has to be recorded anywhere.
 *
 *   pnpm --filter @veratalley/contracts deploy:amoy
 *
 * Ignition is resumable. If a deployment fails halfway, rerun the same command
 * and it continues rather than starting again.
 *
 * VT-103 finishes this off: record the deployed address in
 * `deployments/amoy.json` and verify the source on amoy.polygonscan.com.
 */
export default buildModule('ElectionFactoryModule', (m) => {
  // The administrator defaults to the deploying account, which is the wallet
  // behind DEPLOYER_PRIVATE_KEY. Override it with:
  //   --parameters '{"ElectionFactoryModule":{"administrator":"0x..."}}'
  const administrator = m.getParameter('administrator', m.getAccount(0))

  const factory = m.contract('ElectionFactory', [administrator])

  return { factory }
})
