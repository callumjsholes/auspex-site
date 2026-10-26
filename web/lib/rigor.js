// Intervals and tests for /stats. Inputs are the graded record and the posted price.
// A price-implied rate is the break-even of that American price, not a model probability.
// Nothing here returns a per-pick probability, an edge, a weight, or a coefficient.
import { finite } from "./clv.js";
import { implied } from "./format.js";
import { byTime, fromMilli, isGraded, toMilli } from "./summary.js";
import { clubName, dowName, marketLabel, oddsBand, oppOf, startBand, venueOf } from "./stats.js";

export const RIGOR_SEED = 20261025;
export const BOOT_N = 2000;
export const FAN_PATHS = 2000;
export const Z95 = 1.959963984540054;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normalCdf(z) {
  const x = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * x);
  const d = 0.3989422804014327 * Math.exp(-0.5 * x * x);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const upper = 1 - p;
  return z >= 0 ? upper : 1 - upper;
}

export function logGamma(z) {
  const c = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.98436965407898e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < c.length; i++) x += c[i] / (z + i + 1);
  const t = z + c.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betacf(a, b, x) {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}

export function regularizedIncompleteBeta(x, a, b) {
  if (!(a > 0) || !(b > 0)) return null;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const ln = logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
  const front = Math.exp(ln);
  if (x < (a + 1) / (a + b + 2)) return (front * betacf(a, b, x)) / a;
  return 1 - (front * betacf(b, a, 1 - x)) / b;
}

export function betaQuantile(p, a, b) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (regularizedIncompleteBeta(mid, a, b) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function studentCdf(t, df) {
  if (!(df > 0) || !Number.isFinite(t)) return null;
  const x = df / (df + t * t);
  const ib = regularizedIncompleteBeta(x, df / 2, 0.5);
  if (t >= 0) return 1 - 0.5 * ib;
  return 0.5 * ib;
}

export function studentQuantile(p, df) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  let lo = -40;
  let hi = 40;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (studentCdf(mid, df) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function wilson(wins, losses, z = Z95) {
  const n = wins + losses;
  if (!(n > 0)) return null;
  const p = wins / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  let lo = center - margin;
  let hi = center + margin;
  if (wins === 0) lo = 0;
  if (losses === 0) hi = 1;
  return { n, wins, losses, p, lo: Math.max(0, lo), hi: Math.min(1, hi) };
}

function quantile(sorted, p) {
  if (!sorted.length) return null;
  const x = p * (sorted.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  if (i >= sorted.length - 1) return sorted[sorted.length - 1];
  return sorted[i] * (1 - f) + sorted[i + 1] * f;
}

function sums(rows) {
  let u = 0;
  let s = 0;
  for (const r of rows) {
    u += toMilli(r.units);
    s += toMilli(r.stake);
  }
  return { u, s, roi: s ? (100 * u) / s : null, units: fromMilli(u) };
}

function bootstrap(rows, rng, B) {
  const graded = rows.filter((r) => isGraded(r.result));
  const observed = sums(graded);
  if (!graded.length) return { n: 0, estUnits: null, unitsLo: null, unitsHi: null, estRoi: null, roiLo: null, roiHi: null };
  const units = [];
  const rois = [];
  const n = graded.length;
  for (let b = 0; b < B; b++) {
    let u = 0;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const r = graded[Math.floor(rng() * n)];
      u += toMilli(r.units);
      s += toMilli(r.stake);
    }
    units.push(u);
    if (s) rois.push((100 * u) / s);
  }
  units.sort((a, b) => a - b);
  rois.sort((a, b) => a - b);
  return {
    n,
    estUnits: observed.units,
    unitsLo: fromMilli(quantile(units, 0.025)),
    unitsHi: fromMilli(quantile(units, 0.975)),
    estRoi: observed.roi,
    roiLo: rois.length ? quantile(rois, 0.025) : null,
    roiHi: rois.length ? quantile(rois, 0.975) : null,
  };
}

export function breakEven(price) {
  const p = Number(price);
  if (price == null || price === "" || !Number.isFinite(p) || (p > -100 && p < 100)) return null;
  const q = implied(p);
  return q != null && Number.isFinite(q) ? q : null;
}

export function priceTest(rows) {
  const decided = [];
  let skipped = 0;
  for (const r of rows) {
    if (r.result !== "Won" && r.result !== "Lost") continue;
    const q = breakEven(r.price);
    if (q == null) {
      skipped += 1;
      continue;
    }
    decided.push({ win: r.result === "Won" ? 1 : 0, q });
  }
  const n = decided.length;
  if (!n) return { n: 0, skipped, wins: 0, expected: null, sd: null, z: null, p: null, meanPrice: null };
  let wins = 0;
  let expected = 0;
  let variance = 0;
  for (const d of decided) {
    wins += d.win;
    expected += d.q;
    variance += d.q * (1 - d.q);
  }
  const sd = Math.sqrt(variance);
  const z = sd > 0 ? (wins - expected) / sd : null;
  const p = z == null ? null : 2 * (1 - normalCdf(Math.abs(z)));
  return { n, skipped, wins, expected, sd, z, p, meanPrice: expected / n };
}

export function betaHit(wins, losses) {
  const a = 0.5 + wins;
  const b = 0.5 + losses;
  if (!(a > 0) || !(b > 0)) return null;
  return {
    a,
    b,
    mean: a / (a + b),
    lo: betaQuantile(0.025, a, b),
    hi: betaQuantile(0.975, a, b),
  };
}

export function betaDensity(a, b, steps = 80) {
  const lo = betaQuantile(0.005, a, b);
  const hi = betaQuantile(0.995, a, b);
  const out = [];
  const logBase = logGamma(a + b) - logGamma(a) - logGamma(b);
  for (let i = 0; i <= steps; i++) {
    const x = lo + ((hi - lo) * i) / steps;
    const y = Math.exp(logBase + (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x));
    out.push({ x, y: Number.isFinite(y) ? y : 0 });
  }
  return out;
}

function bayesRoi(rows, rng, B) {
  const graded = rows.filter((r) => isGraded(r.result));
  const n = graded.length;
  if (!n) return { pPositive: null, lo: null, hi: null, mean: null };
  const rois = [];
  for (let b = 0; b < B; b++) {
    let u = 0;
    let s = 0;
    let wsum = 0;
    const w = new Array(n);
    for (let i = 0; i < n; i++) {
      const e = -Math.log(Math.max(rng(), 1e-12));
      w[i] = e;
      wsum += e;
    }
    for (let i = 0; i < n; i++) {
      const weight = w[i] / wsum;
      u += weight * toMilli(graded[i].units);
      s += weight * toMilli(graded[i].stake);
    }
    if (s) rois.push((100 * u) / s);
  }
  rois.sort((a, c) => a - c);
  const positive = rois.filter((v) => v > 0).length;
  return {
    pPositive: rois.length ? positive / rois.length : null,
    lo: quantile(rois, 0.025),
    hi: quantile(rois, 0.975),
    mean: rois.reduce((a, v) => a + v, 0) / rois.length,
  };
}

export function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return { n, r: null, p: null };
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) {
    mx += xs[i];
    my += ys[i];
  }
  mx /= n;
  my /= n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  if (!(sxx > 0) || !(syy > 0)) return { n, r: null, p: null };
  const r = sxy / Math.sqrt(sxx * syy);
  const df = n - 2;
  const t = r * Math.sqrt(df / Math.max(1e-15, 1 - r * r));
  return { n, r, p: 2 * (1 - studentCdf(Math.abs(t), df)) };
}

