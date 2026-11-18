# JOIN LAB — 10초 데이터 결합 사전 진단기 (프로토타입 v2)

제1회 국가데이터통합플랫폼(원-윈도우) 활용 아이디어 공모전 · **플랫폼 기획 부문** 출품작의
인터랙티브 데모입니다. 라이브러리·빌드 없이 `index.html` 한 파일로 동작합니다.

**라이브 데모 — https://jackdinealkim.github.io/one-window-anatomy/**

## 콘셉트

48개 연계 플랫폼을 서랍장처럼 나열하지 않고, **데이터 2개를 고르면 10초 안에 결합 가능 여부와
바로 신청할 기관·서류가 나오는 3단계 화면** 하나로 줄였습니다.

1. **데이터 2개 고르기** — 대표 5개 프리셋(상권·유동인구 / 교통 / 보건·의료 / 부동산·공간 / 카드·소비)
2. **결합 자동 판정** — 고르는 즉시 세 가지 중 하나로 판정
   - `결합 가능` — 두 데이터 모두 집계·공개 단위이고 공유 키가 맞음
   - `가명처리 필요` — 개인 단위 원자료가 섞여 있어 결합전문기관 가명결합만 가능
   - `법적 제한` — 민감정보(건강) × 신용정보는 목적 외 이용·제공으로 제한
   적합도는 공유 키 가중치 합 + 갱신주기 일치 보너스(8점), 100 상한으로 계산합니다.
3. **바로 신청** — 신청 기관 · 필요 서류 · 절차를 한 줄로 안내

## 조작

- 카드를 누르면 선택/해제됩니다. 두 개를 넘겨 고르면 가장 오래된 선택이 바뀝니다.
- 키보드 `1`~`5`로 선택, `Esc`로 초기화. 카드 자체는 Tab·Enter로도 동작합니다.
- 우측 하단 `다크` 버튼으로 라이트/다크를 바꿉니다.

## 구성

```
index.html          완성 페이지 (HTML + CSS + 인라인 JS 한 파일, 의존성 없음)
screenshots/        검수용 캡처 (idle / 한 개 선택 / 결합 가능 / 가명처리 / 법적 제한 / 다크 / 모바일)
build/
  verify.py         Playwright 검사 — 세 판정 상태·키보드·테마·aria·오버플로·콘솔 오류 0건 (JSON 리포트)
  shots.py          상태별 스크린샷 + 기획서 그림(shot_ok / shot_pseudo / shot_bad) 생성
```

v1의 아이소메트릭 기계 도해는 이 v2에서 3단계 진단 화면으로 대체되었습니다.
v1 생성기(`build/figure.js`, `build/live.js`, `build/build.py`, `build/vendor/`)는
git 이력(커밋 `8d21505`)에 남아 있습니다.

## 검사 · 캡처

```sh
cd build
LD_LIBRARY_PATH=/workspace/.libs/root/usr/lib/x86_64-linux-gnu \
FONTCONFIG_FILE=/workspace/tmp/fonts.conf python3 verify.py     # 전체 검사, 실패 시 exit 1
LD_LIBRARY_PATH=... FONTCONFIG_FILE=... python3 shots.py        # ../screenshots/ 갱신
```

`shots.py`는 기획서가 쓰는 그림 3장을 `documents/one-window-2026/_build/`에 함께 저장합니다.

## GitHub Pages

Pages 소스는 **`gh-pages` 브랜치 / (root)**, `main`은 원본 소스 브랜치입니다.
고친 뒤에는 두 브랜치에 함께 올립니다.

```sh
cd /workspace/deploy/one-window-anatomy
git add -A && git commit -m "..."
git push origin main && git push origin main:gh-pages
```

## 사실 관계

- 연계 데이터플랫폼 48개와 플랫폼명: 공모 공고 참고1 「원-윈도우 데이터플랫폼 연계 목록」(2026.11.12.)
- 프리셋 구성, 조인트 키, 갱신주기, 적합도 가중치, 판정 결과, 기관·서류 안내는
  본 프로토타입의 **예시 설계/시뮬레이션 값**입니다. 화면 하단과 기획서에 그렇게 표기했습니다.
