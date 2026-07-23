# API contracts, explained from zero

Read this even if it is not your area. This is the thing that most often goes wrong on a team this
size, and it is rarely taught.

## 1. What an API contract is

Imagine three groups building a car in three different rooms. One builds the engine, one the
dashboard, one the wiring loom that connects them. They do not talk during the week.

If nobody agreed in advance exactly how many pins the connector has, what voltage each pin carries,
and which pin is which, then on assembly day nothing fits and every group blames the other two.

An API contract is that connector specification. A written, precise, machine checkable description of
exactly how one piece of software talks to another, agreed **before** anyone writes code.

It answers four questions for every interaction:

1. What do I call?
2. What exactly do I send, and in what shape?
3. What exactly comes back, and in what shape?
4. What can go wrong, and how am I told?

## 2. Why we freeze it

Once the contract exists, the frontend can be built against a fake backend before the backend
exists. The backend can be built against the written specification without waiting for a screen.
When they are joined together it works, because both were built to the same specification.

Without a frozen contract, ten people each guess, and in Week 5 you discover one team called it
`voterId` and the other called it `voter_address`.

**Our contracts freeze on Monday 27 July 2026.** After that a change needs a pull request labelled
`contract-change` and Bhargav's approval. Adding a new optional field is fine. Renaming or removing
one is not.

## 3. We have three contracts

| Contract                                      | Where                                | Owner | Who reads it   |
| --------------------------------------------- | ------------------------------------ | ----- | -------------- |
| Smart contract interfaces, the blockchain API | `packages/contracts/src/interfaces/` | BT-1  | AT, MT, PT     |
| REST API, OpenAPI 3.1                         | `packages/api-spec/openapi.yaml`     | PT-2  | AT, MT         |
| Ballot data shape, Zod                        | `packages/ballot/src/schema.ts`      | BT-3  | AT, tally tool |

We generate TypeScript types from all three. Never hand write a type that describes a contract,
because a hand written copy silently drifts. Run `pnpm gen` and they regenerate. CI fails if you
forget to commit the result.

## 4. The rule that overrides everything else

> **A vote never passes through our backend.**

There is no `POST /api/vote`. The voter's browser encrypts the ballot, the voter's wallet signs the
transaction, and it goes straight to the blockchain. Our server finds out afterwards by reading the
blockchain, exactly as any member of the public could.

The reason is the entire premise of the product. If a vote passes through our server then we could
alter it, and the fact that we did not becomes unprovable. The blockchain would be decorative.

If you ever find yourself writing an endpoint that accepts a vote, stop and email Bhargav.

## 5. Worked example: casting a vote, end to end

Every sub-team touches this flow.

### Step 1: the ballot before anything happens to it

The browser builds this in memory:

```json
{
  "schema": "veratalley.ballot/1",
  "chainId": 80002,
  "election": "0x9f2cB1a4E7d80C3F5a19b6D2e4Af07C3d8B41c02",
  "contests": [
    { "id": 1, "method": "plurality", "selections": [3] },
    { "id": 2, "method": "approval", "selections": [1, 4] },
    { "id": 3, "method": "binary", "selections": [0] }
  ],
  "nonce": "0x8b1d4ac9f0e2571b3d6a84c5e0f9b27d1a4c6e8f0b2d5a7c9e1f3b6d8a0c2e4f"
}
```

Three questions on the ballot. On question 1 you pick one and the voter picked option 3. On question
2 you may approve several and the voter approved 1 and 4. Question 3 is yes or no and the voter
picked option 0.

Rules that are part of the contract, not suggestions:

- `contests` sorted by `id` ascending. `selections` sorted ascending.
- Serialised with RFC 8785 canonicalisation before encryption, so the same ballot always produces
  byte identical output. Without this the tally is not reproducible.
- `nonce` is 32 random bytes. Without it, two voters who chose identically would produce identical
  ciphertext, and anyone could tell they voted the same way without decrypting anything. **This one
  field is the difference between real ballot secrecy and the illusion of it.**

### Step 2: sealing it

```ts
const plaintext = canonicalJson(ballot) // RFC 8785
const ciphertext = seal(plaintext, election.publicKey) // X25519 + XChaCha20-Poly1305
const ballotHash = keccak256(ciphertext)
```

`ciphertext` is now meaningless to everyone except the holder of the election private key.

### Step 3: the on chain interface, frozen

Lives at [`packages/contracts/src/interfaces/IElectionBallot.sol`](../packages/contracts/src/interfaces/IElectionBallot.sol).