export function clvTest(rows) {
  const graded = rows.filter((r) => isGraded(r.result) && finite(r.clvCents) != null);
  const n = graded.length;
  if (n < 2) return { n, mean: null, lo: null, hi: null, t: null, p: null, rWin: null, rWinP: null, rUnits: null, rUnitsP: null, decided: 0 };
  let sum = 0;
  for (const r of graded) sum += finite(r.clvCents);
  const mean = sum / n;
  let ss = 0;
  for (const r of graded) {
    const d = finite(r.clvCents) - mean;
    ss += d * d;
  }
  const sd = Math.sqrt(ss / (n - 1));
  const se = sd / Math.sqrt(n);
  const t = se > 0 ? mean / se : null;
  const crit = studentQuantile(0.975, n - 1);
  const decided = graded.filter((r) => r.result === "Won" || r.result === "Lost");
  const winCorr = pearson(decided.map((r) => finite(r.clvCents)), decided.map((r) => (r.result === "Won" ? 1 : 0)));
  const unitCorr = pearson(graded.map((r) => finite(r.clvCents)), graded.map((r) => Number(r.units) || 0));
  return {
    n,
    mean,
    sd,
    lo: mean - crit * se,
    hi: mean + crit * se,
    t,
    p: t == null ? null : 2 * (1 - studentCdf(Math.abs(t), n - 1)),
    rWin: winCorr.r,
    rWinP: winCorr.p,
    rUnits: unitCorr.r,
    rUnitsP: unitCorr.p,
    decided: decided.length,
  };
}

