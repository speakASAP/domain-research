# Goals

## Goal 1: Bootstrap Service Foundation

Status: in_progress

Create the remote repository, IPS chain, NestJS service skeleton, UI, RDAP-first availability checks, watch scheduling model, Kubernetes manifests, deploy script, and validation gates.

## Goal 2: Harden Persistence And Migrations

Status: pending

Add explicit TypeORM migrations, database readiness checks, and migration validation.

## Goal 3: Auth And User Ownership

Status: in_progress

Integrate hosted Auth, define `app:domain-research:*` roles, and bind watches to authenticated users.

Current progress: watch endpoints validate Auth bearer tokens through `auth-microservice` and derive notification email from the registered user. `[MISSING: final hosted Auth role/client registration]`.

## Goal 4: Provider Adapter Layer

Status: pending

Add provider adapters for registrar-backed availability and purchase links after provider/budget approval.

## Goal 5: Production Deployment And Docs-RAG Ingestion

Status: pending

Deploy to Kubernetes, register in ecosystem docs, trigger docs-rag ingestion, and validate live smoke tests.

## Goal 6: Expiring Domain Drop Tracking

Status: completed

Warn users before watched domains are likely to leave post-expiration protection and become available. Preserve current-provider-check evidence before any availability notification.
