#!/usr/bin/env python3
"""Screenshots of the JOIN LAB 10-second diagnosis page.

Writes the review set into ../screenshots/ and the two figures used by the
proposal into ../../documents/one-window-2026/_build/.
"""
import json
import pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = "file://" + str(ROOT / "index.html")
OUT = ROOT / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)
DOC = ROOT.parent.parent / "documents" / "one-window-2026" / "_build"
CHROME = "/workspace/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome"
ARGS = ["--no-sandbox", "--force-color-profile=srgb", "--single-process", "--no-zygote",
        "--disable-dev-shm-usage", "--font-render-hinting=none"]

logs = []


def pick(pg, a, b=None):
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(150)
    for i in ((a,) if b is None else (a, b)):
        pg.click(f"[data-pick='{i}']")
        pg.wait_for_timeout(220)
    pg.wait_for_timeout(650)


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=ARGS)
    ctx = b.new_context(viewport={"width": 1120, "height": 1000}, device_scale_factor=2)
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: logs.append(["pageerror", str(e)]))
    pg.on("console", lambda m: logs.append([m.type, m.text]) if m.type in ("error", "warning") else None)
    pg.goto(PAGE, wait_until="load")
    pg.wait_for_timeout(900)

    def plate(name):
        pg.query_selector(".plate").screenshot(path=str(OUT / name), timeout=60000)
        print("saved", name, flush=True)

    pg.screenshot(path=str(OUT / "01_idle_full.png"), full_page=True)
    print("saved 01_idle_full.png", flush=True)
    plate("02_plate_idle.png")

    pick(pg, 0)
    plate("03_plate_one.png")

    pick(pg, 0, 1)
    plate("04_plate_ok.png")
    pg.screenshot(path=str(OUT / "05_full_ok.png"), full_page=True)
    print("saved 05_full_ok.png", flush=True)

    pick(pg, 0, 2)
    plate("06_plate_pseudo.png")

    pick(pg, 2, 4)
    plate("07_plate_bad.png")

    # 다크 테마
    pg.click("[data-theme-toggle]")
    pg.wait_for_timeout(400)
    pick(pg, 0, 1)
    plate("08_plate_dark.png")
    pg.click("[data-theme-toggle]")
    pg.wait_for_timeout(300)

    # 제안서 그림 (결합 가능 · 가명처리 · 법적 제한)
    pick(pg, 0, 1)
    pg.wait_for_timeout(300)
    pg.query_selector(".plate").screenshot(path=str(DOC / "shot_ok.png"))
    pick(pg, 0, 2)
    pg.query_selector(".plate").screenshot(path=str(DOC / "shot_pseudo.png"))
    pick(pg, 2, 4)
    pg.query_selector(".plate").screenshot(path=str(DOC / "shot_bad.png"))
    print("saved proposal figures", flush=True)
    ctx.close()
    b.close()

    b = pw.chromium.launch(executable_path=CHROME, args=ARGS)
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=3)
    m = ctx.new_page()
    m.on("pageerror", lambda e: logs.append(["mobile pageerror", str(e)]))
    m.goto(PAGE, wait_until="load")
    m.wait_for_timeout(900)
    pick(m, 0, 1)
    m.screenshot(path=str(OUT / "09_mobile_full.png"), full_page=True)
    m.query_selector(".plate").screenshot(path=str(OUT / "10_mobile_plate.png"))
    print("saved mobile shots", flush=True)
    b.close()

print(json.dumps(logs, ensure_ascii=False)[:1200], flush=True)
