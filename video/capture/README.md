# Walkthrough capture scripts

How the reel footage in `../public/hq/<id>/` was recorded. The frame folders are large and are deleted after rendering; run these again (with the app running locally) to re-create them, then `npm run render -- <id>`.

- `hq.mjs` — browser recorder (Playwright + Chrome DevTools screencast). Records a 1280×720 viewport at 1.5× (1920×1080 frames, JPEG q92) with timestamps; `r.hold(fn)` leaves loading time off the record. Writes `f00001.jpg…` + `index.json`.
- `hq-<project>.mjs` — one walkthrough per web project: `node hq-bc.mjs <path to video/public/hq>`. Each expects the app on the port in its `base` constant, seeded with the project's own demo data (logins are the repos' published demo accounts).
- `qtrec.py`, `cf_rec.py`, `se_rec.py` — the same output format for the ClassiFile and SummarEase desktop apps: the Qt window is driven in-process and grabbed every frame, using made-up documents.
- `hqsheet.mjs` + `sheet.mjs` — contact sheet of a recording for a quick visual check.
- `blur.mjs` — pixelates rectangles in a screenshot (used to hide a teammate's avatar in a FlavourWave image).

The Node scripts need `playwright-core` (`npm i -D playwright-core`) and Microsoft Edge; the Python ones need each app's own PySide6 environment.
