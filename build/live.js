/* JOIN LAB live layer — runs after the Anatomy kit in the same page. */
const D = window.__DATA;
const P = window.__P;
const GROUPS = D.groups;
const W = D.weights;

const svg = document.querySelector(".iso-svg");
const stage = document.querySelector("[data-stage]");
const readout = document.querySelector("[data-readout]");
const planks = { a: svg.querySelector('[data-plank="a"]'), b: svg.querySelector('[data-plank="b"]') };
const pressEl = svg.querySelector('[data-part="press"]');
const cardEl = svg.querySelector('[data-part="card"]');
const needle = svg.querySelector('[data-part="needle"]');
const parts = {
  base: svg.querySelector('[data-part="base"]'),
  cabinet: svg.querySelector('[data-part="cabinet"]'),
  cradle: svg.querySelector('[data-part="cradle"]'),
  frame: svg.querySelector('[data-part="frame"]'),
  lever: svg.querySelector('[data-part="lever"]'),
  dial: svg.querySelector('[data-part="dial"]'),
  printer: svg.querySelector('[data-part="printer"]'),
};
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

const EXPLODE = {
  base: [0, 0, 0],
  cabinet: [-46, -30, 0],
  cradle: [0, 30, 4],
  frame: [0, 0, 54],
  lever: [0, 0, 54],
  dial: [0, 0, 54],
  printer: [34, -8, 14],
};

const state = {
  pins: [],
  hover: -1,
  pressed: false,
  press: 0,
  explode: 0,
  want: 0,
  tour: 0,
  tourClock: 0,
  idle: 0,
  last: 0,
  frame: 0,
  visible: false,
  slide: { a: 0, b: 0 },
  cardT: 0,
  target: { a: 0, b: 0 },
  printed: false,
};

