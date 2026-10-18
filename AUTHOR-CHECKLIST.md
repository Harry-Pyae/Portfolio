# Author checklist

Facts and links only you can supply. The site never shows placeholders for these: a missing item is
simply left out until you add it in `src/content/projects.js` or `src/content/profile.js`.

## Milestones and recognition (`profile.milestones`)

- [x] **Certifications:** shown in Milestones: Full-Stack Web Developer (CodeLab), IT Passport (ITPEC), participation certificates from Cursor, UNESCO Youth Hackathon 2026 and JICA.
- [ ] **Certificate dates and verification links** (optional): add them to `milestones` in `profile.js` if you want them public.
- [ ] **JICA:** the event or programme the participation certificate was for (shown only as "Participation certificate").
- [ ] **Development offers:** the site says "Received multiple development offers" and nothing more. Add detail only if you want it public, and never as a claim of employment.
- [ ] **Hackathon outcomes:** only participation is shown. Add any finalist or winning result with the event name and year:
  - FlavourWave: the hackathon's name and date are not in the code (which dates from December 2023).
  - ClickWise: the hackathon's name, date and year (2026 is shown but was not confirmed from the files).
  - AstroCare: the docs call it "a hackathon practice round"; add the event's name if it should be shown.
  - Chat to Ledger: built for the Cursor Myanmar AI Hackathon 2026. Was there a result beyond participation?

## Pagination story (`story` in `projects.js`, published in About)

Written from your account: a 2022 personal app (Vue, Laravel, Axios, MySQL), two months of failing paged data, fixed by using `paginate()` instead of `get()`. It sits in About because the app isn't one of the portfolio projects.

- [ ] Which app it was. If it is one of the portfolio projects (for example an early version of MyMedia), set `story.project` to its id and the story moves into that project's details.
- [ ] Confirm the "What stayed with me" lesson, which I wrote from the shape of your account.

## Projects

- [ ] **BloodCare:** confirm the contribution line ("Own project idea; product design and full-stack build across the Vue front end and the Laravel API").
- [ ] **ClickWise AI Tools Hub:** your role on the team. Text detection on the live site was failing at recording time (the Groq model `qwen/qwen3.6-27b` is unavailable), so the detection screenshots come from the app's demo mode. Update the model in the deployed app and the screenshots can be re-taken from real results.
- [ ] **FlavourWave:** your role in team Axionix. The delivery-map screenshot (`public/projects/flavourwave/2.jpg`) shows a picked location's coordinates; the teammate avatar is pixelated. Confirm the location is fine to publish, or remove that screenshot.
- [ ] **AstroCare:** your role in the five-member team.
- [ ] **ClassiFile / SummarEase:** confirm both are solo projects if you want a contribution line (nothing in the repositories says otherwise, but it isn't stated).
- [ ] **MyMedia** and **Pizza Order System:** your role, if you want a contribution line.
- [ ] **FHCP:** only the GitHub push date (May 2022) is known, so no year is shown on the card. Confirm the year it was built if you want it shown.
- [ ] **CineMagicHub:** confirm the logo (`public/projects/cinemagichub/icon.png`, from the project's `image/logo.png`) is your own work. It is used as the card icon.
- [ ] **Live demos:** only ClickWise, AstroCare and Chat to Ledger have one. Add a `demo` URL for any other project you deploy (for example a ClassiFile release download).
- [ ] **Lessons learned:** not shown anywhere yet. If you want them, add a short `lessons` line per project and ask for it to be displayed.

## Profile

- [ ] **Email:** `profile.contact` has no email, so no Email channel or copy button is shown.
- [ ] **LinkedIn:** no URL yet, so it is hidden.
- [ ] **Portrait:** `portrait` is `null`, so the hero shows the "H" monogram. Put a photo in `public/` and set `portrait: 'harry.jpg'`.
- [ ] **GitHub:** shown as `github.com/Harry-Pyae`, taken from your repositories. Change it if you prefer another profile link.
- [ ] **Interests:** the chess, story-driven games and cappuccino lines are your starting copy from `four-pj.md`; edit them in `profile.interests`.
