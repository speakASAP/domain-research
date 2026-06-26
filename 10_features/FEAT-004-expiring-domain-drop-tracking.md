# FEAT-004 Expiring Domain Drop Tracking

## User or system need

A user watching a registered domain needs proactive warnings before the domain exits post-expiration protection and becomes available to register.

## Goal impact

Extends the watch model in `FEAT-001` from periodic expiry checks to lifecycle-aware drop monitoring.

## Scope

- Persist registry lifecycle status evidence from RDAP.
- Estimate a drop candidate timestamp from expiry plus configurable post-expiration, redemption, and pending-delete windows.
- Ask the user around the one-week window whether the service should keep watching.
- Continue watching unless the user declines, so missed email does not silently cancel protection.
- Notify at approximately 24 hours and one hour before estimated drop.
- Recheck hourly in the final day and notify immediately when a scheduled check shows availability.

## Non-goals

- No automatic domain purchase.
- No guarantee that every TLD follows the same lifecycle timing.
- No paid drop-catch registrar integration.

## Acceptance criteria

- Watch rows store lifecycle stage, registry statuses, drop estimate, and tracking consent.
- Scheduler queues deduplicated lifecycle notifications.
- Declining tracking disables the watch and clears the next check.
- Availability notification still requires a fresh provider check.
- Expiry recheck CronJob runs frequently enough to honor exact `nextCheckAt` scheduling.

## Dependencies

- RDAP availability checks.
- notifications-microservice.
- Auth-backed watch ownership.

## Validation strategy

Run `npm run build`, `npm test`, docs gates, and deployment readiness gate.
