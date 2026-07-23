# Contributing

Everything here is short on purpose. If a rule is not written down it is not a rule.

## Branches

```
main        production, protected
develop     integration branch, everything merges here first
feature/*   one branch per issue
```

One branch per issue, named after the issue:

```
feature/VT-104-wallet-connect
feature/VT-101-voter-registry
```

Nobody pushes directly to `main` or `develop`, including Bhargav.

## Commits

Start the message with the issue key, then say what changed in the present tense.

```
VT-104: add wallet connect button with network guard
VT-101: reject batches larger than MAX_BATCH
VT-110: document the receipts endpoint
```

Do not write `fix`, `wip`, `update`, or `changes`. In three weeks someone will be reading
`git log` trying to work out when a behaviour changed, and those tell them nothing.

Small commits are easier to review than one large one, and a pull request that is easy to review
gets reviewed the same day.

## Pull requests

Open it into `develop`. Put `Closes #104` in the description, with your issue's number. That link
closes the issue and moves the board card by itself on merge, which is the whole reason we use
GitHub Issues rather than a separate tracker.

To merge you need:

- one approving review from another developer
- green CI

If your pull request has been waiting more than 24 hours, send a `[REVIEW] VT-nnn` email. That is
not nagging, it is the documented process.

## Reviewing

You are expected to review roughly two per week. You are not expected to be an expert. Check four
things and you have added real value:

1. Does it do what the issue said it would do?
2. Is anything hardcoded that should be configurable, especially addresses, URLs and keys?
3. Are there tests, and do they cover the failure cases and not only the happy path?
4. Would you understand this code in three weeks?

Approve, or leave a comment. **Leaving a pull request untouched for two days is the only wrong
answer.** A fresher whose first pull request sits for four days learns that their work does not
matter, and that is expensive to undo.

Reviewing is not about finding fault. "This looks right to me, one question about line 40" is a
complete and useful review.

## Definition of Done

- [ ] Merged into `develop` through a pull request with one approval
- [ ] CI green
- [ ] Tests cover the failure cases, not only the success case
- [ ] No new TypeScript, ESLint or solhint errors
- [ ] If UI: works with a keyboard alone, and every control has a label
- [ ] If it touches an interface or the API spec: types regenerated and committed
- [ ] Demonstrated working, with a link or screenshot in the issue comments

## The frozen contracts

Three files are frozen from Monday 27 July 2026:

- `packages/contracts/src/interfaces/*.sol`
- `packages/api-spec/openapi.yaml`
- `packages/ballot/src/schema.ts`

Changing any of them needs a pull request labelled `contract-change` and Bhargav's approval. Adding
a new optional field is fine. Renaming or removing one is not.

The reason is not bureaucracy. Three teams are building against these right now, in parallel,
without talking to each other during the week. That only works because the shape they are building
against does not move.

Never hand write a type that describes one of these. Run `pnpm gen`, and commit what it produces.
CI fails if the committed output is stale.

## Before you push

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
```

All four are what CI runs. Running them locally first saves you a round trip.

## Getting stuck

Email your buddy first. Most problems die there.

If that does not resolve it, send `[BLOCKED] VT-nnn short description` to Bhargav and your buddy.
You get a reply within 12 hours, any day of the week including weekends.

Being stuck is normal. Staying quiet about being stuck is the one thing that actually hurts the
project, because it costs a whole week rather than an hour.

Every issue names a fallback task: something you can make progress on without waiting for an answer.
Use it while you wait.

## Security

Never commit a private key, a `.env` file, an RPC provider key, a database password, or a real name
paired with a wallet address.

If you commit one by accident, say so straight away. The value has to be rotated, and deleting it in
a later commit does not achieve that because it is still in the history. Telling someone in the hour
makes it a five minute problem.
