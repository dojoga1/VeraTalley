# Sign In With Ethereum

Written for VT-107. Read this before you start, it will save you most of the ticket.

## The idea in one paragraph

There is no password. To prove who you are, you sign a short message with your wallet. Signing is a
mathematical operation that only the holder of the private key can perform, and anyone can check the
result against the public address. So the server can be certain the request came from a particular
wallet, without ever holding a secret that could be stolen from it.

That is the whole mechanism. Everything below is the detail that stops it being forgeable.

## Why we use it here

Three reasons, in order of how much they matter to this project:

1. **There is no password to steal.** We hold no password hashes, so a database leak leaks nothing
   that lets anyone in. For a voting system that is not a nice-to-have.
2. **The administrator is already defined on chain.** `ElectionFactory.owner()` is the wallet that
   can create elections. Checking a signature against that address means the admin console and the
   contract cannot disagree about who the administrator is. With a password table they drift apart
   the first time somebody changes one and not the other.
3. **There is no password reset flow to build**, which is genuinely a week of work you are not doing.

## The exchange, step by step

```
Browser                                Server
   |                                      |
   |  1. GET /api/auth/nonce              |
   |------------------------------------->|
   |                                      |  generate 16+ random bytes
   |                                      |  store in the session
   |  2. { nonce: "a8Kd..." }             |
   |<-------------------------------------|
   |                                      |
   |  3. build the SIWE message           |
   |     wallet signs it                  |
   |                                      |
   |  4. POST /api/auth/verify            |
   |     { message, signature }           |
   |------------------------------------->|
   |                                      |  a. nonce matches the session?
   |                                      |  b. nonce not already used?
   |                                      |  c. signature valid for the address?
   |                                      |  d. address == factory owner()?
   |                                      |  e. not expired, right domain?
   |                                      |
   |                                      |  consume the nonce
   |                                      |  set the session cookie
   |  5. 200, Set-Cookie                  |
   |<-------------------------------------|
```

## The message

EIP-4361 defines the exact text. Do not invent your own format: wallets display this one in a way
users can read, and a custom blob shown in a signing dialog is exactly what a phishing site looks
like.

```
veratalley.local wants you to sign in with your Ethereum account:
0x4d1a7c0e5b3f89a2d6c14e70b8f35a9c2e46d081

Sign in to the VeraTalley admin console.

URI: https://veratalley.local
Version: 1
Chain ID: 80002
Nonce: a8Kd0fS2mN4pQ7rT
Issued At: 2026-07-27T14:22:41Z
Expiration Time: 2026-07-27T14:32:41Z
```

Every field is load bearing:

| Field                 | What breaks without it                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Domain, first line    | A signature collected by any other site would work here. This is the anti-phishing field |
| Address               | Nothing to check the signature against                                                   |
| Nonce                 | The same signature could be replayed forever                                             |
| Chain ID              | A signature for a different network would be accepted                                    |
| Issued At, Expiration | A signature captured once works indefinitely                                             |

## The five checks on the server

In this order. Each one is cheap and rules out a whole class of attack.

1. **The nonce is the one we issued**, and it is in this session. If the client picks its own nonce,
   it can reuse a signature it captured earlier.
2. **The nonce has not been used before.** Delete it from the session the moment you accept it. This
   is acceptance criterion 6 and the one most people miss: the same valid request replayed twice
   must fail the second time.
3. **The signature is valid for the address in the message.** viem's `verifyMessage` does this.
   Recover the address from the signature and compare, do not trust an address the body claims.
4. **The address equals `ElectionFactory.owner()`**, read from the chain. Not from an environment
   variable, and not from a list in the code. Read it from the contract, because that is the
   definition of who the administrator is.
5. **The message has not expired and names our domain.** Both are in the message and both are
   signed, so neither can be altered after the fact.

Only then set the session cookie.

## The cookie

```ts
{
  httpOnly: true,   // JavaScript cannot read it, so an XSS bug cannot steal the session
  sameSite: 'lax',  // it is not sent on cross-site POSTs, which blocks basic CSRF
  secure: true,     // production only. HTTPS only, so it cannot be read off the wire
  path: '/',
  maxAge: 60 * 60 * 8,
}
```

`secure: true` in development would break the cookie on `http://localhost`, so gate it on
`process.env.NODE_ENV === 'production'`.

Use `iron-session`, which encrypts the session into the cookie itself so there is no session store
to run. Its secret comes from `SESSION_SECRET` in `.env`, at least 32 characters.

## What this does not do

Worth understanding, and worth being able to say out loud in an interview.

- It proves **control of a wallet**, not identity. It says "whoever sent this holds that private
  key". If the key is stolen, the thief is the administrator. That is exactly as true of a password,
  but the failure is quieter because there is nothing to reset.
- It is **one administrator**, because `owner()` is one address. Multiple administrators means an
  allowlist on the factory, and that is a contract change, not a frontend change. Do not work around
  it in the frontend.
- It has **nothing to do with voting**. Voters never sign in. A voter connects a wallet and
  transacts directly with the chain. Only the admin console has a session at all.

## Fallback if you get stuck

Build the sign in page and the admin layout with a `checkIsAdmin()` that always returns true, and
get the routing, the redirect and the middleware working. Then replace that one function with the
real verification. The layout work is genuinely half the ticket and it does not depend on any of
the cryptography.

Email Varshitha first, then Bhargav.

## Reference

- EIP-4361, the specification: <https://eips.ethereum.org/EIPS/eip-4361>
- viem `verifyMessage`: <https://viem.sh/docs/utilities/verifyMessage>
- `iron-session`: <https://github.com/vvo/iron-session>
