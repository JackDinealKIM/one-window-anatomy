#!/usr/bin/env python3
"""Runtime verification for the JOIN LAB page: console, interactions, overflow."""
import json
import pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = "file://" + str(ROOT / "index.html")
OUT = ROOT / "screenshots"
CHROME = "/workspace/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome"
ARGS = ["--no-sandbox", "--force-color-profile=srgb", "--single-process", "--no-zygote",
        "--disable-dev-shm-usage", "--font-render-hinting=none"]

report = {"desktop": {}, "mobile": {}, "console": []}


def main():
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=CHROME, args=ARGS)
        ctx = b.new_context(viewport={"width": 1120, "height": 1000}, device_scale_factor=2)
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
        pg.on("console", lambda m: errs.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        pg.goto(PAGE, wait_until="load")
        pg.wait_for_timeout(1000)

        readout = lambda: pg.text_content("[data-readout]")
        report["desktop"]["readout_idle"] = readout()

        # keyboard: move selection and pin with Enter
        pg.click("[data-stage]")
        pg.wait_for_timeout(200)
        pg.keyboard.press("ArrowRight")
        report["desktop"]["readout_arrow"] = readout()
        pg.keyboard.press("Enter")
        pg.wait_for_timeout(400)
        report["desktop"]["readout_after_enter"] = readout()

        pg.keyboard.press("r")
        pg.wait_for_timeout(500)
        report["desktop"]["readout_reset"] = readout()

        # hover a drawer
        pg.hover("[data-drawer='5']")
        pg.wait_for_timeout(300)
        report["desktop"]["readout_hover"] = readout()

        # a pair with no shared key -> blocked
        pg.click("[data-group='0']")
        pg.wait_for_timeout(400)
        pg.click("[data-group='8']")
        pg.wait_for_timeout(900)
        pg.click("[data-act='press']")
        pg.wait_for_timeout(1200)
        report["desktop"]["readout_blocked"] = readout()
        report["desktop"]["card_hidden_when_blocked"] = pg.evaluate(
            "getComputedStyle(document.querySelector('[data-part=card]')).display === 'none'")
        pg.query_selector(".iso-plate").screenshot(path=str(OUT / "04_plate_reject.png"))

        # a pair that joins -> card printed
        pg.click("[data-act='reset']")
        pg.wait_for_timeout(500)
        pg.click("[data-group='2']")
        pg.wait_for_timeout(300)
        pg.click("[data-group='7']")
        pg.wait_for_timeout(900)
        pg.click("[data-act='press']")
        pg.wait_for_timeout(1500)
        report["desktop"]["readout_joined"] = readout()
        report["desktop"]["card_visible_when_joined"] = pg.evaluate(
            "getComputedStyle(document.querySelector('[data-part=card]')).display !== 'none'")
        press = pg.get_attribute("[data-part=press]", "transform")
        report["desktop"]["press_transform"] = press

        # explode
        pg.click("[data-act='explode']")
        pg.wait_for_timeout(1400)
        report["desktop"]["cabinet_transform"] = pg.get_attribute("[data-part=cabinet]", "transform")
        pg.query_selector(".iso-plate").screenshot(path=str(OUT / "05_plate_exploded.png"))

        # dark theme
        pg.click("[data-theme-toggle]")
        pg.wait_for_timeout(500)
        pg.query_selector(".iso-plate").screenshot(path=str(OUT / "07_plate_dark.png"))
        report["desktop"]["theme"] = pg.evaluate("document.body.dataset.theme")
        pg.click("[data-theme-toggle]")

        report["desktop"]["overflow_x"] = pg.evaluate(
            "document.documentElement.scrollWidth - window.innerWidth")
        report["desktop"]["svg_nodes"] = pg.evaluate("document.querySelectorAll('.iso-svg path').length")
        b.close()

    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=CHROME, args=ARGS)
        ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=3)
        m = ctx.new_page()
        m.on("pageerror", lambda e: errs.append("mobile pageerror: " + str(e)))
        m.goto(PAGE, wait_until="load")
        m.wait_for_timeout(900)
        report["mobile"]["overflow_x"] = m.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        report["mobile"]["plate_width"] = m.evaluate("document.querySelector('.iso-plate').getBoundingClientRect().width")
        m.query_selector(".iso-plate").screenshot(path=str(OUT / "09_plate_mobile.png"))
        m.screenshot(path=str(OUT / "10_mobile_full.png"), full_page=True)
        b.close()

    report["console"] = errs
    print(json.dumps(report, ensure_ascii=False, indent=1))


main()
