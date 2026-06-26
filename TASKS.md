# Tasks

## TASK-001 Bootstrap Domain Research

Status: in_progress

Trace:

- Vision: `01_vision/VISION.md`
- Goal Impact: `22_goal_impact/GOAL-IMPACT-TASK-001-bootstrap-domain-research.md`
- System: `04_systems/SYS-001-domain-research-service.md`
- Feature: `10_features/FEAT-001-domain-suggestion-and-watch.md`
- Execution Plan: `21_execution_plans/EP-TASK-001-bootstrap-domain-research.md`
- Coding Prompt: `14_prompts/PROMPT-TASK-001-bootstrap-domain-research.md`
- Validation: `12_validation/VAL-TASK-001-bootstrap-domain-research.md`

Acceptance:

- Remote repo exists at `/home/ssf/Documents/Github/domain-research`.
- NestJS service builds.
- Unit tests pass.
- UI is served from `public/`.
- K8s manifests and `scripts/deploy.sh` exist.
- CronJob manifests call protected internal endpoints.
- Required docs gates pass.

## TASK-002 Add Database Migrations

Status: pending

Blocked by `[MISSING: migration policy and live DB setup]`.

## TASK-003 Add Hosted Auth

Status: in_progress

User-owned watch API integration is implemented with Auth `/auth/validate`. Remaining blocker: `[MISSING: role contract and client registration]`.

## TASK-004 Expiring Domain Drop Tracking

Status: completed

Trace:

- Vision: `01_vision/VISION.md`
- Goal Impact: `22_goal_impact/GOAL-IMPACT-TASK-004-expiring-domain-drop-tracking.md`
- System: `04_systems/SYS-001-domain-research-service.md`
- Feature: `10_features/FEAT-004-expiring-domain-drop-tracking.md`
- Execution Plan: `21_execution_plans/EP-TASK-004-expiring-domain-drop-tracking.md`
- Coding Prompt: `14_prompts/PROMPT-TASK-004-expiring-domain-drop-tracking.md`
- Validation: `12_validation/VAL-TASK-004-expiring-domain-drop-tracking.md`

Acceptance:

- Watch lifecycle state and drop estimate are persisted.
- User can accept or decline drop tracking.
- Scheduler sends deduplicated week, 24-hour, 1-hour, and availability notifications.
- Final-day checks run hourly per watch through due scheduling.
