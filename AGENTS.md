# Repository Agent Instructions

Shared rules live here:

- Codex profile: `/home/ssf/.codex/AGENTS.md`
- Cross-agent standard: `/home/ssf/.ai-agent-standards/CROSS_AGENT_AUTOMATION_STANDARD.md`
- Repository operations: `AGENT_OPERATIONS.md`

Read those first, then follow the repository-specific notes below and the current planning/status files.

## Repository-Specific Notes

# Agents: domain-research

## Core Intent

Domain Research helps Alfares users describe a business or service, receive domain-name candidates, check domain availability and expiration evidence, and watch registered domains until they become available.

The service must preserve the chain:

```text
Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation
```

If any fact is unavailable, mark it as `[MISSING: ...]` or `[UNKNOWN: ...]`.

## Remote-First Workspace

All implementation work happens on the remote server:

```bash
ssh alfares
cd /home/ssf/Documents/Github/domain-research
```

Do not save or edit the service code under local `/Users/Sergej.Stasok/Documents`.

## Required Reading

Before implementation, branch orchestration, or launching workers, read:

```text
README.md
BUSINESS.md
SYSTEM.md
GOALS.md
TASKS.md
STATE.json
docs/orchestrator/INTENT.md
docs/orchestrator/GOALS.md
docs/orchestrator/PLAN.md
docs/orchestrator/PROMPTS.md
docs/orchestrator/STATUS.md
docs/orchestrator/VALIDATION_DEBT.md
docs/21_execution_plans/EP-TASK-001-bootstrap-domain-research.md
```

## Knowledge Retrieval

Query docs-rag-microservice first for architectural, deployment, migration, operations, and API-contract questions when a service JWT is available:

```bash
curl -s -X POST http://docs-rag-microservice.statex-apps.svc.cluster.local:3397/retrieval/agent-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "domain-research architecture or operation question", "maxTokens": 3000}'
```

Current bootstrap evidence: docs-rag returned HTTP 200 with empty context for initial Alfares service-creation queries, so source files were used and this gap is recorded in validation debt.

## Product And Operations Guardrails

- Secrets must live in Vault at `secret/prod/domain-research`, synced by External Secrets Operator.
- Do not print JWTs, service tokens, notification recipients, raw WHOIS/RDAP payloads, or production data in docs, prompts, tests, logs, or screenshots.
- RDAP is the default source for domain lifecycle evidence. Paid registrar/API providers are adapters and require explicit secret/provider setup.
- Notifications are sent only through notifications-microservice. This repo must not implement its own email/Telegram sender.
- Domain purchase is a handoff/link workflow until an approved registrar API integration exists.
- Watches and notifications are user-impacting. Test sends to real recipients require explicit approval.

## Parallel Planning Default

Use disjoint work ownership. Every substantial plan must include:

- objective;
- allowed files;
- forbidden files;
- dependencies and blockers;
- validation evidence;
- integration owner;
- merge order.

## Commands

```bash
npm run build
npm test
npm run docs:audit
npm run gate:pre-coding
npm run gate:deployment
./scripts/deploy.sh
```

Do not deploy unless Vault secrets, database migration state, and readiness gates are satisfied.

## Active Agents

<!-- Coordinator-maintained -->
None.
