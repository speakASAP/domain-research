# VAL-TASK-001 Bootstrap Domain Research

## Required Evidence

```bash
npm run build
npm test
npm run docs:audit
npm run gate:pre-coding
npm run gate:deployment
git status --short --branch
```

## Current Result

Passed on remote Alfares repository `/home/ssf/Documents/Github/domain-research` after bootstrap.

Evidence:

```bash
npm run build
# result: passed

npm test
# result: 1 test suite passed, 1 test passed

npm run docs:audit
# result: Documentation audit passed

npm run gate:pre-coding
# result: Pre-coding gate passed

npm run gate:deployment
# result: Deployment readiness gate passed

for f in k8s/configmap.yaml k8s/external-secret.yaml k8s/deployment.yaml k8s/service.yaml k8s/ingress.yaml k8s/expiry-recheck-cronjob.yaml k8s/notification-dispatch-cronjob.yaml; do kubectl apply --dry-run=client -f "$f"; done
# result: all manifests created in dry-run mode

Vault secret path and Postgres readiness:
# result: secret/prod/domain-research exists with required keys, values not printed
# result: Postgres database and role domain_research exist

Production deploy:
# result: image localhost:5000/domain-research:b46ed5e built and pushed
# result: migration Job completed with "domain-research migrations applied"
# result: deployment/domain-research rolled out
# result: internal pod /health returned HTTP 200
# result: public https://domain-research.alfares.cz/health returned HTTP 200
# result: public UI root returned HTTP 200
# result: POST /api/domain-suggestions returned HTTP 201
```

Residual validation debt:

- `npm install` reported 46 npm audit vulnerabilities inherited through the selected Nest/toolchain dependency set.
- Real AI/notification service-token issuance remains pending.

## Known Blockers

- `[MISSING: hosted Auth roles/client registration]`
- `[MISSING: real AI/notification service-token issuer contract]`
