#!/usr/bin/env python3
import argparse
from pathlib import Path

REQUIRED = [
    "AGENTS.md",
    "README.md",
    "BUSINESS.md",
    "SYSTEM.md",
    "GOALS.md",
    "TASKS.md",
    "STATE.json",
    "docs/01_vision/VISION.md",
    "docs/04_systems/SYS-001-domain-research-service.md",
    "docs/10_features/FEAT-001-domain-suggestion-and-watch.md",
    "docs/11_tasks/TASK-001-bootstrap-domain-research.md",
    "docs/21_execution_plans/EP-TASK-001-bootstrap-domain-research.md",
    "docs/14_prompts/PROMPT-TASK-001-bootstrap-domain-research.md",
    "docs/12_validation/VAL-TASK-001-bootstrap-domain-research.md",
]

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root)
    missing = [path for path in REQUIRED if not (root / path).exists()]
    if missing:
        print("Missing required docs:")
        for path in missing:
            print(f"- {path}")
        return 1
    print("Documentation audit passed")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
