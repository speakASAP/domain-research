# EP-TASK-001-bootstrap-service

completeness_level: complete

status: validated

## Upstream traceability
- `../11_tasks/TASK-001-bootstrap-service.md`
- `../22_goal_impact/GOAL-IMPACT-TASK-001.md`
- `../12_validation/VAL-TASK-001-bootstrap-service.md`

## Scope
- Document the Domain Research service boundary, provider dependencies, and operational responsibility model
- Align the required IPS adoption artifacts and state file to the real repo scope
- Validate the repo with the shared IPS planning checker

## Non-goals
- Creating a direct purchase stack without approved provider integration
- Inventing identity or payment ownership inside the repo
- Altering the shared IPS governance standard or master rollout plan

## Project invariants
- Ownership boundaries must remain truthful and explicit.
- Domain evidence must be reviewable and provider-aware.
- Validation evidence must match the actual service boundary.

## Sensitive-data handling
No token, secret, or raw production data is introduced into the adoption docs.

## Contract validation plan
Review the service contract for required and not-applicable capability decisions and ensure the repo remains aligned with auth, notifications, AI, and Postgres dependencies without overclaiming platform ownership.

## Replay and determinism plan
The task is deterministic because it is derived from the repo’s real service behavior and the central IPS validation rules.

## Files to inspect
- README.md
- BUSINESS.md
- SYSTEM.md
- AGENTS.md
- TASKS.md
- STATE.json
- repo docs and current operational metadata

## Files to create
- `ips-adoption.json`
- `docs/00_constitution/CONSTITUTION.md`
- `docs/01_vision/VISION.md`
- `docs/06_architecture/INTEGRATION_CONTRACT.md`
- `docs/11_tasks/TASK-001-bootstrap-service.md`
- `docs/12_validation/VAL-TASK-001-bootstrap-service.md`
- `docs/17_governance/PROJECT_INVARIANTS.md`
- `docs/21_execution_plans/EP-TASK-001-bootstrap-service.md`
- `docs/22_goal_impact/GOAL-IMPACT-TASK-001.md`
- `docs/orchestrator/VALIDATION_DEBT.md`

## Files to modify
- root docs and repo metadata where the adoption profile requires reformatting to the IPS standard

## Files that must not be modified
- `shared/config/ecosystem-repositories.json`
- the master rollout plan in the IPS repo

## Implementation steps
1. Read the repo’s real service docs and issue boundaries.
2. Run the scaffold to create any missing adoption artifacts.
3. Rewrite root docs and governance files to the actual Domain Research model.
4. Set the required `STATE.json` keys and `ips-adoption.json` capability decisions.
5. Validate the repo with the central IPS planning script and fix remaining errors.

## Parallel execution
This is a single-repo onboarding task and does not include deploy work or unrelated identity or payment implementation.

## Blockers
- Any future purchase flow or final notification policy requires explicit project-owner approval before expansion beyond the current evidence-driven domain workflow.

## Test plan
- Validate the repo with the central IPS planning script.
- Confirm the service docs remain aligned with the actual domain workflow and external dependencies.

## Validation plan
- `python3 intent-preservation-system/scripts/validate_adoption_profile.py --root domain-research --phase planning`

## Gate commands
- `python3 intent-preservation-system/scripts/validate_adoption_profile.py --root domain-research --phase planning`

## Documentation updates
- Update the repo’s adoption docs and validation ledger to reflect the actual Domain Research service scope.

## Rollback plan
- If validation fails, fix the specific missing artifact or placeholder issue and rerun the planner before committing.

## Handoff
The repo remains with a valid adoption profile and explicit operational boundaries for the next review.

## Completion checklist
- [x] Real service boundary documented
- [x] Required adoption artifacts present
- [x] Capability decisions truthful and traceable
- [x] Validator passed in planning phase
- [x] Traceability links include task, goal impact, execution plan, and validation docs
