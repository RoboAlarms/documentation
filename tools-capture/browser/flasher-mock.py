"""Documentation capture fixture: the production RoboAlarms Flasher against MockWorld only.

Adapted from the website's build/website-flasher-capture.py (2026-10-13) for the current sources.
Nothing touches real serial ports. Changes, all at run time (no file in the repository is edited):
- the Controller keeps its backups, captures and logs under <alarm-panel>/build/docs-capture/flasher;
- the pretend firmware server offers synthetic Alpha 0.8.22 firmware and English voice revision 9;
- MockWorld keeps only the pretend panels named in DOCS_FLASHER_PORTS (default COM5 = factory
  software, COM6 = an older RoboAlarms install), so the port list is short and fictional.

Usage (from anywhere):  <venv python> flasher-mock.py <alarm-panel root> <url-file> [http-port]
"""
from pathlib import Path
import os
import sys

ROOT = Path(sys.argv[1]).resolve()
URL_FILE = sys.argv[2]
PORT = sys.argv[3] if len(sys.argv) > 3 else "0"
sys.path.insert(0, str(ROOT / "tools" / "flasher"))
os.chdir(ROOT)

from roboflash.mock import MockWorld  # noqa: E402
from roboflash.app import main  # noqa: E402
from roboflash import testkit  # noqa: E402
from roboflash.controller import Controller  # noqa: E402

OUT = ROOT / "build" / "docs-capture" / "flasher"
_controller_init = Controller.__init__


def docs_controller(self, **kwargs):
    kwargs["backups_dir"] = str(OUT / "Backups")
    kwargs["captures_dir"] = str(OUT / "Captures")
    kwargs["logs_dir"] = str(OUT / "logs")
    _controller_init(self, **kwargs)


Controller.__init__ = docs_controller


def docs_server(delay=1.5, app_size=192 * 1024):
    server = testkit.FakeServer(delay=delay)
    images = [testkit.synthetic_image(version="0.8.22", profile="release", app_size=3 * 1024 * 1024),
              testkit.synthetic_image(version="0.8.22", profile="release", min_rev=301, max_rev=399,
                                      app_size=3 * 1024 * 1024)]
    server.add("crowpanel_p4", "alpha", "0.8.22", testkit.bundle_bytes(images),
               chip_revs=["v1", "v3"], voices=[("en-US", testkit.voice_file(9))],
               assets=[(name, testkit.asset_file(kind, "0.8.22")) for name, kind in
                       (("letters", 3), ("picture", 4), ("certificates", 5))])
    return server


testkit.mock_server = docs_server
KEEP = [p for p in os.environ.get("DOCS_FLASHER_PORTS", "COM5,COM6").split(",") if p]
_initialize_world = MockWorld.__init__


def docs_world(self, bundle=None, **kwargs):
    _initialize_world(self, bundle, **kwargs)
    for dev in self.devices.values():
        if hasattr(dev, "board") and getattr(dev.board, "seconds_per_mb", None):
            dev.board.seconds_per_mb = 8   # slow enough to catch the progress screens
    self.devices = {k: v for k, v in self.devices.items() if k in KEEP}


MockWorld.__init__ = docs_world

# The page shows where backups go. The files really go under build/docs-capture/flasher, but the page
# is told a fictional user's usual folders (C:\Users\Alex\...), so no real home-directory path is shown.
# Only the server's JSON is mapped (both ways); the frontend files are untouched.
import json as _json  # noqa: E402
from roboflash import server as _server  # noqa: E402

_MAP = [(str(OUT / "logs"), r"C:\Users\Alex\AppData\Local\RoboAlarms\Flasher\logs"),
        (str(OUT), r"C:\Users\Alex\Documents\RoboAlarms")]
_ESC = [(_json.dumps(real)[1:-1], _json.dumps(shown)[1:-1]) for real, shown in _MAP]


class _DocsJson:
    def __getattr__(self, name):
        return getattr(_json, name)

    @staticmethod
    def dumps(obj, *a, **kw):
        s = _json.dumps(obj, *a, **kw)
        for real, shown in _ESC:
            s = s.replace(real, shown)
        return s

    @staticmethod
    def loads(s, *a, **kw):
        if isinstance(s, (bytes, bytearray)):
            s = s.decode("utf-8")
        for real, shown in _ESC:
            s = s.replace(shown, real)
        return _json.loads(s, *a, **kw)


_server.json = _DocsJson()

if __name__ == "__main__":
    sys.exit(main(["--mock", "--no-open", "--http-port", PORT, "--url-file", URL_FILE]))
