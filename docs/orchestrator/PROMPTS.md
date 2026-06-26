# Worker Prompts

## Backend Worker

Own `src/domain-research/**`. Improve entities, services, and tests. Do not edit `k8s/**`.

## Ops Worker

Own `Dockerfile`, `scripts/**`, and `k8s/**`. Do not change application behavior.

## Docs Worker

Own IPS and orchestrator docs. Do not edit runtime code.

## Validation Worker

Own `12_validation/**` and `reports/validation/**`. Run validation after implementation lanes finish.

## Notifications Machine Auth Worker

Use `docs/orchestrator/NOTIFICATIONS_MACHINE_AUTH_LANE.md`. Do not start coding until the owner explicitly approves one contract. Keep the machine actor separate from Auth user identity and never copy or print the shared notifications `SERVICE_TOKEN`.
