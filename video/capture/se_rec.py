"""SummarEase walkthrough + screenshots with an invented, readable handbook. Run from the SummarEase folder:
python se_rec.py <frames_dir> <shots_dir>"""
import os
import sys
import tempfile
from pathlib import Path

os.environ["QT_SCALE_FACTOR"] = "1.5"
os.environ["CLASSIFILE_OCR"] = "off"
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, os.getcwd())

import pymupdf
from PySide6.QtCore import Qt, QUrl
from PySide6.QtTest import QTest
from PySide6.QtWidgets import QApplication

from qtrec import Rec

SECTIONS = [
    ("Welcome to the garden", [
        "This handbook explains how the shared garden on Maple Street works for new members.",
        "Every member looks after one raised bed and shares the tools in the shed.",
        "Members meet on the first Saturday of each month to plan planting and repairs.",
    ]),
    ("Choosing what to grow", [
        "Beds that get morning sun suit lettuce, spinach and peas in the cooler months.",
        "Tomatoes, beans and squash need at least six hours of direct sun each day.",
        "Rotating crops between beds every year keeps the soil healthy and reduces pests.",
        "Herbs such as basil and mint grow well in the small pots beside the gate.",
    ]),
    ("Watering and soil", [
        "Water early in the morning so the leaves dry before the afternoon heat.",
        "A thick layer of mulch keeps moisture in the soil and stops weeds from spreading.",
        "The compost bins accept fruit, vegetable scraps and dry leaves, but never meat or oil.",
        "Turn the compost every two weeks so it breaks down evenly.",
    ]),
    ("Sharing tools and space", [
        "Return every tool to its hook in the shed and clean off the soil after use.",
        "Book the wheelbarrow and the long hose on the board by the door.",
        "Paths between the beds must stay clear so everyone can move around safely.",
    ]),
    ("Harvest and the produce table", [
        "Pick vegetables when they are ready, because overgrown plants stop producing.",
        "Extra produce goes on the shared table at the entrance for any member to take.",
        "At the end of the season each member clears their bed and adds fresh compost.",
    ]),
]


def make_pdf(path):
    d = pymupdf.open()
    p = d.new_page()
    y = 90
    p.insert_text((72, y), "Community Garden Handbook", fontsize=24, fontname="hebo")
    y += 40
    for heading, paras in SECTIONS:
        if y > 120:
            p, y = d.new_page(), 90
        p.insert_text((72, y), heading, fontsize=16, fontname="hebo")
        y += 26
        for para in paras:
            rect = pymupdf.Rect(72, y, 523, y + 60)
            p.insert_textbox(rect, para, fontsize=11, fontname="helv", lineheight=1.4)
            y += 38
        y += 14
    d.save(path)


def main(frames, shots):
    from summarease.app import MainWindow
    app = QApplication([])
    app.setStyle("Fusion")
    shots = Path(shots)
    shots.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp())
    doc = tmp / "Community garden handbook.pdf"
    make_pdf(doc)

    w = MainWindow()
    w.setAttribute(Qt.WA_DontShowOnScreen)
    w.resize(1280, 720)
    w.apply_theme("dark")
    w.show()
    r = Rec(w, frames)

    def snap(n):
        w.grab().toImage().scaled(1280, 720, Qt.KeepAspectRatio, Qt.SmoothTransformation).save(str(shots / f"{n}.jpg"), "JPG", 84)

    def until(done):
        while not done():
            QTest.qWait(50)

    def level(name):
        w.level.setCurrentIndex(["brief", "key", "detailed", "comprehensive"].index(name))

    r.start()
    r.wait(1.0)
    r.hold(lambda: (w.open_file(doc), until(lambda: w.read_job is None)))
    r.wait(1.2)
    bar = w.source_view.verticalScrollBar()
    r.scroll(bar, bar.maximum() // 2, 1.6)
    r.wait(0.5)
    r.scroll(bar, 0, 1.0)
    snap(4)                                      # the document read, no summary yet
    level("key")
    r.wait(0.8)
    QTest.mouseClick(w.summarize_button, Qt.LeftButton)
    r.wait(0.4)
    r.hold(lambda: until(lambda: w.sum_job is None))
    r.wait(2.0)
    snap(1)                                      # key points, each line linked to its page
    late = [l.unit for l in getattr(w.summary, "lines", []) if getattr(l, "unit", None) is not None]
    print("summary lines:", len(late))
    w.follow(QUrl(f"#u{late[-2] if len(late) > 1 else 0}"), "summary")   # what a click on a line's page link runs
    r.wait(2.0)
    snap(2)
    level("detailed")
    r.wait(0.8)
    QTest.mouseClick(w.summarize_button, Qt.LeftButton)
    r.wait(0.4)
    r.hold(lambda: until(lambda: w.sum_job is None))
    r.wait(1.4)
    sbar = w.summary_view.verticalScrollBar()
    if sbar.maximum():
        r.scroll(sbar, sbar.maximum(), 1.8)
    r.wait(0.6)
    final = w.export_to(str(tmp / "Community garden handbook - Detailed summary.pdf"))
    print("exported:", Path(final).name if final else None, Path(final).stat().st_size if final else 0)
    r.wait(2.0)
    snap(3)                                      # detailed summary, export notice
    r.done()
    w.close()


if __name__ == "__main__":
    main(*sys.argv[1:3])
