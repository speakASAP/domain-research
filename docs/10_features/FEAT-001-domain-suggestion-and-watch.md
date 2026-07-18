# FEAT-001 Domain Suggestion And Watch

Users can:

1. Describe a business or service.
2. Receive suggested domain names.
3. Check availability for selected candidates.
4. Watch registered domains.
5. Receive notifications after scheduled rechecks identify availability.

Acceptance:

- Candidate generation works with AI fallback to deterministic heuristics.
- Availability checks persist observations.
- Watches schedule next recheck from expiry date when available.
- CronJobs call protected internal endpoints.
