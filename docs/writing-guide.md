# Writing guide

Every page in `src/content/docs/` follows these rules. They make the text easy to read for
people who are not experts, and for people who read English as a second language.

## Sentences

- Write procedure sentences of 20 words or fewer. Write descriptive sentences of 25 words or fewer.
- Give one instruction in each sentence. Two actions are in one sentence only when you do them
  at the same time.
- Use the imperative for instructions: "Push **Away**." Not "You should push Away" or "Away can be pushed".
- Use the active voice: "The panel shows the code pad." Not "The code pad is shown".
- Use the present tense for what the panel does. Use the future tense only for a result that comes later.
- Do not use contractions (don't, it's, you'll). Do not use "please".
- Keep "the", "a" and "an". Do not write in a telegraphic style ("Enter code, push check mark").
- Put a condition first: "If the panel shows **Not ready**, open **Zones**."
- Do not use -ing words as verbs or nouns where a simple verb works: "Before you arm the panel",
  not "Before arming".
- Write paragraphs of six sentences or fewer, with one topic in each.

## Words

- Use one word for one meaning, and one meaning for one word. Use these terms:

  | Use | Do not use |
  | --- | --- |
  | panel | system (for the device), controller, unit |
  | Panel Manager | web UI, browser app, dashboard |
  | Flasher | flashing tool, installer app |
  | code (the digits on the keypad) | PIN, passcode |
  | password (Panel Manager sign-in only) | code |
  | zone | sensor (when you mean the zone), point, input |
  | sensor | device (when you mean a sensor) |
  | push (a control on the touchscreen) | tap, press, hit, click |
  | click (a control in a browser or on a computer) | push, tap |
  | open (a page or screen) | go to, navigate to, head to |
  | installer | admin, technician, dealer |

- Use simple, common verbs: do, make, push, open, close, set, show, stop, start, find, use, keep, get.
  Do not use: utilize, leverage, ensure, facilitate, perform, initiate, terminate, via, prior to.
- Do not use vague modal verbs. Use "can" for a possibility, "must" for a requirement and "do not"
  for a prohibition. Do not use "should", "may", "might" or "could" for instructions.
- Avoid phrasal verbs when a single verb exists: "start" not "fire up", "find" not "look up".
  Names of controls stay exactly as on the screen, even when they are phrasal verbs (**Set up**).
- Write control names in **bold**, exactly as the screen shows them, with the same capital letters.
- Write a menu path with ">": **Settings > Screen and sound**.
- Do not use marketing words (powerful, seamless, easy, simply, just, robust).

## Page structure

Each task page has this order. Leave out a part that does not apply.

1. Frontmatter: `title` (a task in the imperative or a short noun phrase), `description` (one
   sentence), `audience` (`user`, `installer`, `integrator` or `everyone`) and, for a task, `time`.
2. One or two sentences that tell what the page is for.
3. **Before you start**: an `<Aside type="note" title="Before you start">` with a short list:
   the code or role you need, the software, and the start state.
4. Steps: use Starlight's `<Steps>` around a numbered list. One action in each step. After a step
   with a visible result, give the result in a new paragraph in that step: "The panel shows ...".
5. **Check the result**: an `<Aside type="tip" title="Check the result">` that tells how to know
   the task worked.
6. **If it does not work**: a short table (Problem | Do this) or a few `<details>` blocks.
7. **Related tasks**: two to four links.

Reference pages (glossary, permissions, settings) use tables. Explain each setting with: name,
what it does, the default, and who can change it.

## Warnings and cautions

- Use `<Aside type="danger" title="Warning">` when a person can get hurt or the alarm protection
  can stop. Use `<Aside type="caution" title="Caution">` when equipment or data can be damaged or lost.
- Start with a short command. Then give the risk in one sentence. Example: "Do not bypass a fire
  zone. A bypassed fire zone does not cause an alarm."
- Put a warning before the step where the risk starts, not after it.
- Notes (`type="note"`) give information. Notes do not contain instructions.

## Screenshots

- Use `<PanelShot src alt caption size />` from `src/components/PanelShot.astro`. A full panel
  screen (1024 × 600) gets the panel frame. A browser page gets the browser frame. A crop has no frame.
- Use a screenshot only when it helps the reader find a control or recognize a screen. Do not
  add a screenshot only to fill space.
- Crop a panel screenshot to the part the step is about when the full screen gives no extra help.
  Use `size="small"` for a dialog and `size="medium"` for a part of a screen.
- Write `alt` text that tells what the screen shows. Write a `caption` that tells the reader
  what to look at, in one sentence. Do not write where the image came from or how it was made.
- Screenshots use fictional data and changed codes. They never show the factory codes, a real
  address, a real name or a real network. Show a warning only when the page explains it.
- Use 7-inch panel screenshots only. The 10.1-inch panel shows the same screens.

## Do not write

- Notes about the documentation itself: how screenshots were made, review dates, editions,
  capture tools, simulators or test labs.
- Statements about which screen size a screenshot uses.
- Release status, test status or plans. Link to https://roboalarms.com/updates/ for news.
- The names of other alarm companies or their products.
