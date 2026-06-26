# Goals

## Goal 1: Bootstrap Service Foundation

Status: completed

Create the remote repository, IPS chain, NestJS service skeleton, UI, RDAP-first availability checks, watch scheduling model, Kubernetes manifests, deploy script, and validation gates.

## Goal 2: Harden Persistence And Migrations

Status: completed

Add explicit TypeORM migrations, database readiness checks, and migration validation.

## Goal 3: Auth And User Ownership

Status: completed

Integrate hosted Auth, define `app:domain-research:*` roles, and bind watches to authenticated users.

Completed evidence: watch endpoints validate Auth bearer tokens through `auth-microservice`, the browser uses hosted Auth with callback state validation, live `/auth/validate-return-url` accepts `https://domain-research.alfares.cz/`, and Auth RBAC now registers `domain-research` plus the application `user` and `admin` roles.

## Goal 4: Provider Adapter Layer

Status: pending

Add provider adapters for registrar-backed availability and purchase links after provider/budget approval.

Current blocker: `[MISSING: paid domain provider approval and API keys]`.

## Goal 5: Production Deployment And Docs-RAG Ingestion

Status: completed

Deploy to Kubernetes, register in ecosystem docs, trigger docs-rag ingestion, and validate live smoke tests.

## Goal 6: Expiring Domain Drop Tracking

Status: completed

Warn users before watched domains are likely to leave post-expiration protection and become available. Preserve current-provider-check evidence before any availability notification.

## Goal 7: Watch Entry UX And AI Suggestion Quality

Status: completed

Allow users to add watched domains in bulk from comma-separated, Enter-confirmed, or pasted domain blocks, and route domain suggestion calls through the smarter AI tier instead of the cheap tier.
