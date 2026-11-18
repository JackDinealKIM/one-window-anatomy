#!/usr/bin/env python3
"""Runtime verification for the JOIN LAB 10-second diagnosis page.

Checks: console errors, the three verdict states, keyboard control, theme toggle,
aria labels, and horizontal overflow at desktop / tablet / mobile widths.
Prints a JSON report and exits non-zero when a check fails.
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = "file://" + str(ROOT / "index.html")
CHROME = "/workspace/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome"
ARGS = ["--no-sandbox", "--force-color-profile=srgb", "--single-process", "--no-zygote",
        "--disable-dev-shm-usage", "--font-render-hinting=none"]

report = {"states": {}, "keyboard": {}, "a11y": {}, "overflow": {}, "console": []}
fails = []
errors = []


def check(name, got, want):
    report["states"][name] = got
    if got != want:
        fails.append(f"{name}: got {got!r}, want {want!r}")


def open_page(b, width, height, scale=2):
    ctx = b.new_context(viewport={"width": width, "height": height}, device_scale_factor=scale)
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    pg.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    pg.goto(PAGE, wait_until="load")
    pg.wait_for_timeout(700)
    return ctx, pg


def pair(pg, a, b):
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(150)
    for i in (a, b):
        pg.click(f"[data-pick='{i}']")
        pg.wait_for_timeout(200)
    pg.wait_for_timeout(500)


def snap(pg):
    return {
        "readout": pg.text_content("[data-readout]"),
        "badge": pg.text_content("[data-badge]"),
        "score": pg.text_content("[data-score]"),
        "keys": pg.eval_on_selector_all("[data-keys] .chip", "els => els.map(e => e.textContent)"),
        "apply": pg.text_content("[data-apply]").replace("\u00a0", " "),
        "tone": pg.get_attribute("[data-verdict]", "data-tone"),
        "lamp": pg.get_attribute("[data-lamp]", "data-lamp"),
        "pressed": pg.eval_on_selector_all("[data-pick]", "els => els.map(e => e.getAttribute('aria-pressed'))"),
    }


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=ARGS)
    ctx, pg = open_page(b, 1120, 1000)

    # ── idle
    s = snap(pg)
    check("idle.readout", s["readout"], "데이터 2개를 고르세요")
    check("idle.badge", s["badge"], "대기")
    check("idle.tone", s["tone"], "wait")

    # ── 결합 가능 — 상권·유동인구 × 교통
    pair(pg, 0, 1)
    s = snap(pg)
    check("ok.badge", s["badge"], "결합 가능")
    check("ok.score", s["score"], "60")
    check("ok.keys", s["keys"], ["법정동코드", "기준일자"])
    check("ok.tone", s["tone"], "ok")
    check("ok.lamp", s["lamp"], "ok")
    check("ok.pressed", s["pressed"], ["true", "true", "false", "false", "false"])
    check("ok.readout_has_url", "결합 가능" in s["readout"] and "적합도 60" in s["readout"], True)
    check("ok.apply_has_org", "통신 빅데이터 플랫폼 센터" in s["apply"] and "이용신청서" in s["apply"], True)

    # ── 가명처리 필요 — 상권 × 보건·의료
    pair(pg, 0, 2)
    s = snap(pg)
    check("pseudo.badge", s["badge"], "가명처리 필요")
    check("pseudo.tone", s["tone"], "pseudo")
    check("pseudo.apply_has_org", "결합전문기관" in s["apply"], True)

    # ── 법적 제한 — 보건·의료 × 카드·소비
    pair(pg, 2, 4)
    s = snap(pg)
    check("bad.badge", s["badge"], "법적 제한")
    check("bad.tone", s["tone"], "bad")
    check("bad.lamp", s["lamp"], "bad")
    check("bad.apply_has_reason", "신용정보법" in s["apply"], True)

    # ── 세 번째 선택은 가장 오래된 선택을 교체
    pair(pg, 0, 1)
    pg.click("[data-pick='3']")
    pg.wait_for_timeout(400)
    check("rotate.pressed", snap(pg)["pressed"], ["false", "true", "false", "true", "false"])

    # ── 하나만 고른 상태
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(200)
    pg.click("[data-pick='3']")
    pg.wait_for_timeout(400)
    s = snap(pg)
    check("one.badge", s["badge"], "대기")
    check("one.readout", s["readout"], "부동산·공간 · 하나 더 고르세요")

    # ── 키보드: 숫자 선택, Esc 초기화
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(200)
    pg.keyboard.press("4")
    pg.wait_for_timeout(200)
    pg.keyboard.press("5")
    pg.wait_for_timeout(500)
    k1 = snap(pg)
    report["keyboard"]["after_4_5"] = k1["readout"]
    check("keyboard.badge", k1["badge"], "가명처리 필요")
    check("keyboard.score", k1["score"], "68")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(300)
    check("keyboard.escape", snap(pg)["readout"], "데이터 2개를 고르세요")

    # ── aria
    pair(pg, 0, 1)
    report["a11y"]["svg_label"] = pg.get_attribute("[data-svg]", "aria-label")
    check("a11y.svg_label_has_verdict", "결합 가능" in (report["a11y"]["svg_label"] or ""), True)
    check("a11y.picks_role", pg.get_attribute("[data-picks]", "role"), "group")
    check("a11y.live_region", pg.get_attribute("[data-readout]", "aria-live"), "polite")

    # ── 테마 전환
    pg.click("[data-theme-toggle]")
    pg.wait_for_timeout(300)
    check("theme.dark", pg.evaluate("document.documentElement.dataset.theme"), "dark")
    check("theme.label", pg.text_content("[data-theme-toggle]"), "라이트")
    pg.click("[data-theme-toggle]")
    pg.wait_for_timeout(200)
    check("theme.light", pg.evaluate("document.documentElement.dataset.theme"), "light")

    check("desktop.overflow_x", pg.evaluate("document.documentElement.scrollWidth - window.innerWidth"), 0)
    report["overflow"]["desktop_1120"] = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")

    # ── 태블릿 · 모바일 (같은 페이지에서 뷰포트만 바꿔 검사)
    for w, h, tag in ((768, 900, "tablet_768"), (390, 844, "mobile_390"), (320, 800, "small_320")):
        pg.set_viewport_size({"width": w, "height": h})
        pg.wait_for_timeout(400)
        pair(pg, 0, 1)
        ov = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        report["overflow"][tag] = ov
        if ov != 0:
            fails.append(f"{tag} overflow_x = {ov}")
        report["states"][tag + ".badge"] = pg.text_content("[data-badge]")
        # 카드가 잘리거나 겹치지 않는지: 마지막 카드가 컨테이너 안에 있는지
        inside = pg.evaluate("""() => {
            const box = document.querySelector('[data-picks]').getBoundingClientRect();
            return Array.from(document.querySelectorAll('[data-pick]')).every(el => {
                const r = el.getBoundingClientRect();
                return r.right <= box.right + 0.5 && r.left >= box.left - 0.5;
            });
        }""")
        report["states"][tag + ".picks_inside"] = inside
        if not inside:
            fails.append(f"{tag}: pick card overflows its grid")

    ctx.close()
    b.close()

report["console"] = errors
if errors:
    fails.append(f"{len(errors)} console/page errors")

print(json.dumps(report, ensure_ascii=False, indent=1))
(pathlib.Path(__file__).resolve().parent / "verify-report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=1))
if fails:
    print("\nFAILED:")
    for f in fails:
        print(" -", f)
    sys.exit(1)
print("\nALL CHECKS PASSED")