export function runsTest(rows) {
  const flags = rows.filter((r) => r.result === "Won" || r.result === "Lost").sort(byTime).map((r) => r.result === "Won");
  const n = flags.length;
  const n1 = flags.filter(Boolean).length;
  const n0 = n - n1;
  if (n < 2 || n0 === 0 || n1 === 0) return { n, runs: null, expected: null, z: null, p: null, acf: null, band: null };
  let runs = 1;
  for (let i = 1; i < n; i++) if (flags[i] !== flags[i - 1]) runs += 1;
  const expected = (2 * n1 * n0) / n + 1;
  const variance = (2 * n1 * n0 * (2 * n1 * n0 - n)) / (n * n * (n - 1));
  const z = variance > 0 ? (runs - expected) / Math.sqrt(variance) : null;
  let mean = n1 / n;
  let c0 = 0;
  let c1 = 0;
  for (let i = 0; i < n; i++) {
    const d = (flags[i] ? 1 : 0) - mean;
    c0 += d * d;
    if (i < n - 1) c1 += d * ((flags[i + 1] ? 1 : 0) - mean);
  }
  return {
    n,
    wins: n1,
    losses: n0,
    runs,
    expected,
    z,
    p: z == null ? null : 2 * (1 - normalCdf(Math.abs(z))),
    acf: c0 > 0 ? c1 / c0 : null,
    band: 1.959963984540054 / Math.sqrt(n),
  };
}

export function sampleSize(hit, breakeven, current) {
  const blank = { already: false, needed: null, more: null, unreachable: true };
  if (hit == null || breakeven == null || !(current > 0)) return blank;
  const lower = (N) => wilson(hit * N, (1 - hit) * N).lo;
  if (!(hit > breakeven)) return { already: false, needed: null, more: null, unreachable: true };
  if (lower(current) > breakeven) return { already: true, needed: current, more: 0, unreachable: false };
  let lo = current;
  let hi = Math.max(current + 1, 2);
  while (hi < 100000 && lower(hi) <= breakeven) {
    lo = hi;
    hi = Math.min(100000, hi * 2);
  }
  if (lower(hi) <= breakeven) return { already: false, needed: null, more: null, unreachable: true, cap: 100000 };
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (lower(mid) > breakeven) hi = mid;
    else lo = mid;
  }
  return { already: false, needed: hi, more: hi - current, unreachable: false };
}

function fanChart(rows, rng, paths) {
  const graded = rows.filter((r) => isGraded(r.result));
  const horizon = graded.length;
  if (horizon < 2) return null;
  const n = graded.length;
  const units = graded.map((r) => toMilli(r.units));
  const cols = Array.from({ length: horizon }, () => new Float64Array(paths));
  let down20 = 0;
  let down100 = 0;
  let endDown = 0;
  for (let p = 0; p < paths; p++) {
    let total = 0;
    let min = 0;
    for (let t = 0; t < horizon; t++) {
      total += units[Math.floor(rng() * n)];
      if (total < min) min = total;
      cols[t][p] = total;
    }
    if (min <= -20000) down20 += 1;
    if (min <= -100000) down100 += 1;
    if (total < 0) endDown += 1;
  }
  const pack = (q) => cols.map((col) => {
    const copy = Array.from(col);
    copy.sort((a, b) => a - b);
    return fromMilli(quantile(copy, q));
  });
  return {
    horizon,
    paths,
    p5: pack(0.05),
    p25: pack(0.25),
    p50: pack(0.5),
    p75: pack(0.75),
    p95: pack(0.95),
    pDown20: down20 / paths,
    pDown100: down100 / paths,
    pEndDown: endDown / paths,
  };
}

function residualSigma(rows) {
  const graded = rows.filter((r) => isGraded(r.result) && toMilli(r.stake) > 0);
  const n = graded.length;
  if (n < 2) return null;
  const observed = sums(graded);
  const R = observed.u / observed.s;
  let ss = 0;
  let stake = 0;
  for (const r of graded) {
    const e = toMilli(r.units) - R * toMilli(r.stake);
    ss += e * e;
    stake += toMilli(r.stake);
  }
  const sd = Math.sqrt(ss / (n - 1));
  const meanStake = stake / n;
  return { sd, meanStake, roi: observed.roi, n };
}

