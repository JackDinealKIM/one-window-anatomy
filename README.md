# JOIN LAB — 원-윈도우 데이터 결합 검증대 (프로토타입)

제1회 국가데이터통합플랫폼(원-윈도우) 활용 아이디어 공모전 · **플랫폼 기획 부문** 출품작의
인터랙티브 데모입니다. Anatomy 스킬(`wheresryan22/anatomy`)의 규칙을 따라 만든
아이소메트릭 분해도 한 장이 페이지 전체이고, 외부 라이브러리 없이 `index.html` 하나로 동작합니다.

**라이브 데모 — https://jackdinealkim.github.io/one-window-anatomy/**

## 열기

`index.html`을 브라우저로 열면 됩니다(파일 더블클릭). 서버·빌드·인터넷 연결이 필요 없습니다.

- **서랍(왼쪽 12개)** 을 누르면 그 도메인의 데이터 판이 결합 크래들로 들어옵니다. 두 판까지 물릴 수 있습니다.
- **프레스 바 / 결합 검증 버튼(P)** — 두 판의 공유 조인트 키로 계산한 적합도가 40% 이상이면 프레스가 끝까지 내려가고 레시피 카드가 출력됩니다.
- **분해 보기(E)**, **초기화(R)**, **← →**(서랍 이동), **Enter**(판 물리기), **다크/라이트** 전환.
- 오른쪽 아래 리드아웃이 현재 상태(선택한 도메인 / 판 수 / 공유 키 수 / 적합도 / 예상 행 수)를 보여줍니다.

## 구성

```
index.html          완성 페이지 (정적 SVG + 라이브 레이어 인라인)
screenshots/        검수용 캡처 (idle / 결합 / 결합 불가 / 분해 / 다크 / 모바일)
build/
  figure.js         기하 모델 — 부품, 조립 단위, 데모 데이터(12도메인·48플랫폼·키 가중치)
  live.js           인터랙션 — 변위·분해·게이지·리드아웃·키보드·reduced motion
  build.py          figure.js를 헤드리스 크로미움에서 실행해 index.html을 씀
  verify.py         콘솔 오류 0건·상호작용·오버플로 검사 (JSON 리포트)
  shots.py          상태별 스크린샷
  vendor/iso-kit.mjs  Anatomy kit 사본 (그리기 규칙·4톤 셰이딩·투영)
```

## 다시 빌드하기

Node 없이 동작하도록, 그림 생성은 헤드리스 크로미움 안에서 JS를 실행하는 방식입니다.

```sh
cd build
LD_LIBRARY_PATH=/workspace/.libs/root/usr/lib/x86_64-linux-gnu \
FONTCONFIG_FILE=/workspace/tmp/fonts.conf python3 build.py     # -> ../index.html
LD_LIBRARY_PATH=... python3 verify.py                          # 콘솔 0건 확인
LD_LIBRARY_PATH=... python3 shots.py                           # 스크린샷
```

`figure.js`는 Anatomy `kit/iso-kit.mjs`와 같은 모듈 스코프에서 실행됩니다(`slabOf`, `cylinder`,
`fitProjection`, `solidSvg` … 를 그대로 사용).

## GitHub Pages (공개 완료)

위 라이브 데모로 이미 공개되어 있습니다. Pages 소스는 **`gh-pages` 브랜치 / (root)** 이고,
`main`은 원본 소스 브랜치입니다. 이 폴더 내용을 고친 뒤에는 두 브랜치에 함께 올립니다.

```sh
cd /workspace/deploy/one-window-anatomy
git add -A && git commit -m "..."
git push origin main && git push origin main:gh-pages
```

아래는 처음부터 다시 공개할 때의 절차입니다.

1. GitHub에서 빈 공개 저장소 `one-window-anatomy`를 만듭니다(README 없이).
2. 이 폴더의 `index.html`을 저장소 루트에 올립니다.
   ```sh
   cd /workspace/deploy/one-window-anatomy
   git init -b main && git add index.html README.md
   git commit -m "JOIN LAB prototype"
   git remote add origin https://github.com/<본인계정>/one-window-anatomy.git
   git push -u origin main
   ```
3. 저장소 Settings → Pages → Source `Deploy from a branch` → `main` / `/ (root)` → Save.
4. 1~2분 뒤 `https://<본인계정>.github.io/one-window-anatomy/` 가 열립니다.
   그 주소를 `documents/one-window-2026/제출가이드.md`의 안내대로 기획서 그림 1 캡션 아래에 넣고
   PDF를 다시 렌더하면 됩니다.

## 사실 관계

- 연계 데이터플랫폼 48개와 플랫폼명·URL: 공모 공고 참고1 「원-윈도우 데이터플랫폼 연계 목록」(2026.11.12.)
- 12개 도메인 묶음, 조인트 키 후보, 행 수, 적합도 가중치, 결합 결과: 본 프로토타입의 **예시 설계/시뮬레이션 값**입니다.
  화면과 기획서 모두에 그렇게 표기했습니다.
