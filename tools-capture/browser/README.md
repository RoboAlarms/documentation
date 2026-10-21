# Browser captures: how they were made (2026-10-20)

Panel Manager and Flasher screenshots in `.capture/panel-manager/` and `.capture/flasher/` (each folder has
an `INDEX.md`). Source: the firmware repository (`../alarm-panel`), production frontends
unchanged. No tracked file in alarm-panel or website was modified; everything generated is under the
git-ignored `alarm-panel/build/docs-capture/` and this `.capture/` folder. All data is fictional.

## Tools

- Node 24 on PATH; no npm packages.
- Google Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`), driven headless over the
  DevTools protocol by `tools-capture/browser/cdp.mjs` (Node's built-in WebSocket). No Playwright was available.
  Every launch: fresh temporary profile, `--headless=new --hide-scrollbars --force-color-profile=srgb`,
  viewport 1440 x 960 at device scale 1, `prefers-color-scheme: dark`, `prefers-reduced-motion: reduce`.
- Python for the Flasher: a Python environment with the Flasher's requirements
  (esptool, pyserial, pywebview, certifi). Set `FLASHER_PY` to its python.exe.

Scripts (all in `tools-capture/browser/`):

| Script | What it does |
| --- | --- |
| `stage-panel-manager.mjs` | Copies the six Panel Manager frontend files byte-for-byte and the two mock files (with checked replacements) to `alarm-panel/build/docs-capture/panel-manager`, plus the remote-keypad frame; writes `capture-manifest.json` with hashes. Fails loudly if a replacement no longer matches. |
| `addr-proxy.cjs` | A tiny HTTP/CONNECT proxy so Chrome can open the mock at `http://192.0.2.10/` (RFC 5737) while it runs on loopback. |
| `cdp.mjs` | Headless Chrome driver: launch, navigate, evaluate, click by text, screenshot (optionally clipped). |
| `capture-panel-manager.mjs` | Visits each page/action and saves the Panel Manager PNGs. |
| `flasher-mock.py` | Runs the production Flasher in `--mock` mode with run-time-only fixture changes (below). |
| `capture-flasher.mjs` | Starts a fresh `flasher-mock.py` per phase, walks the guided setup / tools, saves the Flasher PNGs. |

## Panel Manager

