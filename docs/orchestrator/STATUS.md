# Status

## 2026-06-26

Bootstrap created and remotely validated.

Completed:

- Ecosystem research through Alfares remote repos.
- Subagent research for standards, AI integration, architecture, and repo layout.
- Initial service assumptions recorded.
- Remote repository created at `/home/ssf/Documents/Github/domain-research`.
- NestJS service skeleton, UI, RDAP checks, watch model, CronJob endpoints, Kubernetes manifests, deploy script, and IPS docs created.
- `npm install` completed and generated `package-lock.json`.
- `npm run build` passed.
- `npm test` passed.
- `npm run docs:audit` passed.
- `npm run gate:pre-coding` passed.
- `npm run gate:deployment` passed.
- `kubectl apply --dry-run=client` passed for configmap, external-secret, deployment, service, ingress, and both CronJobs.
- Vault path `secret/prod/domain-research` created with required keys.
- Postgres database and role `domain_research` created.
- Explicit migration script added as `scripts/migrate.js`.
- Deploy script now runs migrations through a Kubernetes Job with ConfigMap+ExternalSecret env.
- Validation after deployment hardening passed: `npm run build`, `npm test`, `npm run docs:audit`, `npm run gate:pre-coding`, `npm run gate:deployment`, and manifest dry-run.
- Production deployment completed on Kubernetes.
- AI service-token issuance completed for `domain-research`; `AI_SERVICE_TOKEN` in `secret/prod/domain-research` now contains an AI-compatible service JWT and the deployment was restarted from the synced ExternalSecret.
- AI agent registry configured active `domain-suggestion` agent for service scope `domain-research`.
- Notifications token wiring completed using the RunLayer-compatible ExternalSecret pattern: `NOTIFICATION_SERVICE_TOKEN` is sourced from `secret/prod/notifications-microservice` property `SERVICE_TOKEN`.

Pending:

- Hosted Auth role/client registration.

## Production Deploy Evidence

Date: 2026-06-26

Commit deployed: `b46ed5e chore: prepare production deployment`

Commands/evidence:

```bash
./scripts/deploy.sh
# validation passed
# image built and pushed: localhost:5000/domain-research:b46ed5e
# ConfigMap and ExternalSecret applied
# migration job eventually completed: domain-research migrations applied

kubectl rollout status deployment/domain-research -n statex-apps
# deployment "domain-research" successfully rolled out

kubectl exec -n statex-apps <domain-research-pod> -- node -e 'fetch("http://127.0.0.1:4860/health")...'
# HTTP 200 {"status":"ok","service":"domain-research",...}

curl -k https://domain-research.alfares.cz/health
# HTTP 200 {"status":"ok","service":"domain-research",...}

curl -k https://domain-research.alfares.cz/
# HTTP 200 root UI served

curl -k -X POST https://domain-research.alfares.cz/api/domain-suggestions ...
# HTTP 201, suggestion job and candidates persisted
```

Deploy note: the migration Job initially exceeded the deploy script timeout because the cluster took several minutes to pull images from the local registry. The image pull eventually completed, the migration Job succeeded, and runtime manifests were applied manually from the same commit.

## Service Token Evidence

Date: 2026-06-26

AI integration:

```bash
vault kv patch secret/prod/domain-research AI_SERVICE_TOKEN=<redacted>
kubectl -n statex-apps annotate externalsecret domain-research-secret force-sync=<timestamp> --overwrite
kubectl -n statex-apps rollout restart deployment/domain-research
kubectl -n statex-apps rollout status deployment/domain-research --timeout=180s
# deployment "domain-research" successfully rolled out

kubectl -n statex-apps exec -i deploy/domain-research -- node -
# POST http://ai-microservice.statex-apps.svc.cluster.local:3380/ai/complete
# HTTP 200; AI service accepted the domain-research service token.
# AI service accepted the domain-research service token.
```

Notifications integration:

```bash
# Previous placeholder state before owner approval:
# GET http://notifications-microservice.statex-apps.svc.cluster.local:3368/admin/stats
# HTTP 401 {"message":"Invalid token","error":"Unauthorized","statusCode":401}

# Final approved RunLayer-compatible state:
# k8s/external-secret.yaml sources NOTIFICATION_SERVICE_TOKEN from
# secret/prod/notifications-microservice property SERVICE_TOKEN.
# Domain Research was restarted after ExternalSecret sync.
```

## Final Integration Evidence

Date: 2026-06-26

```bash
kubectl -n statex-apps exec -i deploy/domain-research -- node -
# AI /ai/complete with agent_slug=domain-suggestion:
# HTTP 200, agent_slug=domain-suggestion, error_code=null
#
# Notifications read-only auth smoke:
# GET /admin/stats -> HTTP 200
# GET /admin/params -> HTTP 200
#
# No notification send/test-send route was called.

kubectl -n statex-apps get externalsecret domain-research-secret
# STATUS SecretSynced, READY True

curl -k https://domain-research.alfares.cz/health
# HTTP 200
```
