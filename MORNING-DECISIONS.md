# Decisions for the morning

Each item is something I decided by judgement or that only you can approve. Reply "yes" or "no" to each (or edit
the file), and I'll apply the changes.

## Content and wording

1. **About copy.** It is new first-person copy built only from the facts in your brief (`profile.about`). It keeps your earlier point about moving from hand-written code to AI-assisted tools without implying libraries are worse. Keep it?
2. **Hero intro.** It now reads: "I build web applications with Vue.js on the front end and Laravel and PHP behind it, from my own projects to hackathon prototypes." I dropped "high-performance", which no project data supports. Keep it?
3. **Milestones:** CodeLab Full-Stack Web Developer, ITPEC IT Passport (described as covering IT fundamentals, management and strategy), hackathon participation certificates (I labelled the Cursor one "Myanmar AI Hackathon 2026", the event Chat to Ledger was built for), and "Received multiple development offers". Correct?
4. **BloodCare contribution:** "Own project idea; product design and full-stack build across the Vue front end and the Laravel API." Correct?
5. **GitHub contact link** points to `github.com/Harry-Pyae`. Keep it?
6. **Currently exploring notes.** Each technology is tied only to where it appears:
   - PostgreSQL: through Supabase in ClickWise and Chat to Ledger.
   - React: part of the stack in InternshipJP, Chat to Ledger and AstroCare.
   - Next.js: part of the stack in ClickWise and FlavourWave (team projects; your part isn't claimed).
   
   OK?

## Media

7. **ClickWise:** the live site's text detection fails (the Groq model `qwen/qwen3.6-27b` is no longer offered). The project view now says so right beside the Live demo link, and the showcase says it under its Live demo button; LinkedIn advice moved ClickWise out of "feature first" until it's fixed. Fix the deployed model, or keep it framed as a prototype?
8. **FlavourWave map screenshot:** removed from both sites' galleries (a map pin with coordinates and a pixelated teammate avatar). The FlavourWave reel and showcase walkthrough still include that image briefly; re-rendering them without it needs a short render run. Do that, or keep as is?
9. **Sample content in recordings:** a single quiet line beside the media now says so (MyMedia: sample categories and posts; Pizza: sample menu with generated pizza images). OK?
10. **FHCP and CineMagicHub** are shown from presentation copies, with their third-party film/series imagery replaced by generated "SAMPLE POSTER" art; a quiet line beside the media says so. Your original repositories are unchanged. OK, or would you rather show no screenshots for them?
11. **FHCP shows no year,** since only the May 2022 GitHub push date is known. Show "2022"?

## Structure

12. **Featured spiral order:** BloodCare, InternshipJP, ClariFile (the suite card), FlavourWave, ClickWise, AstroCare, Chat to Ledger, as specified. The ClariFile card opens a suite overview leading to ClassiFile and SummarEase. OK?
13. **Group names:** Recent Personal Projects, Major Hackathon Projects, Smaller Hackathon Projects, Earlier Work, then the Current explorations and Where it began sections. The navbar keeps only Projects, About and Contact. OK?
14. **InternshipJP** stays under Recent Personal Projects, as you classified it, although its docs describe a four-person university team project (your role as Member 1 is shown). OK?
15. **Pagination story:** published in About as a fixed card ("2022 · My longest-running bug", "Getting pagination right") whose full text opens in an overlay, with a code sample labelled as illustrative. Was the app MyMedia (then it moves into MyMedia's details), and is the "What stayed with me" line true to you?

## Space

16. **Deleted to save space** (all re-creatable): the raw walkthrough frames in `video/public/hq` (~430 MB; re-record with the scripts in `video/capture/`), `video/node_modules` (~800 MB; `cd video && npm install` to edit or re-render reels), the `dist/` build output, and the four pasted project folders (verified identical to their GitHub repos before deleting). The reels themselves are final in `public/projects/<id>/reel.mp4`. OK?

## Soundtrack

17. **Music licensing:** both tracks carry content credentials saying they were created with Google generative AI. You confirmed you may publish them, so they are in the repo. A chatbot's reply isn't the service's terms; check the music tool's terms page once if the site is ever used commercially.
18. **Soundtrack excerpts:** each project's excerpt was chosen by analysing the music (sections, beats, loudness), not by listening. Give a few projects a listen; any boundary can be moved in `src/content/audioCues.js`.
19. **Phone memory:** the project excerpts come from decoding the inspection track once (about 55 MB of memory). Fine for modern phones; if you'd rather keep low-end phones light, the excerpts can stream instead, with slightly less exact loops.

## Showcase

20. **Link the two sites:** the showcase is live at https://harry-project-showcase.vercel.app (e.g. /projects/blood-donation). Should each project's view in the portfolio get a "Full case study" link to its showcase page? (Not added yet.)
