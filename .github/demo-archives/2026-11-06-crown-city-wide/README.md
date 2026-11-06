# Crown and City Wide demo archive

This archive preserves the two retired demo directories exactly as they were in
commit `64424239def80a9661e2bae08e749c81006a4ab0`. `source.zip` contains all six
original files (133,176 uncompressed bytes), including Crown's embedded images.
`manifest.json` records each file's SHA-256, Git blob ID, and original path.
No source, embedded assets, or Git history was rewritten.

## Deployment and scope

Before preparation on 2026-11-06, these exact URLs returned HTTP 200 and HTML
byte-identical to the source commit:

- https://aidmarketingagency.github.io/aid-demo-pages/crown-pest-control/
- https://aidmarketingagency.github.io/aid-demo-pages/city-wide-exterminating-locust-d19/

[Pages run 32162240418](https://github.com/aidmarketingagency/aid-demo-pages/actions/runs/32162240418)
successfully built that commit with Jekyll and deployed it. Pages reads `main`
at `/` using the legacy build. The takedown takes effect only after this change
is merged and the resulting Pages build/deployment succeeds. Verify both old
directory URLs and their explicit `index.html`, `styles.css`, and `script.js`
URLs return 404 after deployment; also check the root redirect and `portfolio/`.

The change removes only those six files from the published tree and Crown's
single sitemap entry. City Wide was absent from the sitemap. Other pages,
`index.html`, `portfolio/`, shared services, and the structural gate are unchanged.
The archive lives under `.github`, which the current Jekyll build excludes by
default ([Jekyll directory rules](https://jekyllrb.com/docs/structure/)). Keep it
excluded if the build system changes. The ZIP is an archive, not a relocated
renderable demo; there are no replacement demo pages or redirects.

The repository and its history remain public. This retires the rendered Pages
routes; it does not conceal the code or disable GitHub Pages.

## Durable backup

The remote branch
[`archive/crown-city-wide-before-takedown-2026-11-06`](https://github.com/aidmarketingagency/aid-demo-pages/tree/archive/crown-city-wide-before-takedown-2026-11-06)
points to the original commit and preserves its complete tree and ancestor
history. Keep this backup ref. The ZIP provides a second restoration path in
the current tree, independent of the backup branch.

## Verify the archive

Run from the repository root. This reads the ZIP without executing its contents:

```sh
python3 - <<'PY'
import hashlib, json, subprocess, zipfile
from pathlib import Path
folder = Path('.github/demo-archives/2026-11-06-crown-city-wide')
manifest = json.loads((folder / 'manifest.json').read_text())
assert hashlib.sha256((folder / 'source.zip').read_bytes()).hexdigest() == manifest['archive_sha256']
with zipfile.ZipFile(folder / 'source.zip') as archive:
    assert archive.testzip() is None
    assert sorted(archive.namelist()) == sorted(f['path'] for f in manifest['files'])
    for entry in manifest['files']:
        data = archive.read(entry['path'])
        assert len(data) == entry['bytes']
        assert hashlib.sha256(data).hexdigest() == entry['sha256']
        assert data == subprocess.check_output(['git', 'show', manifest['source_commit'] + ':' + entry['path']])
print('PASS: all six archived files match the original Git blobs byte-for-byte')
PY
```

## Restore or reuse without publishing

Start with a clean, isolated worktree based on the latest `origin/main`.
Verify the ZIP first, then extract to a separate temporary directory to inspect
or reuse the source without affecting the live site:

```sh
python3 -m zipfile -e .github/demo-archives/2026-11-06-crown-city-wide/source.zip /tmp/crown-city-wide-restored
```

To prepare restoration of the original paths on a new branch, either copy the
verified extracted directories into the repository root, or restore only them
from the immutable source commit:

```sh
git switch -c codex/restore-crown-city-wide
git restore --source=64424239def80a9661e2bae08e749c81006a4ab0 -- crown-pest-control city-wide-exterminating-locust-d19
```

Restore Crown's one sitemap block from the source commit if republishing it;
do not overwrite the whole current sitemap. Leave the archive and backup ref
intact. Review current branding, offer text, and external dependencies, commit
the prepared restoration, and run
`python3 scripts/validate_demo_pages.py --base origin/main`. Open a PR and pass
the current required checks before an authorized merge/deployment.

The original Crown page predates the current contract: it lacks the required
visit beacon and contains `{{` in its personalization code. An exact source
restoration therefore needs review and appropriate fixes before it can pass
today's gate. Preserve this archive unchanged; do not weaken the gate.

Crown also has an absolute base URL of
`/aid-demo-pages/crown-pest-control/`; account for it when previewing elsewhere.
Avoid executing payment or contact flows during archival inspection.

## External dependencies retained as references

These services were not changed, disabled, or copied into this archive:

- Both pages: Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), the
  discovery-call links at `https://aidmarketingagency.github.io/aid-discovery-call/`,
  `https://paymegpt.com/widget.js` with shared widget ID `54722168`, and its
  avatar at `https://paymegpt.com/api/files/avatar/widget_avatar_mcp_widget_54722168_1784002747499.png`.
- Crown fonts: Bricolage Grotesque and Fraunces. City Wide fonts: Archivo and
  Crimson Pro. Font URLs remain in each original HTML file.
- Crown: PayMeGPT context endpoint
  `https://paymegpt.com/api/landing/context/{contactId}?page_id=5545`, plus
  payment/cart checkout and checkout confirmation endpoints beneath
  `https://paymegpt.com/api/landing-pages/public/2DmyzMb/`.
- City Wide: visit beacon
  `https://aid-interactive-db.netlify.app/api/demo-visit`.
- Crown's HTML comments retain the original research citation URLs. Local CSS
  and JavaScript, inline SVG, and embedded data images are preserved verbatim.

The external services may change over time. Source restoration does not
guarantee future availability of remote fonts, widgets, or checkout services.
Other demos use the same widget and beacon; do not retire those services as
part of this archive.
