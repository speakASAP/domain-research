#!/usr/bin/env python3
import argparse
from pathlib import Path

CHAIN = [
    "01_vision/VISION.md",
    "22_goal_impact/GOAL-IMPACT-TASK-001-bootstrap-domain-research.md",
    "04_systems/SYS-001-domain-research-service.md",
    "10_features/FEAT-001-domain-suggestion-and-watch.md",
    "11_tasks/TASK-001-bootstrap-domain-research.md",
    "21_execution_plans/EP-TASK-001-bootstrap-domain-research.md",
    "14_prompts/PROMPT-TASK-001-bootstrap-domain-research.md",
    "12_validation/VAL-TASK-001-bootstrap-domain-research.md",
]

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root)
    missing = [path for path in CHAIN if not (root / path).exists()]
    if missing:
        print("Pre-coding gate failed: missing IPS chain files")
        for path in missing:
            print(f"- {path}")
        return 1
    print("Pre-coding gate passed")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
