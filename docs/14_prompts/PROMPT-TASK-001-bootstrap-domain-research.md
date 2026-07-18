# Coding Prompt TASK-001

## Role

Alfares remote implementation worker.

## Task

Bootstrap the `domain-research` service with IPS docs, NestJS service skeleton, domain suggestion workflow, RDAP availability checks, watch scheduling, Kubernetes manifests, and validation gates.

## Constraints

- Work only in `/home/ssf/Documents/Github/domain-research`.
- Do not edit sibling repos.
- Do not add secrets.
- Keep generated artifacts traceable to TASK-001.

## Validation

Run:

```bash
npm run build
npm test
npm run docs:audit
npm run gate:pre-coding
npm run gate:deployment
```
