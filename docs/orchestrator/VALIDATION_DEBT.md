# Validation Debt

- docs-rag initial service-creation queries returned HTTP 200 with empty context; source files were used instead.
- No live deployment has run.
- Auth roles and hosted Auth client registration are not finalized.
- Paid provider fallback is not configured.
- `npm install` reported 46 audit vulnerabilities in the dependency tree. Triage is required before production hardening.
- `AI_SERVICE_TOKEN` and `NOTIFICATION_SERVICE_TOKEN` exist in Vault as generated placeholders. Real cross-service consumer token issuance remains `[MISSING: service-token issuer contract]`.
