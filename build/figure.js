/* JOIN LAB — isometric cutaway figure.
   Runs with the Anatomy kit (iso-kit.mjs) in the same module scope.
   Builds the static SVG string and the demo dataset for the live layer. */

const WIDTH = 560;
const HEIGHT = 450;

const BASE = { x: -152, y: -62, w: 304, d: 124, r: 10 };
const BASE_H = 12;
const FOOT_H = 5;

const CAB = { x: -148, y: -48, w: 86, d: 60, r: 3 };      // x -148..-62, y -48..12
const CAB_H = 66;
const DRAWER_ROWS = 4;
const DRAWER_COLS = 3;

const TRAY = { x: -62, y: -13, w: 60, d: 34, r: 1.5 };    // feed tray x -62..-2
const CRIB = { x: -2, y: -13, w: 50, d: 34, r: 2 };        // cradle x -2..48
const BED_TOP = 15;
const PLANK_H = 4;
const LANE_A = -11;   // y -11..1
const LANE_B = 5;     // y 5..17
const PLANKS_D = 12;
const SEAM_Y = 3;
const KEY_X = [3, 13, 23, 33, 41];

const COL = { x: 56, y: -6, w: 14, d: 16, r: 2 };
const COL_TOP = 78;
const ARM = { x: 2, y: -7, w: 68, d: 16, r: 2 };
const ARM_Z = 68;
const BEAM = ARM;
const BEAM_Z = ARM_Z;
const BAR = { x: -6, y: -3, w: 56, d: 12, r: 1.2 };
const BAR_Z = 30;
const PRESS_TRAVEL = 6;
const DIAL = [42, 1];
const DIAL_R = 12;
const DIAL_Z = ARM_Z + 10;
const DIAL_H = 8;

const PRINT = { x: 78, y: -46, w: 66, d: 50, r: 2.5 };
const PRINT_H = 42;

const P = fitProjection(
  [
    ...boxCorners(BASE, -BASE_H - FOOT_H, 0),
    [COL.x + COL.w, COL.y + COL.d, COL_TOP + 2],
    [COL.x, COL.y, COL_TOP + 2],
    [DIAL[0] + DIAL_R, DIAL[1], DIAL_Z + DIAL_H],
    [-4, 1, 92],
    [PRINT.x + PRINT.w, PRINT.y + PRINT.d, PRINT_H + 12],
    [CAB.x, CAB.y, CAB_H],
  ],
  WIDTH,
  HEIGHT,
  { pad: 20, azimuth: 40, elevation: 31 },
);

const at = (point) => iso(point, P);
const S = (paths, style) => solidSvg(paths, style);
const L = (d, style) => lineSvg(d, style);
const D = (points, style) => dotsSvg(points, style);
const byDepth = (points) =>
  [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));
const faceRect = (x0, x1, y, z0, z1) =>
  pathOf(pointsAt([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], P), true);
const faceRectY = (y0, y1, x, z0, z1) =>
  pathOf(pointsAt([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]], P), true);

