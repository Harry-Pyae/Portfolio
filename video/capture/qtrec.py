"""Frame recorder for Qt windows, same output as hq.mjs: JPEG frames + index.json {duration, frames: [{f, t}]}.

Rec(widget, dir).start(); rec.wait(s) pumps events and grabs the widget about every 1/30 s; rec.hold(fn) runs fn
off the record (its time is cut from the timeline); rec.stop(); rec.done() writes index.json.
"""
import json
import shutil
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PySide6.QtCore import Qt
from PySide6.QtWidgets import QApplication


class Rec:
    def __init__(self, widget, out, size=(1920, 1080)):
        self.w, self.out, self.size = widget, Path(out), size
        shutil.rmtree(self.out, ignore_errors=True)
        self.out.mkdir(parents=True)
        self.frames, self.t, self.last, self.on = [], 0.0, None, False
        self.pool = ThreadPoolExecutor(8)      # scaling + JPEG encoding off the UI thread (encoding is ~5x a grab)
        self.pending = []
        self.marks = []                        # caption cues: {t, text} on the edited timeline

    def _grab(self):
        img = self.w.grab().toImage()
        name = f"f{len(self.frames) + 1:05d}.jpg"
        self.pending.append(self.pool.submit(self._save, img, str(self.out / name)))
        self.frames.append({"f": name, "t": round(self.t, 4)})
        if len(self.pending) > 24:             # bound memory: wait for the oldest encodes
            for f in self.pending[:12]:
                f.result()
            self.pending = self.pending[12:]

    def _save(self, img, path):
        if (img.width(), img.height()) != self.size:
            img = img.scaled(*self.size, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        img.save(path, "JPG", 92)

    def _tick(self):
        now = time.monotonic()
        if self.on:
            self.t += now - self.last
        self.last = now

    def start(self):
        self.last, self.on = time.monotonic(), True
        QApplication.processEvents()
        self._grab()

    def mark(self, text):
        """Caption for what happens next (a lower third in the Walkthrough video)."""
        self._tick()
        self.marks.append({"t": round(self.t, 3), "text": text})

    def stop(self):
        self._tick()
        self.on = False

    def wait(self, seconds):
        end = time.monotonic() + seconds
        while time.monotonic() < end:
            QApplication.processEvents()
            self._tick()
            if self.on and (not self.frames or self.t - self.frames[-1]["t"] >= 1 / 30):
                self._grab()
            time.sleep(0.005)

    def hold(self, fn, settle=0.3):
        self.stop()
        fn()
        end = time.monotonic() + settle
        while time.monotonic() < end:
            QApplication.processEvents()
            time.sleep(0.01)
        self.start()

    def scroll(self, bar, to, seconds):
        """Ease a scroll bar to a value while recording."""
        start, end0 = bar.value(), time.monotonic()
        while (k := (time.monotonic() - end0) / seconds) < 1:
            e = k * k * (3 - 2 * k)
            bar.setValue(int(start + (to - start) * e))
            self.wait(1 / 40)
        bar.setValue(to)

    def done(self):
        self.stop()
        self._grab()
        self.pool.shutdown(wait=True)
        (self.out / "index.json").write_text(json.dumps({"duration": round(self.t + 0.5, 3), "frames": self.frames, "marks": self.marks}))
        print(f"recorded {len(self.frames)} frames, {self.t:.1f} s -> {self.out}")
