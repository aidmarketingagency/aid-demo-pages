# Retired 121 demo routes

On 2026-11-06, the 121 routes listed in `manifest.json` were retired from GitHub Pages at the owner's request. This removes their 340 files from the published main tree and their sitemap entries. No replacement demo or redirect is published.

## Source preservation

All original files remain byte-for-byte recoverable at source commit `40e9557ae197be2b65d628f5eb33846932a9611b` and the dedicated remote backup branch [`archive/121-demos-before-takedown-2026-11-06`](https://github.com/aidmarketingagency/aid-demo-pages/tree/archive/121-demos-before-takedown-2026-11-06). Keep that branch. Git history is unchanged. The manifest records each original path, Git blob ID, byte count, and SHA-256.

This archive directory contains metadata only; the source stays on the backup branch and in history. The repository and history remain public. Retiring the rendered Pages routes does not conceal the code or erase third-party copies and caches.

## Scope and deployment

GitHub Pages builds `main` at `/` using Jekyll. Only the 121 listed top-level directories and their sitemap entries are removed. The root redirect, portfolio, aios-demo, floor-quote-builder, unitproof-demo, prior Crown/City Wide archive, robots.txt, structural gate, and shared external services are unchanged. No PayMeGPT pages or other repositories are changed.

After merge and successful Pages deployment, verify all listed directory URLs, explicit index.html URLs, and removed asset paths return HTTP 404. Verify the unchanged routes still serve normally. This metadata lives under `.github`, excluded by the current Jekyll build; keep it excluded if deployment changes.

## Verify preserved source

From a clone of this repository, run:

```sh
python3 - <<'PYCODE'
import hashlib, json, subprocess
from pathlib import Path
m = json.loads(Path('.github/demo-archives/2026-11-06-121-demo-routes/manifest.json').read_text())
for f in m['files']:
    data = subprocess.check_output(['git', 'show', m['source_commit'] + ':' + f['path']])
    assert len(data) == f['bytes']
    assert hashlib.sha256(data).hexdigest() == f['sha256']
    assert subprocess.check_output(['git', 'rev-parse', m['source_commit'] + ':' + f['path']], text=True).strip() == f['blob']
print('PASS: all 340 source files remain byte-for-byte recoverable')
PYCODE
```

## Restore for inspection, without publishing

Use a separate local worktree of the backup commit. Do not execute payment/contact flows while inspecting source.

```sh
git worktree add --detach ../retired-demo-source 40e9557ae197be2b65d628f5eb33846932a9611b
```

To prepare a future restoration, create a new branch from current main and restore only specifically authorized paths from the source commit. Review all claims, branding, privacy, and dependencies; run the current structural validator and required checks. Republishing requires a new instruction. Do not overwrite the current sitemap or restore all archived routes as a side effect.
