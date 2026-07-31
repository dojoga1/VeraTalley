# Deployments

`amoy.json` is the single record of what is live on Polygon Amoy. The web app, the audit dashboard
and the indexer all start from the factory address in it and discover everything else.

**It is written by a script, not by hand.** A deployment record that somebody typed out is a record
that is wrong the first time there is a typo, and three other people read this file.

## Current state — the real factory is live

`amoy.json` records the **real** `ElectionFactory` (`"isStub": false`), deployed by VT-112 with three
elections (upcoming / open / closed) and registered voters on the open one. See
[`../../../HANDOVER.md`](../../../HANDOVER.md) for the addresses, explorer/Sourcify links, and the
end-to-end proof transaction.

**That deployment is administratively frozen** — it is owned by the original deployer's wallet, which
has left. You cannot register voters or create elections on it. It stays live as a read-only
demonstration. To do real work, deploy your own (below).

## Deploy your own factory

The factory config reads `RPC_URL_AMOY` and `DEPLOYER_PRIVATE_KEY`. Hardhat's `configVariable` takes
**environment variables in preference to the keystore**, so the simplest path is a gitignored `.env`
at the repo root with those two values (a fresh wallet you control, funded from
<https://faucet.polygon.technology>). Then, from `packages/contracts`:

```bash
set -a; . ../../.env; set +a
# deploy the factory
pnpm --filter @veratalley/contracts exec hardhat ignition deploy ignition/modules/Factory.ts --network amoy
# create the three elections + register voters (edit the pubkey / voters as needed)
FACTORY_ADDRESS=0xNEW ELECTION_PUBLIC_KEY=0x... pnpm exec tsx scripts/seed-and-register.ts
# record what is actually on chain (NO VERATALLEY_STUB flag → isStub false)
node scripts/record-deployment.js amoy 0xNEW "$RPC_URL_AMOY"
```

Generate a **fresh** election keypair with `generateElectionKeypair()` from `@veratalley/ballot` — the
published demo keypair works only for the demo elections. Then cast a verified ballot with
`scripts/cast-and-verify.ts`. **The RPC URL and keys never go in this file.**

Verify the source on Sourcify (works without an API key):
`hardhat verify --network amoy <address> <constructor-args>`. Polygonscan's own "Contract" tab
additionally needs a free `POLYGONSCAN_API_KEY`.

## The retired stub (local testing only)

The stub in `../src/stub/` is a throwaway that answers read calls but cannot accept a ballot. It is no
longer deployed anywhere; it is kept only for local, no-network testing:

```bash
npx hardhat node                                            # one terminal
pnpm --filter @veratalley/contracts deploy:stub:local        # another
```

## Why `localhost.json` is not here

It is in `.gitignore`. A local node hands out the same deterministic addresses to everyone, so
committing them tells nobody anything and produces a conflict every time two people deploy locally.