/* ── base ─────────────────────────────────────────────── */
function base() {
  const out = [`<path class="iso-halo" d="${haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
  for (const [x, y] of byDepth(corners(BASE, 26))) {
    out.push(S(cylinder(x, y, 8.5, -BASE_H - FOOT_H, 2, P, 24), { tone: "lo" }));
    out.push(S(cylinder(x, y, 6.4, -BASE_H - FOOT_H + 2, FOOT_H - 2, P, 24), { tone: "mid" }));
  }
  out.push(S(slabOf(BASE, -BASE_H, BASE_H, P, 10, 1.8), { tone: "mid" }));
  out.push(L(planOutline(insetPlan(BASE, 6), 0, P, 10), { tone: "lo" }));
  const screws = [...corners(BASE, 12), ...corners(BASE, 12).slice(0, 1)];
  out.push(L(screws.slice(0, 4).map(([x, y]) => ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.slice(0, 4).map(([x, y]) => at([x, y, 0])), { size: 0.5 }));

  // ruler strip along the front edge
  const strip = { x: -92, y: 44, w: 176, d: 7, r: 1 };
  out.push(S(slabOf(strip, 0, 0.7, P, 3), { tone: "lo", crease: "none" }));
  const t = topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.7, [2, 3.8], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.7]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.7])], { size: 0.45 }));

  // name plate, front left
  const plate = { x: -146, y: 24, w: 50, d: 15, r: 1.5 };
  out.push(S(slabOf(plate, 0, 1, P, 4, 0.4), { tone: "hi", crease: "lo" }));
  out.push(L(planOutline(insetPlan(plate, 1.8), 1, P, 4), { tone: "faint" }));
  [0.62, 0.44, 0.72].forEach((share, index) => {
    const y = plate.y + 4 + index * 3.4;
    out.push(L(lineOnTop([plate.x + 4, y], [plate.x + 4 + (plate.w - 8) * share, y], 1, P), { tone: "lo", free: true }));
  });
  out.push(D([at([plate.x + 3, plate.y + 3, 1]), at([plate.x + plate.w - 3, plate.y + 3, 1])], { size: 0.42 }));

  // the query card standing in its holder, front left
  out.push(S(slabOf({ x: -68, y: 28, w: 36, d: 9, r: 1 }, 0, 5, P, 3, 0.4), { tone: "mid" }));
  out.push(L(faceRect(-66, -34, 37.1, 1.5, 3.6), { tone: "faint" }));
  out.push(S(slabOf({ x: -65, y: 31.6, w: 30, d: 0.7, r: 0.3 }, 4, 18, P, 2, 0.2), { tone: "hi", crease: "lo" }));
  for (let index = 0; index < 4; index += 1) {
    const z = 19 - index * 3.4;
    out.push(L(pathOf(pointsAt([[-62, 31.2, z], [-62 + [20, 14, 22, 11][index], 31.2, z]], P), false), { tone: "lo", free: true }));
  }
  out.push(D([at([-66.5, 32, 4.4]), at([-33.5, 32, 4.4])], { size: 0.36, tone: "mid" }));

  // shallow groove under the cradle footprint
  out.push(L(planOutline({ x: CRIB.x - 8, y: CRIB.y - 8, w: CRIB.w + 16, d: CRIB.d + 16, r: 4 }, 0, P, 4), { tone: "faint" }));
  out.push(L(planOutline({ x: PRINT.x - 6, y: PRINT.y - 6, w: PRINT.w + 12, d: PRINT.d + 12, r: 3 }, 0, P, 4), { tone: "faint" }));
  return out.join("");
}

/* ── drawer cabinet: 12 drawers = the 48 linked platforms in fours ── */
function cabinet() {
  const out = [];
  out.push(S(slabOf({ x: CAB.x, y: CAB.y + 3, w: CAB.w, d: CAB.d - 3, r: 3 }, 0, 4, P, 6, 1), { tone: "lo" }));
  out.push(S(slabOf(CAB, 4, CAB_H - 4, P, 6, 1.4), { tone: "mid", inner: L(sideSeam(CAB, 34, P, 6), { tone: "faint" }) }));
  out.push(S(slabOf(insetPlan(CAB, 2.5), CAB_H, 2.2, P, 6, 0.6), { tone: "mid" }));
  out.push(L(planOutline(insetPlan(CAB, 5), CAB_H + 2.2, P, 6), { tone: "faint" }));
  const top = corners(insetPlan(CAB, 2.5), 6);
  out.push(D([at([top[0][0], top[0][1], CAB_H + 2.2]), at([top[3][0], top[3][1], CAB_H + 2.2])], { size: 0.45 }));
  out.push(faceTextSvg(topMatrix([CAB.x + CAB.w / 2, CAB.y + CAB.d / 2 - 6], CAB_H + 2.2, P, "x"), "48", { size: 5.2, tone: "mid", anchor: "middle" }));

  // vents on the case top, a texture that ends on the lid's own outline
  for (let index = 0; index < 4; index += 1) {
    const y = CAB.y + 8 + index * 4;
    out.push(L(lineOnTop([CAB.x + 8, y], [CAB.x + CAB.w - 10, y], CAB_H + 2.2, P), { tone: "faint" }));
  }

  // right face: the two slots the planks come through
  const rx = CAB.x + CAB.w;
  for (const y0 of [LANE_A, LANE_B]) {
    out.push(L(faceRectY(y0, y0 + PLANKS_D, rx + 0.05, BED_TOP - 1, BED_TOP + PLANK_H + 2.4), { tone: "mid" }));
    out.push(L(faceRectY(y0 + 1.6, y0 + PLANKS_D - 1.6, rx + 0.06, BED_TOP, BED_TOP + PLANK_H + 1), { tone: "faint" }));
  }
  out.push(L(faceRectY(-36, -10, rx + 0.05, 42, 58), { tone: "lo" }));
  out.push(L(faceRectY(-34, -12, rx + 0.06, 44, 56), { tone: "faint" }));
  for (let index = 0; index < 3; index += 1) {
    const z = 53 - index * 3.4;
    out.push(L(segment([rx + 0.1, -33, z], [rx + 0.1, -13, z], P), { tone: "lo", free: true }));
  }
  out.push(D([at([rx + 0.1, -34, 43]), at([rx + 0.1, -12, 43])], { size: 0.4, tone: "lo" }));

  // twelve drawer faces
  const face = CAB.y + CAB.d;
  for (let row = 0; row < DRAWER_ROWS; row += 1) {
    for (let col = 0; col < DRAWER_COLS; col += 1) {
      const index = row * DRAWER_COLS + col;
      const x = CAB.x + 2.4 + col * 27.6;
      const z = 4.6 + row * 15.4;
      const plan = { x, y: face, w: 25.2, d: 1.8, r: 0.8 };
      const pull = { x: x + 4.2, y: face + 1.8, w: 16.8, d: 1.6, r: 0.6 };
      const group = [];
      group.push(S(slabOf(plan, z, 13.4, P, 3, 0.4), { tone: "hi", crease: "lo" }));
      group.push(S(slabOf(pull, z + 6.2, 2, P, 3, 0.3), { tone: "mid", crease: "none" }));
      group.push(D([at([x + 2.2, face + 2, z + 2]), at([x + 23, face + 2, z + 2])], { size: 0.36, tone: "lo" }));
      out.push(`<g data-drawer="${index}">${group.join("")}</g>`);
    }
  }
  return out.join("");
}

/* ── feed tray and cradle ─────────────────────────────── */
function cradle() {
  const out = [];
  out.push(S(slabOf(TRAY, 9, 3.5, P, 4, 0.5), { tone: "lo" }));
  out.push(L(planOutline(insetPlan(TRAY, 3), 12.5, P, 4), { tone: "faint" }));
  for (const y of [TRAY.y - 1.8, TRAY.y + TRAY.d]) {
    out.push(S(slabOf({ x: TRAY.x, y, w: TRAY.w, d: 2.8, r: 0.8 }, 9, 6, P, 3, 0.3), { tone: "lo" }));
    out.push(D([TRAY.x + 6, TRAY.x + TRAY.w - 8].map((x) => at([x, y + 1.4, 15])), { size: 0.36, tone: "lo" }));
  }
  // centre divider between the two lanes, ending on the cradle
  out.push(S(slabOf({ x: TRAY.x + 2, y: 1.4, w: TRAY.w - 2, d: 3.2, r: 0.8 }, 9, 4, P, 3, 0.3), { tone: "lo" }));

  out.push(S(slabOf(CRIB, BED_TOP - 3, 3, P, 4, 0.5), { tone: "mid" }));
  out.push(L(planOutline(insetPlan(CRIB, 2.4), BED_TOP, P, 4), { tone: "faint" }));
  for (const y of [CRIB.y - 1.8, CRIB.y + CRIB.d]) {
    out.push(S(slabOf({ x: CRIB.x, y, w: CRIB.w, d: 2.8, r: 0.8 }, BED_TOP - 3, 7, P, 3, 0.4), { tone: "mid" }));
  }
  out.push(S(slabOf({ x: CRIB.x + CRIB.w, y: CRIB.y, w: 2.6, d: CRIB.d, r: 0.8 }, BED_TOP - 3, 7, P, 3, 0.4), { tone: "mid" }));
  out.push(D([CRIB.x + 8, CRIB.x + 26, CRIB.x + 42].map((x) => at([x, CRIB.y + CRIB.d + 1.4, 19])), { size: 0.4, tone: "lo" }));
  // scale on the front rail, ticks hanging from its top edge
  const ticks = sideTicks(CRIB.x + 2, CRIB.x + CRIB.w - 2, 4, 4, CRIB.y + CRIB.d + 2.85, 18.4, [1.6, 3], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));

  return out.join("");
}

/* ── a data plank: one platform group laid out for the joint ── */
function plank(lane, seed) {
  const out = [];
  const plan = { x: 1, y: lane + 0.6, w: 42, d: PLANKS_D - 1.2, r: 0.9 };
  out.push(S(slabOf(plan, BED_TOP, PLANK_H, P, 4, 0.45), { tone: "hi", crease: "lo" }));
  out.push(L(planOutline(insetPlan(plan, 2), BED_TOP + PLANK_H, P, 4), { tone: "faint" }));
  // key holes along the seam edge
  const edge = lane < SEAM_Y ? lane + PLANKS_D - 2.2 : lane + 2.2;
  out.push(L(KEY_X.map((x) => ring(x, edge, 1.9, BED_TOP + PLANK_H, P, 14)).join(""), { tone: "lo" }));
  out.push(D(KEY_X.map((x) => at([x, edge, BED_TOP + PLANK_H])), { size: 0.34, tone: "faint" }));
  // printed rule lines standing for the dataset's columns
  for (let row = 0; row < 3; row += 1) {
    const y = lane + 3.2 + row * 2.6;
    const length = 12 + ((seed + row * 5) % 16);
    out.push(L(lineOnTop([5, y], [5 + length, y], BED_TOP + PLANK_H, P), { tone: "lo", free: true }));
  }
  out.push(D([at([plan.x + plan.w - 3, lane + PLANKS_D - 3, BED_TOP + PLANK_H])], { size: 0.4, tone: "mid" }));
  return out.join("");
}

/* ── press, frame and dial ───────────────────────────── */
function frame() {
  const out = [];
  // column foot and column
  out.push(S(slabOf({ x: COL.x - 6, y: COL.y - 6, w: COL.w + 12, d: COL.d + 12, r: 2 }, 0, 3, P, 4, 0.5), { tone: "lo" }));
  out.push(S(slabOf(COL, 3, COL_TOP - 3, P, 5, 1.2), { tone: "mid", inner: L(sideSeam(COL, 44, P, 5), { tone: "faint" }) }));
  out.push(D(corners(insetPlan({ x: COL.x - 6, y: COL.y - 6, w: COL.w + 12, d: COL.d + 12, r: 2 }, 4), 1).map(([x, y]) => at([x, y, 3])), { size: 0.4 }));
  // rib on the column's outer face
  out.push(L(segment([COL.x + COL.w + 0.06, 3, 20], [COL.x + COL.w + 0.06, 3, 60], P), { tone: "faint" }));
  out.push(D([at([COL.x + COL.w + 0.08, 3, 14]), at([COL.x + COL.w + 0.08, 3, 64])], { size: 0.45, tone: "lo" }));
  // top arm with a boss under it
  out.push(S(slabOf(ARM, ARM_Z, 10, P, 5, 1.2), { tone: "mid", inner: L(sideSeam(ARM, ARM_Z + 4.5, P, 5), { tone: "faint" }) }));
  out.push(L(planOutline(insetPlan(ARM, 2.6), ARM_Z + 10, P, 5), { tone: "faint" }));
  out.push(D(corners(insetPlan(ARM, 4), 3).map(([x, y]) => at([x, y, ARM_Z + 10])), { size: 0.4 }));
  out.push(S(slabOf({ x: 16, y: -2, w: 30, d: 6, r: 1.4 }, ARM_Z - 4, 4, P, 3, 0.4), { tone: "mid" }));
  // depth scale on the ram column
  out.push(L(segment([26, 9.2, BAR_Z + 8], [26, 9.2, ARM_Z - 6], P), { tone: "faint" }));
  // gusset between arm and column
  out.push(S(slabOf({ x: 40, y: -6, w: 16, d: 14, r: 1.5 }, ARM_Z - 12, 12, P, 3, 0.4), { tone: "mid" }));
  // guide rods with collars
  for (const x of [12, 40]) {
    out.push(S(cylinder(x, 3, 1.8, BAR_Z + 4.5, ARM_Z - BAR_Z - 8.5, P, 14), { tone: "mid", crease: "none" }));
    out.push(S(cylinder(x, 3, 2.7, ARM_Z - 4, 1.8, P, 16), { tone: "mid" }));
  }
  // rack and its pinion housing
  out.push(S(cylinder(26, 3, 1.8, BAR_Z + 4.5, ARM_Z - BAR_Z - 4.5, P, 14), { tone: "hi", crease: "none" }));
  out.push(L([46, 54, 62].map((z) => sideArc(26, 3, 1.8, z, P, 12)).join(""), { tone: "lo" }));
  out.push(S(cylinder(26, 3, 3.2, ARM_Z + 10, 2.4, P, 18), { tone: "mid" }));
  return out.join("");
}

function lever() {
  const out = [];
  // pinion housing on the arm and the handle that turns it
  out.push(S(cylinder(26, 3, 6.2, ARM_Z + 12, 5, P, 26), { tone: "hi", crease: "lo" }));
  out.push(L(knurl(26, 3, 6.2, ARM_Z + 12.4, ARM_Z + 16.6, 28, P), { tone: "lo" }));
  out.push(L(segment([26, 3, ARM_Z + 17], [-2, 3, ARM_Z + 23], P), { tone: "mid" }));
  out.push(S(cylinder(-2, 3, 3.8, ARM_Z + 21.5, 4.4, P, 22), { tone: "hi", crease: "lo" }));
  out.push(L(knurl(-2, 3, 3.8, ARM_Z + 21.9, ARM_Z + 25.5, 20, P), { tone: "lo" }));
  out.push(D([at([26, 3, ARM_Z + 17.4])], { size: 0.5, tone: "mid" }));
  return out.join("");
}

function pressBar() {
  const out = [];
  out.push(S(slabOf(BAR, BAR_Z, 4.5, P, 4, 0.6), { tone: "hi", crease: "lo" }));
  out.push(L(planOutline(insetPlan(BAR, 2), BAR_Z + 4.5, P, 4), { tone: "faint" }));
  out.push(D(corners(insetPlan(BAR, 3.6), 1).map(([x, y]) => at([x, y, BAR_Z + 4.5])), { size: 0.4, tone: "lo" }));
  for (const x of KEY_X) {
    out.push(S(cylinder(x, SEAM_Y, 2.4, BAR_Z - 2.2, 2.2, P, 18), { tone: "mid" }));
    out.push(S(cylinder(x, SEAM_Y, 1.4, BAR_Z - 5, 5, P, 14), { tone: "hi", crease: "none", lit: true }));
    out.push(L(sideArc(x, SEAM_Y, 1.4, BAR_Z - 2.6, P, 10), { tone: "lo" }));
  }
  out.push(D([at([BAR.x + 6, BAR.y + 2, BAR_Z + 4.5]), at([BAR.x + BAR.w - 6, BAR.y + 2, BAR_Z + 4.5])], { size: 0.42, tone: "mid" }));
  return out.join("");
}

function dial() {
  const out = [];
  const [x, y] = DIAL;
  const top = DIAL_Z + DIAL_H;
  out.push(S(cylinder(x, y, 4.6, ARM_Z + 10, 1.2, P, 18), { tone: "mid" }));
  out.push(D([at([x - 5, y, ARM_Z + 11.2]), at([x + 5, y, ARM_Z + 11.2])], { size: 0.36, tone: "lo" }));
  out.push(S(cylinder(x, y, DIAL_R, DIAL_Z, DIAL_H, P, 56, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(knurl(x, y, DIAL_R, top - 3, top, 52, P, 0.3), { tone: "lo" }));
  out.push(L(sideArc(x, y, DIAL_R, top - 3, P, 36), { tone: "faint" }));
  out.push(L(ring(x, y, DIAL_R - 2.2, top, P, 56), { tone: "lo" }));
  const ticks = radialTicks(x, y, DIAL_R - 3.2, 40, 5, top, [1.3, 2.8], P, -Math.PI * 0.75, Math.PI * 1.5);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L(ring(x, y, 1.8, top, P, 16), { tone: "mid" }));
  return out.join("");
}

/* ── recipe printer ───────────────────────────────────── */
function printer() {
  const out = [];
  const face = PRINT.y + PRINT.d;
  out.push(S(slabOf(PRINT, 0, PRINT_H, P, 6, 1.2), { tone: "mid", inner: L(sideSeam(PRINT, 22, P, 6), { tone: "faint" }) }));
  out.push(S(slabOf(insetPlan(PRINT, 2.4), PRINT_H, 2, P, 6, 0.5), { tone: "mid" }));
  out.push(L(planOutline(insetPlan(PRINT, 5), PRINT_H + 2, P, 6), { tone: "faint" }));
  out.push(D(corners(insetPlan(PRINT, 2.4), 5).map(([x, y]) => at([x, y, PRINT_H + 2])), { size: 0.45 }));

  // card slot on the front face
  out.push(L(faceRect(PRINT.x + 8, PRINT.x + PRINT.w - 10, face + 0.05, 27, 33.5), { tone: "mid" }));
  out.push(L(faceRect(PRINT.x + 10, PRINT.x + PRINT.w - 12, face + 0.06, 28, 32.4), { tone: "faint" }));
  // label strip under the slot
  out.push(L(faceRect(PRINT.x + 10, PRINT.x + 40, face + 0.05, 20, 24), { tone: "faint" }));

  // feed wheel and status lamp on the top face
  out.push(S(cylinder(PRINT.x + PRINT.w - 12, PRINT.y + 10, 6.4, PRINT_H + 2, 3.4, P, 24), { tone: "hi", crease: "lo" }));
  out.push(L(knurl(PRINT.x + PRINT.w - 12, PRINT.y + 10, 6.4, PRINT_H + 2.4, PRINT_H + 5.2, 24, P), { tone: "lo" }));
  out.push(D([at([PRINT.x + PRINT.w - 12, PRINT.y + 10, PRINT_H + 5.4])], { size: 0.5, tone: "mid" }));
  out.push(S(cylinder(PRINT.x + 12, PRINT.y + 9, 1.6, PRINT_H + 2, 1.2, P, 14), { tone: "hi", lit: true }));

  // stack of blank recipe cards with a corner guide
  for (let index = 0; index < 3; index += 1) {
    out.push(S(slabOf({ x: PRINT.x + 7, y: PRINT.y + 20, w: 28, d: 20, r: 0.8 }, PRINT_H + 2 + index * 2.1, 1.8, P, 3, 0.3), { tone: "hi", crease: "lo" }));
    out.push(L(planOutline({ x: PRINT.x + 9, y: PRINT.y + 22, w: 24, d: 16, r: 0.6 }, PRINT_H + 3.8 + index * 2.1, P, 3), { tone: "faint" }));
  }
  out.push(L(planOutline({ x: PRINT.x + 6, y: PRINT.y + 19, w: 30, d: 22, r: 1 }, PRINT_H + 2, P, 3), { tone: "lo" }));

  // output tray in front of the printer, with two finished cards
  out.push(S(slabOf({ x: 84, y: 8, w: 46, d: 26, r: 2 }, 0, 2.4, P, 4, 0.4), { tone: "mid" }));
  out.push(L(planOutline({ x: 87, y: 11, w: 40, d: 20, r: 1 }, 2.4, P, 4), { tone: "faint" }));
  return out.join("");
}

function outCard() {
  const out = [];
  out.push(S(slabOf({ x: 92, y: 14, w: 36, d: 22, r: 0.8 }, 2.4, 1.6, P, 3, 0.3), { tone: "hi", crease: "lo", lit: true }));
  out.push(L(planOutline({ x: 94, y: 16, w: 32, d: 18, r: 0.6 }, 4, P, 3), { tone: "faint" }));
  for (let index = 0; index < 4; index += 1) {
    const y = 18.5 + index * 4;
    const length = [26, 20, 24, 14][index];
    out.push(L(lineOnTop([96, y], [96 + length, y], 4, P), { tone: "lo", free: true }));
  }
  return out.join("");
}

/* ── assembly ─────────────────────────────────────────── */
const parts = {
  base: base(),
  cabinet: cabinet(),
  cradle: cradle(),
  frame: frame(),
  lever: lever(),
  printer: printer(),
};

const svg = figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "JOIN LAB 데모 기계: 12개 서랍에 원-윈도우 연계 48개 데이터플랫폼이 담긴 캐비닛, 그 오른쪽 피드 트레이와 결합 크래들, 크래들 위의 프레스 바와 다섯 개의 조인트 키, 상단 게이지, 오른쪽 레시피 프린터.",
  body: [
    `<g data-part="base">${parts.base}</g>`,
    `<g data-part="cabinet">${parts.cabinet}</g>`,
    `<g data-part="cradle">${parts.cradle}</g>`,
    `<g data-part="planks">
      <g data-plank="a">${plank(LANE_A, 1)}</g>
      <g data-plank="b">${plank(LANE_B, 4)}</g>
    </g>`,
    `<g data-part="frame">${parts.frame}</g>`,
    `<g data-part="press">${pressBar()}</g>`,
    `<g data-part="dial">${dial()}</g>`,
    `<g data-part="printer">${parts.printer}</g>`,
    `<g data-part="card" style="display:none">${outCard()}</g>`,
    `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${lineOnTop([DIAL[0] - 2, DIAL[1] + 2], [DIAL[0] + 1, DIAL[1] - 10], DIAL_Z + DIAL_H + 0.2, P)}" style="stroke-width:1.2"/>`,
  ],
});

