# Runbook

**Written in Week 5, by PT-1.** This file is a placeholder with the required headings so that
nobody has to design the structure under pressure on the last week.

The test of this document is not whether it is complete. It is whether somebody who has never seen
this project can keep it running from this file alone, with nobody to ask. Write it for that person.

---

## Deploy

<!-- Exact commands. Not "run the deploy script", the actual command with the actual flags. -->

## Restart

### The web application

### The indexer

### PostgreSQL

## Health checks

<!-- How do you know it is up? What URL, what does a healthy response look like? -->

## Backups

### What is backed up, and what is not

<!--
State clearly that the chain is the source of truth and PostgreSQL is a cache that can be rebuilt.
It changes what a failed backup means, and someone panicking at 2am needs to know that.
-->

### How to take one

### How to restore one

<!-- A restore that has never been tested is not a backup. Test it in Week 5 and record the result. -->

## Certificates and HTTPS

<!-- Caddy handles renewal automatically. Say what to check if it has not. -->

## Common failures

| Symptom | Likely cause | What to do |
| ------- | ------------ | ---------- |
|         |              |            |

<!--
Fill this in from what actually went wrong during the project. The real incidents from Weeks 2 to 4
are worth more here than anything imagined in advance.
-->

## The indexer is behind

<!-- How to tell, how far behind is acceptable, how to make it catch up, and when to reindex. -->

## Rotating a key

### RPC provider key

### Deployment wallet

### Session secret

## Who to contact

| System | Owner | Backup |
| ------ | ----- | ------ |
|        |       |        |
