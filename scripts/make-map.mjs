// Draws SixSpots' own fictional map (public/map.svg). Run: node scripts/make-map.mjs
// Structure: one tall island state in a teal sea, reef ring, green land, white roads,
// a grey city on the east coast, a swamp in the south, islands to the west, keys to the south.
import { writeFileSync } from "node:fs";

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const W = 4000, H = 3000;

// Catmull-Rom spline through points -> smooth SVG path
function smooth(pts, closed = true) {
  const n = pts.length, P = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${P(0)[0].toFixed(0)} ${P(0)[1].toFixed(0)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(0)} ${c1[1].toFixed(0)} ${c2[0].toFixed(0)} ${c2[1].toFixed(0)} ${p2[0].toFixed(0)} ${p2[1].toFixed(0)}`;
  }
  return closed ? d + " Z" : d;
}
// add a jagged coastline between control points
function coast(ctrl, steps = 6, amp = 28) {
  const out = [];
  for (let i = 0; i < ctrl.length; i++) {
    const a = ctrl[i], b = ctrl[(i + 1) % ctrl.length];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const nx = -(b[1] - a[1]), ny = b[0] - a[0], len = Math.hypot(nx, ny) || 1;
      const j = (rnd() - 0.5) * 2 * amp;
      out.push([a[0] + (b[0] - a[0]) * t + (nx / len) * j, a[1] + (b[1] - a[1]) * t + (ny / len) * j]);
    }
  }
  return out;
}
function blob(cx, cy, rx, ry, k = 10, amp = 0.25) {
  const pts = [];
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2, r = 1 + (rnd() - 0.5) * 2 * amp;
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  return smooth(pts);
}

const C = {
  sea: "#2c91a7", sea2: "#2c91a7", reef: "#4fb4c2", shallow: "#5fc2cc",
  land: "#8dbd97", land2: "#7fb38c", forest: "#6fa47e", field: "#a3c9a2", sand: "#e6dcb8",
  swamp: "#86b99c", water: "#5aaec4", urban: "#c5c9d1", block: "#d9dce2", block2: "#b4b9c3",
  road: "#f7f8fa", roadEdge: "#c9d3cf", hwy: "#fff6d6", label: "#ffffff", labelEdge: "#2b4a45",
};

// ---------- shapes ----------
const islandCtrl = [
  [1790, 190], [2000, 130], [2250, 170], [2430, 300], [2560, 520], [2640, 780], [2660, 1040],
  [2760, 1220], [2820, 1450], [2790, 1700], [2700, 1900], [2580, 2120], [2440, 2330], [2330, 2520],
  [2200, 2690], [2060, 2760], [1950, 2690], [1880, 2540], [1760, 2400], [1640, 2230], [1560, 2030],
  [1500, 1800], [1470, 1560], [1430, 1320], [1400, 1080], [1430, 820], [1500, 580], [1600, 380],
];
// widen the island around its middle so it reads as a fat egg shape
const X = (x) => 2120 + (x - 2120) * 1.22;
const ISLAND = smooth(coast(islandCtrl.map(([x, y]) => [X(x), y]), 5, 22));
const WEST_ISLES = [
  blob(1120, 960, 90, 150, 9, 0.3), blob(1050, 1230, 70, 110, 8, 0.3), blob(1110, 1480, 110, 160, 10, 0.25),
  blob(1030, 1720, 60, 90, 8, 0.3), blob(1150, 700, 50, 70, 7, 0.3),
];
const SW_ISLAND = blob(1500, 2620, 190, 120, 11, 0.22);
const KEYS = [];
for (let i = 0; i < 11; i++) {
  const t = i / 10, x = 2050 - t * 620 + (rnd() - 0.5) * 30, y = 2830 - Math.sin(t * Math.PI) * 60 + (rnd() - 0.5) * 20;
  KEYS.push(blob(x, y, 38 + rnd() * 30, 16 + rnd() * 8, 7, 0.25));
}
const allLand = [ISLAND, ...WEST_ISLES, SW_ISLAND, ...KEYS];

// ---------- svg ----------
const o = [];
const add = (s) => o.push(s);
add(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`);
add(`<defs>
<clipPath id="land">${allLand.map((d) => `<path d="${d}"/>`).join("")}</clipPath>
<clipPath id="main"><path d="${ISLAND}"/></clipPath>
<radialGradient id="seaG" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="${C.sea}"/><stop offset="1" stop-color="${C.sea2}"/></radialGradient>
</defs>`);

