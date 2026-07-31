import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('FactoryModule', (m) => {
  const deployer = m.getAccount(0)

  const factory = m.contract('ElectionFactory', [deployer])

  return { factory }
})
