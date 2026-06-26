# Tasks

## TASK-001 Bootstrap Domain Research

Status: completed

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

Status: completed

Acceptance:

- Explicit migration script exists at `scripts/migrate.js`.
- Deployment runs migrations through a Kubernetes Job.
- Production database and role exist.
- Validation gates and production deployment evidence are recorded in `docs/orchestrator/STATUS.md`.

## TASK-003 Add Hosted Auth

Status: completed

Acceptance:

- Watch endpoints validate Auth bearer tokens through `auth-microservice` `/auth/validate`.
- Watch ownership binds `userId` and registered Auth email.
- Browser login flow uses hosted Auth with `client_id=domain-research`, callback fragment handling, and state validation.
- Live Auth return-url validation passes for `https://domain-research.alfares.cz/`.
- Auth RBAC registration includes `domain-research` plus `app:domain-research:user` and `app:domain-research:admin`.

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

## TASK-005 Watch Bulk Entry And Smarter AI Suggestions

Status: completed

Trace:

- Vision: `01_vision/VISION.md`
- Goal Impact: `[MISSING: dedicated goal-impact document for owner-requested UX/AI quality polish]`
- System: `04_systems/SYS-001-domain-research-service.md`
- Feature: `10_features/FEAT-001-domain-suggestion-and-watch.md`
- Execution Plan: `[MISSING: dedicated execution plan document for owner-requested UX/AI quality polish]`
- Coding Prompt: owner request on 2026-06-26 to support comma/Enter/paste domain watch entry and use a smarter AI model tier.
- Validation: `node --check public/app.js`, `git diff --check`, `npm run build`, `npm test`.

Acceptance:

- Watch input turns comma-separated entries and Enter-confirmed entries into removable domain chips.
- Pasted domain blocks can create multiple pending watch chips at once.
- Submitting creates watches for all pending chips and keeps failed domains visible.
- AI suggestions use the `smart` tier by default and production config sets `AI_MODEL_TIER=smart`.