// sea + faint deep-water contours
add(`<rect width="${W}" height="${H}" fill="url(#seaG)"/>`);
for (const [rx, ry, op] of [[1250, 1500, 0.1], [1450, 1650, 0.07]])
  add(`<ellipse cx="2050" cy="1480" rx="${rx}" ry="${ry}" fill="none" stroke="#1f7d92" stroke-width="40" opacity="${op}"/>`);

// reef ring + shallows around all land
for (const d of allLand) add(`<path d="${d}" fill="${C.reef}" stroke="${C.reef}" stroke-width="170" stroke-linejoin="round" opacity=".55"/>`);
for (const d of allLand) add(`<path d="${d}" fill="${C.shallow}" stroke="${C.shallow}" stroke-width="70" stroke-linejoin="round"/>`);
// beaches
for (const d of allLand) add(`<path d="${d}" fill="${C.sand}" stroke="${C.sand}" stroke-width="16" stroke-linejoin="round"/>`);
// land
for (const d of allLand) add(`<path d="${d}" fill="${C.land}"/>`);

add(`<g clip-path="url(#land)">`);
// texture: forest + field patches
for (let i = 0; i < 160; i++) {
  const x = 950 + rnd() * 2100, y = 150 + rnd() * 2750, r = 40 + rnd() * 120;
  add(`<path d="${blob(x, y, r, r * (0.6 + rnd() * 0.5), 8, 0.3)}" fill="${rnd() > 0.5 ? C.forest : C.land2}" opacity=".55"/>`);
}
for (let i = 0; i < 70; i++) {
  const x = 1500 + rnd() * 700, y = 300 + rnd() * 1300, w = 60 + rnd() * 90, h = 40 + rnd() * 70;
  add(`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${C.field}" opacity=".6" transform="rotate(${(rnd() * 20 - 10).toFixed(1)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`);
}
// swamp in the south
add(`<path d="${blob(1950, 2080, 380, 300, 12, 0.18)}" fill="${C.swamp}"/>`);
for (let i = 0; i < 90; i++) {
  const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
  const x = 1950 + Math.cos(a) * 330 * r, y = 2080 + Math.sin(a) * 260 * r, s = 12 + rnd() * 40;
  add(`<path d="${blob(x, y, s, s * 0.6, 7, 0.35)}" fill="${C.water}" opacity=".9"/>`);
}
// rivers + lakes
add(`<path d="${smooth([[2200, 560], [2120, 820], [2010, 1100], [1900, 1400], [1880, 1700], [1930, 1900]], false)}" fill="none" stroke="${C.water}" stroke-width="20" stroke-linecap="round"/>`);
add(`<path d="${blob(2230, 640, 150, 100, 11, 0.2)}" fill="${C.water}"/>`);
add(`<path d="${blob(1700, 1450, 70, 50, 9, 0.25)}" fill="${C.water}"/>`);
add(`<path d="${blob(2050, 1650, 55, 40, 8, 0.25)}" fill="${C.water}"/>`);

// city on the east coast + two towns
function town(cx, cy, rx, ry, step, dense) {
  add(`<path d="${blob(cx, cy, rx, ry, 12, 0.15)}" fill="${C.urban}"/>`);
  for (let x = cx - rx; x < cx + rx; x += step)
    for (let y = cy - ry; y < cy + ry; y += step) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 0.85 || rnd() < 0.12) continue;
      const tall = dense && dx * dx + dy * dy < 0.18 && rnd() > 0.4;
      add(`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${(step - 12).toFixed(0)}" height="${(step - 12).toFixed(0)}" rx="3" fill="${tall ? C.block2 : C.block}"/>`);
    }
}
town(2670, 1450, 270, 370, 46, true); // Port Neon
town(1800, 460, 130, 90, 40, false); // north town
town(1460, 1900, 90, 80, 38, false); // west town
// airport south of the city
add(`<g transform="rotate(-25 2520 1960)"><rect x="2380" y="1930" width="300" height="34" rx="6" fill="#b9bec7"/><rect x="2420" y="1990" width="220" height="26" rx="6" fill="#b9bec7"/></g>`);
// marina / pier
add(`<rect x="2930" y="1420" width="120" height="16" rx="5" fill="#b9a983"/>`);
add(`</g>`);
// SW island town (on its own island)
add(`<g clip-path="url(#land)">`);
town(1500, 2620, 110, 70, 34, false);
add(`</g>`);

