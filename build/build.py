#!/usr/bin/env python3
"""Build deploy/one-window-anatomy/index.html.

Renders the Anatomy figure with the kit inside headless Chromium (no Node in
this environment), then writes one standalone HTML page: static SVG for print
and search, plus the live layer inlined.
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
KIT = (HERE / "vendor" / "iso-kit.mjs").read_text()
FIGURE = (HERE / "figure.js").read_text()
LIVE = (HERE / "live.js").read_text()

PAGE_CSS = """
:root { --ink:#18181a; --soft:#6b6b70; --line:#dcdcd8; --paper:#f4f4f1; }
* { box-sizing: border-box; }
html { color-scheme: light; }
body { margin:0; background:var(--paper); color:var(--ink);
  font-family: "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Noto Sans CJK KR", "Malgun Gothic", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased; }
.page { width:min(920px, 100% - 40px); margin:0 auto; padding:48px 0 72px; }
header { display:grid; gap:14px; border-bottom:1px solid var(--line); padding-bottom:26px; }
.eyebrow { font:11.5px/1.5 ui-monospace, "SFMono-Regular", Menlo, monospace; letter-spacing:.08em;
  text-transform:uppercase; color:var(--soft); }
h1 { margin:0; font-size:clamp(34px, 5.4vw, 52px); letter-spacing:-.02em; line-height:1; font-weight:800; }
h1 span { font-weight:300; color:var(--soft); }
.lede { margin:0; max-width:62ch; font-size:15.5px; line-height:1.68; color:#3a3a3e; }
.meta { display:flex; flex-wrap:wrap; gap:8px 18px; font:11.5px/1.6 ui-monospace, Menlo, monospace; color:var(--soft); }
.meta b { color:var(--ink); font-weight:600; }
.iso-figure { margin:34px 0 0; }
.iso-plate { background:var(--anatomy-card); }
.iso[data-theme="light"] { --anatomy-paper:#fffdfb; --anatomy-card:#fcfcfa; }
.iso-plate-corner { font-family: "Pretendard", "Noto Sans KR", "Noto Sans CJK KR", ui-sans-serif, sans-serif; letter-spacing:0; }
.iso-plate-corner[data-corner="fig"] { font-family: ui-monospace, Menlo, monospace; letter-spacing:.06em; }
.iso-legend { color:var(--soft); }
.iso-caption { display:block; margin-top:6px; max-width:74ch; color:#4a4a4f; }
.iso[data-theme="dark"] {
  --anatomy-weight:.8px; --anatomy-hi:#e2e2e2; --anatomy-mid:#9a9a9a; --anatomy-lo:#5a5a5a;
}
.iso-svg [data-plank] .iso-top,
.iso-svg [data-plank] .iso-fill { fill: var(--anatomy-shade-2); }
.iso-svg [data-plank] .iso-shade { fill: var(--anatomy-shade-0); }
.iso-svg [data-hot] .iso-edge { stroke: var(--anatomy-lit); stroke-width:1.1px; }
.iso-svg [data-hot] .iso-dots circle { opacity:.9; }
.iso[data-theme="light"] {
  --anatomy-shade-0:#9c9c93; --anatomy-shade-1:#b4b4ab; --anatomy-shade-2:#cacac1; --anatomy-shade-3:#dcdcd3;
  --anatomy-hi:#101013; --anatomy-mid:#4a4a52; --anatomy-lo:#8a8a92; --anatomy-faint:#bcbcc2;
  --anatomy-weight:.85px;
  --anatomy-lit-top:#ffffff; --anatomy-lit-shade:#e4e4e0;
}
.iso-svg [data-part] { transition: filter .2s var(--anatomy-ease); }
.iso-svg [data-drawer] { cursor:pointer; }
.controls { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:16px; }
button { font:inherit; font-size:12.5px; padding:8px 13px; border-radius:7px; border:1px solid var(--line);
  background:#fff; color:var(--ink); cursor:pointer; }
button:hover { border-color:#b9b9b4; }
button kbd { font:11px ui-monospace, Menlo, monospace; color:var(--soft); margin-left:6px; }
button[data-theme-toggle] { margin-left:auto; color:var(--soft); }
.steps { display:grid; grid-template-columns:repeat(3, 1fr); gap:1px; margin:44px 0 0;
  background:var(--line); border:1px solid var(--line); border-radius:10px; overflow:hidden; }
.steps article { background:#fff; padding:18px 18px 20px; }
.steps h3 { margin:0 0 6px; font-size:13px; letter-spacing:-.01em; }
.steps h3 i { font:11px ui-monospace, Menlo, monospace; font-style:normal; color:var(--soft); margin-right:7px; }
.steps p { margin:0; font-size:12.5px; line-height:1.65; color:#55555a; }
.groups { margin:30px 0 0; display:grid; grid-template-columns:repeat(6, 1fr); gap:6px; }
.groups button { text-align:left; font-size:11.5px; padding:7px 9px; line-height:1.3; }
.groups button b { display:block; font:10.5px ui-monospace, Menlo, monospace; color:var(--soft); font-weight:400; }
.groups button[data-on] { border-color:var(--ink); background:#f3f3ef; }
.groups button[data-pinned] { background:#ecece7; border-color:#8f8f8a; }
footer { margin-top:36px; padding-top:18px; border-top:1px solid var(--line);
  font-size:11.5px; line-height:1.8; color:var(--soft); }
footer a { color:var(--soft); }
.hintline { margin:10px 0 0; font-size:11.5px; color:var(--soft); }
@media (max-width:720px) {
  .page { padding-top:30px; }
  .steps { grid-template-columns:1fr; }
  .groups { grid-template-columns:repeat(3, 1fr); }
  .iso-plate-corner[data-corner="readout"] { font-size:9.5px; }
}
"""


def render_figure():
    js = KIT + "\n" + FIGURE
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path="/workspace/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome", args=["--no-sandbox","--force-color-profile=srgb","--single-process","--no-zygote","--disable-dev-shm-usage","--font-render-hinting=none"])
        page = browser.new_page(viewport={"width": 1200, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.set_content("<!doctype html><html><body></body></html>")
        page.add_script_tag(content=f"{js}\nwindow.__READY = true;", type="module")
        try:
            page.wait_for_function("window.__FIG && window.__READY", timeout=15000)
        except Exception:
            print("FIGURE ERROR:", errors, file=sys.stderr)
            raise
        out = page.evaluate("({svg: window.__FIG.svg, p: window.__FIG.P, data: window.__FIG.data, css: window.__FIG.css})")
        browser.close()
    return out


def groups_html():
    names = [
        ("01", "금융"), ("02", "카드·소비"), ("03", "교통"), ("04", "생태·환경"),
        ("05", "보건·의료"), ("06", "농림·수산"), ("07", "문화·관광"), ("08", "통계·공공"),
        ("09", "과학·지식"), ("10", "산업·무역"), ("11", "부동산·공간"), ("12", "생활·안전"),
    ]
    return "".join(
        f'<button type="button" data-group="{i}" aria-label="{n} {label}, 서랍 {i+1}"><b>{n}</b>{label}</button>'
        for i, (n, label) in enumerate(names)
    )


def main():
    fig = render_figure()
    svg = fig["svg"]
    script = (
        KIT
        + "\nwindow.__P = "
        + json.dumps(fig["p"])
        + ";\nwindow.__DATA = "
        + json.dumps(fig["data"], ensure_ascii=False)
        + ";\n"
        + LIVE
    )
    script = script.replace("</script", "<\\/script")
    html = f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JOIN LAB — 원-윈도우 데이터 결합 검증대 (프로토타입)</title>
<meta name="description" content="원-윈도우 연계 48개 데이터플랫폼의 결합 가능성을 미리 검증하는 결합 실습대 프로토타입. 제1회 국가데이터통합플랫폼 활용 아이디어 공모전 플랫폼 기획 부문 출품작.">
<style>__CSS__</style>
</head>
<body class="iso" data-theme="light">
<main class="page">
  <header>
    <div class="eyebrow">제1회 국가데이터통합플랫폼(원-윈도우) 활용 아이디어 공모전 · 플랫폼 기획 부문</div>
    <h1>JOIN LAB <span>결합 검증대</span></h1>
    <p class="lede">원-윈도우에 연계된 48개 데이터플랫폼은 한 카탈로그에 모여 있지만, 실제로 <b>결합이 되는지</b>는 아직 사용자가 직접 부딪혀 봐야 합니다. JOIN LAB은 데이터를 고르기 전에 결합 가능성을 먼저 재는 실습대입니다. 서랍을 눌러 데이터 판을 물리고, 프레스 바를 눌러 조인트 키가 맞물리는지 확인하세요. 키가 맞지 않으면 프레스는 끝까지 내려가지 않습니다.</p>
    <div class="meta">
      <span><b>김재동</b></span>
      <span>프로토타입 v1 · 2026.11</span>
      <span>도해 1/1 · 인터랙티브 SVG</span>
      <span>데이터 <b>원-윈도우 연계 48개 플랫폼</b> (공고 참고1 기준)</span>
    </div>
  </header>

  <figure class="iso-figure">
    <div class="iso-plate">
      <div class="iso-plate-corners" aria-hidden="true">
        <span class="iso-plate-corner" data-corner="fig">도해 1</span>
        <span class="iso-plate-corner" data-corner="title">JOIN LAB 결합 검증대</span>
        <span class="iso-plate-corner" data-corner="hint">서랍을 눌러 데이터 판을 물리고 · 프레스 바를 눌러 검증</span>
        <span class="iso-plate-corner" data-corner="readout" data-readout aria-live="polite">01 금융 · 4개 플랫폼</span>
      </div>
      <div class="iso-stage" data-stage tabindex="0" role="application"
           aria-label="JOIN LAB 결합 검증대. 좌우 방향키로 서랍을 고르고 Enter로 판을 물립니다. P는 결합 검증, E는 분해, R은 초기화.">
        {svg}
      </div>
    </div>
    <figcaption class="iso-legend">
      <span class="iso-keys">
        <span class="iso-key"><svg class="iso-swatch" data-mark="lit" viewBox="0 0 16 10" aria-hidden="true"><path d="M2 4.5 8 1.5 14 4.5 14 6 8 9 2 6Z"/><path class="iso-swatch-crease" d="M2 4.5 8 7.5 14 4.5"/></svg>조인트 키 — 두 판이 공유하는 결합 키</span>
        <span class="iso-key"><svg class="iso-swatch" data-mark="raised" viewBox="0 0 16 10" aria-hidden="true"><path d="M2 4.5 8 1.5 14 4.5 14 6 8 9 2 6Z"/><path class="iso-swatch-crease" d="M2 4.5 8 7.5 14 4.5"/></svg>데이터 판 — 한 도메인의 데이터셋</span>
        <span class="iso-key"><svg class="iso-swatch" data-mark="dim" viewBox="0 0 16 10" aria-hidden="true"><path d="M1.5 5h13"/></svg>서랍 — 연계 플랫폼 4개씩, 모두 48개</span>
      </span>
      <span class="iso-caption">왼쪽 서랍장은 원-윈도우 연계 데이터플랫폼 48개를 12개 도메인으로 묶은 것입니다. 서랍을 누르면 그 도메인의 데이터 판이 피드 트레이를 타고 결합 크래들로 들어오고, 상단 게이지가 두 판의 <b>공유 조인트 키</b>로 계산한 결합 적합도를 가리킵니다. 프레스 바가 끝까지 내려가면 오른쪽 프린터에서 결합 레시피 카드가 나옵니다. 수치는 데모용 예시 메타데이터로 계산한 시뮬레이션 값입니다.</span>
    </figcaption>
  </figure>

  <div class="controls">
    <button type="button" data-act="press">결합 검증<kbd>P</kbd></button>
    <button type="button" data-act="explode">분해 보기<kbd>E</kbd></button>
    <button type="button" data-act="reset">초기화<kbd>R</kbd></button>
    <button type="button" data-theme-toggle>다크</button>
  </div>
  <p class="hintline">키보드 ← → 로 서랍 이동 · Enter 로 판 물리기 · 기계를 눌러도 같은 동작이 됩니다.</p>

  <div class="groups" aria-label="도메인 서랍 12개">{groups_html()}</div>

  <section class="steps" aria-label="JOIN LAB의 세 단계">
    <article>
      <h3><i>01</i>탐색 — AI 결합 후보 찾기</h3>
      <p>질문을 넣으면 원-윈도우 메타데이터에서 후보 데이터셋을 찾아 도메인별 서랍으로 보여줍니다. 이 데모에서는 48개 플랫폼을 12개 도메인으로 묶어 서랍 하나에 4개씩 담았습니다.</p>
    </article>
    <article>
      <h3><i>02</i>검증 — 키가 맞물리는지 먼저 재기</h3>
      <p>두 데이터셋의 공유 조인트 키(법정동코드·기준일자·사업자번호 등)를 가중 합산해 결합 적합도를 계산합니다. 키가 없으면 프레스가 내려가지 않고, 레시피도 출력되지 않습니다.</p>
    </article>
    <article>
      <h3><i>03</i>실행 — MCP로 돌려 보고 레시피로 남기기</h3>
      <p>검증을 통과한 결합은 MCP 도구 호출로 바로 실행해 보고, 호출 기록이 레시피 카드로 남습니다. 카드는 갤러리에 공유되어 다음 사용자와 경진대회 과제로 이어집니다.</p>
    </article>
  </section>

  <footer>
    <p>자료 — 과학기술정보통신부·한국지능정보사회진흥원 「제1회 국가데이터통합플랫폼(원-윈도우) 활용 아이디어 공모전」 공고문(2026.11.12) 및 참고1 원-윈도우 데이터플랫폼 연계 목록 48개. 플랫폼명·URL은 공고 자료에서, 도메인 묶음·조인트 키·행 수·적합도는 본 프로토타입의 예시 설계입니다.</p>
    <p>원-윈도우 <a href="https://www.data1window.kr/" rel="noreferrer">data1window.kr</a> · 이 페이지는 외부 라이브러리 없이 단일 HTML로 동작합니다.</p>
  </footer>
</main>
<script type="module">{script}</script>
</body>
</html>
"""
    css = fig["css"] + "\n" + PAGE_CSS
    html = html.replace("__CSS__", css)
    (ROOT / "index.html").write_text(html)
    print("wrote", ROOT / "index.html", len(html))


if __name__ == "__main__":
    main()
