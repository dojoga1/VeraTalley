# Architecture

## The shape of it

```
                  ┌──────────────────────────────┐
                  │        Voter's browser       │
                  │                              │
                  │  builds the ballot           │
                  │  seals it  (X25519 +         │
                  │            XChaCha20)        │
                  │  wallet signs the tx         │
                  └───────┬──────────────┬───────┘
                          │              │
        sealed ballot,    │              │  tx hash only
        straight to chain │              │  (for the receipt)
                          v              v
        ┌─────────────────────────┐   ┌──────────────────────────┐
        │   Polygon Amoy (80002)  │   │   Next.js route handlers │
        │                         │   │                          │
        │  ElectionFactory        │   │   /api/v1/*              │
        │    └── Election         │   │                          │
        │         BallotCast ─────┼──>│   reads the chain itself │
        └─────────────────────────┘   └────────────┬─────────────┘
                          ^                        │
                          │                        v
                    ┌─────┴──────┐          ┌──────────────┐
                    │  Indexer   │─────────>│  PostgreSQL  │
                    │            │          │              │
                    │ BallotCast │          │  read model  │
                    └────────────┘          └──────────────┘
```

## The rule that shapes everything

> **A vote never passes through our backend.**

The arrow from the browser to the chain does not touch our server. That is not an optimisation, it
is the product.

If a vote passed through our server, we could alter it, and the fact that we did not becomes
unprovable. Every guarantee VeraTalley makes would then rest on trusting us, which is precisely the
thing the project exists to remove. The blockchain would be decorative.

So: there is no `POST /api/vote`, and there never will be. If you find yourself writing an endpoint
that accepts a vote, stop and email Bhargav.

## What each piece is for

### The chain is the source of truth

`ElectionFactory` creates elections and holds the canonical list. Each `Election` is its own
contract, so one election's state cannot affect another's. Ballots live in the `BallotCast` event
log, which is permanently readable by anyone, including people who have never heard of us.

Event log data costs 8 gas per byte. Contract storage costs 20,000 gas per 32 bytes. Both are
equally permanent and equally public. Storage would cost roughly three hundred times more for no
benefit, which is why the ciphertext goes in the log.

### PostgreSQL is a cache, not a record

Everything in the database can be rebuilt by replaying the chain from block zero. Nothing is only in
PostgreSQL. This is worth stating clearly because it decides what a database bug means: at worst the
dashboard is stale, never that a vote was lost.

It exists because reading five thousand events from an RPC endpoint to render one page is slow, and
because SQL can answer questions the chain cannot answer cheaply.

### The indexer is the only writer

One process reads `BallotCast` and writes to PostgreSQL. Nothing else writes ballot rows. One writer
means there is one place to look when a number is wrong.

### The API is read-only, with one exception

`POST /api/v1/receipts` accepts a transaction hash and nothing else. The server then fetches that
transaction from the chain itself, decodes the event, and reads the hash, sequence and timestamp
**from the chain**. It believes nothing the browser said beyond the transaction hash.

That is what makes a receipt worth having. If the server recorded whatever the browser claimed, the
receipt would prove nothing at all.

## Trust, stated plainly

What you have to trust us for, and what you do not.

|                                               | Trusted party              | Why                                        |
| --------------------------------------------- | -------------------------- | ------------------------------------------ |
| That a ballot was recorded                    | **Nobody**                 | It is on a public chain. Count it yourself |
| That the ballot count is right                | **Nobody**                 | Count the events on the explorer           |
| That eligibility was enforced                 | **Nobody**                 | The contract rejects unregistered wallets  |
| That nobody voted twice                       | **Nobody**                 | The contract rejects a second ballot       |
| That ballots stay secret                      | **The election authority** | It holds the decryption key. See below     |
| That the published result matches the ballots | **The election authority** | It is attested, not proven. See below      |

The last two are real limitations and we publish them rather than pretend otherwise. A product that
overstates its own security is worse than one that documents its gaps.

1. The authority holds the key, so in principle it could read individual ballots. Fixing this
   properly means splitting the key across several independent people so no single one can decrypt.
   Version 2.
2. The count is attested by the authority against an unchangeable set of sealed ballots, rather than
   proven mathematically. Fixing that requires zero knowledge proofs. Version 2.

This is roughly where real systems such as Helios sit, and it is a very long way ahead of "trust the
spreadsheet".

## Boundaries between the packages

```
apps/web ──────> packages/ui         design system
         ──────> packages/ballot     ballot shape and sealing
         ──────> packages/api-spec   generated REST types
         ──────> packages/contracts  generated ABIs
         ──────> packages/db         only in route handlers, never in a component

apps/indexer ──> packages/db
             ──> packages/contracts

packages/ui ───> nothing in this repository
```

`packages/ui` importing from `apps/web` would make both impossible to build or test on their own.
The dependency goes one way. Nothing enforces this but you.

## Where the numbers come from

A single turnout figure can be reached three ways, and they must agree:

1. `Election.ballotCount()` on the chain, which is authoritative.
2. `SELECT count(*) FROM "Ballot" WHERE ...`, which is the indexer's view.
3. Counting `BallotCast` events on `amoy.polygonscan.com`, which is what a member of the public does.

If 1 and 2 disagree, the indexer is behind or has a bug, and 1 wins. Always. The audit dashboard
shows the on-chain number and links to the explorer so anyone can check it, which is Guarantee 1
made concrete rather than claimed.
