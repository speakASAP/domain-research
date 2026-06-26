# Notifications Machine Auth Lane

Date: 2026-06-26
Status: closed

## Intent Preservation Chain

- Vision: Domain Research can notify users when a watched domain appears available without sharing broad production service tokens.
- Goal Impact: closes the remaining production service-to-service gap for domain availability notifications.
- System: `domain-research`, `notifications-microservice`, and optionally `auth-microservice`.
- Feature: machine-authenticated notifications dispatch.
- Task: provide a `domain-research`-specific machine credential accepted by notifications and stored in Vault.
- Execution Plan: implement one of the approved contracts below, sync Vault through External Secrets Operator, restart affected deployments, and smoke read-only plus send-path behavior without printing secrets.
- Coding Prompt: see the agent-ready prompt in this document.
- Code: `[MISSING: approval-gated changes]`.
- Validation: current evidence proves notifications rejects the placeholder token with HTTP 401.

## Current Evidence

- `domain-research` production deployment is healthy after AI service-token sync.
- `AI_SERVICE_TOKEN` is no longer placeholder debt; AI accepted the service token with HTTP 200.
- `NOTIFICATION_SERVICE_TOKEN` is now sourced from `secret/prod/notifications-microservice` property `SERVICE_TOKEN`, matching the RunLayer pattern.
- From `deployment/domain-research`, read-only notifications endpoints `/admin/stats` and `/admin/params` returned HTTP 200 with the runtime `NOTIFICATION_SERVICE_TOKEN`.
- No notification send/test-send route was called during validation.

## Resolution

Owner approval was granted to follow the existing Alfares notifications pattern used by RunLayer and Monitoring:

- `Authorization: Bearer <NOTIFICATION_SERVICE_TOKEN>`
- `k8s/external-secret.yaml` maps `NOTIFICATION_SERVICE_TOKEN` from `secret/prod/notifications-microservice` property `SERVICE_TOKEN`.
- No `x-internal-service-token` or `x-service-name` headers were introduced because they are not the established notifications consumer pattern in the inspected services.

## Parallel Execution

### Lane A: Notifications Consumer Contract

- Status: closed by approved RunLayer-compatible token mapping; no notifications code change required.
- Owner role: Notifications worker.
- Objective: add a `domain-research` machine actor path that is separate from user JWT/RBAC.
- Allowed files after approval: `notifications-microservice/src/auth/**`, focused tests, `notifications-microservice/k8s/external-secret.yaml`, docs.
- Forbidden files: unrelated delivery providers, webhook mutation flows, broad admin UI changes.
- Dependencies: owner approval for machine-auth contract.
- Validation evidence: unit guard tests for accepted `domain-research` service actor, user JWT behavior unchanged, unauthenticated requests still 401, read-only admin smoke 200 with the new credential.

### Lane B: Domain Research Runtime Wiring

- Status: closed.
- Owner role: Domain Research worker.
- Objective: send the accepted notifications credential/header shape from `NotificationClient`.
- Allowed files after Lane A: `domain-research/src/integrations/notification.client.ts`, `domain-research/k8s/**`, docs.
- Forbidden files: AI client, domain availability logic, database schema unless validation shows a necessary config field.
- Dependencies: accepted header/token contract and Vault key names.
- Validation evidence: in-pod read-only notifications smoke 200; controlled send-path smoke using a non-customer test recipient or mock/test channel only after owner approval.

### Lane C: Secret Operations

- Status: closed.
- Owner role: Ops worker.
- Objective: create dedicated Vault values and sync Kubernetes secrets without printing secret values.
- Allowed systems after approval: Vault keys under approved service paths, ExternalSecret metadata, deployment restarts.
- Forbidden actions: printing tokens, copying shared `SERVICE_TOKEN`, force-pushing repos, destructive DB operations.
- Validation evidence: ExternalSecret Ready=True, deployment rollout success, secret key presence by key name only.

### Final Integration

- Integration owner: original Domain Research orchestrator thread.
- Validation owner: Validation worker.
- Merge order: Lane A, Lane C, Lane B, final evidence docs.
- Final gate: `domain-research` health HTTP 200, AI auth smoke 200, AI agent smoke without `error_code`, notifications read-only auth smoke 200, no secret values in docs/logs, repo clean and pushed.

## Agent-Ready Prompt

Work remote-only on `alfares`. Do not read or print secret values. Implement the owner-approved notifications machine-auth contract for `domain-research` without copying the shared notifications `SERVICE_TOKEN`. Preserve user JWT behavior and existing public routes. Add focused tests and docs evidence. After approval and validation, update Vault key names only in docs, sync ExternalSecret, restart affected deployments, and verify from `deployment/domain-research` without sending real customer notifications.