const shared = () => {
  if (state.pins.length < 2) return [];
  const [x, y] = state.pins.map((i) => GROUPS[i].keys);
  return x.filter((k) => y.includes(k));
};
const fitOf = () => {
  const keys = shared();
  if (!keys.length) return 0;
  return Math.min(96, keys.reduce((sum, k) => sum + (W[k] ?? 12), 0));
};
const rowsOf = () => {
  const [a, b] = state.pins.map((i) => GROUPS[i].rows);
  return Math.round(Math.min(a, b) * (fitOf() / 100) * 0.62);
};
const formatRows = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${Math.round(n / 1e3)}K`);

function setReadout() {
  let text;
  if (state.pins.length === 2) {
    const fit = fitOf();
    const keys = shared();
    if (state.pressed && state.printed) {
      text = `결합 완료 · 키 ${keys.length} · 적합 ${fit}% · ${formatRows(rowsOf())}행`;
    } else if (state.pressed) {
      text = `결합 불가 · 공유 키 없음 · 적합 ${fit}%`;
    } else {
      text = `판 2/2 · 공유 키 ${keys.length} · 적합 ${fit}%`;
    }
  } else if (state.pins.length === 1) {
    const g = GROUPS[state.pins[0]];
    text = `판 1/2 · ${g.label} · 상대 판 선택`;
  } else {
    const g = GROUPS[state.hover >= 0 ? state.hover : state.tour];
    text = `${g.n} ${g.label} · 4개 플랫폼 · 키 ${g.keys[0]}`;
  }
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-label", `JOIN LAB 결합 검증대. ${text}`);
}

function markHover(index) {
  svg.querySelectorAll("[data-drawer]").forEach((el) => {
    if (Number(el.dataset.drawer) === index) el.setAttribute("data-hot", "");
    else el.removeAttribute("data-hot");
  });
  document.querySelectorAll("[data-group]").forEach((el) => {
    if (Number(el.dataset.group) === index) el.setAttribute("data-on", "");
    else el.removeAttribute("data-on");
  });
}

function drawPlanks() {
  const home = D.startX;
  const dock = D.dockX;
  planks.a.setAttribute("transform", translateAlong(P, [lerp(home, dock, state.slide.a), 0, 0]));
  planks.b.setAttribute("transform", translateAlong(P, [lerp(home, dock, state.slide.b), 0, 0]));
  planks.a.style.opacity = 1;
  planks.b.style.opacity = 1;
}

function drawNeedle() {
  const value = state.pins.length === 2 ? fitOf() : 0;
  const shown = value * state.press;
  const angle = (-Math.PI * 0.75 + (Math.PI * 1.5 * shown) / 100);
  const [cx, cy] = [D.dial.x, D.dial.y];
  const tipX = cx + Math.sin(angle) * (D.dial.r - 4.5);
  const tipY = cy - Math.cos(angle) * (D.dial.r - 4.5);
  const tailX = cx - Math.sin(angle) * 3;
  const tailY = cy + Math.cos(angle) * 3;
  needle.setAttribute("d", lineOnTop([tailX, tailY], [tipX, tipY], D.dial.z + 0.2, P));
  needle.setAttribute("data-free", "start");
}

function drawCard() {
  if (!state.printed && state.cardT < 0.02) {
    cardEl.style.display = "none";
    return;
  }
  cardEl.style.display = "";
  cardEl.setAttribute("transform", translateAlong(P, [0, -10 * (1 - state.cardT) + 10 * state.explode, 0]));
  cardEl.style.opacity = String(state.cardT);
}

function drawExplode() {
  for (const [key, vec] of Object.entries(EXPLODE)) {
    const el = parts[key];
    if (!el) continue;
    const t = state.explode;
    el.setAttribute("transform", translateAlong(P, [vec[0] * t, vec[1] * t, vec[2] * t]));
  }
  pressEl.setAttribute("transform", translateAlong(P, [0, 0, 42 * state.explode - state.press * D.travel]));

}

const pressDepth = () => {
  if (state.pins.length < 2) return 0;
  return fitOf() >= 40 ? D.travel : D.travel * 0.28;
};

function drawPress() {
  pressEl.setAttribute("transform", translateAlong(P, [0, 0, 42 * state.explode - state.press * pressDepth()]));
}

function tick(now) {
  const dt = state.last ? Math.min((now - state.last) / 1000, 1 / 30) : 1 / 60;
  state.last = now;
  const calm = still.matches;
  state.idle += dt;
  if (state.idle > 3.2 && !calm && !state.pins.length) {
    state.tourClock += dt;
    if (state.tourClock > 2.4) {
      state.tourClock = 0;
      state.hover = -1;
      state.tour = (state.tour + 1) % GROUPS.length;
      markHover(state.tour);
    }
  }
  const ease = (value, target, tau) => (calm ? target : value + (target - value) * (1 - Math.exp(-dt / tau)));
  state.slide.a = ease(state.slide.a, state.target.a, 0.26);
  state.slide.b = ease(state.slide.b, state.target.b, 0.26);
  state.press = ease(state.press, state.pressed ? 1 : 0, 0.2);
  state.explode = ease(state.explode, state.want, 0.22);
  state.cardT = ease(state.cardT, state.printed ? 1 : 0, 0.25);
  drawPlanks();
  drawExplode();
  drawPress();
  drawCard();
  drawNeedle();
  setReadout();
  const settled =
    Math.abs(state.slide.a - state.target.a) < 0.002 &&
    Math.abs(state.slide.b - state.target.b) < 0.002 &&
    Math.abs(state.press - (state.pressed ? 1 : 0)) < 0.002 &&
    Math.abs(state.explode - state.want) < 0.002 &&
    Math.abs(state.cardT - (state.printed ? 1 : 0)) < 0.002;
  state.frame = settled && !state.visible ? 0 : requestAnimationFrame(tick);
}

const run = () => {
  if (!state.frame) {
    state.last = 0;
    state.frame = requestAnimationFrame(tick);
  }
};

function pin(index) {
  state.idle = 0;
  state.printed = false;
  state.pressed = false;
  const at = state.pins.indexOf(index);
  if (at >= 0) {
    state.pins.splice(at, 1);
  } else if (state.pins.length < 2) {
    state.pins.push(index);
  } else {
    state.pins = [state.pins[1], index];
  }
  state.target.a = state.pins.length > 0 ? 1 : 0;
  state.target.b = state.pins.length > 1 ? 1 : 0;
  state.hover = index;
  markHover(index);
  run();
}

function pressJoint() {
  state.idle = 0;
  if (state.pins.length < 2) {
    state.pressed = false;
    state.printed = false;
    run();
    return;
  }
  state.pressed = true;
  const ok = fitOf() >= 40;
  if (ok) {
    setTimeout(() => {
      if (state.pressed && state.pins.length === 2) {
        state.printed = true;
        run();
      }
    }, still.matches ? 0 : 620);
  }
  run();
}

function reset() {
  state.idle = 0;
  state.pins = [];
  state.pressed = false;
  state.printed = false;
  state.target.a = 0;
  state.target.b = 0;
  state.want = 0;
  state.hover = -1;
  markHover(-1);
  run();
}

function toggleExplode() {
  state.idle = 0;
  state.want = state.want ? 0 : 1;
  run();
}

svg.addEventListener("pointerover", (event) => {
  const drawer = event.target.closest("[data-drawer]");
  if (!drawer) return;
  state.idle = 0;
  state.hover = Number(drawer.dataset.drawer);
  markHover(state.hover);
  setReadout();
});
svg.addEventListener("pointerleave", () => {
  if (!state.pins.length) {
    state.hover = -1;
    state.idle = 0;
  }
});
svg.addEventListener("click", (event) => {
  const drawer = event.target.closest("[data-drawer]");
  if (drawer) {
    pin(Number(drawer.dataset.drawer));
    return;
  }
  if (event.target.closest('[data-part="press"]') || event.target.closest('[data-part="gantry"]')) pressJoint();
});

document.querySelectorAll("[data-group]").forEach((el) => {
  el.addEventListener("pointerenter", () => {
    state.idle = 0;
    state.hover = Number(el.dataset.group);
    markHover(state.hover);
  });
  el.addEventListener("click", () => pin(Number(el.dataset.group)));
});

document.querySelector("[data-act='press']").addEventListener("click", pressJoint);
document.querySelector("[data-act='explode']").addEventListener("click", toggleExplode);
document.querySelector("[data-act='reset']").addEventListener("click", reset);
document.querySelector("[data-theme-toggle]").addEventListener("click", (event) => {
  const body = document.body;
  const next = body.dataset.theme === "light" ? "dark" : "light";
  body.dataset.theme = next;
  event.currentTarget.textContent = next === "light" ? "다크" : "라이트";
});

stage.addEventListener("keydown", (event) => {
  const key = event.key;
  if (key === "ArrowRight" || key === "ArrowDown") {
    state.idle = 0;
    const from = state.hover >= 0 ? state.hover : state.tour;
    state.hover = (from + 1) % GROUPS.length;
    markHover(state.hover);
    setReadout();
    event.preventDefault();
  } else if (key === "ArrowLeft" || key === "ArrowUp") {
    state.idle = 0;
    const from = state.hover >= 0 ? state.hover : state.tour;
    state.hover = (from - 1 + GROUPS.length) % GROUPS.length;
    markHover(state.hover);
    setReadout();
    event.preventDefault();
  } else if (key === "Enter" || key === " ") {
    if (state.hover >= 0) pin(state.hover);
    event.preventDefault();
  } else if (key === "p" || key === "P") {
    pressJoint();
  } else if (key === "e" || key === "E") {
    toggleExplode();
  } else if (key === "r" || key === "R") {
    reset();
  }
});

new IntersectionObserver(
  (entries) => {
    state.visible = entries[entries.length - 1].isIntersecting;
    if (state.visible) run();
  },
  { rootMargin: "120px 0px" },
).observe(stage);

if (still.matches) {
  state.slide.a = 0;
  state.slide.b = 0;
}
drawPlanks();
drawExplode();
drawPress();
drawCard();
drawNeedle();
setReadout();
run();