// roads (clipped to land): casing + white
const roads = [
  { w: 22, pts: [[1880, 230], [1950, 520], [2050, 820], [2150, 1100], [2350, 1350], [2550, 1600], [2480, 1900], [2330, 2200], [2230, 2450], [2100, 2700]] }, // interstate
  { w: 18, pts: [[1560, 420], [1430, 700], [1380, 1000], [1400, 1300], [1430, 1600], [1520, 1900], [1700, 2250], [1950, 2560]] }, // west highway
  { w: 12, pts: [[1380, 1000], [1700, 980], [1950, 960], [2150, 1100]] },
  { w: 12, pts: [[1400, 1300], [1800, 1320], [2100, 1350], [2400, 1420], [2850, 1420]] },
  { w: 12, pts: [[1430, 1600], [1800, 1620], [2050, 1700], [2450, 1750], [2850, 1700]] },
  { w: 12, pts: [[1520, 1900], [1800, 1950], [2050, 1880], [2300, 1950]] },
  { w: 12, pts: [[1820, 460], [2050, 450], [2300, 500], [2550, 650]] },
  { w: 10, pts: [[2550, 650], [2700, 900], [2760, 1150]] },
  { w: 10, pts: [[1760, 2400], [1950, 2380], [2200, 2420]] },
];
add(`<g clip-path="url(#land)" fill="none" stroke-linecap="round" stroke-linejoin="round">`);
for (const r of roads) add(`<path d="${smooth(r.pts, false)}" stroke="${C.roadEdge}" stroke-width="${r.w + 8}"/>`);
for (const r of roads) add(`<path d="${smooth(r.pts, false)}" stroke="${r.w >= 18 ? C.hwy : C.road}" stroke-width="${r.w}"/>`);
// little local roads
for (let i = 0; i < 70; i++) {
  const x = 1350 + rnd() * 1500, y = 250 + rnd() * 2400, a = rnd() * Math.PI, l = 80 + rnd() * 200;
  const p = [[x, y], [x + Math.cos(a) * l * 0.5 + (rnd() - 0.5) * 60, y + Math.sin(a) * l * 0.5], [x + Math.cos(a) * l, y + Math.sin(a) * l]];
  add(`<path d="${smooth(p, false)}" stroke="${C.road}" stroke-width="6" opacity=".9"/>`);
}
add(`</g>`);
// bridges over water (not clipped)
const bridges = [[[1340, 1230], [1090, 1230]], [[1330, 960], [1200, 960]], [[1110, 1310], [1110, 1380]], [[2080, 2740], [2030, 2810]], [[1700, 2560], [1620, 2600]]];
for (const [a, b] of bridges) add(`<path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}" stroke="${C.roadEdge}" stroke-width="18" stroke-linecap="round"/><path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}" stroke="${C.road}" stroke-width="10" stroke-linecap="round"/>`);
// keys causeway
add(`<path d="${smooth([[2050, 2830], [1850, 2800], [1650, 2790], [1430, 2830]], false)}" fill="none" stroke="${C.road}" stroke-width="8" stroke-dasharray="40 14" opacity=".9"/>`);

// labels (our own names)
const labels = [
  ["Palmer County", 1960, 330, 64],
  ["Lake Ibis", 2230, 800, 40],
  ["Grove County", 1700, 1180, 64],
  ["Port Neon", 2670, 1240, 72],
  ["Sunset Isles", 990, 1960, 44],
  ["South Grove County", 1840, 1780, 52],
  ["Sawgrass Swamp", 1960, 2120, 50],
  ["Mangrove Keys", 1760, 2930, 44],
];
for (const [t, x, y, s] of labels)
  add(`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${s}" fill="${C.label}" stroke="${C.labelEdge}" stroke-width="${(s / 7).toFixed(1)}" stroke-linejoin="round" paint-order="stroke" opacity=".95">${t}</text>`);

add(`</svg>`);
writeFileSync(new URL("../public/map.svg", import.meta.url), o.join("\n"));
console.log("public/map.svg written");
