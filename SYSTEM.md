# SYSTEM.md

completeness_level: complete

status: validated

## Purpose
The Domain Research service proposes domain names, validates availability and lifecycle evidence, watches domains for later changes, and dispatches notifications when a previously watched domain becomes available again.

## Responsibilities
- Generate domain suggestion jobs from service or business input
- Evaluate available candidate names and check their lifecycle status
- Maintain watch records for domains that require future review
- Recheck watched domains and trigger notification logic when state changes
- Keep the service boundary aligned with auth, AI, and notifications dependencies without inventing parallel infrastructure

## Non-responsibilities
- Owning the identity provider or auth service itself
- Implementing a custom email or messaging stack
- Directly purchasing domains without an approved provider integration
- Replacing docs-rag or broader platform discovery services

## Inputs
- Business or service description for candidate generation
- RDAP and availability checks for candidate domains
- User-scoped watch records and lifecycle metadata
- Platform secrets and environment configuration from Vault

## Outputs
- Candidate domain suggestions and availability evidence records
- Watch lifecycle state and recheck results
- Notification dispatch records passed to notifications-microservice
- Health and readiness status for the platform and service owner

## Dependencies
- ai-microservice for domain suggestions
- notifications-microservice for real delivery flows
- logging-microservice for structured logs
- auth-microservice for bearer-token validation on authenticated watch endpoints
- db-server-postgres for service persistence
- Vault and External Secrets for secret management

## Upstream traceability
- AI candidate generation is upstream to the suggestion workflow.
- Auth validation is upstream to user-owned watch APIs.
- Notifications are upstream to the human-facing alert path.
- Postgres and Vault are platform dependencies rather than local domain ownership.

## Downstream artifacts
- Suggestion records and checked availability records
- Watch state and reminder workflows
- Notification records and domain-lifecycle evidence for operator review

## Validation criteria
- Domain suggestions remain relevant to the described use case.
- RDAP-first availability checks remain evidence-backed and repeatable.
- Watch logic triggers only when the service has legitimate eligibility to notify.
- Deployment readiness checks and service health remain green before rollout.

## Open questions
- Which registrar provider will be approved for a future purchase-adapter workflow.
- Which recipient policy will govern production notification delivery and escalation.
