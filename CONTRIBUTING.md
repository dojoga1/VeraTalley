# Contributing

Everything here is short on purpose. If a rule is not written down it is not a rule.

## The week

| When                    | What                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Friday, 12:30 to 13:30  | The only meeting. Everyone explains briefly what they did. Bhargav says what comes next and assigns the week's issues |
| Saturday to Thursday    | You do your issue                                                                                                     |
| By the following Friday | It is merged into `develop`, finished and working                                                                     |
| Any time you are unsure | Ask your buddy. If it is a real doubt about what to build, ask Bhargav directly                                       |

That is the whole process. One meeting a week, one issue each, done by the next meeting.

**Finished means finished.** Not "mostly working", not "works on my machine", not "I will clean it
up next week". It is merged into `develop`, CI is green, and someone else has looked at it. A
half-done issue carried into next week is worse than a smaller issue completed, because everyone
downstream of you plans around the first one being real.

If your issue turns out bigger than it looked, say so **before** Friday and it gets made smaller.
That is a completely normal thing to happen and it is not a failure. Going quiet and arriving on
Friday with nothing is the only thing that actually hurts the project, because it costs a whole week
instead of a conversation.

## The rule that matters most: only change your own work

**Do not edit code that belongs to someone else's issue.** Not to fix a bug you spotted, not to
tidy something up, not because it was quicker than asking. This is the one rule that will cost the
project most if it is broken.

Two reasons, and the second is the one people underestimate.

Ten people editing the same files in the same week produces conflicts that take longer to untangle
than the original work took to write. And if two people change the same thing, the reason it broke
is no longer findable: neither of you knows what the other assumed.

`.github/CODEOWNERS` records who owns what. `apps/web/app/README.md` and the package READMEs say the
same thing in words.

**If you need something in somebody else's area changed**, there are exactly three options and none
of them is editing it yourself:

1. Message the owner and ask them to change it.
2. If it blocks you today, email Bhargav and your buddy. That is what unblocking is for.
3. Work around it for now and note it in your pull request so the owner can fix it properly.

**Reading other people's code is encouraged. Editing it is not.** Reviewing a pull request means
reading it and leaving a comment, which is exactly the point of having a buddy. If you think
something in it is wrong, say so in a comment. Do not push a commit to their branch to fix it.

The exception, and it is narrow: if a file is genuinely shared and your issue explicitly says you
touch it, then you touch it, and you say so clearly in your pull request description.

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

**Your buddy reviews your work, and you review theirs.** That is the normal path, and between the
two of you most things get sorted without anybody else being involved.

| You       | Your buddy |
| --------- | ---------- |
| Tirthesh  | Rahul      |
| Rahul     | Tirthesh   |
| Utkarsh   | Anusha     |
| Niharika  | Adarsh     |
| Adarsh    | Niharika   |
| Sakshi    | Varshitha  |
| Dimple    | Varshitha  |
| Varshitha | Dimple     |
| Het       | Anusha     |
| Anusha    | Het        |

You are not expected to be an expert. Check four things and you have added real value:

1. Does it do what the issue said it would do?
2. Is anything hardcoded that should be configurable, especially addresses, URLs and keys?
3. Are there tests, and do they cover the failure cases and not only the happy path?
4. Would you understand this code in three weeks?

**Leave a comment, or approve. Do not push a commit to their branch.** Reviewing means reading and
saying what you think. Fixing it yourself is the one rule above, broken.

**Leaving a pull request untouched for two days is the only wrong answer.** A fresher whose first
pull request sits for four days learns that their work does not matter, and that is expensive to
undo. If yours has been waiting more than a day, message your buddy, then Bhargav.

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

**A doubt about what to build goes to Bhargav.** If the issue is unclear, or you are not sure what
the right behaviour is, or you think the issue is wrong, ask him directly. Do not guess and do not
work around it. If an issue was unclear, that is his mistake to fix, not yours to absorb.

**A problem with how to build it goes to your buddy first.** Most things die there, and two people
working it out between them is faster than waiting on one person's inbox.

Either way, send it as `[BLOCKED] VT-nnn short description` so it is obvious what it is. You get a
reply within 12 hours, any day of the week including weekends.

Being stuck is normal. Staying quiet about being stuck is the one thing that actually hurts the
project, because it costs a whole week rather than an hour. Nobody has ever been thought less of for
asking on Saturday. Arriving on Friday having been stuck since Monday is the thing to avoid.

Every issue names a fallback task: something you can make progress on without waiting for an answer.
Use it while you wait, so being blocked never means being idle.

## Security

Never commit a private key, a `.env` file, an RPC provider key, a database password, or a real name
paired with a wallet address.

If you commit one by accident, say so straight away. The value has to be rotated, and deleting it in
a later commit does not achieve that because it is still in the history. Telling someone in the hour
makes it a five minute problem.
