# Orchestrator Plan

## Current Plan

Complete TASK-001 with remote-only edits, run validation, and leave production deployment blocked until Vault and DB readiness are confirmed.

## Parallel Lanes

See `docs/21_execution_plans/EP-TASK-001-bootstrap-domain-research.md`.

## Approval-Gated Notifications Lane

The remaining production blocker is documented in `docs/orchestrator/NOTIFICATIONS_MACHINE_AUTH_LANE.md`. It is intentionally not implemented until the owner explicitly approves a notifications machine-auth contract, because the current safe evidence shows no existing `domain-research`-specific token issuer or validator path.