const GROUPS = [
  { n: "01", label: "금융", keys: ["사업자번호", "기준일자", "법정동코드"], rows: 41200000, items: ["금융 빅데이터 플랫폼", "금융데이터거래소", "데이터루트", "신한카드 데이터바다"] },
  { n: "02", label: "카드·소비", keys: ["사업자번호", "기준일자", "업종코드"], rows: 27800000, items: ["쿠콘", "피타그래프", "KAMP", "삼성카드 데이터랩"] },
  { n: "03", label: "교통", keys: ["법정동코드", "기준일자", "노선ID"], rows: 86100000, items: ["교통 빅데이터 플랫폼", "자동차데이터플랫폼", "물모아", "레일포털"] },
  { n: "04", label: "생태·환경", keys: ["법정동코드", "측정소코드", "기준일자"], rows: 19400000, items: ["환경 빅데이터 플랫폼", "지오빅데이터 오픈플랫폼", "국가생물종지식정보시스템", "K-BDS"] },
  { n: "05", label: "보건·의료", keys: ["법정동코드", "기준일자", "요양기관번호"], rows: 33100000, items: ["헬스케어 빅데이터 플랫폼", "감염병 빅데이터 플랫폼", "한국보건정보의료원", "보건의료빅데이터 개방시스템"] },
  { n: "06", label: "농림·수산", keys: ["법정동코드", "기준일자", "품목코드"], rows: 12600000, items: ["농식품 빅데이터 플랫폼", "스마트팜 빅데이터 플랫폼", "산림 빅데이터 플랫폼", "연안 빅데이터 플랫폼"] },
  { n: "07", label: "문화·관광", keys: ["법정동코드", "콘텐츠ID", "기준일자"], rows: 9700000, items: ["문화 빅데이터 플랫폼", "한국관광데이터랩", "공공누리", "KMDB"] },
  { n: "08", label: "통계·공공", keys: ["법정동코드", "기준일자", "통계표ID"], rows: 52300000, items: ["공공데이터포털", "통계데이터센터", "KOSIS 국가통계포털", "서울 열린데이터 광장"] },
  { n: "09", label: "과학·지식", keys: ["기준일자", "문서ID", "기관코드"], rows: 7400000, items: ["AI-HUB", "디지털집현전", "사이언스온", "셀렉트스타"] },
  { n: "10", label: "산업·무역", keys: ["사업자번호", "HS코드", "기준일자"], rows: 21800000, items: ["중소기업 빅데이터 플랫폼", "무역투자빅데이터", "한국무역협회", "한국거래소 KRX"] },
  { n: "11", label: "부동산·공간", keys: ["법정동코드", "기준일자", "필지고유번호"], rows: 15900000, items: ["부동산 빅데이터 플랫폼", "공간데이터마켓", "GBP 강동구 빅데이터 플랫폼", "서울시 빅데이터 캠퍼스"] },
  { n: "12", label: "생활·안전", keys: ["법정동코드", "기준일자", "시설ID"], rows: 28500000, items: ["라이프로그 빅데이터 플랫폼", "소방안전 빅데이터 플랫폼", "통신 빅데이터 플랫폼", "그랜데이터"] },
];

const WEIGHTS = {
  법정동코드: 48, 기준일자: 32, 사업자번호: 36, 측정소코드: 20, 요양기관번호: 22,
  품목코드: 18, 콘텐츠ID: 14, 통계표ID: 20, 문서ID: 12, HS코드: 18,
  필지고유번호: 16, 시설ID: 14, 업종코드: 16, 노선ID: 12,
};

window.__FIG = {
  svg,
  P,
  css: ISO_CSS,
  data: {
    groups: GROUPS,
    weights: WEIGHTS,
    dial: { x: DIAL[0], y: DIAL[1], z: DIAL_Z + DIAL_H, r: DIAL_R },
    lanes: [LANE_A, LANE_B],
    seam: SEAM_Y,
    bed: BED_TOP,
    barZ: BAR_Z,
    travel: PRESS_TRAVEL,
    keyX: KEY_X,
    startX: -56,
    dockX: 0,
  },
};
