# Agent operations

## Roles
- Readiness scanner: decide whether the task is domain-generation, availability-checking, watch logic, or a platform dependency issue.
- Worker agent: implement a bounded change that stays within the domain-research workflow.
- Worker monitor: watch for creep into payment, identity, or custom messaging infrastructure.
- Integration validator: confirm the service remains truthful about its provider, notifications, and auth dependencies.

## Before work
- Read the repo’s real service docs and policy before changing code.
- Confirm whether the task is in the suggestion flow, watch lifecycle, notification dispatch path, or a dependency integration.
- Check whether ownership really sits in Domain Research or in a platform service such as auth, notifications, or payment.

## Parallel work
- Parallel workstreams are allowed only when they do not claim ownership of auth, payment, or notification infrastructure outside the repo’s real scope.
- Shared files and service contracts should have a single integration owner and explicit merge order.

## Validation debt
- Use `docs/orchestrator/VALIDATION_DEBT.md` to record known out-of-scope debt without excusing current-task failures.
- Current-task failures remain blocking even if a debt ledger entry exists.

## Handoff
- Document any change that alters the domain suggestion flow, watch state, RDAP integration, or notification-trigger logic.

## Project-specific operations
- Keep service evidence tied to actual domain availability checks and user-owned watch actions.
- Preserve the explicit boundary between Domain Research and the platform services it relies on.
