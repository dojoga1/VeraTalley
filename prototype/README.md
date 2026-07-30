# Prototype

`VeraTalley_dApp.jsx` is the original single-file prototype that was in this repository before the
project structure was set up. It was moved here unchanged, from the repository root, so that the
root is the monorepo and nothing else.

**It is not part of the build.** Nothing imports it, no test covers it, and neither the linter nor
the formatter touches it. Do not add to it and do not import from it.

It is kept because it is useful reading:

- It shows the intended shape of the voter journey: connect, choose, review, submit, receipt.
- It has the copy for several screens already written, which is worth more than it looks. Wording a
  non technical person understands is genuinely hard.
- The mock election in it is a reasonable shape for a three contest ballot.

Two things in it are **wrong for the real system**, and copying either across would be a real
mistake:

1. It points at `https://rpc-amoy.polygon.technology/`. That endpoint was switched off on 17 July
   2026. The real RPC URL comes from a provider and Bhargav issues it.
2. It holds vote counts and a registered voter list in the browser. In the real system the roll
   lives in the `Election` contract and the counts come from the chain. Nothing about eligibility or
   tallying is decided in the browser.

To put it back at the repository root:

```bash
git mv prototype/VeraTalley_dApp.jsx VeraTalley_dApp.jsx
```
