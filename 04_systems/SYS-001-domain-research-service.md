# SYS-001 Domain Research Service

## Purpose

Provide domain suggestion, availability evidence, expiry monitoring, and user notification workflow as a Kubernetes-deployed Alfares service.

## Interfaces

- UI: `/`
- Health: `/health`
- API: `/api/domain-suggestions`, `/api/availability/check`, `/api/watches`
- Internal jobs: `/api/internal/jobs/*`

## Dependencies

- PostgreSQL
- ai-microservice
- notifications-microservice
- logging-microservice
- docs-rag-microservice
- Vault + External Secrets Operator

## Validation

- Build and test pass.
- Docs gates pass.
- K8s manifests are syntactically present.
- Live deploy is blocked until Vault and DB readiness are confirmed.
