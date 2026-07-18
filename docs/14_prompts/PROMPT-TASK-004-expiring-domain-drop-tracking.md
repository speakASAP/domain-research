# Coding Prompt TASK-004

## Task summary

Add expiring-domain drop tracking to Domain Research watches.

## Execution plan link

`docs/21_execution_plans/EP-TASK-004-expiring-domain-drop-tracking.md`

## Required context

Existing watch scheduler, RDAP availability service, notifications integration, and ICANN lifecycle notes captured in the task docs.

## Allowed changes

`src/domain-research/**`, `src/integrations/notification.client.ts`, `scripts/migrate.js`, `k8s/expiry-recheck-cronjob.yaml`, `public/**`, and TASK-004 docs.

## Forbidden changes

No secrets, no raw provider payloads, no automatic registrar purchase, no protected vision/constitution edits.

## Implementation instructions

Use additive schema changes, dedupe lifecycle notifications, and preserve a fresh provider check before any `domain_available` notification.

## Acceptance criteria

See `docs/11_tasks/TASK-004-expiring-domain-drop-tracking.md`.

## Validation commands

`npm run build`, `npm test`, `npm run docs:audit`, `npm run gate:pre-coding`, `npm run gate:deployment`, `git diff --check`.

## Expected output

Code, tests, and validation evidence for lifecycle-aware drop tracking.
