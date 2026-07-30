# Deployments

`amoy.json` is the single record of what is live on Polygon Amoy. The web app, the audit dashboard
and the indexer all start from the factory address in it and discover everything else.

**It is written by a script, not by hand.** A deployment record that somebody typed out is a record
that is wrong the first time there is a typo, and three other people read this file.

## Current state

`factory` is `null` and `isStub` is `true`. Nothing is deployed yet.

## Deploying the weekend stub

Bhargav only. It needs the deployer private key, which lives in one password manager.

The stub is a throwaway that answers the read calls and nothing else. It exists so VT-105 and VT-108
have real on-chain data to build against on Monday morning and do not spend week one of five waiting
on a contracts developer. VT-112 replaces it on the Thursday.

Try it locally first. No key, no network, no test tokens:

```bash
npx hardhat node
```

then, in another terminal:

```bash
pnpm --filter @veratalley/contracts deploy:stub:local
```

Then against Amoy. The deployer wallet needs test POL from <https://faucet.polygon.technology>,
choosing Amoy:

```bash
npx hardhat keystore set RPC_URL_AMOY
npx hardhat keystore set DEPLOYER_PRIVATE_KEY
pnpm --filter @veratalley/contracts deploy:stub:amoy
```

Take the printed `StubElectionFactory` address and record it:

```bash
cd packages/contracts
VERATALLEY_STUB=1 node scripts/record-deployment.js amoy 0xYOUR_ADDRESS "$RPC_URL_AMOY"
```

The script reads the elections back off the chain rather than trusting what the deploy printed, so
the file describes what is actually there. Check the output shows one `upcoming`, one `open` and one
`closed`, then commit `amoy.json`.

Last, put the factory address in your `.env` as `NEXT_PUBLIC_FACTORY_ADDRESS`, and send it to the
team. **The RPC URL is not in this file and must never be, because it carries a provider key.**

## VT-112, replacing the stub with the real thing

Same shape, once VT-101, VT-102 and VT-103 are merged:

```bash
pnpm --filter @veratalley/contracts deploy:amoy
pnpm --filter @veratalley/contracts verify:amoy 0xNEW_ADDRESS
node scripts/record-deployment.js amoy 0xNEW_ADDRESS "$RPC_URL_AMOY"
```

Note the missing `VERATALLEY_STUB=1`, which is what flips `isStub` to `false`.

Then create the three seeded elections through the real factory, register every developer's wallet
from the tracker's Roster sheet as a test voter on the open one, and email the team the new address
with the explorer link.

Because the read interface never moved, VT-105 and VT-108 keep working without either developer
changing a line. That is the whole reason the interfaces were frozen before anyone started.

## Why `localhost.json` is not here

It is in `.gitignore`. A local node hands out the same deterministic addresses to everyone, so
committing them tells nobody anything and produces a conflict every time two people deploy locally.
