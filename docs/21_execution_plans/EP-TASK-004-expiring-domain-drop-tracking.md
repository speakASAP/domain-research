# EP-TASK-004 Expiring Domain Drop Tracking

## Metadata

- status: draft work requested by owner
- owner: implementation orchestrator
- created: 2026-06-26

## Upstream traceability

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation.

## Goal impact

Warn users before watched domains become available while preserving evidence-backed claims.

## Project invariants

- Availability notification requires a current provider check.
- No automatic purchase.
- No secrets or raw RDAP payloads.

## Sensitive-data handling

No secrets, customer data samples, raw RDAP payloads, or notification token values in code comments, tests, docs, or logs.

## Contract validation plan

Schema changes are additive with defaults. Existing watch API remains compatible; PATCH accepts optional `dropTrackingConsent`.

## Replay/determinism plan

Lifecycle helper is pure for a fixed input/time/env configuration and covered by unit tests.

## Scope

- RDAP registry statuses.
- Lifecycle planning helper.
- Watch lifecycle fields.
- Deduped domain notification fields.
- Scheduler lifecycle notifications.
- User consent update path.
- CronJob cadence.
- Tests and validation docs.

## Non-goals

No purchase automation, no registrar API integration, no exact TLD-specific drop-time guarantee.

## Files to inspect

`src/domain-research/**`, `src/integrations/notification.client.ts`, `scripts/migrate.js`, `k8s/expiry-recheck-cronjob.yaml`, IPS docs.

## Files to create

`src/domain-research/services/domain-lifecycle.ts`, lifecycle and scheduler tests, TASK-004 docs.

## Files to modify

Watch/check/notification entities, watch service, scheduler service, notification client, migration, UI, CronJob, task/status docs.

## Files that must not be modified

`docs/00_constitution/CONSTITUTION.md`, `docs/01_vision/VISION.md`, secrets, sibling repos.

## Implementation steps

1. Persist normalized RDAP statuses.
2. Add additive lifecycle/drop-tracking schema fields.
3. Implement lifecycle plan helper with configurable ICANN-derived defaults.
4. Update watch creation and patch behavior.
5. Update scheduler to recheck due watches, dedupe notifications, and queue week/day/hour/available messages.
6. Update notification content and UI consent controls.
7. Add focused tests and run gates.

## Test plan

`npm run build`, `npm test`, `npm run docs:audit`, `npm run gate:pre-coding`, `npm run gate:deployment`, `git diff --check`.

## Validation plan

Capture command outputs in `docs/12_validation/VAL-TASK-004-expiring-domain-drop-tracking.md`.

## Gate commands

See test plan.

## Documentation updates

Feature, task, execution plan, coding prompt, validation report, project invariants, TASKS, GOALS, STATE, and orchestrator status.

## Rollback plan

Revert code changes and keep additive DB columns unused. Restore CronJob cadence to daily if runtime load is unacceptable.

## Parallel Execution

| Workstream | Status | Owner role | Scope | Dependencies | Validation owner | Merge order |
| --- | --- | --- | --- | --- | --- | --- |
| Lifecycle model | ready now | Backend worker | lifecycle helper, entities, migration | existing watch schema | backend worker | 1 |
| Scheduler notifications | dependency-gated | Backend worker | scheduler and notification client | lifecycle model | backend worker | 2 |
| UI consent controls | ready now | UI worker | `public/**` only | PATCH contract | UI worker | 3 |
| Docs and gates | final integration | Orchestrator | IPS docs, reports | all code lanes | orchestrator | 4 |

Shared files/contracts: watch schema, notification type contract, `UpdateWatchDto`. Integration owner: orchestrator. Validation owner: orchestrator.

## Agent handoff prompt

Implement TASK-004 in `/home/ssf/Documents/Github/domain-research` only. Preserve evidence-backed availability invariants and do not add purchase automation or secrets.

## Completion checklist

- [ ] Code implemented
- [ ] Tests pass
- [ ] Docs gates pass
- [ ] Deployment gate passes
- [ ] Validation report updated
