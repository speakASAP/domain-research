# Validation Debt

- docs-rag initial service-creation queries returned HTTP 200 with empty context; source files were used instead.
- Auth roles and hosted Auth client registration are not finalized.
- Paid provider fallback is not configured.
- `npm install` reported 46 audit vulnerabilities in the dependency tree. Triage is required before production hardening.
- `NOTIFICATION_SERVICE_TOKEN` remains a generated placeholder. Real notifications consumer token issuance remains `[MISSING: domain-research-specific notifications machine-auth contract]`.
- AI calls authenticate successfully with the production `AI_SERVICE_TOKEN`, but the smoke response reports `AGENT_NOT_AVAILABLE` for `agent_slug=domain-research-smoke`; register the Domain Research AI agent definition before treating AI suggestions as fully integrated.
- The deploy script timeout was too short for slow local-registry image pulls observed on 2026-06-26. Runtime was recovered manually after the migration Job completed.
