"""ClassiFile walkthrough with the repository's own made-up library (tools.screenshots.build). Run from the
ClassiFile folder: python cf_rec.py <frames_dir>"""
import os
import sys
import tempfile
import time
from pathlib import Path

os.environ["QT_QPA_PLATFORM"] = "offscreen"
os.environ["QT_SCALE_FACTOR"] = "1.5"
os.environ["CLASSIFILE_OCR"] = "off"
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, os.getcwd())

from PySide6.QtCore import Qt
from PySide6.QtGui import QFont, QFontDatabase
from PySide6.QtTest import QTest
from PySide6.QtWidgets import QAbstractButton, QApplication, QLineEdit

from qtrec import Rec


def main(frames):
    from classifile.app import make_app
    from classifile.app.main import ALL, AUTO, DECIDE, MainWindow
    from classifile.catalog.db import Catalog
    from classifile.organizer import Organizer
    from tools.screenshots import build

    app = QApplication.instance() or make_app([])
    app.setStyle("windows11")
    fonts = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
    for name in ("segoeui.ttf", "seguisb.ttf", "seguisym.ttf", "SegoeIcons.ttf", "segmdl2.ttf"):
        if (fonts / name).exists():
            QFontDatabase.addApplicationFont(str(fonts / name))
    app.setFont(QFont("Segoe UI", 10))

    with tempfile.TemporaryDirectory(prefix="classifile-rec-", ignore_cleanup_errors=True) as tmp:
        base = Path(tmp) / "lib"
        build(base)
        org = Organizer(Catalog(base / "data" / "catalog.sqlite3"))
        w = MainWindow(org, ask_output_root=False)
        w.ask_close = lambda n: ("close", False)
        w.set_appearance("dark")
        w.resize(1280, 720)
        w.show()
        for _ in range(20):
            app.processEvents()
            time.sleep(0.02)

        def button(prefix):
            found = [b for b in w.findChildren(QAbstractButton) if b.isVisible() and b.text().startswith(prefix)]
            return found[0] if found else None

        def press(prefix, r, after=1.6):
            b = button(prefix)
            print("press", prefix, "->", b.text() if b else None)
            if b:
                QTest.mouseClick(b, Qt.LeftButton)
            r.wait(after)

        r = Rec(w, frames)
        w.show_view(ALL)
        r.start()
        r.mark("A made-up library, classified offline (no network calls)")
        r.wait(2.2)
        w.show_view(DECIDE)
        r.mark("When it isn't sure, it asks instead of guessing")
        r.wait(2.2)
        first = w.waiting_docs[0]["id"] if w.waiting_docs else None
        if first:
            w.show_details(first)
            r.mark("Each suggestion explains itself: similar documents and shared terms")
            r.wait(2.6)
        r.mark("Filing works on a hash-verified copy; the original never changes")
        press("File in", r, 2.2)
        w.close_details()
        r.wait(0.8)
        name = next((e for e in w.findChildren(QLineEdit) if e.isVisible() and "name" in e.placeholderText().lower()), None)
        if name:
            r.mark("Documents that share a new subject become a new category")
            QTest.mouseClick(name, Qt.LeftButton)
            for ch in "Photography":
                QTest.keyClick(name, ch)
                r.wait(0.07)
            r.wait(0.6)
            press("Create", r, 2.2)
        w.show_view(AUTO)
        r.mark("Files automatically only when one category is clearly ahead")
        r.wait(1.8)
        filed = [i.doc_id for i in w.auto_page.items] if hasattr(w.auto_page, "items") else []
        if filed:
            w.show_details(filed[0])
            r.wait(2.4)
            r.mark("Every confirmation teaches it")
            press("Looks right", r, 2.2)
            w.close_details()
            r.wait(0.6)
        cat = next(c["id"] for c in w.org.catalog.categories() if c["name"] == "Recipes")
        w.show_view("category", cat)
        r.mark("Browse by category")
        r.wait(2.4)
        r.done()
        w.close()
        w.org.catalog.close()
        app.processEvents()


if __name__ == "__main__":
    main(sys.argv[1])
