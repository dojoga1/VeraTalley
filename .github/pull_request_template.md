Closes #

<!--
Put the issue number above. That single line is what closes the issue and moves
the card to Done when this merges. Without it somebody has to do it by hand,
and eventually nobody does.
-->

## What this does

<!-- Two or three sentences. What changed and why, not a list of files. -->

## How to check it

<!--
How would a reviewer confirm this works? A command to run, a URL to open, or a
screenshot. If the reviewer has to work this out for themselves, the review
takes an hour instead of ten minutes and it will sit unreviewed.
-->

## Definition of Done

- [ ] Finished, not "mostly working". Someone else could use this as it stands
- [ ] CI green
- [ ] Tests cover the failure cases, not only the success case
- [ ] No new TypeScript, ESLint or solhint errors
- [ ] **Only files belonging to my own issue are changed.** If not, I have said why below
- [ ] If UI: works with a keyboard alone, and every control has a label
- [ ] If it touches an interface or the API spec: types regenerated and committed
- [ ] Demonstrated working, with a link or screenshot above

## Anything the reviewer should know

<!--
Optional. A decision you were unsure about, something you deliberately left
out, or a bit you would like a second opinion on. Saying "I could not work out
how to test X" here is useful and completely fine.
-->

<!--
If this changes anything in packages/contracts/src/interfaces/,
packages/api-spec/openapi.yaml or packages/ballot/src/schema.ts, add the
`contract-change` label and tag Bhargav. Those three are frozen and other
people are building against them right now.
-->
