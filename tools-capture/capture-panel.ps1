<#
.SYNOPSIS
  Render the 7-inch (1024x600) panel screenshots for the manuals, with custom (fictional) codes.

.DESCRIPTION
  Documentation-only fixture. Stages copies of the alarm-panel repository's host preview sources
  (host/ui_preview main.c, host_panel.c, host_link_demo.c) under the alarm-panel's git-ignored
  build/docs-preview-source, edits the copies, builds them into build/docs-preview and runs the
  scripted walk; the PNGs land in build/docs-preview/shots. It never edits a tracked file of
  alarm-panel, the ordinary preview (build/ui_preview) or its regression fixture.

  What the staged copies change:
  - the factory installer and master codes are changed through the engine's programming API
    right after every host_panel_init (installer 85729, master 286493: public, fictional
    documentation codes, never to be used on an installation), and every code the walk types
    is changed to match;
  - every shot() asserts snapshot.default_codes == 0, so no picture can show a factory-code
    warning;
  - the panel-link pairing code becomes the fictional -PairingCode (default 540497);
  - LAN addresses become RFC 5737 192.0.2.x, the Wi-Fi MAC an RFC 7042 documentation MAC, the
    panel ID an obviously made-up 0a1b2c3d4e5f;
  - file numbers stay those of the ordinary walk (build/ui_preview/shots): an omitted shot still
    takes its number;
  - the panel's own battery is present and healthy;
  - the walk's test troubles (zone 8's low battery, the Zigbee contact's, the 60-zone paging
    stress test) are restored and acknowledged once their scenes are done, so later pictures
    don't carry a stale trouble badge;
  - walk blocks that exist only to show or test factory-code warnings are omitted (listed below).

  Omitted walk blocks (they show the factory-code state on purpose):
  - "Change code" (the factory-code banner on Home);
  - the first-boot setup's change of the installer code (setup_new_code);
  - the update-server page's factory-installer-code scenes (fwsrv_factory_code,
    fwsrv_refused_factory).

  Requires the alarm-panel's host toolchain (tools/host_env.ps1: gcc, cmake, ninja) and LVGL
  (one firmware build, or pwsh tools/ui_preview.ps1 once).

.PARAMETER AlarmPanel
  The alarm-panel repository. Default: ..\alarm-panel beside this documentation repository.

.PARAMETER PairingCode
  Six digits shown as the panel-link pairing code.

.EXAMPLE
  pwsh tools-capture/capture-panel.ps1
  pwsh tools-capture/capture-panel.ps1 -AlarmPanel D:\src\alarm-panel
#>
param(
    [string]$AlarmPanel = (Join-Path $PSScriptRoot '..\..\alarm-panel'),
    [ValidatePattern('^\d{6}$')][string]$PairingCode = '540497'
)
$ErrorActionPreference = 'Stop'
$MasterCode = '286493'
$InstallerCode = '85729'

$repo = (Resolve-Path $AlarmPanel).Path
if (-not (Test-Path (Join-Path $repo 'host/ui_preview/main.c'))) { throw "Not an alarm-panel repository: $repo" }
$stage = Join-Path $repo 'build/docs-preview-source'
$build = Join-Path $repo 'build/docs-preview'
$shots = Join-Path $build 'shots'
$captureStatus = Join-Path $build 'capture-status.json'
$captureStdout = Join-Path $build 'capture-stdout.log'
$captureStderr = Join-Path $build 'capture-stderr.log'
New-Item -ItemType Directory -Force -Path $stage, $shots | Out-Null
# host_panel.c resolves its font fixtures beside its (staged) source file.
$fixtures = Join-Path $stage 'fixtures'
New-Item -ItemType Directory -Force -Path $fixtures | Out-Null
Get-ChildItem -LiteralPath (Join-Path $repo 'host/ui_preview/fixtures') -File -Filter '*.bin' |
    ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $fixtures $_.Name) -Force }
# Clear only this fixture's PNGs, so no stale capture survives.
Get-ChildItem -LiteralPath $shots -File -Filter '*.png' | ForEach-Object { Remove-Item -LiteralPath $_.FullName }
Remove-Item -LiteralPath $captureStatus, $captureStdout, $captureStderr -Force -ErrorAction SilentlyContinue

function Write-CaptureStatus([string]$stageName, [int]$exitCode, [bool]$summaryFound, [string]$summary = '') {
    [ordered]@{
        stage = $stageName
        nativeExitCode = $exitCode
        normalSummaryFound = $summaryFound
        summary = $summary
        pngCount = @(Get-ChildItem -LiteralPath $shots -File -Filter '*.png').Count
        completedAt = (Get-Date).ToString('o')
    } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $captureStatus -Encoding utf8
}

