# Domain Research

Domain Research is an Alfares service for finding, checking, and monitoring domain names.

Users describe the business or service they are building. The service proposes domain candidates, checks availability and lifecycle evidence through RDAP-first providers, and can watch registered domains until a later scheduled check shows they are available.

## Stack

- NestJS 10, TypeScript, TypeORM, PostgreSQL.
- Static first-party UI served from `public/`.
- RDAP-first availability and expiry evidence.
- AI suggestions through ai-microservice (`POST /ai/complete`).
- Notifications through notifications-microservice (`POST /notifications/send`).
- Logs through logging-microservice.
- Kubernetes deployment in `statex-apps`.
- Secrets in Vault via External Secrets Operator.

## Assumptions

- `[ASSUMPTION: service domain]` `https://domain-research.alfares.cz`.
- `[ASSUMPTION: service port]` `4860`.
- `[ASSUMPTION: database name]` `domain_research`.
- `[ASSUMPTION: database user]` `domain_research`.
- `[ASSUMPTION: Vault path]` `secret/prod/domain-research`.
- `[ASSUMPTION: purchase flow]` handoff to registrar UI/API link, not automatic purchase in MVP.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `POST` | `/api/domain-suggestions` | Generate candidate domain names |
| `GET` | `/api/domain-suggestions/:id` | Read suggestion job and candidates |
| `POST` | `/api/availability/check` | Check selected domains |
| `POST` | `/api/watches` | Watch a domain for lifecycle changes |
| `GET` | `/api/watches` | List watches |
| `PATCH` | `/api/watches/:id` | Enable/disable or update notification target |
| `GET` | `/api/watches/:id/history` | Show availability observations |
| `POST` | `/api/internal/jobs/expiry-recheck/run-due` | Internal CronJob endpoint |
| `POST` | `/api/internal/jobs/notification-dispatch/run-due` | Internal CronJob endpoint |

## Run

```bash
npm install
npm run build
npm test
npm run docs:audit
npm run gate:pre-coding
npm run gate:deployment
npm run migrate
```

## Deploy

```bash
./scripts/deploy.sh
```

Deploy is blocked until required Vault secrets and database migration policy are ready.
