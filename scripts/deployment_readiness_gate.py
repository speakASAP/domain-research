#!/usr/bin/env python3
import argparse
from pathlib import Path

REQUIRED = [
    "Dockerfile",
    "scripts/deploy.sh",
    "k8s/configmap.yaml",
    "k8s/external-secret.yaml",
    "k8s/deployment.yaml",
    "k8s/service.yaml",
    "k8s/ingress.yaml",
    "k8s/expiry-recheck-cronjob.yaml",
    "k8s/notification-dispatch-cronjob.yaml",
]

FORBIDDEN_SECRET_MARKERS = ["password=", "api_key=", "secret=", "token="]

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root)
    missing = [path for path in REQUIRED if not (root / path).exists()]
    if missing:
        print("Deployment readiness failed: missing files")
        for path in missing:
            print(f"- {path}")
        return 1
    for path in ["k8s/secret.yaml.example", "k8s/configmap.yaml"]:
        text = (root / path).read_text(encoding="utf-8") if (root / path).exists() else ""
        lower = text.lower()
        if any(marker in lower for marker in FORBIDDEN_SECRET_MARKERS):
            print(f"Deployment readiness failed: possible secret marker in {path}")
            return 1
    print("Deployment readiness gate passed")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
