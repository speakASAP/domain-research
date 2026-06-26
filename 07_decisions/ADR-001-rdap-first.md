# ADR-001 Use RDAP First

Status: accepted

## Context

The service needs domain availability and expiration evidence.

## Decision

Use RDAP as the default provider and add paid registrar/API adapters only as fallbacks or purchase integrations.

## Consequences

- No provider secret is required for baseline checks.
- Coverage and rate limits vary by registry.
- Availability is evidence-backed but must still expose confidence.
