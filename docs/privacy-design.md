# Privacy design

What VeraTalley protects, how, and what it does not protect. The last section is not an appendix. A
product that overstates its own security is worse than one that documents its gaps.

## The two guarantees

**Guarantee 1: anyone can confirm a ballot was cast.** Turnout is public and countable by anyone,
not just by us. If we announce 1,200 ballots, anyone can open the public block explorer, count the
records themselves, and get 1,200.

**Guarantee 2: nobody can see how anyone voted.** This is the hard part, and it is what makes this
project interesting rather than a database exercise.

## How both are true at once

Think of a physical ballot box. You sign a register at the door, so it is public that you voted.
Then you put your paper in a sealed envelope and drop it in the box, so nobody knows your choice.

We do exactly that, digitally:

- The voter's browser builds the ballot.
- The browser **encrypts** it: scrambles the data with a mathematical key so that what leaves the
  browser is meaningless noise unless you hold the matching key. That is the envelope.
- Only the scrambled ballot goes onto the blockchain, alongside the voter's wallet address.
- Anyone can see "this address submitted a ballot at 14:32". Nobody can read what is inside.
- When voting closes, the election authority opens all the envelopes at once, counts them, and
  publishes the result plus a fingerprint anyone can check against the blockchain.

## The cryptography

| Piece                             | What it does                                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| X25519                            | Key agreement. The browser derives a shared secret with the election's public key without ever contacting the authority |
| XChaCha20-Poly1305                | Authenticated encryption. Encrypts the ballot and detects any tampering                                                 |
| `@noble/curves`, `@noble/ciphers` | Audited, dependency free implementations in TypeScript                                                                  |
| keccak256                         | Produces the ballot hash, which is the voter's receipt value                                                            |

The election's public key is published on chain in the `Election` contract. That is what lets a
browser seal a ballot with no server involved at all. The matching private key is generated off
chain and never touches this repository, a server, or a document.

## The nonce, and why it is not optional

Every ballot carries 32 random bytes.

Without it, two voters who made identical choices would produce identical ciphertext. Anyone
reading the public chain could then group voters by what they chose, without decrypting anything at
all. In a small election with a lopsided result, the group of size two tells you almost everything.

Ballot secrecy would be an illusion, and it would look fine in testing, because in testing everyone
votes differently.

The nonce is generated fresh for every ballot with a cryptographically secure random source, and it
is never reused.

## What is public, deliberately

All of this is on a public chain and cannot be made private later:

- That a particular wallet address cast a ballot.
- Exactly when, to the second.
- The ballot's sequence number and hash.
- The sealed ciphertext itself.
- The total turnout at any moment.

This is Guarantee 1. It is the point, not a leak.

## What is never stored anywhere

- Real names paired with wallet addresses. Not in the repository, not in Google Drive, not in the
  database, not in a spreadsheet.
- The election private key. Not in the repository, not in `.env`, not in Actions secrets, not in a
  message to anyone.
- Any mapping from a voter's identity to their ballot contents.

The voter roll is a list of wallet addresses. Whoever runs an election necessarily knows which
person owns which address, because they compiled the roll. That link exists outside this system and
we do not import it into ours.

## The limitations, stated plainly

Two remain, and we publish them openly.

**1. The election authority holds the decryption key.**

In principle it could open individual ballots rather than only the total. Nothing in the current
design prevents this.

Fixing it properly means splitting the key across several independent people using threshold
cryptography, so that no single person can decrypt anything alone. That is a version 2 feature.

**2. The published count is attested, not proven.**

The authority decrypts the sealed ballots, counts them, and publishes the result along with a
fingerprint of the exact set of ballots it counted. Anyone can verify the fingerprint matches what
is on chain, which means the authority cannot quietly add, drop or swap a ballot.

What nobody can currently verify is that the decryption and arithmetic were performed honestly.
Proving that requires zero knowledge proofs. Also version 2.

This is roughly where real world systems such as Helios sit, and it is a very long way ahead of
"trust the spreadsheet".

## Threats this design does defeat

| Threat                               | Why it fails                                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Organiser quietly adds ballots       | Every ballot is an on-chain transaction from a registered wallet. Extra ones are visible and countable by anyone        |
| Organiser drops inconvenient ballots | Ballots are permanent once written. A dropped one is still there, and the sequence numbers have no gaps                 |
| Someone votes twice                  | The contract rejects the second ballot from the same wallet                                                             |
| An ineligible person votes           | The contract rejects any wallet not on the roll                                                                         |
| Our server is compromised            | The server never sees a vote and never handles a key. An attacker gets a cache they could have rebuilt from public data |
| Our database is altered              | It is a cache. Rebuild it from the chain and the alteration disappears                                                  |
| Traffic is intercepted               | The ballot is already sealed before it leaves the browser                                                               |

## Threats it does not defeat

Say these out loud rather than hoping nobody asks.

| Threat                                | Status                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| Authority reads individual ballots    | Possible. Needs threshold decryption. Version 2                                       |
| Authority miscounts and attests to it | Possible. Needs zero knowledge proofs. Version 2                                      |
| Voter's device is compromised         | Out of scope. If malware controls the browser, it sees the ballot before it is sealed |
| Voter is coerced while voting         | Out of scope, and unsolved in every remote voting system including postal voting      |
| Roll is compiled unfairly             | Out of scope. Who is eligible is decided before this system is involved               |
