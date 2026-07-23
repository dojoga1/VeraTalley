# Infrastructure

Owner: PT-1, Het.

## What goes here

| File                      | Issue  | Week |
| ------------------------- | ------ | ---- |
| `docker-compose.yml`      | VT-109 | 1    |
| `Caddyfile`               |        | 4    |
| `docker-compose.prod.yml` |        | 4    |

## VT-109, this week

`docker-compose.yml` with PostgreSQL 16 and Adminer, and a named volume so data survives a restart.

The credentials in `.env.example` are what the compose file should use:

```
postgresql://veratalley:veratalley@localhost:5432/veratalley
```

They are identical on every machine and deliberately not a secret. Production credentials come from
the environment and never appear in a file in this directory.

The honest test of this ticket is deleting your Docker volumes and starting from nothing. Anything
less passes on a machine that already has state and fails on a teammate's.

Adminer goes on `localhost:8080`. It is a small web UI for browsing the database, and it saves the
frontend team from installing a database client just to check whether a row exists.

## Later, Week 4

Caddy in front of the web app, which obtains and renews HTTPS certificates by itself. Deployment to
the server, backups, and the restore test.

A backup that has never been restored is not a backup. Test the restore in Week 5 and write the
result in [`../docs/runbook.md`](../docs/runbook.md).
