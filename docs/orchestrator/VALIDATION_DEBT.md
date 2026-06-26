# Validation Debt

- docs-rag initial service-creation queries returned HTTP 200 with empty context; source files were used instead.
- No live deployment has run.
- No Vault secret exists yet at `secret/prod/domain-research`.
- TypeORM migrations are not yet explicit; bootstrap uses entity definitions only.
- Auth roles and hosted Auth client registration are not finalized.
- Paid provider fallback is not configured.
- `npm install` reported 46 audit vulnerabilities in the dependency tree. Triage is required before production hardening.