Write-CaptureStatus 'preparing' -1 $false
. (Join-Path $repo 'tools/host_env.ps1')

function Replace-Checked($text, $from, $to) {
    if (-not $text.Contains($from)) { throw "Preview source changed; review the documentation fixture: $from" }
    return $text.Replace($from, $to)
}
# Removes [start, end) found after an optional anchor; throws when the walk has changed.
function Remove-Block($text, [string]$startText, [string]$endText, [string]$insert = '', [string]$anchor = '') {
    $from = 0
    if ($anchor) {
        $from = $text.IndexOf($anchor)
        if ($from -lt 0) { throw "Preview source changed; anchor not found: $anchor" }
    }
    $start = $text.IndexOf($startText, $from)
    $end = if ($start -ge 0) { $text.IndexOf($endText, $start) } else { -1 }
    if ($start -lt 0 -or $end -lt 0) { throw "Preview source changed; walk block not found: $startText .. $endText" }
    return $text.Substring(0, $start) + $insert + $text.Substring($end)
}
function Read-Source([string]$name) {
    return (Get-Content (Join-Path $repo "host/ui_preview/$name") -Raw).Replace("`r`n", "`n")
}

$main = Read-Source 'main.c'
$panel = Read-Source 'host_panel.c'
$link = Read-Source 'host_link_demo.c'

# --- fictional pairing code, documentation addresses -------------------------------------------
$displayCode = $PairingCode.Substring(0, 3) + ' ' + $PairingCode.Substring(3)
$main = Replace-Checked $main '"588 460"' ('"' + $displayCode + '"')
$panel = Replace-Checked $panel '"588460"' ('"' + $PairingCode + '"')
$link = Replace-Checked $link '#define PAIR_CODE "588460"' ('#define PAIR_CODE "' + $PairingCode + '"')
$main = Replace-Checked $main '192.168.1.9' '192.0.2.9'
$main = Replace-Checked $main '192.168.1.1' '192.0.2.1'
$panel = Replace-Checked $panel '192.168.1.1' '192.0.2.1'
$panel = Replace-Checked $panel '192.168.1.42' '192.0.2.42'
$panel = Replace-Checked $panel '"58:CF:79:1A:2B:3C"' '"00:00:5E:00:53:2A"'
# An obviously made-up panel ID on About and the enrolment pages.
$panel = Replace-Checked $panel '"0c8b95a1f2d4"' '"0a1b2c3d4e5f"'
$main = Replace-Checked $main '0c8b95a1f2d4' '0a1b2c3d4e5f'
# A present, healthy battery for the panel itself.
$panel = Replace-Checked $panel 'static ui_power_info_t s_power = {.percent = -1};' 'static ui_power_info_t s_power = {.state = UI_BATTERY_PRESENT, .percent = 82};'

