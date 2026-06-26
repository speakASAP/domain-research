# EP-TASK-001 Bootstrap Domain Research

## Objective

Create the initial remote Alfares service repository for domain research, aligned with ecosystem documentation, Kubernetes, Vault, and goal-driven development standards.

## Scope

- IPS documentation chain.
- NestJS backend.
- Static UI.
- RDAP-first availability checks.
- Watch and notification scheduling model.
- Kubernetes manifests and deploy script.
- Validation gates.

## Assumptions

- `[ASSUMPTION: service name]` `domain-research`.
- `[ASSUMPTION: external domain]` `domain-research.alfares.cz`.
- `[ASSUMPTION: port]` `4860`.
- `[ASSUMPTION: DB]` `domain_research`.

## Parallel Execution

| Lane | Status | Owner | Allowed Files | Forbidden Files | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| IPS/docs | ready_parallel | Docs worker | `00_*` to `23_*`, `docs/**`, root docs | `src/**`, `k8s/**` | none | `npm run docs:audit`, `npm run gate:pre-coding` |
| API/data model | ready_parallel | Backend worker | `src/domain-research/**`, tests | `k8s/**`, root IPS docs except task-specific updates | TASK-001 contract | `npm run build`, `npm test` |
| AI/RDAP adapters | ready_parallel | Integration worker | `src/integrations/**`, `src/domain-research/services/availability.service.ts` | `k8s/**`, docs baseline | provider contracts | `npm run build`, targeted tests |
| Ops/K8s | ready_parallel | Ops worker | `Dockerfile`, `scripts/**`, `k8s/**` | `src/domain-research/**` behavior | service name/port assumptions | `npm run gate:deployment`, `kubectl apply --dry-run=client` |
| Validation integration | final_integration | Orchestrator | `12_validation/**`, `reports/validation/**`, status docs | unrelated repos | all lanes complete | full validation suite |

## Merge Order

1. IPS/docs.
2. API/data model.
3. AI/RDAP adapters.
4. Ops/K8s.
5. Validation integration.

## Blockers

- `[MISSING: Vault secret values]`
- `[MISSING: production DB creation/migration approval]`
- `[MISSING: Auth roles/client registration]`
- `[MISSING: provider budget/API keys for paid fallback]`