function groupBy(rows, keyFn) {
  const map = new Map();
  for (const r of rows) {
    const key = keyFn(r);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  return [...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
}

function hitOf(rows) {
  let wins = 0;
  let losses = 0;
  for (const r of rows) {
    if (r.result === "Won") wins += 1;
    else if (r.result === "Lost") losses += 1;
  }
  return { wins, losses };
}

const FAMILIES = [
  ["Sport", (r) => r.league || "Other"],
  ["Market", marketLabel],
  ["Tier", (r) => r.tier || "Not labeled"],
  ["Price", (r) => oddsBand(r.price)],
  ["Side", (r) => (r.side === "Over" || r.side === "Under" ? r.side : "")],
  ["Venue", venueOf],
  ["Book", (r) => r.book || ""],
  ["Day", (r) => dowName(r.date)],
  ["Start", (r) => startBand(r.start)],
  ["Team", (r) => clubName(r.league, r.team)],
  ["Opponent", (r) => clubName(r.league, oppOf(r))],
];

export function buildRigor(rows, opts = {}) {
  const seed = opts.seed ?? RIGOR_SEED;
  const B = opts.boots ?? BOOT_N;
  const paths = opts.paths ?? FAN_PATHS;
  const rng = mulberry32(seed);
  const list = Array.isArray(rows) ? rows : [];
  const overallBoot = bootstrap(list, rng, B);
  const overallHit = hitOf(list);
  const overallWilson = wilson(overallHit.wins, overallHit.losses);
  const slices = [];
  for (const [family, keyFn] of FAMILIES) {
    for (const [key, group] of groupBy(list, keyFn)) {
      const hit = hitOf(group);
      const boot = bootstrap(group, rng, B);
      const test = priceTest(group);
      slices.push({
        key: `${family} · ${key}`,
        family,
        name: key,
        few: boot.n > 0 && boot.n < 30,
        n: boot.n,
        wilson: wilson(hit.wins, hit.losses),
        boot,
        test,
      });
    }
  }
  const test = priceTest(list);
  const posterior = betaHit(overallHit.wins, overallHit.losses);
  const roiPosterior = bayesRoi(list, rng, B);
  const pAbove = posterior && test.meanPrice != null ? 1 - regularizedIncompleteBeta(test.meanPrice, posterior.a, posterior.b) : null;
  const hitRate = test.n ? test.wins / test.n : null;
  const power = sampleSize(hitRate, test.meanPrice, test.n);
  const sigma = residualSigma(list);
  const funnelPoints = slices
    .filter((s) => s.boot.estRoi != null && s.n > 0)
    .map((s) => ({ key: s.key, family: s.family, n: s.n, roi: s.boot.estRoi, few: s.few }));
  let limits = [];
  if (sigma && sigma.meanStake > 0 && sigma.sd > 0 && funnelPoints.length) {
    const ns = funnelPoints.map((p) => p.n);
    const loN = Math.max(1, Math.min(...ns));
    const hiN = Math.max(...ns);
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const n = Math.max(loN, loN * (hiN / loN) ** (i / steps));
      const half = (Z95 * (sigma.sd / sigma.meanStake) / Math.sqrt(n)) * 100;
      limits.push({ n, lo: sigma.roi - half, hi: sigma.roi + half });
    }
  }
  const nearest = (n) => limits.reduce((best, row) => (Math.abs(row.n - n) < Math.abs(best.n - n) ? row : best), limits[0]);
  const marked = funnelPoints.map((p) => {
    if (!limits.length) return { ...p, outside: false };
    const lim = nearest(p.n);
    return { ...p, outside: p.roi < lim.lo || p.roi > lim.hi };
  });
  return {
    seed,
    boots: B,
    paths,
    wilson: overallWilson,
    units: { n: overallBoot.n, est: overallBoot.estUnits, lo: overallBoot.unitsLo, hi: overallBoot.unitsHi },
    roi: { n: overallBoot.n, est: overallBoot.estRoi, lo: overallBoot.roiLo, hi: overallBoot.roiHi },
    slices: slices.map((s) => ({
      key: s.key,
      family: s.family,
      name: s.name,
      few: s.few,
      n: s.n,
      wins: s.wilson?.wins ?? 0,
      losses: s.wilson?.losses ?? 0,
      hit: s.wilson?.p ?? null,
      hitLo: s.wilson?.lo ?? null,
      hitHi: s.wilson?.hi ?? null,
      units: s.boot.estUnits,
      unitsLo: s.boot.unitsLo,
      unitsHi: s.boot.unitsHi,
      roi: s.boot.estRoi,
      roiLo: s.boot.roiLo,
      roiHi: s.boot.roiHi,
      z: s.test.z,
      p: s.test.p,
      expected: s.test.expected,
      decided: s.test.n,
    })),
    test,
    bayes: posterior ? {
      mean: posterior.mean,
      lo: posterior.lo,
      hi: posterior.hi,
      a: posterior.a,
      b: posterior.b,
      density: betaDensity(posterior.a, posterior.b),
      price: test.meanPrice,
      pAbovePrice: pAbove,
      pRoiPositive: roiPosterior.pPositive,
      roiLo: roiPosterior.lo,
      roiHi: roiPosterior.hi,
      roiMean: roiPosterior.mean,
    } : null,
    fan: fanChart(list, rng, paths),
    clv: clvTest(list),
    runs: runsTest(list),
    power: { ...power, hit: hitRate, breakeven: test.meanPrice, decided: test.n },
    funnel: sigma ? { center: sigma.roi, points: marked, limits } : { center: null, points: [], limits: [] },
  };
}
