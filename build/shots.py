#!/usr/bin/env python3
"""Screenshots + console check for the JOIN LAB page."""
import json
import pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = "file://" + str(ROOT / "index.html")
OUT = ROOT / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/workspace/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome"
ARGS = ["--no-sandbox", "--force-color-profile=srgb", "--single-process", "--no-zygote",
        "--disable-dev-shm-usage", "--font-render-hinting=none"]

logs = []


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=ARGS)
        ctx = b.new_context(viewport={"width": 1120, "height": 1000}, device_scale_factor=2)
        pg = ctx.new_page()
        pg.on("pageerror", lambda e: logs.append(["pageerror", str(e)]))
        pg.on("console", lambda m: logs.append([m.type, m.text]) if m.type in ("error", "warning") else None)
        pg.goto(PAGE, wait_until="load")
        pg.wait_for_timeout(1200)

        def plate_shot(name, page=None):
            el = (page or pg).query_selector(".iso-plate")
            el.screenshot(path=str(OUT / name), timeout=60000)
            print("saved", name, flush=True)

        plate_shot("01_plate_idle.png")

        pg.click("[data-group='2']")
        pg.wait_for_timeout(700)
        pg.click("[data-group='7']")
        pg.wait_for_timeout(1300)
        plate_shot("02_plate_pinned.png")

        pg.click("[data-act='press']")
        pg.wait_for_timeout(1500)
        plate_shot("03_plate_joined.png")

        pg.click("[data-act='reset']")
        pg.wait_for_timeout(700)
        pg.click("[data-group='0']")
        pg.wait_for_timeout(500)
        pg.click("[data-group='8']")
        pg.wait_for_timeout(1200)
        pg.click("[data-act='press']")
        pg.wait_for_timeout(1200)
        plate_shot("04_plate_reject.png")

        pg.click("[data-act='explode']")
        pg.wait_for_timeout(1800)
        plate_shot("05_plate_exploded.png")
        pg.evaluate("window.scrollTo(0,0)")
        pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / "06_full_page.png"), full_page=True, timeout=60000)
        print("saved 06_full_page.png", flush=True)

        pg.click("[data-theme-toggle]")
        pg.wait_for_timeout(800)
        plate_shot("07_plate_dark.png")
        pg.click("[data-theme-toggle]")
        pg.click("[data-act='explode']")
        pg.click("[data-act='reset']")
        pg.wait_for_timeout(1200)
        pg.hover("[data-drawer='7']")
        pg.wait_for_timeout(600)
        plate_shot("08_plate_hover.png")

        m = b.new_context(viewport={"width": 390, "height": 880}, device_scale_factor=3).new_page()
        m.on("pageerror", lambda e: logs.append(["pageerror-mobile", str(e)]))
        m.goto(PAGE, wait_until="load")
        m.wait_for_timeout(1200)
        plate_shot("09_plate_mobile.png", m)
        print("saved 09_plate_mobile.png", flush=True)
        b.close()
    print(json.dumps(logs, ensure_ascii=False, indent=1)[:2000], flush=True)


main()
