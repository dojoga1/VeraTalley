# Routes

Route groups in brackets do not appear in the URL. `app/(voter)/elections/page.tsx` serves
`/elections`, not `/voter/elections`. They exist so each area can have its own layout without that
showing up in the address bar.

| Folder     | Serves                                        | Owner | Week 1 issue |
| ---------- | --------------------------------------------- | ----- | ------------ |
| `(voter)/` | `/elections`, `/elections/[address]`          | AT    | VT-105       |
| `(admin)/` | `/admin/*`, behind Sign In With Ethereum      | MT-1  | VT-107       |
| `(audit)/` | `/audit`, `/audit/[address]`, no login at all | MT-2  | VT-108       |
| `api/`     | `/api/v1/*`                                   | PT-2  | VT-110       |
| `design/`  | `/design`, every component in every state     | AT-3  | VT-106       |

Create the folder you need. It does not exist yet because creating empty folders that nobody owns is
how a codebase ends up with three places to put the same thing.

## Two rules

**Nothing under `(audit)/` may require authentication.** That page is how Guarantee 1 is delivered.
If a member of the public has to sign in to check the count, the guarantee is theoretical.

**No route handler accepts a vote.** There is no `POST /api/vote` and there never will be. See
[`../../../docs/api-contract.md`](../../../docs/api-contract.md) section 4.
