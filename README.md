# VeraTalley

Verifiable voting on a public blockchain.

Two guarantees, and they are the whole product:

1. **Anyone can confirm a ballot was cast.** If we announce 1,200 ballots, anyone can open a public
   block explorer, count the records themselves, and get 1,200.
2. **Nobody can see how anyone voted.** The ballot is encrypted in the voter's browser. Only the
   sealed bytes ever reach the chain.

Both are true at once for the same reason a physical ballot box works: you sign the register at the
door, so it is public that you voted, then your paper goes into a sealed envelope, so nobody knows
your choice.

**A vote never passes through our backend.** There is no `POST /api/vote` and there never will be.
The browser seals the ballot, the wallet signs the transaction, and it goes straight to the chain.
Our server finds out afterwards by reading the chain, exactly as any member of the public could. If
you ever find yourself writing an endpoint that accepts a vote, stop and email Bhargav.

---

## Getting started

About 30 minutes, once.

### What you need first

- **Node 22.** Check with `node --version`. If it prints anything below 22, install Node 22 before
  going further. Everything below will fail in confusing ways on an older version.
- **pnpm 10.** If you do not have it: `corepack enable && corepack prepare pnpm@10.15.0 --activate`
- **MetaMask** in your browser, with a **new wallet used only for this project**. Never reuse a
  personal wallet.
- **Docker Desktop**, only if you are in the Platform team.

### Set it up

```bash
git clone https://github.com/dojoga1/VeraTalley.git
cd VeraTalley
pnpm install
cp .env.example .env
```

Open `.env` and read it. Nothing in it is required to run the app locally, but it tells you what
exists and who holds what.

### Check it works

```bash
pnpm dev        # web app on http://localhost:3000
pnpm test       # 25 tests, all should pass
pnpm typecheck  # should print no errors
pnpm lint       # should print no errors
```

Open <http://localhost:3000>. You should see the VeraTalley landing page listing the routes and who
is building each one.

**If any of that fails, send a `[BLOCKED]` email.** That is exactly what it is for, and you get a
reply within 12 hours including at the weekend. Do not spend four hours fighting an install.

### Add the Amoy network to MetaMask

| Field          | Value                          |
| -------------- | ------------------------------ |
| Network name   | Polygon Amoy                   |
| Chain ID       | `80002`                        |
| Currency       | `POL`                          |
| Block explorer | `https://amoy.polygonscan.com` |
| RPC URL        | Ask Bhargav                    |

The old public endpoint `rpc-amoy.polygon.technology` was switched off on 17 July 2026. Anything
pointing at it is already broken. Bhargav holds the provider key and nobody else needs it.

Then get free test POL from <https://faucet.polygon.technology>, selecting Amoy.

---

## There is already a factory on Amoy

The address is in [`packages/contracts/deployments/amoy.json`](packages/contracts/deployments/amoy.json).
Put it in your `.env` as `NEXT_PUBLIC_FACTORY_ADDRESS`.

It is seeded with three elections, one in each state: one **upcoming**, one **open**, one **closed**.
That is exactly what VT-105 criterion 2 and VT-108 criterion 1 need to test against, so **you are not
waiting on anybody** to start.

**It is a stub, and that is deliberate.** It answers `getElections()`, `electionCount()`, `owner()`,
and per election `name()`, `startTime()`, `endTime()`, `ballotCount()` and `isVotingOpen()`. It
cannot accept a ballot and it has no voter roll, so `ballotCount()` is always 0 and any attempt to
vote reverts.

VT-112 replaces it with the real contracts on the Thursday of Week 1. **The read interface does not
change when it does**, which is the entire reason the interfaces were frozen before anyone started.
Nothing you build against the stub will need rewriting.

Do not import anything from `packages/contracts/src/stub/`. It is deleted when VT-112 lands.

---

## What is in here

```
veratalley/
  apps/
    web/                 Next.js 15. The voter app, admin console and audit dashboard
    indexer/             Reads BallotCast events into PostgreSQL. Week 2
  packages/
    contracts/           Solidity, Hardhat 3, deployments
      src/interfaces/    FROZEN. The blockchain API
    ballot/              Ballot schema, canonicalisation, sealing
    api-spec/            FROZEN. OpenAPI 3.1, and the types generated from it
    db/                  Prisma schema and client
    ui/                  Shared design system
  infra/                 Docker Compose, deployment
  docs/                  Architecture, contracts, privacy, runbook
```

### Commands

Run these from the repository root.

| Command           | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `pnpm dev`        | Web app on port 3000                             |
| `pnpm test`       | Every test in every package                      |
| `pnpm typecheck`  | TypeScript across the workspace                  |
| `pnpm lint`       | ESLint, solhint and the OpenAPI linter           |
| `pnpm build`      | Production build of everything                   |
| `pnpm format`     | Prettier, writes changes                         |
| `pnpm gen`        | Regenerate types from the three frozen contracts |
| `pnpm db:migrate` | Apply database migrations                        |
| `pnpm db:seed`    | Insert local development data                    |

Working on contracts only:

```bash
pnpm --filter @veratalley/contracts compile
pnpm --filter @veratalley/contracts test
```

---

## The three frozen contracts

An API contract is a written, precise, machine checkable description of how one piece of software
talks to another, agreed **before** anyone writes code. Without one, ten people each guess, and in
Week 5 you find that one team called it `voterId` and the other called it `voter_address`.

| Contract                  | Where                                | Owner |
| ------------------------- | ------------------------------------ | ----- |
| Smart contract interfaces | `packages/contracts/src/interfaces/` | BT-1  |
| REST API, OpenAPI 3.1     | `packages/api-spec/openapi.yaml`     | PT-2  |
| Ballot shape, Zod         | `packages/ballot/src/schema.ts`      | BT-3  |

**These freeze on Monday 27 July 2026.** After that a change needs a pull request labelled
`contract-change` and Bhargav's approval. Adding a new optional field is fine. Renaming or removing
one is not.

Types are generated from all three. **Never hand write a type that describes a contract**, because a
hand written copy silently drifts and you find out at integration. Run `pnpm gen` and they
regenerate. CI fails if you forget to commit the result.

Full explanation, with a worked example of casting a vote end to end:
[`docs/api-contract.md`](docs/api-contract.md).

---

## How we work

Branch, pull request, one approval, merge. Nobody pushes directly to `main` or `develop`, including
Bhargav.

```bash
git checkout develop
git pull
git checkout -b feature/VT-104-wallet-connect
# ... work ...
git commit -m "VT-104: add wallet connect button with network guard"
git push -u origin feature/VT-104-wallet-connect
```

Then open a pull request into `develop` with `Closes #104` in the description. That closes the issue
and moves the card by itself when it merges.

Details in [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Never commit

Private keys. `.env` contents. RPC provider keys. Database passwords. Real voter names or email
addresses paired with wallet addresses.

Assume anything committed here is permanent and worldwide. `gitleaks` runs on every pull request and
will catch most of it, but it is a safety net and not a permission slip.

If you commit a secret by accident, **say so immediately**. Deleting it in the next commit does not
remove it: it is still in the history, and the value has to be rotated. Telling someone within the
hour is a five minute problem. Not telling anyone is a serious one.

---

## Licence and ownership

MIT, copyright Tom Basey. See [`LICENSE`](LICENSE).

The repository is owned by Tom Basey. You keep authorship of your own commits: MIT means anyone,
including you, can use, copy and build on this code, and your commit history stays yours to point a
recruiter at.
