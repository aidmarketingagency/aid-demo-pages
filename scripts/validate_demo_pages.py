#!/usr/bin/env python3
"""
validate_demo_pages.py — deterministic structural gate for demo page PRs.

Per Ryan's 2026-08-09 review-diet ruling, content gets structural QA, not LLM
review. This validator enforces the DEMO PAGE CONTRACT on every page dir a PR
adds or modifies. It is the substance behind the "Admiral Review" check that
merge-freeze-guard (Agentic_Systems) requires before any agent-side
`gh pr merge` of this repo's PRs.

Checks per changed */index.html:
  1. BEACON    — page wires visit tracking to aid-interactive-db.netlify.app
  2. BOOKING   — the aid-discovery-call booking CTA is present
  3. NO-PMGPT  — no visible paymegpt.com/p/ URLs (ruling 2026-07-21: zero)
  4. NO-SCAFFOLD — no template scaffolding or unrendered placeholder text
  5. TITLE     — a real, non-generic <title>

A PR that changes no page index.html (infra, scripts, workflows) passes.
Exit 0 = pass, 1 = violations (printed per page).

Usage: python3 scripts/validate_demo_pages.py --base origin/main
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

BEACON_HOST = "aid-interactive-db.netlify.app"
BOOKING_SLUG = "aid-discovery-call"
RAW_PMGPT = "paymegpt.com/p/"
SCAFFOLD_PATTERNS = [
    "preview only",
    "swap this demo",
    "lorem ipsum",
    "{{",
]
GENERIC_TITLES = {"", "document", "untitled", "index", "demo"}


def changed_index_files(base: str) -> list[Path]:
    merge_base = subprocess.run(
        ["git", "merge-base", base, "HEAD"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    out = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=AM", merge_base, "HEAD"],
        capture_output=True, text=True, check=True,
    ).stdout
    return [
        Path(line)
        for line in out.splitlines()
        if line.endswith("index.html") and Path(line).exists()
    ]


def title_of(html: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    return (m.group(1).strip() if m else "")


def validate(path: Path) -> list[str]:
    html = path.read_text(encoding="utf-8", errors="replace")
    lower = html.lower()
    violations = []
    if BEACON_HOST not in html:
        violations.append(f"BEACON: no {BEACON_HOST} tracking endpoint")
    if BOOKING_SLUG not in html:
        violations.append(f"BOOKING: no {BOOKING_SLUG} CTA link")
    if RAW_PMGPT in lower:
        violations.append(f"NO-PMGPT: visible {RAW_PMGPT} URL (must be zero)")
    for pat in SCAFFOLD_PATTERNS:
        if pat in lower:
            violations.append(f"NO-SCAFFOLD: found {pat!r}")
    if title_of(html).lower() in GENERIC_TITLES:
        violations.append("TITLE: missing or generic <title>")
    return violations


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="origin/main")
    args = ap.parse_args()

    pages = changed_index_files(args.base)
    if not pages:
        print("No page index.html changed — structural gate passes (infra-only PR).")
        return 0

    failed = False
    for page in pages:
        problems = validate(page)
        if problems:
            failed = True
            print(f"FAIL {page}")
            for p in problems:
                print(f"  - {p}")
        else:
            print(f"PASS {page}")

    if failed:
        print("\nDEMO PAGE CONTRACT violations — fix the pages on this branch.")
        return 1
    print(f"\nAll {len(pages)} changed page(s) meet the DEMO PAGE CONTRACT.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
