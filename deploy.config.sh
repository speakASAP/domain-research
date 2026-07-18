# deploy.config.sh — declaration consumed by shared/scripts/deploy.sh.
# See shared/docs/DEPLOY_STANDARDIZATION_REPORT.md section 6/7 for the design.
# scripts/deploy.sh is still the live, authoritative deploy path.
#
# Real script applies configmap+external-secret, waits for the ExternalSecret
# to sync, runs a DB migration Job to completion, THEN applies
# deployment/service/ingress/cronjobs — in that order, because new pods must
# not start against an unmigrated schema. MANIFESTS therefore only lists the
# first group; deploy_post_manifests does the wait + migration + the second
# group of applies, faithfully reproducing the real script's ordering.

SERVICE_NAME="domain-research"
PORT="4860"

IMAGES=(
  "domain-research|.||"
)

DEPLOYMENTS=(
  "domain-research|app|domain-research"
)

MANIFESTS=(configmap.yaml external-secret.yaml)

deploy_preflight() {
  ( cd "$PROJECT_ROOT" && npm run build && npm test && npm run docs:audit && npm run gate:deployment )
}

deploy_post_manifests() {
  local i migration_job image
  for i in $(seq 1 30); do
    if kubectl get secret "${SERVICE_NAME}-secret" -n "$NAMESPACE" >/dev/null 2>&1; then
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo "ExternalSecret did not create ${SERVICE_NAME}-secret" >&2
      kubectl describe externalsecret "${SERVICE_NAME}-secret" -n "$NAMESPACE" || true
      return 1
    fi
    sleep 2
  done

  image="${REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}"
  migration_job="${SERVICE_NAME}-migrate-${IMAGE_TAG//[^a-zA-Z0-9-]/-}"
  kubectl delete job "$migration_job" -n "$NAMESPACE" --ignore-not-found >/dev/null
  cat <<YAML | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${migration_job}
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
          image: ${image}
          imagePullPolicy: Always
          command: ["node", "scripts/migrate.js"]
          envFrom:
            - configMapRef:
                name: ${SERVICE_NAME}-config
            - secretRef:
                name: ${SERVICE_NAME}-secret
YAML
  kubectl wait --for=condition=complete "job/${migration_job}" -n "$NAMESPACE" --timeout=480s || {
    kubectl logs "job/${migration_job}" -n "$NAMESPACE" || true
    return 1
  }
  kubectl logs "job/${migration_job}" -n "$NAMESPACE"
  kubectl delete job "$migration_job" -n "$NAMESPACE" --ignore-not-found >/dev/null

  kubectl apply -f "$PROJECT_ROOT/k8s/deployment.yaml" -n "$NAMESPACE"
  kubectl apply -f "$PROJECT_ROOT/k8s/service.yaml" -n "$NAMESPACE"
  kubectl apply -f "$PROJECT_ROOT/k8s/ingress.yaml" -n "$NAMESPACE"
  kubectl apply -f "$PROJECT_ROOT/k8s/expiry-recheck-cronjob.yaml" -n "$NAMESPACE"
  kubectl apply -f "$PROJECT_ROOT/k8s/notification-dispatch-cronjob.yaml" -n "$NAMESPACE"
}
