# CP-TASK-004 Expiring Domain Drop Tracking

## Preserved context

Domain Research watches must warn users before likely domain drop, but must never claim availability without a current provider check.

## Key constraints

- ICANN gTLD lifecycle includes pre-expiration reminders, post-expiration renewal behavior, a 30-day Redemption Grace Period after deletion, and purge after pending delete.
- Timing is TLD/registrar dependent, so the service stores estimates and registry status evidence.
- User can decline tracking; otherwise service continues to protect against missed messages.

## Required files

`src/domain-research/services/domain-lifecycle.ts`, scheduler/watch services, watch/check/notification entities, migration, CronJob, UI, validation report.