# --- custom codes --------------------------------------------------------------------------------
# Change the real engine credentials, rather than masking the snapshot's factory-code flag.
$main = $main.Replace('123456', $MasterCode).Replace('69420', $InstallerCode)
$main = Replace-Checked $main 'type("123");' ('type("' + $MasterCode.Substring(0, 3) + '");')
$main = Replace-Checked $main 'type("1234");' ('type("' + $MasterCode.Substring(0, 4) + '");')
$main = Replace-Checked $main 'type("56k");' ('type("' + $MasterCode.Substring(4) + 'k");')
$main = Replace-Checked $main 'host_panel_init(' 'docs_panel_init('
$main = Replace-Checked $main '#include "host_panel.h"' "#include `"host_panel.h`"`nstatic void docs_panel_init(int64_t epoch);`nstatic void docs_ack_troubles(void);"
# A restored trouble stays counted until someone acknowledges it (code + Off while disarmed, as
# Troubles' Acknowledge sends it). The fixture acknowledges the walk's test troubles once their
# scenes are done, so later pictures don't carry a stale trouble badge.
$main = Replace-Checked $main 'int main(int argc, char **argv)' @"
static void docs_ack_troubles(void)
{
    alarm_cmd_t cmd;
    memset(&cmd, 0, sizeof(cmd));
    cmd.type = ALARM_CMD_DISARM;
    cmd.partition = 1;
    snprintf(cmd.code, sizeof(cmd.code), "$MasterCode");
    expect(host_panel_remote_command(&cmd) == ALARM_OK, "docs: the test troubles weren't acknowledged");
    run(500);
}

static void docs_panel_init(int64_t epoch)
{
    host_panel_init(epoch);
    ui_backend_t be;
    host_panel_backend(&be);
    uint8_t docs_actor = 0;
    expect(be.program_enter(be.ctx, "69420", &docs_actor) == ALARM_OK,
           "docs: cannot enter programming to change factory codes");
    expect(be.program_set_code(be.ctx, 1, "$InstallerCode") == ALARM_OK,
           "docs: installer code was not changed");
    expect(be.program_set_code(be.ctx, 2, "$MasterCode") == ALARM_OK,
           "docs: master code was not changed");
    be.program_exit(be.ctx);
}

int main(int argc, char **argv)
"@
$main = Replace-Checked $main "static void shot(const char *name)`n{" @'
static void shot(const char *name)
{
    ui_backend_t docs_backend;
    alarm_snapshot_t docs_snapshot;
    host_panel_backend(&docs_backend);
    docs_backend.get_snapshot(docs_backend.ctx, &docs_snapshot);
    if (docs_snapshot.default_codes != 0) {
        fprintf(stderr, "docs: factory credentials in screenshot %s\n", name);
    }
    expect(docs_snapshot.default_codes == 0, "docs: factory credentials in screenshot");
'@

# --- walk blocks that show factory-code warnings on purpose --------------------------------------
$main = Remove-Block $main '    printf("Change code\n");' '    printf("Screen saver\n");' `
    "    tap_name(`"nav_home`");`n    ++s_shots; /* change_code omitted: keeps the ordinary walk's numbers */`n`n"
# With custom codes, changing one asks for the existing code first. The manual shows the completed
# setup state, not credential entry; leave those credentials intact.
$main = Remove-Block $main '    tap_text("Installer code");' '    shot("setup_codes");' `
    "    ++s_shots; /* setup_new_code omitted */`n" 'printf("First-boot setup'
# The update-server walk restores factory credentials to test its refusals.
$main = Remove-Block $main '    /* the factory installer code: Change is dimmed, with the reason */' '    /* the installer code changed: the page */' `
    "    ++s_shots; /* fwsrv_factory_code omitted */`n"
$main = Remove-Block $main '    /* the factory code is back while the installer reads the warning: the hold is refused */' `
    '    /* back from the warning forgets the check */' "    ++s_shots; /* fwsrv_refused_factory omitted */`n    tap_name(`"page_back`");`n    run(300);`n`n"
$main = Replace-Checked $main 'expect(find_label(by_name("page_body"), "Still the factory code") != NULL,' 'expect(find_label(by_name("page_body"), "Still the factory code") == NULL,'
$main = Replace-Checked $main '"BL-187: the codes page lost ''Still the factory code''"' '"docs: the normal codes page still shows a factory-code warning"'

# --- tidy scenes for the manual ------------------------------------------------------------------
$main = Replace-Checked $main '    shot("setup_welcome");' "    run(5500); /* let the installer-exit toast finish */`n    shot(`"setup_welcome`");"
$main = Replace-Checked $main '    shot("zone_edit");' "    lv_obj_scroll_to_y(by_name(`"page_body`"), 0, LV_ANIM_OFF);`n    run(300);`n    shot(`"zone_edit`");"
# Only the Troubles illustration should contain the early low-battery test condition.
$main = Replace-Checked $main '    walk_zones_open_none(); /* UI-020, UI-023 (BL-177) */' @'
    walk_zones_open_none(); /* UI-020, UI-023 (BL-177) */
    host_panel_zone(8, ALARM_ZEV_LOW_BATTERY_RESTORE);
    run(300);
    docs_ack_troubles();
'@
$main = Replace-Checked $main '    host_panel_trouble(ALARM_TRBL_AC_LOSS, true);' "    host_panel_zone(8, ALARM_ZEV_LOW_BATTERY);`n    host_panel_trouble(ALARM_TRBL_AC_LOSS, true);"
$main = Replace-Checked $main '    host_panel_trouble(ALARM_TRBL_AC_LOSS, false);' "    host_panel_zone(8, ALARM_ZEV_LOW_BATTERY_RESTORE);`n    host_panel_trouble(ALARM_TRBL_AC_LOSS, false);"
$main = Replace-Checked $main '    shot("zone_unreachable");' "    shot(`"zone_unreachable`");`n    host_panel_zone(5, ALARM_ZEV_REACHABLE);`n    run(300);`n    docs_ack_troubles();"
# The Zigbee contact's tamper, low battery and jamming tests are restored by the walk; acknowledge.
$main = Replace-Checked $main "           `"the Zigbee zone did not recover from interference`");" "           `"the Zigbee zone did not recover from interference`");`n    docs_ack_troubles();"
# The trouble-paging stress test leaves 60 low batteries (Window 11..70): restore and acknowledge
# them once its own checks have passed, so later pictures don't show 60 troubles.
$main = Replace-Checked $main '    printf("Emergency: set up but offline, then connected\n");' @'
    for (uint16_t z = 11; z <= 70; z++) {
        host_panel_zone(z, ALARM_ZEV_LOW_BATTERY_RESTORE);
    }
    run(300);
    docs_ack_troubles();
    printf("Emergency: set up but offline, then connected\n");
'@

# --- write the staged copies and a CMake project that swaps them in ------------------------------
$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $stage 'main.c'), $main, $utf8)
[IO.File]::WriteAllText((Join-Path $stage 'host_panel.c'), $panel, $utf8)
[IO.File]::WriteAllText((Join-Path $stage 'host_link_demo.c'), $link, $utf8)
$cmakeRepo = $repo.Replace('\', '/')
$cmakeStage = $stage.Replace('\', '/')
$cmake = @"
cmake_minimum_required(VERSION 3.20)
project(docs_preview C)
add_subdirectory("$cmakeRepo/host/ui_preview" preview)
get_target_property(docs_sources ui_preview SOURCES)
list(FILTER docs_sources EXCLUDE REGEX "(^|/)(main|host_panel|host_link_demo)[.]c$")
set(docs_abs)
foreach(src IN LISTS docs_sources)
    if(IS_ABSOLUTE "`${src}")
        list(APPEND docs_abs "`${src}")
    else()
        list(APPEND docs_abs "$cmakeRepo/host/ui_preview/`${src}")
    endif()
