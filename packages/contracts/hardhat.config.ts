import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem'
import { configVariable, defineConfig } from 'hardhat/config'

/**
 * Sources live in `src/` rather than the Hardhat default `contracts/`, because
 * every Week 1 issue and the handbook refer to `packages/contracts/src/`.
 *
 * Solidity tests are `*.t.sol` files under `test/`. TypeScript integration
 * tests are `*.ts` files under `test/integration/`.
 */
export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],

  paths: {
    sources: 'src',
    tests: {
      solidity: 'test',
      nodejs: 'test/integration',
    },
  },

  solidity: {
    profiles: {
      default: {
        version: '0.8.34',
        settings: {
          // Pinned deliberately. solc 0.8.34 defaults to `osaka`, and bytecode
          // built for it can contain opcodes Polygon Amoy does not yet accept,
          // which shows up as a deployment that reverts with no useful message.
          // `cancun` is supported on Amoy today. Do not remove this line to
          // silence a warning.
          evmVersion: 'cancun',
        },
      },
      production: {
        version: '0.8.34',
        settings: {
          evmVersion: 'cancun',
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },

  networks: {
    // Local in-memory chain. This is what `hardhat test` uses.
    hardhat: {
      type: 'edr-simulated',
      chainType: 'l1',
    },

    // Polygon Amoy testnet, chain ID 80002.
    //
    // Both values come from the environment and are never written down here.
    // Set them locally with `npx hardhat keystore set RPC_URL_AMOY`, or in CI
    // they arrive from GitHub Actions secrets. Only Bhargav holds the key.
    amoy: {
      type: 'http',
      chainType: 'l1',
      chainId: 80002,
      url: configVariable('RPC_URL_AMOY'),
      accounts: [configVariable('DEPLOYER_PRIVATE_KEY')],
    },
  },
})
