# How similar projects document themselves

Research for the October 2026 rewrite. Five open-source projects close to RoboAlarms (hardware,
firmware, a flasher, a web interface, Home Assistant) were compared.

| Project | Docs | Strong points | Weak points |
| --- | --- | --- | --- |
| Alarmo | github.com/nielsfaber/alarmo (one README) | Reference tables for states, arm modes, sensor types and events; a state diagram | One very long page; no troubleshooting; audiences mixed |
| Konnected | support.konnected.io | "What's in the box" and "Before you start" lists; one wiring page for each sensor type; bold safety notes; labels such as "advanced" | Flat card grid that mixes products, platforms and orders; few screenshots; readers jump between pages |
| WLED | kno.wled.ge | The best quick start: numbered, with "how to tell it worked" after a step; tabs for variants; inline fixes; a "top 5 mistakes" page | Few screenshots of the web interface; some duplicate pages |
| ESPHome | esphome.io | Audience fork on the home page ("Begin here" / "Already using it?"); the same template on every reference page (option, required, type, default) | Assumes YAML skill; no screenshots on the home page |
| Meshtastic | meshtastic.org/docs | Linear getting-started path; flashing methods in order of preference; warnings at the step where they apply; glossary; previous/next links | Many pages that are only lists of links; few screenshots of the apps |

## What this site took from them

1. An audience fork on the home page (household, installer, integrator) and audience labels under each page title.
2. A linear quick start that tells the reader how to know each step worked.
3. The same layout on every task page: before you start, steps, check the result, if it does not work, related tasks.
4. Fixes on the task page where the problem happens, plus a central troubleshooting page and an FAQ.
5. Screenshots of the real screens, cropped to the part the step is about, in device frames.
6. Reference tables for permissions, contact types, siren settings and terms (glossary).
7. Warnings and cautions before the step where the risk starts.
8. Previous/next links and related tasks on every page; search that finds the words on the screen.
