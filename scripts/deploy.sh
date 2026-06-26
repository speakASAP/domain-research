#!/bin/bash
# deploy.sh - Kubernetes deployment for domain-research
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVICE_NAME="domain-research"
NAMESPACE="${NAMESPACE:-statex-apps}"
REGISTRY="${REGISTRY:-localhost:5000}"
HEALTH_PORT="${PORT:-4860}"
IMAGE_TAG="${1:-$(cd "$PROJECT_ROOT" && git rev-parse --short HEAD 2>/dev/null || date -u +%Y%m%d%H%M%S)}"
IMAGE="${REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}"
IMAGE_LATEST="${REGISTRY}/${SERVICE_NAME}:latest"

# shellcheck disable=SC1091
source "$(dirname "$PROJECT_ROOT")/shared/scripts/load-deploy-phase-timing.sh" "$PROJECT_ROOT" 2>/dev/null \
  || source "$HOME/Documents/Github/shared/scripts/load-deploy-phase-timing.sh" "$PROJECT_ROOT" \
  || { echo -e "${RED}Error: deploy timing library not found${NC}" >&2; exit 1; }
deploy_timing_init "$SERVICE_NAME"

echo -e "${BLUE}"
echo "=========================================================="
echo "  Domain Research - Kubernetes Deployment"
echo "=========================================================="
echo -e "${NC}"

cd "$PROJECT_ROOT"

deploy_timing_phase_start "Validation"
npm run build
npm test
npm run docs:audit
npm run gate:deployment
deploy_timing_phase_end "Validation"

deploy_timing_phase_start "Build image"
docker build -t "$IMAGE" -t "$IMAGE_LATEST" "$PROJECT_ROOT"
deploy_timing_phase_end "Build image"

deploy_timing_phase_start "Push image"
docker push "$IMAGE"
docker push "$IMAGE_LATEST"
deploy_timing_phase_end "Push image"

deploy_timing_phase_start "Apply Kubernetes manifests"
kubectl apply -f "$PROJECT_ROOT/k8s/configmap.yaml" -n "$NAMESPACE"
kubectl apply -f "$PROJECT_ROOT/k8s/external-secret.yaml" -n "$NAMESPACE"
deploy_timing_phase_end "Apply Kubernetes manifests"

deploy_timing_phase_start "Wait for Vault secret sync"
for i in $(seq 1 30); do
  if kubectl get secret "${SERVICE_NAME}-secret" -n "$NAMESPACE" >/dev/null 2>&1; then
    echo -e "${GREEN}ExternalSecret synced${NC}"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo -e "${RED}ExternalSecret did not create ${SERVICE_NAME}-secret${NC}"
    kubectl describe externalsecret "${SERVICE_NAME}-secret" -n "$NAMESPACE" || true
    exit 1
  fi
  sleep 2
done
deploy_timing_phase_end "Wait for Vault secret sync"

deploy_timing_phase_start "Database migration"
MIGRATION_JOB="${SERVICE_NAME}-migrate-${IMAGE_TAG//[^a-zA-Z0-9-]/-}"
kubectl delete job "$MIGRATION_JOB" -n "$NAMESPACE" --ignore-not-found >/dev/null
cat <<YAML | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${MIGRATION_JOB}
  namespace: ${NAMESPACE}
  labels:
    app: ${SERVICE_NAME}
    component: migration
spec:
  backoffLimit: 0
  template:
    metadata:
      labels:
        app: ${SERVICE_NAME}
        component: migration
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: ${IMAGE}
          imagePullPolicy: Always
          command: ["node", "scripts/migrate.js"]
          envFrom:
            - configMapRef:
                name: ${SERVICE_NAME}-config
            - secretRef:
                name: ${SERVICE_NAME}-secret
YAML
kubectl wait --for=condition=complete "job/${MIGRATION_JOB}" -n "$NAMESPACE" --timeout=480s || {
  kubectl logs "job/${MIGRATION_JOB}" -n "$NAMESPACE" || true
  exit 1
}
kubectl logs "job/${MIGRATION_JOB}" -n "$NAMESPACE"
kubectl delete job "$MIGRATION_JOB" -n "$NAMESPACE" --ignore-not-found >/dev/null
deploy_timing_phase_end "Database migration"

deploy_timing_phase_start "Apply runtime manifests"
kubectl apply -f "$PROJECT_ROOT/k8s/deployment.yaml" -n "$NAMESPACE"
kubectl apply -f "$PROJECT_ROOT/k8s/service.yaml" -n "$NAMESPACE"
kubectl apply -f "$PROJECT_ROOT/k8s/ingress.yaml" -n "$NAMESPACE"
kubectl apply -f "$PROJECT_ROOT/k8s/expiry-recheck-cronjob.yaml" -n "$NAMESPACE"
kubectl apply -f "$PROJECT_ROOT/k8s/notification-dispatch-cronjob.yaml" -n "$NAMESPACE"
deploy_timing_phase_end "Apply runtime manifests"

deploy_timing_phase_start "Update deployment image"
kubectl set image "deployment/${SERVICE_NAME}" app="$IMAGE" -n "$NAMESPACE"
deploy_timing_phase_end "Update deployment image"

deploy_timing_phase_start "Wait for rollout"
deploy_timing_k8s_rollout_wait kubectl "$SERVICE_NAME" "$NAMESPACE"
deploy_timing_phase_end "Wait for rollout"

deploy_timing_phase_start "Health check"
POD=$(kubectl get pod -n "$NAMESPACE" -l "app=${SERVICE_NAME}" -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n "$NAMESPACE" "$POD" -- node -e \
  "fetch('http://127.0.0.1:${HEALTH_PORT}/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
echo -e "${GREEN}Health OK${NC}"
deploy_timing_phase_end "Health check"

deploy_timing_finish_success "$SERVICE_NAME"
echo "Image:     ${IMAGE}"
echo "Namespace: ${NAMESPACE}"
echo "Service:   https://domain-research.alfares.cz"
DEPLOY_TIMING_FINISHED=1
