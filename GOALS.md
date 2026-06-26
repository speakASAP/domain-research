# Goals

## Goal 1: Bootstrap Service Foundation

Status: in_progress

Create the remote repository, IPS chain, NestJS service skeleton, UI, RDAP-first availability checks, watch scheduling model, Kubernetes manifests, deploy script, and validation gates.

## Goal 2: Harden Persistence And Migrations

Status: pending

Add explicit TypeORM migrations, database readiness checks, and migration validation.

## Goal 3: Auth And User Ownership

Status: pending

Integrate hosted Auth, define `app:domain-research:*` roles, and bind watches to authenticated users.

## Goal 4: Provider Adapter Layer

Status: pending

Add provider adapters for registrar-backed availability and purchase links after provider/budget approval.

## Goal 5: Production Deployment And Docs-RAG Ingestion

Status: pending

Deploy to Kubernetes, register in ecosystem docs, trigger docs-rag ingestion, and validate live smoke tests.