endforeach()
set_property(TARGET ui_preview PROPERTY SOURCES "$cmakeStage/main.c" "$cmakeStage/host_panel.c" "$cmakeStage/host_link_demo.c" `${docs_abs})
target_include_directories(ui_preview PRIVATE "$cmakeRepo/host/ui_preview")
"@
[IO.File]::WriteAllText((Join-Path $stage 'CMakeLists.txt'), $cmake, $utf8)

$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python -or $python -like '*WindowsApps*') {
    $python = 'C:/Espressif/tools/python/v6.1/venv/Scripts/python.exe'
}
$pythonOpt = @(if (Test-Path $python) { "-DPython3_EXECUTABLE=$python" })
cmake -S $stage -B $build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_C_COMPILER=gcc -DALARM_BOARD=crowpanel_p4 $pythonOpt
$configureExitCode = $LASTEXITCODE
if ($configureExitCode) {
    Write-CaptureStatus 'configure_failed' $configureExitCode $false
    exit $configureExitCode
}
cmake --build $build --target ui_preview
$buildExitCode = $LASTEXITCODE
if ($buildExitCode) {
    Write-CaptureStatus 'build_failed' $buildExitCode $false
    exit $buildExitCode
}

$previewExe = Join-Path $build 'preview/ui_preview.exe'
$process = Start-Process -FilePath $previewExe -ArgumentList ('"' + $shots + '"') -WorkingDirectory $repo `
    -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput $captureStdout -RedirectStandardError $captureStderr
$nativeExitCode = $process.ExitCode
$stdout = if (Test-Path -LiteralPath $captureStdout) { Get-Content -LiteralPath $captureStdout -Raw } else { '' }
$stderr = if (Test-Path -LiteralPath $captureStderr) { Get-Content -LiteralPath $captureStderr -Raw } else { '' }
if ($stdout) { Write-Host $stdout }
if ($stderr) { [Console]::Error.WriteLine($stderr) }
$summaryMatch = [regex]::Match($stdout, '(?m)^\d+ screenshots\r?$')
$summaryFound = $summaryMatch.Success
$summary = if ($summaryFound) { $summaryMatch.Value.Trim() } else { '' }
Write-CaptureStatus $(if ($summaryFound -and $nativeExitCode -eq 0) { 'completed' } else { 'preview_failed' }) `
    $nativeExitCode $summaryFound $summary
if ($nativeExitCode -ne 0) { exit $nativeExitCode }
if (-not $summaryFound) {
    Write-Error "Preview exited without its normal completion summary; see $captureStdout and $captureStderr"
    exit 1
}
Write-Host "Shots: $shots"
exit 0
