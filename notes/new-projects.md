# New projects: extraction notes

Collected 2026-10-18 from the copies in `portfolio projects/` (paths below are relative to each project's inner
folder) and from the public GitHub repositories. "Verified" means seen in code, docs, git history or a running app.

## Repositories (all four checked with `git ls-remote`)

| Project | Repository | Commits | Dates (git) |
| --- | --- | --- | --- |
| FHCP | https://github.com/Harry-Pyae/FHCP | 3 | all on 2022-05-25 ("first commit", README edits) |
| CineMagicHub | https://github.com/Harry-Pyae/CineMagicHub-2023 | 2 | both 2026-10-17 (a late upload, see below) |
| ClassiFile | https://github.com/ClariFile/ClassiFile | 67 | 2026-10-07 to 2026-10-17 |
| SummarEase | https://github.com/ClariFile/SummarEase | 8 | 2026-10-14 to 2026-10-15 |

ClassiFile and SummarEase live under the **ClariFile** GitHub organization (https://github.com/ClariFile). No
public demo URL exists for any of the four. ClassiFile's README points to a releases page
(https://github.com/ClariFile/ClassiFile/releases) for the Windows installer; whether a release is published there
was not checked beyond the README.

---

## FHCP

- **What it is:** the user's first project using only HTML and CSS (`README.md`: "This is my first project using only
  HTML & CSS"; README heading "OP-1.1"). A one-page fan site for the TV series *Supernatural*: page title
  `SPN_fandom`, brand "FANSPN" (`html/index.html`).
- **Name:** "FHCP" is never expanded anywhere in the files. Use the name as is with a subtitle, e.g.
  "My first HTML & CSS page".
- **Date:** pushed to GitHub on 2022-05-25 (all three commits that day; the zip's file times match). No separate
  creation date is stated. Safe wording: "2022" / "first pushed May 2022".
- **Stack:** HTML5 and CSS3 (`css/style.css`, 573 lines; `html/index.html`, 489 lines). CDN stylesheets only, no
  JavaScript: Boxicons, Font Awesome 6.0.0, Google Fonts Roboto, MDB UI Kit 4.0.0 CSS.
- **Page sections:** navbar (Home, Seasons, Shop, Sign Up); a "SUPERNATURAL" headline with a plot box and
  "Get Started"; a strip of 15 season cards (S1–S15) that scale up on hover (`#spn_card .card:hover`); "Season 1-15"
  details, one block per season with poster, synopsis, "Watch Now" and three outbound site buttons, each block
  scaling on hover (`#spn_s_abt #seasons:hover`); "Visit SPN shop, or buy all seasons" with two hover cards; a footer
  (Catagories, Contact Us, a Subscribe form).
- **Responsive:** media queries at 3840, 760, 600, 444, 400 and 320 px.
- **Placeholders, not functional:** Sign Up, Get Started, Watch Now (no behaviour), the season cards (`href=""`), the
  footer links (`#!`), the Subscribe form (no action).
- **Third-party material:** every image in `img/` (series key art, 15 season posters, shop and site banners, the
  icon) is from the series. Outbound links go to unofficial streaming sites (myflixer.to, fbox.to,
  watchmovieshd.ru), plus supernaturalmerch.store and warnerbros.com. The footer reads "@Copyright Matter PTF LTD 2017"
  (template text, not the user's company).

## CineMagicHub

- **What it is:** a static movie-channel landing page (`README.md`).
- **Dates:** the README states it was built in 2023 while learning HTML, CSS and Bootstrap, and pushed only in 2026
  ("the commit dates are later than the actual work"). Git: two commits on 2026-10-17. **Use 2023 as the creation
  year** (the user's own statement), never the commit date.
- **Stack:** HTML5, CSS3, Bootstrap 4.0 from CDN (with jQuery and Popper for the dropdowns), Font Awesome, Google
  Font "Protest Riot". No JavaScript of the user's own (`README.md`).
- **Page:** navbar with logo, Movies dropdown (2023 / 2022 / 2021 / More Movies), About Us, a search box, a Guest
  dropdown (Log In / Sign Up); featured *Avengers: Endgame* section with poster, Watch Now and Download, and a hero
  grid (Captain America, Iron Man, Thor, Hulk, Black Widow, Hawkeye); a "Popular Movies" row whose posters lift on
  hover. The hero grid is hidden at 768 px and below.
- **Functioning:** layout, the two Bootstrap dropdowns, hover effects, responsive behaviour (all verified in a
  browser). **Placeholders:** every link and button (`href="#"`): search, Log In / Sign Up, Watch Now, Download.
- **Third-party material:** all movie posters and character images in `image/` belong to their studios (the README
  says so). `image/logo.png` is a CineMagicHub logo (an atom mark with the name); it looks made for the project, but
  its source is not recorded. It is used as the project icon; confirm in the author checklist.

## Presentation copies (FHCP, CineMagicHub)

Built in the scratchpad (`pres/fhcp`, `pres/cmh`); the original repositories are unchanged.
- Every third-party picture was replaced by an original generated image of the same file name and size
  (`scratchpad/harness/posters.mjs`: abstract gradients and shapes; portrait images get a "SAMPLE POSTER" band;
  backgrounds stay plain). CineMagicHub's `logo.png` was kept.
- FHCP's three streaming-site buttons per season now read "Site 1/2/3" and link to `#` (their labels named
  unofficial streaming sites). Nothing else in the markup or CSS changed.
- A small fixed tag, "Presentation copy · original artwork replaced with generated images", is on both pages, so
  every screenshot and frame carries it.

---

## ClassiFile

- **What it is:** a Windows desktop app that sorts documents into categories by their content. It files a copy when
  it is sure, asks when it isn't, and learns from the answers (`README.md`). Part of the ClariFile suite.
- **Status:** "v1 release candidate (1.0.0-rc.2, for a small pilot), for Windows" (`README.md`;
  `classifile/__init__.py`: `__version__ = "1.0.0-rc.2"  # pilot release candidate; 1.0.0 after the pilot`).
  `docs/LAUNCH.md` is the v1 finish line: only launch work and bug fixes until v1. Portfolio wording:
  **"Release candidate · Under active development"**.
- **Stack:** Python 3.12, PySide6 6.11.2 (Qt for Python), PyMuPDF 1.28.2, Tesseract OCR, SQLite catalog,
  PyInstaller 6.22.3 and an Inno Setup installer (`installer/classifile.iss`). Licence AGPL-3.0.
- **Verified in code:**
  - *Offline classification:* `classifile/matching.py`, "one word-level TF-IDF representation, fitted on the
    training documents only … Standard library only". No network imports anywhere in `classifile/` (grep for
    socket/urllib/requests/http/QNetwork: none). "Check for updates" only opens the releases page in the browser.
    LAUNCH.md records an offline run with networking disabled (`tools.offline_check`).
  - *Confidence-based review:* automatic filing only when one category is clearly ahead (a setting, Strict by
    default, `matching.py`), and only into a category with at least 3 user-confirmed documents
    (`AUTO_MIN_CONFIRMED = 3`). Everything else waits in "Needs your decision" with the best categories and the
    reason.
  - *Learning from decisions:* it learns only from documents the user files, confirms ("Looks right") or moves,
    and from existing folders the user chooses; matching updates after 10 new decisions
    (`AUTO_UPDATE_EVERY = 10`) and keeps the previous version if the new one would make more mistakes (README).
    Seen live in the walkthrough: after one document was filed into Recipes, matching updated and "Oil change
    notes" was filed automatically into Car, with its reason.
  - *Originals preserved:* it works on verified copies: "planned record → exclusive temp write → hash check →
    publish without overwrite" (`classifile/copies/engine.py`, SHA-256). The README states originals are never
    changed, moved, renamed or deleted.
  - Reads PDF, PPTX, DOCX and ODT, with selective OCR for pictures (`docs/STATUS.md`, CP2).
- **Known limitations (README):** English only; JPG/PNG not yet; tested on study and work documents only; Windows
  only. Roadmap v1.1: phone photos and scans, household documents, Burmese.
- **Screenshots:** made with the repository's own tool (`python -m tools.screenshots OUT --size 1280x800 --theme
  dark`), which builds a made-up library (garden, recipes, travel, car, photography). No real document, name or
  path appears. Published: `public/projects/classifile/1.jpg` Needs your decision with Details, `2.jpg` All
  documents, `3.jpg` Filed automatically with the reason, `4.jpg` Learn from my existing folders (600×533 dialog).
- **Walkthrough:** `video/public/hq/classifile` (332 frames, 17.3 s, 1920×1080, frames + `index.json` like
  `hq.mjs`). Real window, made-up library, dark theme: All documents → Needs your decision → Details → "File in
  Recipes" (real filing) → the app files "Oil change notes" automatically → Filed automatically → Details (why this
  category) → "Looks right" → the Recipes category.

## SummarEase

- **What it is:** an offline desktop app that summarizes documents and pasted text at several levels of detail,
  shown as readable text you can copy or export (`START_HERE.md`).
- **Status:** "In development". M0 and M1 done; the UI redesign and M2 are built and "waiting at their stop point";
  M3 next "only on the owner's go-ahead" (`START_HERE.md`, `docs/STATUS.md`, decision record 0.2).
- **Stack:** Python 3.12, PySide6 6.11.2, PyMuPDF 1.28.2; reader copied unchanged from ClassiFile (tag
  `reader-v6`, hash-checked by a test); worker processes with time limits. Licence AGPL-3.0.
- **Extractive, not generative:** `summarease/summarize.py`: "every line is a sentence, bullet or line taken word for
  word from the document … Nothing is reworded, joined or invented." A local LLM is only proposal P3 in
  `DECISION_RECORD.md` ("optional, and only to rewrite an extractive draft"), not confirmed and not built.
  **Do not describe it as AI/LLM summarization.**
- **Functioning (verified in the running app with a made-up document):**
  - Reading workspace: Source and Summary panes; open (button, Ctrl+O, drag-and-drop) or paste; headings and
    paragraphs laid out from the reader; OCR text and gaps marked (`docs/STATUS.md`, M1).
  - Four nested detail levels: Brief, Key points, Detailed, Comprehensive (`LEVELS` in `summarize.py`).
  - Source references: every summary line links to its page, slide or section; following one scrolls the Source
    pane there (seen in the walkthrough: page 4).
  - Copy, and Export to PDF (searchable) or Word; an export is read back and checked and never overwrites a file
    (`summarease/export.py`). Ran `export_to` on the made-up document: a 71 KB PDF was written.
  - Light and dark themes following Windows.
- **Evaluation work, not finished:** `EVALUATION.md` plan; `python -m tools.evaluate` "not yet run on the
  development files"; reference key points and a held-out set still to come (`docs/STATUS.md`, "Open"). Methods:
  structure-first for slides, the opening-lines baseline for prose "until a method beats it on the rubric".
- **Planned:** M3 (all levels, Copy and Export finalised per MILESTONES.md) and M4, integration with ClassiFile
  "only after ClassiFile v1 is released".
- **Screenshots:** the repository's tool uses invented word-salad documents, so the published screenshots come from
  the real app driven by `scratchpad/harness/se_rec.py` with a made-up, readable "Community Garden Handbook" PDF.
  `public/projects/summarease/1.jpg` Key points with page links, `2.jpg` after following a page link,
  `3.jpg` Detailed summary with the "Exported as …" notice, `4.jpg` the document read, no summary yet
  (all 1280×720, dark).
- **Walkthrough:** `video/public/hq/summarease` (359 frames, 19.1 s, 1920×1080): empty window → open the document →
  scroll the source → Key points → Summarize → follow a page link → Detailed → Summarize → scroll the summary →
  export notice.

## ClariFile suite and the companion integration

- Suite: two separate apps; "ClariFile is the suite. It has two separate apps." Each works on its own; they "never
  share a catalog or a database. SummarEase never writes ClassiFile's data" (`SummarEase/START_HERE.md`).
- `SummarEase/INTEGRATION.md` is titled "(draft)": "Nothing here is confirmed; the owner decides at M4." It
  describes a registration file that ClassiFile would read to discover SummarEase, a JSON request/response
  protocol, and asking the user every time. Nothing of it is implemented. Portfolio wording: **"Planned companion
  integration"**.
- ClassiFile already keeps layout in its extraction record "for SummarEase later" (`docs/STATUS.md`, CP2). That is
  preparation, not integration.
- Icons: suite `clarifile.svg`, apps `classifile.svg` and `summarease.svg` (from each repository's
  `assets/icons/`), copied to `public/projects/{clarifile,classifile,summarease}/icon.svg` and
  `video/public/logos/`.

---

## Facts searched for but not found

- **Pagination story:** no account of a "manual API pagination challenge" exists in the user's messages in any of
  the 8 local Claude sessions, in `redesign.md`, `design-fix.md`, `four-pj.md` or `profile.js`. In the public code,
  BloodCare (Laravel `->paginate()`, 17 uses) and InternshipJP (Spring `Pageable`/`PageRequest`, a shared React
  `Pagination.jsx`) both use framework pagination, not a hand-written one; MyMedia, Pizza, ChatLedger, ClickWise and
  AstroCare have no API pagination code. One pagination-related bug is documented: BloodCare `STATUS.md` (around
  line 984), "`[ 2, 2 ]` fixed at its source": the controller added a `total` to the list's meta that merged with the
  paginator's own `total` into an array; fixed by `meta.all`, with `NotificationCentreTest` asserting each count is
  one number. Whether this is the story the user means is unknown. **Keep the story unpublished.**
- **Certification:** no title, issuer, date or link anywhere.
- **Hackathon outcomes:** only participation is documented: ChatLedger "Built for the Cursor Myanmar AI Hackathon
  2026" (README); AstroCare "a hackathon practice round" (AGENTS.md); FlavourWave and ClickWise have no hackathon
  name or result. No finalist or winning result is recorded anywhere.
- **Development offers:** only the user's own wording ("multiple development offers"); no employers or details
  (and none should be invented).
- **Interests (chess, games, cappuccino):** only the starting copy in `four-pj.md`.
