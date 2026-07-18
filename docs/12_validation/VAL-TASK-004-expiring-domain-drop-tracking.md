# VAL-TASK-004 Expiring Domain Drop Tracking

## Artifact validated

TASK-004 implementation in `/home/ssf/Documents/Github/domain-research`.

## Validation scope

Lifecycle helper, scheduler notifications, additive migration, CronJob cadence, UI consent controls, and docs gates.

## Evidence

```bash
git diff --check
# result: passed

npm run build
# result: passed

npm test
# result: passed; 6 suites passed, 14 tests passed

npm run docs:audit
# result: Documentation audit passed

npm run gate:pre-coding
# result: Pre-coding gate passed

npm run gate:deployment
# result: Deployment readiness gate passed
```

## Gate evidence

Pre-coding and deployment-readiness gates passed on the remote Alfares repo.

## Invariant evidence

Availability notification remains queued only after `availability.checkOne` returns `available` inside the scheduled job. TASK-004 does not add automatic purchase behavior.

## Sensitive-data scan evidence

`git diff --check` passed. No secrets or raw RDAP payloads were added; code stores normalized registry statuses and raw payload hashes only.

## Replay and determinism evidence

Lifecycle helper has deterministic unit tests for pre-expiry, final-day, and redemption status planning. Scheduler tests cover one-week prompt queuing and availability notification gating.

## Passed criteria

- Watch lifecycle state and drop estimate are persisted.
- User can accept or decline drop tracking.
- Scheduler sends deduplicated lifecycle notifications.
- Availability notification requires a scheduled provider check.
- Final-day checks are planned hourly per watch; CronJob cadence is every five minutes to honor due timestamps.

## Failed criteria

None in local validation.

## Deviations

Drop timing is stored as an estimate unless RDAP status evidence provides stronger lifecycle context; exact availability still requires provider check.

## Production deploy evidence

```bash
./scripts/deploy.sh
# result: passed
# image pushed: localhost:5000/domain-research:d703edd
# migration job completed: domain-research migrations applied
# deployment/domain-research successfully rolled out
# in-pod health check passed

curl -k -s -i https://domain-research.alfares.cz/health
# result: HTTP/2 200

kubectl -n statex-apps get deploy domain-research -o custom-columns=IMAGE:.spec.template.spec.containers[0].image --no-headers
# result: localhost:5000/domain-research:d703edd

kubectl -n statex-apps get cronjob domain-research-expiry-recheck -o custom-columns=SCHEDULE:.spec.schedule --no-headers
# result: */5 * * * *
```

## Recommendation

TASK-004 is implemented, deployed, and validated.
