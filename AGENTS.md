# Agents

## Required reading
- `README.md`
- `BUSINESS.md`
- `SYSTEM.md`
- `TASKS.md`
- `STATE.json`
- `intent-preservation-system/docs/24_onboarding/PROJECT_ADOPTION_STANDARD.md`
- `intent-preservation-system/scripts/validate_adoption_profile.py`

## Authority
This repo owns the domain-research workflow, including suggestion generation, availability checks, watch tracking, and notification dispatch records. It does not own identity, payment, or registrar purchase infrastructure.

## Intent preservation system
This repo preserves the chain by documenting its service intent, operational boundaries, and evidence-based availability logic in a traceable, validation-ready profile.

## Safety and operations
- Do not print JWTs, production tokens, or raw RDAP payloads in logs or documentation.
- Keep notifications bound to the approved notifications service and never implement a separate custom sender.
- Domain purchase remains a handoff workflow until a provider adapter is explicitly approved.
- Preserve honest service boundaries and avoid claiming ownership of platform or identity infrastructure.

## Project-specific rules
- Use RDAP-first availability evidence and keep provider-specific adapters clearly separated.
- Treat notification delivery as an approved external contract rather than an in-repo feature.
- Do not invent a final provider budget, auth role, or notification recipient policy without explicit project owner approval.

## Required final report
The final report must describe the real domain-research service boundary, its validation evidence, and any remaining operational approval blockers that are not yet resolved.

## Service-to-service authentication
Any call this service makes to, or receives from, another service is governed by
[`auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md`](../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md).
Read it before writing or debugging a machine call — including a 401 from an internal
endpoint. New machine paths use an Auth-issued per-pair RS256 service JWT; a shared static
token is legacy and closed to new adopters.
