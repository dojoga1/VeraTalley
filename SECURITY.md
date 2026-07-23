# Security

## Reporting something

Email Bhargav directly. Do not open a public issue for anything that looks like a real
vulnerability, because the issue tracker is public and filing it there tells everyone before there
is a fix.

You get an acknowledgement within 24 hours.

If you are on the team and you are not sure whether something counts, send it anyway. A false alarm
costs ten minutes.

## If you commit a secret

This will happen to someone. What matters is the next ten minutes.

1. **Say so immediately.** Email Bhargav with the commit hash. Do not wait until you have worked out
   how to undo it.
2. **Do not just delete it in the next commit.** The value is still in the history, still readable
   by anyone who clones the repository, and still valid.
3. Bhargav rotates the value. That is the only thing that actually fixes it.

Telling someone within the hour makes this a five minute problem. Not telling anyone makes it a
serious one, and the difference is entirely in the reporting, not the mistake.

## What must never be committed

- Private keys of any kind
- `.env` file contents. `.env.example` holds names, never values
- RPC provider URLs containing an API key
- Database passwords, other than the local development ones that are identical on every machine
- Session secrets
- Real voter names or email addresses paired with wallet addresses

`gitleaks` runs on every pull request and scans the full history, not just the tip. It is a safety
net, not a permission slip: it catches patterns it recognises and it will not catch everything.

## Where secrets actually live

| Secret                        | Where it lives                                                   | Who can see it           |
| ----------------------------- | ---------------------------------------------------------------- | ------------------------ |
| Deployment wallet private key | Bhargav's password manager, and GitHub Actions secrets           | Bhargav                  |
| RPC provider URL              | GitHub Actions secrets, and each developer's local `.env`        | Bhargav issues it        |
| Election private key          | Generated off chain per election, held by the election authority | Never in this repository |
| Database password, production | GitHub Actions secrets                                           | Bhargav, Het             |
| Session secret                | Environment on the server                                        | Bhargav, Het             |

Nothing on that list belongs in the repository, in Google Drive, in a message, or in a document,
under any circumstances, including temporarily.

## Design decisions that are security decisions

Worth knowing, because a well meant change can undo one of these without looking like it.

- **A vote never passes through our backend.** There is no endpoint that accepts a vote. Adding one
  would make the entire product unprovable, whatever else it also did.
- **The ballot is sealed in the browser**, before it reaches the network. Not on the server, not in
  transit.
- **The contract never inspects the ciphertext.** It takes opaque bytes, which is what lets the
  encryption change without breaking anything else.
- **Every ballot carries a fresh 32 byte nonce.** Removing it would let anyone group voters by what
  they chose without decrypting anything. See [`docs/privacy-design.md`](docs/privacy-design.md).
- **The admin session checks `ElectionFactory.owner()` on chain**, not a list in the code or an
  environment variable, so the console and the contract cannot disagree about who the administrator
  is.
- **The database is a cache.** Everything in it can be rebuilt from the chain. Nothing is only there.

## Known limitations

Published deliberately in [`docs/privacy-design.md`](docs/privacy-design.md). In short: the election
authority holds the decryption key, and the published count is attested rather than proven. Both are
version 2 problems and both are stated openly rather than hidden.
