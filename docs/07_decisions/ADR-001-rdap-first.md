# ADR-001 Use RDAP First

Status: accepted

## Context

The service needs domain availability and expiration evidence.

## Decision

Use RDAP as the default provider and add free WHOIS over TCP/43 as a conservative fallback when RDAP cannot produce a definitive result. Paid registrar/API services are not part of the current availability-checking path.

## Consequences

- No provider secret is required for baseline checks or fallback checks.
- Coverage and rate limits vary by registry.
- WHOIS fallback uses only explicit registry text markers; ambiguous text remains `unknown`.
- Availability is evidence-backed but must still expose confidence.
