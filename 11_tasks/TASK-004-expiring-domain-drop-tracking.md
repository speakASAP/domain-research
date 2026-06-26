# TASK-004 Expiring Domain Drop Tracking

## Objective

Add lifecycle-aware scheduling so watched domains can be monitored through expiry, post-expiration protection, redemption, pending delete, and final availability.

## Upstream links

- Vision: `01_vision/VISION.md`
- Goal Impact: `22_goal_impact/GOAL-IMPACT-TASK-004-expiring-domain-drop-tracking.md`
- System: `04_systems/SYS-001-domain-research-service.md`
- Feature: `10_features/FEAT-004-expiring-domain-drop-tracking.md`
- Execution Plan: `21_execution_plans/EP-TASK-004-expiring-domain-drop-tracking.md`
- Coding Prompt: `14_prompts/PROMPT-TASK-004-expiring-domain-drop-tracking.md`
- Validation: `12_validation/VAL-TASK-004-expiring-domain-drop-tracking.md`

## Goal impact

Improves watch usefulness by warning users before a domain becomes available, not only after a daily recheck.

## Project invariant impact

Preserves evidence-backed availability claims and the prohibition on automatic purchase.

## Sensitive-data classification

No secrets or raw provider payloads. Store normalized statuses and hashes only.

## Contract/schema impact

Adds nullable/defaulted database columns to `domain_checks`, `domain_watches`, and `domain_notifications`.

## Replay/determinism impact

Scheduler decisions are deterministic for a given watch, provider check, env timing configuration, and current time.

## Scope

Backend lifecycle planning, scheduler notifications, migration updates, CronJob cadence, focused tests, UI consent controls, and docs.

## Non-goals

Registrar purchase automation and paid drop-catch integration.

## Acceptance criteria

See `10_features/FEAT-004-expiring-domain-drop-tracking.md`.

## Required context

ICANN ERRP and EPP lifecycle rules; existing watch scheduler and notifications integration.

## Validation task

Run build, tests, docs audit, pre-coding gate, deployment gate, and `git diff --check`.

## Required gates

Pre-coding, deployment-readiness, and validation evidence capture.