```solidity
interface IElectionBallot {
    event BallotCast(
        address indexed voter,
        bytes32 indexed ballotHash,
        uint32  indexed sequence,
        uint64  castAt,
        bytes   ciphertext
    );

    error NotRegistered();
    error AlreadyVoted();
    error VotingClosed();
    error EmptyPayload();
    error PayloadTooLarge();

    function castBallot(bytes calldata ciphertext) external;
    function ballotOf(address voter) external view returns (bytes32 ballotHash, uint64 castAt);
    function ballotCount() external view returns (uint32);
    function isVotingOpen() external view returns (bool);
}
```

Two things worth understanding.

**The contract never looks inside `ciphertext`.** It takes opaque bytes. That is why we can change
how we encrypt in Week 4 without changing this interface and breaking three teams.

**The ciphertext goes in the event log, not contract storage.** Storage costs 20,000 gas per 32
bytes. Event log data costs 8 gas per byte. Both are permanently readable by anyone. Storage would
cost roughly three hundred times more for no benefit.

### Step 4: the frontend call

```ts
const { writeContractAsync } = useWriteContract()

const txHash = await writeContractAsync({
  address: election,
  abi: electionBallotAbi, // generated, never hand written
  functionName: 'castBallot',
  args: [ciphertext],
})
```

### Step 5: the receipt, the only place our backend is involved

The browser tells the server "this transaction happened", sending a transaction hash and nothing
else:

```http
POST /api/v1/receipts
Content-Type: application/json

{
  "chainId": 80002,
  "election": "0x9f2cB1a4E7d80C3F5a19b6D2e4Af07C3d8B41c02",
  "txHash": "0x4d1a7c0e5b3f89a2d6c14e70b8f35a9c2e46d081b7f3a5c9e0d2b4f68a1c3e57"
}
```

```http
202 Accepted

{ "receiptId": "rcpt_01J8QW3ZK4M7N2P9", "status": "pending" }
```

The server then goes to the blockchain itself, fetches that transaction, checks it went to an
election we know about, decodes the `BallotCast` event, and reads the hash, sequence and timestamp
**from the chain**. It believes nothing the browser said beyond the transaction hash.

That is what makes the receipt worth having. If the server recorded whatever the browser claimed,
the receipt would prove nothing.

```http
GET /api/v1/receipts/rcpt_01J8QW3ZK4M7N2P9

{
  "receiptId": "rcpt_01J8QW3ZK4M7N2P9",
  "status": "confirmed",
  "election": { "address": "0x9f2c...1c02", "name": "UTA Student Government 2026" },
  "ballotHash": "0x7a03e91c4d5b28f60a7c3e15d9b47c082a5e63f19d0b4c8a2e7f501639bd8c4a",
  "sequence": 1841,
  "txHash": "0x4d1a...3e57",
  "blockNumber": "42906388",
  "castAt": "2026-08-14T17:22:41Z",
  "explorerUrl": "https://amoy.polygonscan.com/tx/0x4d1a...3e57"
}
```

### Step 6: errors, the same shape everywhere

```json
{
  "error": {
    "code": "BALLOT_NOT_FOUND",
    "message": "Transaction contains no BallotCast event for a known election",
    "traceId": "01J8QW40T7X2"
  }
}
```

The frontend switches on `code`, never on `message`, because messages get reworded and that would
break the UI silently. The list of valid codes is part of the frozen contract:

`NOT_FOUND`, `UNAUTHORIZED`, `VALIDATION_FAILED`, `BALLOT_NOT_FOUND`, `CHAIN_UNAVAILABLE`,
`RATE_LIMITED`, `INTERNAL`.

## 6. Field conventions across the whole project

Get these wrong and integration day is painful.

| Thing          | On the blockchain     | In JSON                                                                                |
| -------------- | --------------------- | -------------------------------------------------------------------------------------- |
| Wallet address | `address`             | checksummed string starting `0x`                                                       |
| Big number     | `uint256`             | a decimal **string**, never a JavaScript number. JavaScript loses precision above 2^53 |
| Time           | `uint64` unix seconds | RFC 3339 string, always UTC, e.g. `2026-08-14T17:22:41Z`                               |
| Hash           | `bytes32`             | `0x` string, exactly 66 characters                                                     |
| Our own IDs    | not on chain          | prefixed, e.g. `rcpt_01J8...`                                                          |

The big number rule catches people out. `blockNumber` on Polygon is already past 42 million, and
while that fits in a JavaScript number today, `uint256` values such as token amounts do not.
`JSON.parse` will silently round them. Use strings, everywhere, with no exceptions, so that nobody
has to remember which fields are safe.
