# VeraTalley — Handover

_Last updated 31 July 2026. Written for a technical person who has never seen this project._

## What VeraTalley is

VeraTalley is blockchain voting where **anyone can verify a ballot was cast, but nobody can see how
a person voted**. The voter's browser encrypts the ballot before it ever leaves the machine, and only
the sealed bytes go on chain — so turnout is public and countable by anyone, while the choices stay
secret. It runs on the Polygon Amoy testnet (chain ID 80002).

Read next, in order: [`README.md`](README.md) (run instructions), [`docs/architecture.md`](docs/architecture.md),
[`docs/privacy-design.md`](docs/privacy-design.md), [`docs/api-contract.md`](docs/api-contract.md).

## How to run it

All code is on the **`develop`** branch, not `main` (see Operational notes).

```bash
git clone --branch develop https://github.com/dojoga1/VeraTalley.git
cd VeraTalley
pnpm install
pnpm test
```

You need Node 22 and pnpm 10 (`corepack enable && corepack prepare pnpm@10.15.0 --activate`). The web
app runs with `pnpm dev` on <http://localhost:3000>.

## What is built and merged

All of the following is merged into `develop` and green in CI. Each person is credited by name because
this document is part of their record.

| Ticket | What it delivers                                                                                                                               | Author                  | PR                                                   |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------- |
| VT-101 | **VoterRegistry** — register/revoke voters, batch cap, registration window, fuzz-tested `registeredCount` invariant                            | **Tirthesh Kode**       | [#18](https://github.com/dojoga1/VeraTalley/pull/18) |
| VT-102 | **`castBallot` + `BallotCast` event** — the core voting function, with an invariant test and precise `[start, end)` window handling            | **Rahul Patil**         | [#13](https://github.com/dojoga1/VeraTalley/pull/13) |
| VT-103 | **`ElectionFactory`** — creates elections, `Ownable2Step`, Ignition deploy module                                                              | **Rahul Patil**         | [#14](https://github.com/dojoga1/VeraTalley/pull/14) |
| VT-111 | **Ballot sealing library** — X25519 + XChaCha20-Poly1305 sealed-box encryption and RFC 8785 canonicalisation, using audited `@noble` libraries | **Utkarsh Vijayvergia** | [#15](https://github.com/dojoga1/VeraTalley/pull/15) |
| —      | Repository skeleton, CI, secret scanning, docs, and the read-only stub factory deployment                                                      | Bhargav Urs Sumantharaj | —                                                    |

Together these mean the **contract layer is functionally complete**: an election can register voters,
open and close on a time window, accept one sealed ballot per registered voter, prevent double votes,
and emit a public ballot log — and the browser-side library that seals those ballots exists and is
tested. Contracts suite: 56 Solidity/integration tests. Ballot library: 22 tests.

## Work delivered but not yet merged (open PRs)

Both are real work that is close. Precise remediation is in each PR thread.

- **[PR #17](https://github.com/dojoga1/VeraTalley/pull/17) — gas-snapshot regression guard (Rahul Patil).**
  The guard itself works (verified: it fails the build on a gas increase). It cannot merge as-is because
  the branch is the pre-squash `feature/VT-102`, which conflicts add/add with `develop`, and its
  committed snapshot predates VT-101/VT-103. Fix: rebuild as a small PR on top of current `develop` and
  regenerate the snapshot. Tracked by issue [#16](https://github.com/dojoga1/VeraTalley/issues/16).
- **[PR #20](https://github.com/dojoga1/VeraTalley/pull/20) — VT-108 public audit dashboard (Varshitha Kondeti).**
  Three routes plus the data layer; the structure is good and it likely renders in `pnpm dev`. It fails
  the production build for three fixable reasons: files not Prettier-formatted; the audit pages
  statically prerender on-chain reads at build time (need `export const dynamic = 'force-dynamic'`); and
  the reads point at the deprecated public RPC `rpc-amoy.polygon.technology` instead of the configured
  provider. Tracked by issue [#8](https://github.com/dojoga1/VeraTalley/issues/8).

## Work in progress, not on `develop`

- **VT-109 database / Docker / Prisma (Het Desai)** — on branch `VT-109-database-docker`; not yet
  opened as a PR into `develop`. Issue [#9](https://github.com/dojoga1/VeraTalley/issues/9).
- **VT-105 elections list page (Niharika Yerra)** — reported finished but no branch has been pushed to
  the remote. Issue [#5](https://github.com/dojoga1/VeraTalley/issues/5).

## What is not built

Each maps to an open issue:

| Area                                         | Issue                                                         |
| -------------------------------------------- | ------------------------------------------------------------- |
| Voter app: wallet connection & network guard | [#4 VT-104](https://github.com/dojoga1/VeraTalley/issues/4)   |
| Voter app: elections list page               | [#5 VT-105](https://github.com/dojoga1/VeraTalley/issues/5)   |
| Design system & accessibility baseline       | [#6 VT-106](https://github.com/dojoga1/VeraTalley/issues/6)   |
| Admin console & Sign In With Ethereum        | [#7 VT-107](https://github.com/dojoga1/VeraTalley/issues/7)   |
| Public audit dashboard (in PR #20)           | [#8 VT-108](https://github.com/dojoga1/VeraTalley/issues/8)   |
| Database, Docker Compose, Prisma schema      | [#9 VT-109](https://github.com/dojoga1/VeraTalley/issues/9)   |
| REST API skeleton & OpenAPI spec             | [#10 VT-110](https://github.com/dojoga1/VeraTalley/issues/10) |
| Deploy the real factory to Amoy              | [#12 VT-112](https://github.com/dojoga1/VeraTalley/issues/12) |

Also not built and not yet ticketed for Week 1: the **event indexer** (reads `BallotCast` into
PostgreSQL), the **tally CLI** (decrypts sealed ballots and certifies the count), and the **server /
NAS deployment** behind HTTPS. These are the Weeks 2–5 roadmap in the handbook.

## What is deployed on Amoy

**Only a read-only stub factory is live.** It answers the read calls the frontend needs (list
elections, read metadata) but **cannot register a voter or accept a ballot** — `castBallot` reverts.
It exists so the frontend has real on-chain data to build against.

| Thing                                         | Address                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Stub factory                                  | [`0x3e63D1600Cff1ce0b55f5AA740E4645a47e17522`](https://amoy.polygonscan.com/address/0x3e63D1600Cff1ce0b55f5AA740E4645a47e17522) |
| Election — upcoming (Riverside Ward Council)  | [`0xc4b7caf5078fc816fdcc97d04a73253ff10232f1`](https://amoy.polygonscan.com/address/0xc4b7caf5078fc816fdcc97d04a73253ff10232f1) |
| Election — open (UTA Student Government)      | [`0xd85a4c9929dd5300c40f8d6816c79b4bf02e03ad`](https://amoy.polygonscan.com/address/0xd85a4c9929dd5300c40f8d6816c79b4bf02e03ad) |
| Election — closed (Housing Society Committee) | [`0x6d9c0a25c4cd2542b83415374e9cefe6db1a68e3`](https://amoy.polygonscan.com/address/0x6d9c0a25c4cd2542b83415374e9cefe6db1a68e3) |

The record of what is deployed lives in
[`packages/contracts/deployments/amoy.json`](packages/contracts/deployments/amoy.json) (`"isStub": true`).

**The real factory is not deployed.** The contract code is complete on `develop`, so it can be. This is
VT-112 ([#12](https://github.com/dojoga1/VeraTalley/issues/12)): deploy the Ignition module to Amoy,
seed three elections, run `scripts/record-deployment.js` to update `amoy.json`, verify the source on
polygonscan, and commit. It needs the deployer key from the Hardhat keystore and a person to enter the
keystore password. See [`packages/contracts/deployments/README.md`](packages/contracts/deployments/README.md).

## The three frozen contracts

These are the agreed interfaces that let teams build in parallel without colliding. **Changing any of
them needs explicit lead sign-off** — a change ripples into every team building against it.

1. **Smart-contract interfaces** — [`packages/contracts/src/interfaces/`](packages/contracts/src/interfaces/)
   (the blockchain API: `IElectionBallot`, `IVoterRegistry`, `IElectionFactory`, `IElectionMetadata`).
2. **REST API** — [`packages/api-spec/openapi.yaml`](packages/api-spec/openapi.yaml) (OpenAPI 3.1; still a
   skeleton — VT-110).
3. **Ballot data shape** — [`packages/ballot/src/schema.ts`](packages/ballot/src/schema.ts) (the Zod ballot
   schema the sealing library and the tally tool both read).

> Note: the handbook refers to this third file as `packages/ballot/schema.ts`; in the repository it is at
> `packages/ballot/src/schema.ts`.

Types are generated from all three (`pnpm gen`); CI fails if the committed output is stale. Never hand-write
a type that describes one of these.

## Known privacy limitations (published deliberately)

We committed to documenting these honestly rather than overstating security. Full write-up in
[`docs/privacy-design.md`](docs/privacy-design.md).

1. **The election authority holds the decryption key**, so in principle it can read individual ballots,
   not just the total. Fixing this properly needs threshold cryptography (splitting the key across
   several independent parties). **Version 2.**
2. **The published count is attested, not proven** — anyone can check the tally matches the sealed
   ballots on chain, so nothing can be added or dropped, but nobody can yet verify the decryption and
   arithmetic were done honestly. Fixing this needs zero-knowledge proofs. **Version 2.**

This is roughly where real systems such as Helios sit, and far ahead of "trust the spreadsheet".

## Operational notes (read before you touch anything)

- **`main` is still the default branch, but all code is on `develop`.** Every new PR therefore targets
  the wrong branch by default and must be re-pointed to `develop`. The clean fix is to change the repo's
  default branch to `develop` (Settings → General → Default branch) — this needs Admin.
- **Branch protection was never enabled.** The repository is owned by a personal account
  (`dojoga1` / Tom Basey) and Admin could not be granted to enable rulesets. So nothing technically
  enforces "PR + one review + green CI"; it has been convention only. If ownership moves to an org,
  enable a ruleset on `main` and `develop` requiring the `verify` and `secrets` checks.
- **Polygon's public Amoy RPC (`rpc-amoy.polygon.technology`) was deprecated in July 2026.** A provider
  key is required (dRPC, Tenderly, Allnodes, Nodies, 1RPC). It is held in the Hardhat keystore as
  `RPC_URL_AMOY` and must never be committed. Any code still pointing at the public endpoint is broken
  (this is one of the VT-108 build failures).
- **CI** runs two jobs on every PR: `Lint, typecheck, test, build` and `Secret scan` (gitleaks over full
  history). Fork PRs require a maintainer to approve the workflow run before CI starts.
- **Secrets** (deployer key, RPC URL, session secret) live in the Hardhat keystore and a password
  manager, never in the repo. See [`SECURITY.md`](SECURITY.md).

## Repository map

```
apps/web/            Next.js 15 voter app, admin, audit (mostly skeleton)
apps/indexer/        BallotCast → PostgreSQL indexer (not built)
packages/contracts/  Solidity, Hardhat 3, deployments   ← contract layer complete
packages/ballot/     ballot schema + sealing library     ← complete
packages/api-spec/   OpenAPI 3.1 contract (skeleton)
packages/db/         Prisma schema (skeleton)
packages/ui/         shared design system (skeleton)
docs/                architecture, api-contract, privacy-design, siwe, runbook
```
