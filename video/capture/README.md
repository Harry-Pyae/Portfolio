# Walkthrough capture scripts

How the footage in `../public/hq/<id>/` was recorded. The frame folders are large and are deleted after rendering; run these again (with the app running locally) to re-create them, then `npm run render -- <id>` (16 s portfolio reels) and `node render-walkthroughs.mjs <slug>` (20–45 s captioned walkthroughs for the showcase site).

- `hq.mjs` — browser recorder (Playwright + Chrome DevTools screencast). Records a 1280×720 viewport at 1.5× (1920×1080 frames, JPEG q92) with timestamps; `r.hold(fn)` leaves loading time off the record. Writes `f00001.jpg…` + `index.json`. `r.mark(text)` records a caption cue at the current moment; the walkthrough video shows it as a lower third, so keep each mark to what the next few seconds really show.
- `hq-<project>.mjs` — one walkthrough per web project: `node hq-bc.mjs <path to video/public/hq>` (`hq-early.mjs` records FHCP and CineMagicHub from presentation copies served on port 8090: third-party images replaced with generated art, labelled on the page). Each expects the app on the port in its `base` constant, seeded with the project's own demo data (logins are the repos' published demo accounts).
- `qtrec.py`, `cf_rec.py`, `se_rec.py` — the same output format for the ClassiFile and SummarEase desktop apps: the Qt window is driven in-process and grabbed every frame, using made-up documents; `rec.mark(text)` adds caption cues the same way.
- `hqsheet.mjs` + `sheet.mjs` — contact sheet of a recording for a quick visual check.
- `posters.mjs` — builds the FHCP/CineMagicHub presentation copies: replaces every third-party image with generated art of the same name and size (`node posters.mjs <imageDir> [keep,...]`; CineMagicHub keeps `logo.png`).
- `pizzas.mjs` — draws the sample pizza images used as Pizza Order's menu in the recording.
- `blur.mjs` — pixelates rectangles in a screenshot (used to hide a teammate's avatar in a FlavourWave image).

The Node scripts need `playwright-core` (`npm i -D playwright-core`) and Microsoft Edge; the Python ones need each app's own PySide6 environment.
