# Decisions for the morning

Each item is something I decided by judgement or that only you can approve. Reply "yes" or "no" to each (or edit
the file), and I'll apply the changes.

## Content and wording

1. **About copy.** It is new first-person copy built only from the facts in `four-pj.md` (`profile.about`). It keeps your earlier point about moving from hand-written code to AI-assisted tools without implying libraries are worse. Keep it?
2. **Hero intro.** It now reads: "I build web applications with Vue.js on the front end and Laravel and PHP behind it, from my own projects to hackathon prototypes." I dropped "high-performance", which no project data supports. Keep it?
3. **Milestones use general wording only:** "Completed a full-stack developer certification", "Received multiple development offers", "Took part in hackathons" (linked to FlavourWave, ClickWise, AstroCare and Chat to Ledger). OK until you supply details?
4. **BloodCare contribution:** "Own project idea; product design and full-stack build across the Vue front end and the Laravel API." Correct?
5. **GitHub contact link** points to `github.com/Harry-Pyae`. Keep it?
6. **Currently exploring notes.** Each technology is tied only to where it appears:
   - PostgreSQL: through Supabase in ClickWise and Chat to Ledger.
   - React: part of the stack in InternshipJP, Chat to Ledger and AstroCare.
   - Next.js: part of the stack in ClickWise and FlavourWave (team projects; your part isn't claimed).
   
   OK?

## Media

7. **ClickWise:** the live site's text detection was failing (the Groq model `qwen/qwen3.6-27b` is unavailable to the deployed key). The reel shows the live masking tool and quiz, and the detection screenshots are labelled as the app's demo-mode sample results. Fix the deployed model so the detection results can be re-recorded, or keep it as is?
8. **FlavourWave map screenshot:** it shows a picked map location's coordinates; the teammate avatar is pixelated. Keep it or remove it?
9. **Sample content in recordings:** the MyMedia reel uses sample categories and posts, and the Pizza reel a sample menu with generated pizza images. Both are labelled in the captions. OK?
10. **FHCP and CineMagicHub** are shown from labelled presentation copies, with their third-party film/series imagery replaced by generated "SAMPLE POSTER" art. Your original repositories are unchanged. OK, or would you rather show no screenshots for them?
11. **FHCP shows no year,** since only the May 2022 GitHub push date is known. Show "2022"?

## Structure

12. **Featured spiral order:** BloodCare, InternshipJP, ClariFile (the suite card), FlavourWave, ClickWise, AstroCare, Chat to Ledger, as specified. The ClariFile card opens a suite overview leading to ClassiFile and SummarEase. OK?
13. **Group names:** Recent Personal Projects, Major Hackathon Projects, Smaller Hackathon Projects, Earlier Work, then the Current explorations and Where it began sections. The navbar keeps only Projects, About and Contact. OK?
14. **InternshipJP** stays under Recent Personal Projects, as you classified it, although its docs describe a four-person university team project (your role as Member 1 is shown). OK?
15. **Pagination story:** kept unpublished, because no account of it was found. The facts needed are listed in `AUTHOR-CHECKLIST.md`. One candidate is a documented BloodCare bug, where pagination totals merged into `[2, 2]`. Is that the story you meant?

## Space

16. **Deleted to save space** (all re-creatable): the raw walkthrough frames in `video/public/hq` (~430 MB; re-record with the scripts in `video/capture/`), `video/node_modules` (~800 MB; `cd video && npm install` to edit or re-render reels), the `dist/` build output, and the four pasted project folders (verified identical to their GitHub repos before deleting). The reels themselves are final in `public/projects/<id>/reel.mp4`. OK?
