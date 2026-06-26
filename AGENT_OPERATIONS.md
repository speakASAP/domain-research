# Agent Operations

## Current Operating Mode

Remote-only Alfares microservice work.

## Standard Commands

```bash
ssh alfares 'cd /home/ssf/Documents/Github/domain-research && git status --short --branch'
ssh alfares 'cd /home/ssf/Documents/Github/domain-research && npm run build'
ssh alfares 'cd /home/ssf/Documents/Github/domain-research && npm test'
ssh alfares 'cd /home/ssf/Documents/Github/domain-research && npm run docs:audit'
ssh alfares 'cd /home/ssf/Documents/Github/domain-research && npm run gate:pre-coding'
ssh alfares 'cd /home/ssf/Documents/Github/domain-research && npm run gate:deployment'
```

## Deploy Gate

Deploy only after:

1. `npm run build` passes.
2. `npm test` passes.
3. `npm run docs:audit` passes.
4. `npm run gate:pre-coding` passes.
5. `npm run gate:deployment` passes.
6. Vault has required keys at `secret/prod/domain-research`.
7. Postgres database exists and `npm run migrate` passes.

Command:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/domain-research && ./scripts/deploy.sh'
```
