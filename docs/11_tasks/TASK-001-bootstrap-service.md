# TASK-001-bootstrap-service

completeness_level: complete

status: validated

## Objective
Create and validate the initial IPS adoption profile for the Domain Research service so its governance, runtime contract, and task traceability match the actual service reality.

## Upstream links
- `../22_goal_impact/GOAL-IMPACT-TASK-001.md`
- `../21_execution_plans/EP-TASK-001-bootstrap-service.md`
- `../12_validation/VAL-TASK-001-bootstrap-service.md`

## Goal impact
The service gains a truthful adoption profile that captures domain suggestions, availability checks, watch tracking, and approved notification boundaries without overclaiming provider or auth ownership.

## Project invariant impact
The project remains aligned with the invariant that real service ownership and operational boundaries must stay explicit and consistent.

## Sensitive-data classification
The onboarding docs do not include secret values, raw provider payloads, or production token data.

## Contract and schema impact
This task defines the repository-level adoption and governance contract and does not change the live domain workflow logic beyond documentation alignment.

## Replay and determinism impact
The task is deterministic because it is anchored to the service’s real implementation and the shared IPS validator rules.

## Scope
- Document the service’s real domain research and watch workflow
- Align root docs and governance artifacts to the actual service boundary
- Validate the repo against the IPS adoption checker

## Non-goals
- Creating a general-purpose purchase system without explicit provider approval
- Building a custom notification stack instead of using the approved notifications boundary
- Claiming ownership of auth or payment infrastructure outside the repo’s real domain

## Acceptance criteria
- The required sections exist in each mandated artifact.
- The repo passes the IPS planning validator.
- No placeholder markers or invented provider claims remain in the profile.
- The docs remain honest about the service’s dependencies and care boundaries.

## Required context
- Real repo documentation and runtime configuration
- Shared IPS adoption standard and validation script

## Validation task
Run the repository-level validator and confirm the planning gate passes before committing the repo work.

## Required gates
- `python3 intent-preservation-system/scripts/validate_adoption_profile.py --root domain-research --phase planning`

## Parallel workstream context
This task is single-repo onboarding work and does not include unrelated payment or identity implementation.