Data changes, made only in the staged copy of `mock-panel.cjs` / `mock-screen.cjs` (the engineering
mock already uses the project's fictional household: Harbor House Wi-Fi, 192.0.2.10, Alex/Pat/Sam):

- panel id `30eda0123456` (Espressif-style MAC) -> `d0c000000001`;
- user 2 "Alex" shown as "Master" (matching the remote-keypad frame's banner) in users, events and automations;
  "Alex's key fob" -> "Master's key fob"; login names in the mock are unchanged;
- zone names title-cased as in the guides (Front Door, Garage Door, Kitchen Window, Hallway Motion, Back Door,
  Living Room Motion, Hallway Smoke, Water Heater Leak, Key Fob), and the old Back door alarm event;
- backup battery `absent` -> `present, 82 %` (healthy power; Troubles: None);
- remote keypad: the mock's painted test scene is replaced by a genuine 1024 x 600 LVGL frame
  (Home, Disarmed, Ready to arm, red "Remote: Master" banner) sent as a still picture (PNG, type 4) on the
  supported still-picture transport. The default frame is `.capture/panel/01_home_ready.png`
  (the current `build/ui_preview/shots` has no clean remote-banner Home frame: they show the factory-codes
  banner, a keyboard or the pause dialog). Pass another PNG as the second argument to change it.

Commands (PowerShell; `$node` = the node.exe above):

```powershell
# from the documentation repository root
node tools-capture/browser/stage-panel-manager.mjs ../alarm-panel [frame.png]
$m = '../alarm-panel/build/docs-capture/panel-manager/mock-panel.cjs'
# three mocks, each in its own terminal / background job:
$env:MOCK_AUTOLOGIN='master';    $env:MOCK_CLOCK='ok'; node $m 8561   # Master session
Remove-Item Env:MOCK_AUTOLOGIN;  $env:MOCK_CLOCK='ok'; node $m 8562   # signed out (sign-in page)
$env:MOCK_AUTOLOGIN='installer'; $env:MOCK_CLOCK='ok'; node $m 8563   # Installer session
# and three address proxies:
node tools-capture/browser/addr-proxy.cjs 8571 8561; node addr-proxy.cjs 8572 8562; node addr-proxy.cjs 8573 8563
node tools-capture/browser/capture-panel-manager.mjs                 # all shots -> .capture/panel-manager
node tools-capture/browser/capture-panel-manager.mjs "" overview,zones   # only some
```

`capture-panel-manager.mjs` opens `http://192.0.2.10/#/<page>` through the matching proxy, waits 2.5 s
(5 s on the remote keypad), performs the listed action (type "Master" in the sign-in name, open Sam,
open Change password, Set up Home Assistant, Add an automation, open the first automation, Check now on
updates, open the Front Door zone), scrolls to the top (except the browser sign-in shot), and saves a
viewport screenshot. "Check now" changes the Master mock's update state; restart the mocks for a clean run.

## Flasher

`flasher-mock.py <alarm-panel> <url-file> [port]` runs `roboflash.app.main(["--mock", "--no-open", ...])`
with these run-time patches (no repository file is edited):

- the Controller keeps backups, captures and logs under `alarm-panel/build/docs-capture/flasher`;
- the pretend firmware server offers only CrowPanel P4 Alpha 0.8.22 (v1 and v3 silicon builds), English
  voice revision 9 and three assets (as the website fixture did);
- `MockWorld` keeps only the ports in `DOCS_FLASHER_PORTS` (COM5 = factory software, COM6 = RoboAlarms
  0.5.9), writes at 8 s/MB so progress can be caught;
- the server's JSON maps the real build folder to a fictional user's folders both ways
  (`C:\Users\Alex\Documents\RoboAlarms\...`, `C:\Users\Alex\AppData\Local\RoboAlarms\Flasher\logs`), so no real
  home-directory path appears on screen.

```powershell
node tools-capture/browser/capture-flasher.mjs install   # fresh Flasher on COM5: Plan, Wire (all ticks), Connect, Check, Review, Install, Test
node tools-capture/browser/capture-flasher.mjs update    # fresh Flasher on COM6: Connect, Check, Review, Update, Finished
node tools-capture/browser/capture-flasher.mjs tools     # fresh Flasher on COM5+COM6: Advanced tools pages
# DEBUG=1 prints each page's text; STOP=connect|checked|review stops early.
```

In the guided flow the script chooses the 7" panel, ticks Wireless sensors (433 MHz, CC1101 default) and
Battery-backed clock, ticks every checklist box, and presses each "Next". Progress screens list the chip's
MAC and a backup file named after it, so they are saved as clips (x 456, 800 px wide): the headline,
progress bar and first check; and the step list from "Erase the flash" / "Compare the layout" down to
Stop. The tools phase first deletes the fixture's own backups (named after the pretend MAC) so the
Backups page shows its empty state; it chooses COM6 and opens each Advanced tools page without
connecting the console.

## Checks done

Every saved PNG was opened and looked at: dark theme, no error toasts, no scrollbars, only fictional
names, 192.0.2.x addresses, `d0c000000001`, and `C:\Users\Alex\...` paths; no chip MAC or serial in any
Flasher image. States that come from the mock and are left as they are: a "Review spoken name" chip on
Zones, an automation "Didn't work" status, trouble history in Activity, the installer's "5 zones have no
sensor" banner, Zigbee/Z-Wave devices not heard or low on battery, and the Flasher's v3-silicon warning on
the Software page. The Flasher's Test-and-finish page shows the product's published factory codes as
genuine UI text.

To clean up afterwards: delete `alarm-panel/build/docs-capture/` (fixture copies, URL files, pretend
backups and logs).
