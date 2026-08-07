# VeraTalley

Verifiable voting on a public blockchain.

> **Picking this project up?** Start with **[HANDOVER.md](HANDOVER.md)** — it covers what is built and
> merged, what is deployed on Amoy, what is not done, and the operational gotchas, all in one page.

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

| Field          | Value                           |
| -------------- | ------------------------------- |
| Network name   | Polygon Amoy                    |
| Chain ID       | `80002`                         |
| Currency       | `POL`                           |
| Block explorer | `https://amoy.polygonscan.com`  |
| RPC URL        | `https://polygon-amoy.drpc.org` |

`https://polygon-amoy.drpc.org` is dRPC's free public Amoy endpoint; it responds today and is fine for
reading and light use. It is **rate limited**, so for real work (deploying, load) create your own free
dRPC key at <https://drpc.org> and use that instead. The old public endpoint
`rpc-amoy.polygon.technology` was **switched off in July 2026** — anything pointing at it is broken; do
not use it.

Then get free test POL from <https://faucet.polygon.technology>, selecting Amoy.

---

## The real factory is live on Amoy

The **real, fully functional** `ElectionFactory` is deployed on Polygon Amoy — it registers voters and
accepts encrypted ballots. Its address and the three election addresses are in
[`packages/contracts/deployments/amoy.json`](packages/contracts/deployments/amoy.json) (`"isStub": false`).
Put the factory address in your `.env` as `NEXT_PUBLIC_FACTORY_ADDRESS`.

It is seeded with three elections, one in each state: one **upcoming**, one **open**, one **closed** —
what VT-105 and VT-108 need to read against. A real encrypted ballot has already been cast and verified
end to end; see [`HANDOVER.md`](HANDOVER.md).

> The factory is owned by the original deployer's wallet and is **administratively frozen** (the owner
> has left with the key), so you cannot create elections or register voters on _this_ deployment. It
> stays permanently readable as a demonstration artifact. To run your own, deploy a fresh factory with
> your own wallet — one Ignition command, see [`HANDOVER.md`](HANDOVER.md).

The earlier read-only **stub** factory is retired. Its Solidity lives in `packages/contracts/src/stub/`
and is kept only for local testing (`pnpm --filter @veratalley/contracts deploy:stub:local`); it is not
what is deployed and nothing in the app should import from it.

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

One meeting a week, on Friday. You get one issue, and it is finished and merged into `develop` by
the next Friday. At that meeting everyone explains briefly what they built, and Bhargav says what
comes next.

Branch, pull request, one approval from your buddy, merge. Nobody pushes directly to `main` or
`develop`, including Bhargav.

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

**Two rules worth knowing before you start:**

**Only change your own work.** Do not edit files that belong to somebody else's issue, even to fix
something you spotted. Ask the owner, or ask Bhargav. Reading and reviewing other people's code is
encouraged; editing it is not. This is the rule that will cost the project most if it is broken.

**If the issue is unclear, ask Bhargav directly.** If it is a "how do I do this" question, ask your
buddy first. Being stuck is normal. Staying quiet about it for a week is the only real failure.

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

## Database Setup

### Option 1: Running from the repository root (recommended)

Start the PostgreSQL database and Adminer:

```bash
docker compose up -d
```

Run the Prisma migrations:

```bash
pnpm --filter @veratalley/db migrate
```

Seed the database with sample data:

```bash
pnpm --filter @veratalley/db seed
```

---

### Option 2: Running from `packages/db`

If you're already inside the `packages/db` directory, use the following commands instead:

Start the PostgreSQL database and Adminer (run from the repository root):

```bash
docker compose up -d
```

Then, from `packages/db`, run the migrations:

```bash
pnpm migrate
```

Seed the database:

```bash
pnpm seed
```

After completing these steps:

- PostgreSQL will be running on `localhost:5432`.
- Adminer will be available at `http://localhost:8080`.
- The database schema will be created.
- Two sample elections and twenty sample ballots (along with related data) will be available for local development.

---

## Licence and ownership

MIT, copyright Tom Basey. See [`LICENSE`](LICENSE).

The repository is owned by Tom Basey. You keep authorship of your own commits: MIT means anyone,
including you, can use, copy and build on this code, and your commit history stays yours to point a
recruiter at.
