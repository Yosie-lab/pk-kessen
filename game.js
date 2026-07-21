import { unlockAudio, playKick, playCheer, playMiss, playPostHit, playWhistle, playVictoryCelebration } from "./audio.js";

const canvas = document.getElementById("pitch");
const ctx = canvas.getContext("2d");

const els = {
  hud: document.getElementById("hud"),
  title: document.getElementById("title-screen"),
  result: document.getElementById("result-screen"),
  controls: document.getElementById("controls"),
  prompt: document.getElementById("prompt"),
  scoreYou: document.getElementById("score-you"),
  scoreCpu: document.getElementById("score-cpu"),
  kicksYou: document.getElementById("kicks-you"),
  kicksCpu: document.getElementById("kicks-cpu"),
  roundLabel: document.getElementById("round-label"),
  aimHint: document.getElementById("aim-hint"),
  labelYou: document.getElementById("label-you"),
  labelCpu: document.getElementById("label-cpu"),
  flagYou: document.getElementById("flag-you"),
  flagCpu: document.getElementById("flag-cpu"),
  resultKicker: document.getElementById("result-kicker"),
  resultTitle: document.getElementById("result-title"),
  resultScore: document.getElementById("result-score"),
  btnStart: document.getElementById("btn-start"),
  btnRetry: document.getElementById("btn-retry"),
};

const DIRS = ["left", "center", "right"];
const HEIGHTS = ["low", "mid", "high"];

/** 日本代表風・サムライブルー */
const SAMURAI_BLUE = {
  name: "SAMURAI BLUE",
  shortName: "JAPAN",
  id: "jp",
  flag: "🇯🇵",
  jersey: "#0c1f45",
  jerseyDark: "#081530",
  shorts: "#0c1f45",
  socks: "#0c1f45",
  exposeThigh: true,
  accent: "#f2f5fa",
  number: "#ffffff",
  trim: "#ffffff",
};

/**
 * 国ごとのスタジアム景色（対戦相手のホーム想定）
 * situations: その国で出やすい天候・時間帯（日付シードで日替わり）
 */
const VENUES = {
  jp: {
    seats: ["#1e3a5f", "#c8102e", "#ffffff"],
    motif: "city",
    situations: ["night", "rainNight", "dusk", "fog"],
  },
  ar: {
    seats: ["#74acdf", "#ffffff", "#1a3a6b"],
    motif: "city",
    situations: ["night", "dusk", "golden", "noon"],
  },
  es: {
    seats: ["#c60b1e", "#1a2f5a", "#f0e6d8"],
    motif: "plaza",
    situations: ["golden", "dusk", "night", "noon"],
  },
  fr: {
    seats: ["#002654", "#ffffff", "#ed2939"],
    motif: "tower",
    situations: ["dusk", "night", "rainNight", "fog"],
  },
  eng: {
    seats: ["#00247d", "#ffffff", "#cf081f"],
    motif: "overcast",
    situations: ["overcast", "rainDay", "rainNight", "noon"],
  },
  pt: {
    seats: ["#d40000", "#006600", "#ffd700"],
    motif: "coast",
    situations: ["golden", "dusk", "noon", "night"],
  },
  br: {
    seats: ["#ffdf00", "#002776", "#009c3b"],
    motif: "palms",
    situations: ["noon", "golden", "dusk", "night"],
  },
  ma: {
    seats: ["#c1272d", "#006233", "#f5e6c8"],
    motif: "desert",
    situations: ["golden", "dusk", "noon", "night"],
  },
  nl: {
    seats: ["#ff6900", "#111111", "#ffffff"],
    motif: "flat",
    situations: ["overcast", "dusk", "rainDay", "night"],
  },
  be: {
    seats: ["#000000", "#fadb0a", "#e30613"],
    motif: "city",
    situations: ["rainNight", "overcast", "night", "dusk"],
  },
  de: {
    seats: ["#ffffff", "#111111", "#dd0000"],
    motif: "industrial",
    situations: ["night", "overcast", "rainNight", "fog"],
  },
};

/** 時間帯・天候シチュエーション */
const SITUATIONS = {
  noon: {
    label: "昼",
    sky: ["#3a6ea8", "#5a92c4", "#7aacc8"],
    haze: "rgba(255,250,230,0.14)",
    lights: false,
    grass: ["#2d8a42", "#247a38", "#1a5c2a"],
    apron: "#2a3034",
    rain: 0,
    fog: 0,
    sun: true,
  },
  golden: {
    label: "夕方",
    sky: ["#2a1838", "#c45a28", "#e8a048"],
    haze: "rgba(255,180,90,0.28)",
    lights: false,
    grass: ["#3a7a38", "#2e6a30", "#1e5024"],
    apron: "#3a3030",
    rain: 0,
    fog: 0,
    sun: true,
  },
  dusk: {
    label: "薄暮",
    sky: ["#0e1428", "#2a2848", "#6a4060"],
    haze: "rgba(255,160,120,0.2)",
    lights: true,
    grass: ["#1a5a32", "#145028", "#0e3c20"],
    apron: "#1c2028",
    rain: 0,
    fog: 0,
    sun: false,
  },
  night: {
    label: "夜",
    sky: ["#050a12", "#0c1624", "#152030"],
    haze: "rgba(220,210,160,0.2)",
    lights: true,
    grass: ["#0f4f2c", "#146338", "#0b3a22"],
    apron: "#0c1014",
    rain: 0,
    fog: 0,
    sun: false,
  },
  overcast: {
    label: "曇天",
    sky: ["#3a4450", "#5a646e", "#7a848e"],
    haze: "rgba(200,210,220,0.1)",
    lights: false,
    grass: ["#2a6a38", "#225c30", "#184a26"],
    apron: "#3a4048",
    rain: 0,
    fog: 0.12,
    sun: false,
  },
  fog: {
    label: "霧",
    sky: ["#2a3038", "#4a5058", "#6a7078"],
    haze: "rgba(210,220,230,0.22)",
    lights: true,
    grass: ["#2a5a38", "#224c30", "#183c26"],
    apron: "#2a3038",
    rain: 0,
    fog: 0.35,
    sun: false,
  },
  rainDay: {
    label: "昼の雨",
    sky: ["#2a3540", "#3a4854", "#4a5a68"],
    haze: "rgba(180,200,220,0.12)",
    lights: false,
    grass: ["#1e5a30", "#184c28", "#123c20"],
    apron: "#2a3038",
    rain: 0.7,
    fog: 0.08,
    sun: false,
  },
  rainNight: {
    label: "夜の雨",
    sky: ["#04080e", "#0a121c", "#121c28"],
    haze: "rgba(160,190,220,0.16)",
    lights: true,
    grass: ["#0c3a24", "#0e4830", "#082818"],
    apron: "#080c10",
    rain: 1,
    fog: 0.1,
    sun: false,
  },
};

function dayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function venueForKit(kit) {
  return VENUES[kit?.id] || VENUES.jp;
}

/** 国×日付でシチュエーションを決定（同じ日・同じ国は同じ雰囲気） */
function buildScene(kit) {
  const venue = venueForKit(kit);
  const seed = hashStr(`${dayKey()}:${kit?.id || "jp"}`);
  const keys = venue.situations;
  const sitKey = keys[seed % keys.length];
  const sit = SITUATIONS[sitKey] || SITUATIONS.night;
  // 日付の別ビットで観客の熱量・芝の明るさを微調整
  const crowdHeat = 0.88 + ((seed >>> 8) % 12) / 100;
  const grassShift = ((seed >>> 16) % 7) - 3;
  return {
    id: sitKey,
    label: sit.label,
    sky: sit.sky,
    haze: sit.haze,
    lights: sit.lights,
    grass: sit.grass,
    apron: sit.apron,
    rain: sit.rain,
    fog: sit.fog,
    sun: sit.sun,
    seats: venue.seats,
    motif: venue.motif,
    crowdHeat,
    grassShift,
  };
}

/** ワールドランキング上位の対戦相手（試合ごとに抽選） */
const OPPONENT_KITS = [
  // 1 アルゼンチン：水色と白
  {
    name: "アルゼンチン",
    id: "ar",
    flag: "🇦🇷",
    rank: 1,
    jersey: "#74acdf",
    jerseyDark: "#4f8fc4",
    shorts: "#ffffff",
    socks: "#74acdf",
    accent: "#e8f4fc",
    number: "#1a3a6b",
    trim: "#ffffff",
  },
  // 2 スペイン：赤と紺
  {
    name: "スペイン",
    id: "es",
    flag: "🇪🇸",
    rank: 2,
    jersey: "#c60b1e",
    jerseyDark: "#8e0815",
    shorts: "#1a2f5a",
    socks: "#c60b1e",
    accent: "#ffcdd2",
    number: "#ffffff",
    trim: "#1a2f5a",
  },
  // 3 フランス：紺と白
  {
    name: "フランス",
    id: "fr",
    flag: "🇫🇷",
    rank: 3,
    jersey: "#002654",
    jerseyDark: "#001a3a",
    shorts: "#ffffff",
    socks: "#002654",
    accent: "#e3f2fd",
    number: "#ffffff",
    trim: "#ed2939",
  },
  // 4 イングランド：白と紺
  {
    name: "イングランド",
    id: "eng",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    rank: 4,
    jersey: "#f5f5f5",
    jerseyDark: "#d0d0d0",
    shorts: "#00247d",
    socks: "#f5f5f5",
    accent: "#e8eef8",
    number: "#00247d",
    trim: "#cf081f",
  },
  // 5 ポルトガル：赤とエンジ
  {
    name: "ポルトガル",
    id: "pt",
    flag: "🇵🇹",
    rank: 5,
    jersey: "#d40000",
    jerseyDark: "#9a0000",
    shorts: "#6b1e2a",
    socks: "#d40000",
    accent: "#ffcdd2",
    number: "#ffffff",
    trim: "#006600",
  },
  // 6 ブラジル：黄色と青
  {
    name: "ブラジル",
    id: "br",
    flag: "🇧🇷",
    rank: 6,
    jersey: "#ffdf00",
    jerseyDark: "#d4b800",
    shorts: "#002776",
    socks: "#ffdf00",
    accent: "#fff9c4",
    number: "#002776",
    trim: "#009c3b",
  },
  // 7 モロッコ：赤と緑
  {
    name: "モロッコ",
    id: "ma",
    flag: "🇲🇦",
    rank: 7,
    jersey: "#c1272d",
    jerseyDark: "#8e1c21",
    shorts: "#006233",
    socks: "#c1272d",
    accent: "#ffcdd2",
    number: "#ffffff",
    trim: "#006233",
  },
  // 8 オランダ：オレンジと黒
  {
    name: "オランダ",
    id: "nl",
    flag: "🇳🇱",
    rank: 8,
    jersey: "#ff6900",
    jerseyDark: "#cc5200",
    shorts: "#111111",
    socks: "#ff6900",
    accent: "#ffe0b2",
    number: "#ffffff",
    trim: "#111111",
  },
  // 9 ベルギー：赤
  {
    name: "ベルギー",
    id: "be",
    flag: "🇧🇪",
    rank: 9,
    jersey: "#e30613",
    jerseyDark: "#a0040e",
    shorts: "#e30613",
    socks: "#e30613",
    accent: "#ffcdd2",
    number: "#ffffff",
    trim: "#000000",
  },
  // 10 ドイツ：白と黒
  {
    name: "ドイツ",
    id: "de",
    flag: "🇩🇪",
    rank: 10,
    jersey: "#ffffff",
    jerseyDark: "#d8d8d8",
    shorts: "#111111",
    socks: "#ffffff",
    accent: "#f5f5f5",
    number: "#111111",
    trim: "#dd0000",
  },
];

const state = {
  mode: "title",
  phase: "idle",
  suddenDeath: false,
  kickIndex: 0,
  turn: "you-shoot",
  scores: { you: 0, cpu: 0 },
  history: { you: [], cpu: [] },
  youKit: SAMURAI_BLUE,
  oppKit: OPPONENT_KITS[0],
  lastOppIndex: -1,
  scene: buildScene(OPPONENT_KITS[0]),
  aim: { x: 0.5, y: 0.45 },
  shot: null,
  save: null,
  keeperDir: "center",
  keeperHeight: "mid",
  keeperProgress: 0,
  keeperFeint: null,
  ball: null,
  kicker: null,
  approach: null,
  aimLocked: false,
  diveLocked: false,
  pointerAim: null,
  pendingStrike: null,
  whistlePending: false,
  flash: 0,
  crowdPulse: 0,
  netShake: 0,
  netImpact: { x: 0.5, y: 0.5 },
  message: "",
  dpr: 1,
  w: 0,
  h: 0,
  fixedGoal: null,
};

function pickOpponentKit() {
  let idx = Math.floor(Math.random() * OPPONENT_KITS.length);
  if (OPPONENT_KITS.length > 1) {
    while (idx === state.lastOppIndex) {
      idx = Math.floor(Math.random() * OPPONENT_KITS.length);
    }
  }
  state.lastOppIndex = idx;
  state.oppKit = OPPONENT_KITS[idx];
  state.youKit = SAMURAI_BLUE;
  state.scene = buildScene(state.oppKit);
  if (els.labelYou) els.labelYou.textContent = SAMURAI_BLUE.shortName;
  if (els.labelCpu) els.labelCpu.textContent = state.oppKit.name;
  if (els.flagYou) els.flagYou.textContent = SAMURAI_BLUE.flag;
  if (els.flagCpu) els.flagCpu.textContent = state.oppKit.flag;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  state.w = Math.max(1, rect.width);
  state.h = Math.max(1, rect.height);
  canvas.width = Math.floor(state.w * state.dpr);
  canvas.height = Math.floor(state.h * state.dpr);
  canvas.style.width = `${state.w}px`;
  canvas.style.height = `${state.h}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

let safeProbe = null;

function readSafeAreaInsets() {
  if (!safeProbe) {
    safeProbe = document.createElement("div");
    safeProbe.style.cssText =
      "position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);";
    document.body.appendChild(safeProbe);
  }
  const s = getComputedStyle(safeProbe);
  return {
    top: parseFloat(s.paddingTop) || 0,
    right: parseFloat(s.paddingRight) || 0,
    bottom: parseFloat(s.paddingBottom) || 0,
    left: parseFloat(s.paddingLeft) || 0,
  };
}

/** キャンバス内のプレイ余白（HUD はキャンバス外に配置） */
function playfieldInsets() {
  const safe = readSafeAreaInsets();
  let top = 10;
  // プレイ中は下部ヒントの出し入れでゴールサイズが揺れないよう固定
  let bottom = state.mode === "play" ? 46 : 10;

  if (state.mode !== "play" && els.controls && !els.controls.hidden) {
    const canvasRect = canvas.getBoundingClientRect();
    const controlsRect = els.controls.getBoundingClientRect();
    const overlap = canvasRect.bottom - controlsRect.top;
    if (overlap > 0) bottom = Math.max(bottom, overlap + 8);
  }

  return {
    top,
    bottom,
    left: safe.left + 4,
    right: safe.right + 4,
  };
}

function computeGoalRect() {
  const w = state.w;
  const h = state.h;
  const inset = playfieldInsets();
  const availW = Math.max(120, w - inset.left - inset.right);
  const availH = Math.max(140, h - inset.top - inset.bottom);
  const topOverhang = 22;

  const playableH = Math.max(80, availH - topOverhang);
  const maxGhByHeight = playableH * 0.32;
  const maxGhByWidth = (availW * 0.96) / 2.92;
  const ghCap = h <= 300 ? 104 : h <= 380 ? 142 : h <= 460 ? 172 : 216;
  const gh = Math.min(maxGhByHeight, maxGhByWidth, ghCap);

  const gw = Math.min(availW * 0.96, gh * 3.0);
  const x = inset.left + (availW - gw) * 0.5;
  const y = inset.top + topOverhang;

  return { x, y, w: gw, h: gh };
}

function refreshFixedGoal() {
  if (state.mode !== "play") return;
  state.fixedGoal = computeGoalRect();
}

function clearFixedGoal() {
  state.fixedGoal = null;
}

function goalRect() {
  if (state.mode === "play" && state.fixedGoal) {
    return state.fixedGoal;
  }
  return computeGoalRect();
}

/** 9マスの中心点。狙い・ボール着地・キーパー・セーブ判定はすべてここを基準にする */
const ZONE_X = { left: 0.17, center: 0.5, right: 0.83 };
const ZONE_Y = { high: 0.2, mid: 0.5, low: 0.8 };

function worldFromAim(aim) {
  const g = goalRect();
  return {
    x: g.x + aim.x * g.w,
    y: g.y + aim.y * g.h,
  };
}

function zoneFromAim(aim) {
  // 9マス中心に最も近いマス（同距離は Y に近い高さ・中央列を優先）
  let bestDir = "center";
  let bestHeight = "mid";
  let bestDist = Infinity;
  for (const dir of DIRS) {
    for (const height of HEIGHTS) {
      const c = cellCenter(dir, height);
      const d = (aim.x - c.x) ** 2 + (aim.y - c.y) ** 2;
      if (d < bestDist - 1e-10) {
        bestDist = d;
        bestDir = dir;
        bestHeight = height;
      } else if (Math.abs(d - bestDist) <= 1e-10) {
        const cur = cellCenter(bestDir, bestHeight);
        const candY = Math.abs(c.y - aim.y);
        const curY = Math.abs(cur.y - aim.y);
        if (candY < curY - 1e-10) {
          bestDir = dir;
          bestHeight = height;
        } else if (Math.abs(candY - curY) <= 1e-10 && dir === "center") {
          bestDir = "center";
        }
      }
    }
  }
  return { dir: bestDir, height: bestHeight };
}

/** 指定マスの中心座標 */
function cellCenter(dir, height) {
  return {
    x: ZONE_X[dir] ?? ZONE_X.center,
    y: ZONE_Y[height] ?? ZONE_Y.mid,
  };
}

function sameCell(a, b) {
  return a && b && a.dir === b.dir && a.height === b.height;
}

/** キーパー胴体（中央）がボール着地点をカバーしているか（上下非対称） */
function keeperBodyCovers(ballAim, diveCell) {
  if (diveCell.dir !== "center" || !ballAim) return false;
  const diveAim = keeperDiveAim(diveCell.dir, diveCell.height);
  const dx = Math.abs(ballAim.x - diveAim.x);
  const dy = ballAim.y - diveAim.y; // 負 = 上（頭側）、正 = 下（腹・足側）

  if (diveCell.height === "mid") {
    if (dx > 0.14) return false;
    if (dy < -0.08) return false; // 頭上は届かない
    if (dy > 0.26) return false; // 下方向は腹・足元まで
    return true;
  }
  if (diveCell.height === "high") {
    if (dx > 0.12) return false;
    if (dy < -0.12) return false;
    if (dy > 0.16) return false;
    return true;
  }
  if (diveCell.height === "low") {
    if (dx > 0.12) return false;
    if (dy < -0.06) return false;
    if (dy > 0.14) return false;
    return true;
  }
  return false;
}

/** 中央列：届く方向だけ（中段→下、上段→中段）。頭上は上段ダイブのみ */
function centerVerticalReach(ballCell, diveCell, ballAim) {
  if (ballCell.dir !== "center" || diveCell.dir !== "center") return false;
  if (ballAim && Math.abs(ballAim.x - ZONE_X.center) > 0.14) return false;
  if (diveCell.height === "mid" && ballCell.height === "low") {
    return !ballAim || ballAim.y >= 0.58;
  }
  if (diveCell.height === "high" && ballCell.height === "mid") {
    return !ballAim || ballAim.y <= 0.58;
  }
  return false;
}

/** 左右下枠：キーパーが伸ばした手・体でボールをカバーしているか */
function keeperSideLowCovers(ballAim, diveCell, ballCell = null) {
  if (diveCell.height !== "low" || diveCell.dir === "center" || !ballAim) return false;
  if (ballCell && ballCell.dir !== "center" && ballCell.dir !== diveCell.dir) return false;
  const diveAim = keeperDiveAim(diveCell.dir, diveCell.height);
  const dx = Math.abs(ballAim.x - diveAim.x);
  const dy = ballAim.y - diveAim.y; // 正 = ボールが手より下（下枠方向）
  if (dx > 0.14) return false;
  if (dy < -0.06) return false; // 上方向は届かない
  if (dy > 0.22) return false; // 下方向も限界（完全に角を抜けた球はゴール）
  return true;
}

/** セーブ：同一マス、胴体カバー、または届く方向の中央リーチ */
function keeperSavesShot(ballCell, diveCell, ballAim = null) {
  if (sameCell(ballCell, diveCell)) {
    if (ballCell.height === "low" && ballCell.dir !== "center") {
      return keeperSideLowCovers(ballAim, diveCell, ballCell);
    }
    return true;
  }
  if (ballAim && keeperBodyCovers(ballAim, diveCell)) return true;
  if (ballAim && keeperSideLowCovers(ballAim, diveCell, ballCell)) return true;
  if (centerVerticalReach(ballCell, diveCell, ballAim)) return true;
  return false;
}

function keeperDiveAim(dir, height = "mid") {
  // ボールのマス中心とキーパー着地点を一致させる
  if (height === "high") {
    return { x: ZONE_X[dir] ?? ZONE_X.center, y: 0.24 };
  }
  if (height === "low") {
    return { x: ZONE_X[dir] ?? ZONE_X.center, y: 0.68 };
  }
  return cellCenter(dir, height);
}

const KEEPER_LOCAL_FOOT_Y = 82;
const KEEPER_LOCAL_HEAD_TOP = -14;
const BALL_REF_GOAL_H = 160;
const BALL_REF_RADIUS = 9;

function ballBaseRadius(g = goalRect()) {
  return clamp((g.h / BALL_REF_GOAL_H) * BALL_REF_RADIUS, 5.5, 11);
}

function keeperScaleForGoal(g = goalRect()) {
  // ゴール高さに比例（h=160 で約1.05）。小画面ではフレーム内に収まるよう上限もかける
  const ref = (g.h * 0.65625) / 100;
  const maxFit = (g.h * 0.98) / (KEEPER_LOCAL_FOOT_Y - KEEPER_LOCAL_HEAD_TOP);
  return clamp(Math.min(ref, maxFit), 0.52, 1.32);
}

/** 待機ポーズの足元までのアンカーからの距離（スケール後） */
function keeperFootDrop(g = goalRect()) {
  return KEEPER_LOCAL_FOOT_Y * keeperScaleForGoal(g);
}

/** 待機はゴールライン上（足元がラインに揃う位置） */
function keeperReadyAim() {
  const g = goalRect();
  const footDrop = keeperFootDrop(g);
  const aimY = clamp(1 - footDrop / Math.max(g.h, 1), 0.1, 0.94);
  return { x: ZONE_X.center, y: aimY };
}

/** キーパーフェイント 10種（キックごとに抽選） */
const KEEPER_FEINTS = [
  "shuffle",
  "hop",
  "fake-left",
  "fake-right",
  "sway",
  "crouch",
  "arm-wave",
  "double-fake",
  "advance",
  "jitter",
];

function rollKeeperFeint() {
  let id = randChoice(KEEPER_FEINTS);
  if (KEEPER_FEINTS.length > 1 && state.keeperFeint?.id === id) {
    id = randChoice(KEEPER_FEINTS.filter((f) => f !== id));
  }
  state.keeperFeint = { id, startedAt: performance.now() };
}

/** 相手が蹴るまでのフェイント姿勢（ワールド／ボディオフセット） */
function sampleKeeperFeint(now = performance.now()) {
  const blank = {
    ox: 0,
    oy: 0,
    lean: 0,
    hipX: 0,
    hipY: 0,
    shoulderY: 0,
    plant: 0,
    handSpread: 0,
    handLY: 0,
    handRY: 0,
    handLX: 0,
    handRX: 0,
  };
  const f = state.keeperFeint;
  if (!f) return blank;
  // ダイブが始まったらフェードアウト
  const fade = 1 - clamp(state.keeperProgress / 0.12, 0, 1);
  if (fade <= 0.01) return blank;

  const t = (now - f.startedAt) / 1000;
  const g = goalRect();
  const stepX = g.w * 0.055;
  const stepY = g.h * 0.04;
  let m = { ...blank };

  switch (f.id) {
    case "shuffle": {
      // 左右に小刻みステップ＋腕は対側に軽く振れる
      const s = Math.sin(t * 5.2);
      m.ox = s * stepX * 0.85;
      m.hipX = s * 4;
      m.plant = Math.abs(s) * 6;
      m.handLX = s * 1.5;
      m.handRX = s * 1.5;
      m.handLY = Math.abs(s) * 1.8;
      m.handRY = Math.abs(s) * 1.2;
      break;
    }
    case "hop": {
      const hop = Math.abs(Math.sin(t * 6.5));
      m.oy = -hop * stepY * 1.1;
      m.hipY = -hop * 5;
      m.plant = -hop * 4;
      m.handLY = hop * 2.5;
      m.handRY = hop * 2.5;
      break;
    }
    case "fake-left": {
      const cycle = (t % 1.35) / 1.35;
      const pulse = cycle < 0.45 ? Math.sin((cycle / 0.45) * Math.PI) : 0;
      m.ox = -pulse * stepX * 1.35;
      m.lean = -pulse * 0.18;
      m.hipX = -pulse * 8;
      m.handLX = -pulse * 3;
      m.handRX = -pulse * 1.5;
      m.handLY = pulse * 2;
      m.handRY = -pulse * 1;
      break;
    }
    case "fake-right": {
      const cycle = (t % 1.35) / 1.35;
      const pulse = cycle < 0.45 ? Math.sin((cycle / 0.45) * Math.PI) : 0;
      m.ox = pulse * stepX * 1.35;
      m.lean = pulse * 0.18;
      m.hipX = pulse * 8;
      m.handLX = pulse * 1.5;
      m.handRX = pulse * 3;
      m.handLY = -pulse * 1;
      m.handRY = pulse * 2;
      break;
    }
    case "sway": {
      const s = Math.sin(t * 2.1);
      m.ox = s * stepX * 0.55;
      m.lean = s * 0.12;
      m.hipX = s * 6;
      m.handLX = s * 2;
      m.handRX = s * 2;
      m.handLY = -s * 1.5;
      m.handRY = s * 1.5;
      break;
    }
    case "crouch": {
      const c = 0.5 + 0.5 * Math.sin(t * 3.4);
      m.oy = c * stepY * 0.7;
      m.hipY = c * 10;
      m.shoulderY = c * 6;
      m.plant = c * 5;
      // しゃがむときグローブは少し前・下へ
      m.handLY = c * 3;
      m.handRY = c * 3;
      m.handLX = c * 1.5;
      m.handRX = -c * 1.5;
      break;
    }
    case "arm-wave": {
      // 腕を伸ばし気味に開閉・上下
      const open = 0.5 + 0.5 * Math.sin(t * 2.8);
      const lift = Math.sin(t * 3.4);
      m.handSpread = 6 + open * 11;
      m.handLX = -open * 4;
      m.handRX = open * 4;
      m.handLY = lift * 2.8 - open * 0.8;
      m.handRY = -lift * 2.8 - open * 0.8;
      m.shoulderY = open * 1;
      break;
    }
    case "double-fake": {
      const cycle = (t % 1.6) / 1.6;
      let pulse = 0;
      let side = -1;
      if (cycle < 0.28) {
        pulse = Math.sin((cycle / 0.28) * Math.PI);
        side = -1;
      } else if (cycle > 0.38 && cycle < 0.72) {
        pulse = Math.sin(((cycle - 0.38) / 0.34) * Math.PI);
        side = 1;
      }
      m.ox = side * pulse * stepX * 1.25;
      m.lean = side * pulse * 0.2;
      m.hipX = side * pulse * 9;
      m.handLX = side * pulse * 2.5;
      m.handRX = side * pulse * 2.5;
      m.handLY = pulse * 1.5;
      m.handRY = pulse * 1.5;
      break;
    }
    case "advance": {
      const a = 0.5 + 0.5 * Math.sin(t * 2.8);
      m.oy = a * stepY * 1.15;
      m.hipY = a * 4;
      m.lean = a * 0.06;
      m.plant = a * 3;
      m.handLY = -a * 2;
      m.handRY = -a * 2;
      break;
    }
    case "jitter":
    default: {
      const jx = Math.sin(t * 11.5) * 0.55 + Math.sin(t * 17.3) * 0.35;
      const jy = Math.sin(t * 13.1) * 0.4;
      m.ox = jx * stepX * 0.7;
      m.oy = jy * stepY * 0.45;
      m.hipX = jx * 5;
      m.plant = Math.abs(jx) * 5;
      m.handLX = Math.sin(t * 8.5) * 1.2;
      m.handRX = Math.sin(t * 9.1 + 1) * 1.2;
      m.handLY = Math.sin(t * 9.2) * 1.8;
      m.handRY = Math.sin(t * 8.7 + 0.8) * 1.8;
      break;
    }
  }

  const scale = fade;
  return {
    ox: m.ox * scale,
    oy: m.oy * scale,
    lean: m.lean * scale,
    hipX: m.hipX * scale,
    hipY: m.hipY * scale,
    shoulderY: m.shoulderY * scale,
    plant: m.plant * scale,
    handSpread: m.handSpread * scale,
    handLY: m.handLY * scale,
    handRY: m.handRY * scale,
    handLX: m.handLX * scale,
    handRX: m.handRX * scale,
  };
}

function setPrompt(text, opts = {}) {
  let headline = null;
  let sub = null;
  let plain = text;

  if (text && typeof text === "object") {
    opts = text.opts ?? opts;
    headline = text.headline ?? null;
    sub = text.sub ?? "";
    plain = headline ? `${headline}${sub}` : sub;
  }

  state.message = plain;
  els.prompt.textContent = "";
  els.prompt.classList.toggle("prompt-result", !!opts.result);
  els.prompt.classList.toggle("prompt-matchup", !!headline);

  if (headline) {
    const head = document.createElement("span");
    head.className = "prompt-headline";
    if (headline.startsWith("VS ")) {
      const mark = document.createElement("span");
      mark.className = "prompt-vs-mark";
      mark.textContent = "VS";
      head.appendChild(mark);
      head.appendChild(document.createTextNode(headline.slice(2)));
    } else {
      head.textContent = headline;
    }
    els.prompt.appendChild(head);
    if (sub) {
      const subEl = document.createElement("span");
      subEl.className = "prompt-sub";
      subEl.textContent = sub;
      els.prompt.appendChild(subEl);
    }
  } else {
    els.prompt.textContent = plain;
  }

  els.prompt.style.animation = "none";
  void els.prompt.offsetWidth;
  els.prompt.style.animation = "";
}

function updateHud() {
  els.scoreYou.textContent = String(state.scores.you);
  els.scoreCpu.textContent = String(state.scores.cpu);
  els.roundLabel.textContent = state.suddenDeath
    ? `サドンデス ${state.kickIndex + 1}`
    : `${Math.min(state.kickIndex + 1, 5)} / 5`;

  renderKicks(els.kicksYou, state.history.you);
  renderKicks(els.kicksCpu, state.history.cpu);
}

function renderKicks(container, history) {
  container.innerHTML = "";
  const slots = state.suddenDeath ? Math.max(history.length, 1) : 5;
  for (let i = 0; i < slots; i++) {
    const dot = document.createElement("span");
    dot.className = "kick-dot";
    if (history[i] === "goal") dot.classList.add("goal");
    if (history[i] === "miss") dot.classList.add("miss");
    container.appendChild(dot);
  }
}

function showControls(mode) {
  els.controls.hidden = mode === "none";
  const showHint = mode === "ready" || mode === "ready-save" || mode === "aim-click" || mode === "dive-click";
  els.aimHint.hidden = !showHint;
  if (mode === "ready") els.aimHint.textContent = "ピッチをクリック → ホイッスル → 助走";
  if (mode === "ready-save") els.aimHint.textContent = "ピッチをクリック → ホイッスル → CPUキック";
  if (mode === "aim-click") els.aimHint.textContent = "今だ！ゴールをクリックして狙え";
  if (mode === "dive-click") els.aimHint.textContent = "今だ！ゴールをクリックしてダイブ";
}

function hideOverlayScreens() {
  els.title.hidden = true;
  els.result.hidden = true;
  els.hud.hidden = false;
  requestAnimationFrame(() => {
    resize();
    requestAnimationFrame(refreshFixedGoal);
  });
}

function startMatch() {
  try {
    unlockAudio();
    clearFixedGoal();
    state.mode = "play";
    state.suddenDeath = false;
    state.kickIndex = 0;
    state.scores = { you: 0, cpu: 0 };
    state.history = { you: [], cpu: [] };
    pickOpponentKit();
    state.flash = 0;
    state.ball = null;
    state.kicker = null;
    state.approach = null;
    state.shot = null;
    state.save = null;
    state.pendingStrike = null;
    state.whistlePending = false;
    state.keeperDir = "center";
    state.keeperHeight = "mid";
    state.keeperProgress = 0;
    hideOverlayScreens();
    updateHud();
    beginYouShoot();
  } catch (err) {
    console.error(err);
  }
}

function beginYouShoot() {
  state.turn = "you-shoot";
  state.phase = "ready";
  state.aim = { x: 0.5, y: 0.48 };
  state.aimLocked = false;
  state.pointerAim = null;
  state.ball = null;
  state.kicker = null;
  state.approach = rollApproach(true);
  state.shot = null;
  state.save = null;
  state.pendingStrike = null;
  state.keeperDir = "center";
  state.keeperHeight = "mid";
  state.keeperProgress = 0;
  rollKeeperFeint();
  state.whistlePending = false;
  showControls("ready");
  setPrompt({
    headline: `${SAMURAI_BLUE.shortName} kick`,
    sub: " — ピッチをクリックしてキック開始",
  });
}

function beginYouSave() {
  state.turn = "you-save";
  state.phase = "ready-save";
  state.ball = null;
  state.kicker = null;
  state.approach = rollApproach(false);
  state.shot = null;
  state.save = null;
  state.aimLocked = false;
  state.diveLocked = false;
  state.pointerAim = null;
  state.pendingStrike = null;
  state.keeperDir = "center";
  state.keeperHeight = "mid";
  state.keeperProgress = 0;
  rollKeeperFeint();
  state.whistlePending = false;
  showControls("ready-save");
  setPrompt({
    headline: `${state.oppKit.name} kick`,
    sub: " — クリックで開始。蹴る瞬間にダイブ",
  });
}

function accuracyFromPower(power) {
  const sweet = 0.7;
  const dist = Math.abs(power - sweet);
  if (dist < 0.06) return 1;
  if (dist < 0.14) return 0.78;
  if (dist < 0.24) return 0.52;
  if (dist < 0.34) return 0.32;
  return 0.18;
}

/** 精度が低いほど枠を外しやすい（少し緩め） */
function missChanceFromAccuracy(accuracy, aim) {
  let chance = clamp(0.52 - accuracy * 0.42, 0.12, 0.48);
  // 枠の端を狙うほどさらに外れやすい
  const edge = Math.min(aim.x, 1 - aim.x, aim.y * 0.85, 1 - aim.y);
  if (edge < 0.1) chance += 0.12;
  else if (edge < 0.18) chance += 0.06;
  return clamp(chance, 0.1, 0.55);
}

/** 枠内シュートがポスト／バーに当たる確率（端・高精度でも一定） */
function postChanceFromAim(aim, accuracy, zone) {
  let chance = 0.1 + (1 - accuracy) * 0.14;
  const edgeX = Math.min(aim.x, 1 - aim.x);
  if (edgeX < 0.12) chance += 0.16;
  else if (edgeX < 0.2) chance += 0.08;
  if (aim.y < 0.16) chance += 0.14;
  else if (aim.y < 0.28) chance += 0.07;
  if (zone.dir !== "center") chance += 0.05;
  if (zone.height === "high") chance += 0.07;
  return clamp(chance, 0.08, 0.4);
}

function pickPostPart(aim, zone) {
  const options = [];
  if (zone.dir === "left" || aim.x < 0.42) options.push("left", "left");
  if (zone.dir === "right" || aim.x > 0.58) options.push("right", "right");
  if (zone.height === "high" || aim.y < 0.38) options.push("bar", "bar");
  options.push("left", "right", "bar");
  return randChoice(options);
}

function aimOnPost(part, zone) {
  if (part === "left") return { x: 0.015, y: ZONE_Y[zone.height] };
  if (part === "right") return { x: 0.985, y: ZONE_Y[zone.height] };
  return { x: ZONE_X[zone.dir], y: 0.02 };
}

function resolveShot(aim, power, dive) {
  const intended = zoneFromAim(aim);
  const accuracy = accuracyFromPower(power);
  const softMiss = Math.random() < missChanceFromAccuracy(accuracy, aim);
  const onTarget = !softMiss;
  const diveCell = {
    dir: dive?.dir ?? "center",
    height: dive?.height ?? "mid",
  };

  let finalAim;
  if (!onTarget) {
    finalAim = {
      x: intended.dir === "left" ? -0.06 : intended.dir === "right" ? 1.06 : aim.x < 0.5 ? -0.06 : 1.06,
      y: clamp(ZONE_Y[intended.height] - 0.08, -0.04, 0.55),
    };
  } else {
    const center = cellCenter(intended.dir, intended.height);
    const pull = 0.38;
    finalAim = {
      x: lerp(center.x, aim.x, pull),
      y: lerp(center.y, aim.y, pull),
    };
  }

  const ballCell = onTarget ? zoneFromAim(finalAim) : { dir: intended.dir, height: intended.height };
  const saved = onTarget && keeperSavesShot(ballCell, diveCell, finalAim);

  // ゴールになりうる球だけ、ポスト／バー判定 → 入る／外れる
  let post = null;
  let postIn = false;
  if (onTarget && !saved && Math.random() < postChanceFromAim(aim, accuracy, ballCell)) {
    post = pickPostPart(aim, ballCell);
    postIn = Math.random() < clamp(0.4 + accuracy * 0.22, 0.36, 0.64);
    finalAim = aimOnPost(post, ballCell);
  }

  return {
    aim: finalAim,
    zone: ballCell,
    dive: diveCell,
    intended,
    power,
    accuracy,
    onTarget,
    saved,
    post,
    postIn,
    goal: onTarget && !saved && (!post || postIn),
  };
}

function cpuAim() {
  const dir = randChoice(DIRS);
  const height = randChoice(HEIGHTS);
  return cellCenter(dir, height);
}

function cpuKeeperGuess(playerHistoryAims) {
  if (playerHistoryAims.length >= 2 && Math.random() < 0.4) {
    const last = zoneFromAim(playerHistoryAims[playerHistoryAims.length - 1]);
    return { dir: last.dir, height: last.height };
  }
  return { dir: randChoice(DIRS), height: randChoice(HEIGHTS) };
}

const playerAimHistory = [];

function applyKeeperDive(dive) {
  state.keeperDir = dive.dir;
  state.keeperHeight = dive.height;
}

/** キックごとに助走・踏み込み・蹴りの型を抽選 */
function rollKickStyle() {
  const presets = [
    { name: "calm", plantAt: 0.52, decelPow: 2.55, strideMul: 0.88, legAmp: 0.84, kickMsMul: 1.1, runMsMul: 1.08, launchU: 0.27, followMs: 430, swingSpan: 0.68, slideAmp: 4.0 },
    { name: "snap", plantAt: 0.43, decelPow: 2.05, strideMul: 1.14, legAmp: 1.06, kickMsMul: 0.86, runMsMul: 0.9, launchU: 0.2, followMs: 300, swingSpan: 0.6, slideAmp: 5.6 },
    { name: "long", plantAt: 0.57, decelPow: 2.8, strideMul: 0.7, legAmp: 0.92, kickMsMul: 1.16, runMsMul: 1.14, launchU: 0.3, followMs: 470, swingSpan: 0.74, slideAmp: 3.6 },
    { name: "stutter", plantAt: 0.49, decelPow: 2.35, strideMul: 1.02, legAmp: 1.0, kickMsMul: 0.96, runMsMul: 1.02, launchU: 0.24, followMs: 360, swingSpan: 0.64, slideAmp: 4.6, stutter: true },
    { name: "power", plantAt: 0.47, decelPow: 2.42, strideMul: 0.94, legAmp: 1.2, kickMsMul: 1.04, runMsMul: 1.0, launchU: 0.25, followMs: 410, swingSpan: 0.7, slideAmp: 5.4 },
    { name: "short", plantAt: 0.4, decelPow: 1.95, strideMul: 1.18, legAmp: 0.98, kickMsMul: 0.82, runMsMul: 0.86, launchU: 0.19, followMs: 290, swingSpan: 0.58, slideAmp: 5.0 },
    { name: "lefty", plantAt: 0.5, decelPow: 2.38, strideMul: 0.9, legAmp: 1.02, kickMsMul: 1.0, runMsMul: 1.0, launchU: 0.24, followMs: 390, swingSpan: 0.66, slideAmp: 4.4, leftFooted: true },
  ];
  const base = randChoice(presets);
  return {
    ...base,
    plantAt: clamp(base.plantAt + rand(-0.035, 0.035), 0.38, 0.6),
    legAmp: clamp(base.legAmp + rand(-0.09, 0.09), 0.72, 1.28),
    kickMsMul: clamp(base.kickMsMul + rand(-0.07, 0.07), 0.8, 1.22),
    runMsMul: clamp(base.runMsMul + rand(-0.06, 0.06), 0.84, 1.2),
    followMs: clamp((base.followMs + rand(-45, 45)) | 0, 260, 520),
    strideMul: clamp(base.strideMul + rand(-0.1, 0.1), 0.62, 1.28),
    slideAmp: base.slideAmp + rand(-0.8, 0.8),
    sideJitter: rand(-0.18, 0.18),
  };
}

function strikeTiming(runDist, kickStyle = {}) {
  const runMs = clamp((480 + runDist * 0.48) * (kickStyle.runMsMul ?? 1), 500, 980);
  const kickMs = clamp(300 * (kickStyle.kickMsMul ?? 1), 235, 390);
  return { runMs, kickMs };
}

/** 走り始め位置の型（PK でよく見るスタート地点） */
function rollStartSpot(isYou, ballX, ballY, w, h, side, kickStyle) {
  const depthMul =
    kickStyle.name === "long" ? 1.28 : kickStyle.name === "short" ? 0.68 : kickStyle.name === "snap" ? 0.82 : 1;
  const spots = isYou
    ? [
        { id: "center_deep", lx: 0.02, depth: 0.155, arc: 0 },
        { id: "center_mid", lx: -0.03, depth: 0.1, arc: 0.04 },
        { id: "left_wide", lx: -0.26, depth: 0.12, arc: 0.14 },
        { id: "right_wide", lx: 0.24, depth: 0.12, arc: -0.12 },
        { id: "left_short", lx: -0.18, depth: 0.055, arc: 0.08 },
        { id: "right_short", lx: 0.16, depth: 0.055, arc: -0.07 },
        { id: "far_back", lx: side * 0.1, depth: 0.21, arc: side * 0.1 },
        { id: "beside_left", lx: -0.22, depth: 0.035, arc: 0.05 },
        { id: "beside_right", lx: 0.2, depth: 0.038, arc: -0.04 },
        { id: "diagonal", lx: -0.2 * (side >= 0 ? 1 : -1), depth: 0.17, arc: 0.16 },
      ]
    : [
        { id: "center_deep", lx: 0.02, depth: 0.1, arc: 0 },
        { id: "center_mid", lx: 0.03, depth: 0.065, arc: -0.03 },
        { id: "left_wide", lx: -0.22, depth: 0.085, arc: 0.11 },
        { id: "right_wide", lx: 0.21, depth: 0.085, arc: -0.1 },
        { id: "left_short", lx: -0.15, depth: 0.04, arc: 0.07 },
        { id: "right_short", lx: 0.14, depth: 0.04, arc: -0.06 },
        { id: "far_back", lx: side * 0.08, depth: 0.125, arc: side * 0.08 },
        { id: "beside_left", lx: -0.18, depth: 0.028, arc: 0.04 },
        { id: "beside_right", lx: 0.17, depth: 0.03, arc: -0.03 },
        { id: "diagonal", lx: 0.18 * (side >= 0 ? 1 : -1), depth: 0.11, arc: -0.13 },
      ];

  const pick = randChoice(spots);
  const depth = pick.depth * depthMul + rand(-0.012, 0.018);
  const lx = pick.lx + rand(-0.035, 0.035);
  const minY = isYou ? ballY + h * 0.04 : ballY + h * 0.025;
  const maxY = isYou ? h * 0.97 : ballY + h * 0.15;

  return {
    from: {
      x: clamp(ballX + lx * w, w * 0.07, w * 0.93),
      y: clamp(ballY + depth * h, minY, maxY),
    },
    startId: pick.id,
    arc: pick.arc + rand(-0.04, 0.04),
  };
}

/** 毎回違う助走コースを抽選 */
function rollApproach(isYou) {
  const w = state.w;
  const h = state.h;
  const spot = penaltyLayout().spot;
  const ballX = spot.x;
  const ballY = spot.y;
  const idlePose = randChoice(["sides", "hips", "front", "focus", "bounce"]);
  const kickStyle = rollKickStyle();
  const side = clamp((Math.random() - 0.5) * 2 + kickStyle.sideJitter, -1, 1);
  const steps = 3.2 + Math.random() * 1.5 + (kickStyle.runMsMul - 1) * 2;
  const start = rollStartSpot(isYou, ballX, ballY, w, h, side, kickStyle);
  const plantOffset = kickStyle.leftFooted ? 14 : 16;

  if (isYou) {
    const to = {
      x: ballX - plantOffset - side * (6 + Math.random() * 5),
      y: ballY + h * (0.045 + Math.random() * 0.014),
    };
    return {
      from: start.from,
      to,
      facing: 1,
      side,
      idlePose,
      steps,
      kickStyle,
      startId: start.startId,
      arc: start.arc,
    };
  }

  const to = {
    x: ballX + plantOffset + side * (5 + Math.random() * 5),
    y: ballY + h * (0.04 + Math.random() * 0.014),
  };
  return {
    from: start.from,
    to,
    facing: -1,
    side,
    idlePose,
    steps,
    kickStyle,
    startId: start.startId,
    arc: start.arc,
  };
}

/** PK助走〜キック〜フォローの一体モーション */
function sampleKickerMotion({
  elapsed,
  runMs,
  kickMs,
  runFrom,
  runTo,
  runDist,
  approach,
  flightElapsed = 0,
  airborne = false,
  side = "you",
}) {
  const style = approach?.kickStyle ?? {};
  const plantAt = style.plantAt ?? 0.48;
  const plantKickTEnd = 0.36;
  const followMs = style.followMs ?? 380;
  const decelPow = style.decelPow ?? 2.35;
  const strideMul = style.strideMul ?? 1;
  const swingSpan = style.swingSpan ?? 0.68;
  const slideAmp = style.slideAmp ?? 4.5;

  if (airborne) {
    const fu = clamp(flightElapsed / followMs, 0, 1);
    const sideBias = approach?.side ?? 0;
    const followDir = side === "you" ? 1 : -1;
    const drift = 6 + Math.abs(sideBias) * 4 + slideAmp * 0.6;
    const ease = 1 - Math.pow(1 - fu, 2.1);
    return {
      x: lerp(runTo.x, runTo.x + followDir * drift, ease),
      y: runTo.y - Math.sin(fu * Math.PI) * (1.8 + slideAmp * 0.08),
      pose: "follow",
      kick: ease,
      stride: lerp(0.25, 0, fu),
      run: 1,
    };
  }

  if (elapsed < runMs) {
    const u = elapsed / runMs;
    let moveEase = 1 - Math.pow(1 - u, decelPow);
    if (style.stutter && u > 0.32 && u < 0.52) {
      const st = (u - 0.32) / 0.2;
      moveEase *= 0.9 + 0.1 * Math.sin(st * Math.PI);
    }
    let x = lerp(runFrom.x, runTo.x, moveEase);
    let y = lerp(runFrom.y, runTo.y, moveEase);
    const arc = approach?.arc ?? 0;
    if (arc !== 0 && runDist > 1) {
      const perpX = -(runTo.y - runFrom.y) / runDist;
      const perpY = (runTo.x - runFrom.x) / runDist;
      const arcOff = arc * runDist * Math.sin(u * Math.PI);
      x += perpX * arcOff;
      y += perpY * arcOff;
    }
    const strideFreq = (2.8 + runDist / 130) * strideMul * (1 - u * 0.62);
    let stride = (elapsed / 1000) * Math.PI * strideFreq * 2.15;
    if (style.stutter) {
      stride += Math.sin(elapsed / 95) * 0.18;
    }

    if (u < plantAt) {
      return { x, y, pose: "run", kick: 0, stride, run: u };
    }
    const pu = (u - plantAt) / (1 - plantAt);
    const plantEase = pu * pu * (3 - 2 * pu);
    return {
      x,
      y,
      pose: "plant",
      kick: plantEase * plantKickTEnd,
      stride: lerp(stride, 0.15, plantEase),
      run: u,
    };
  }

  const ku = clamp((elapsed - runMs) / kickMs, 0, 1);
  const swingEase = ku < swingSpan ? 1 - Math.pow(1 - ku / swingSpan, 2.15) : 1;
  const kickT = lerp(plantKickTEnd, 1, swingEase);
  const slideDir = side === "you" ? -1 : 1;
  const x = runTo.x + slideDir * lerp(0, slideAmp, Math.sin(ku * Math.PI * 0.9));
  const y = runTo.y + lerp(0, 1.2 + slideAmp * 0.06, Math.sin(ku * Math.PI));

  return {
    x,
    y,
    pose: ku < 0.88 ? "kick" : "follow",
    kick: kickT,
    stride: 0,
    run: 1,
  };
}

function kickerBallLaunchElapsed(runMs, kickMs, kickStyle = {}) {
  return runMs + kickMs * (kickStyle.launchU ?? 0.24);
}

function applyKickerMotion(kicker, opts) {
  const m = sampleKickerMotion(opts);
  kicker.x = m.x;
  kicker.y = m.y;
  kicker.pose = m.pose;
  kicker.kick = m.kick;
  kicker.stride = m.stride;
  kicker.run = m.run;
}

function aimFromClient(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / Math.max(1, rect.width)) * state.w;
  const y = ((clientY - rect.top) / Math.max(1, rect.height)) * state.h;
  const g = goalRect();
  const nx = (x - g.x) / g.w;
  const ny = (y - g.y) / g.h;
  const inside = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1;
  return {
    aim: { x: clamp(nx, 0, 1), y: clamp(ny, 0, 1) },
    inside,
  };
}

function launchBall(now, pending = null) {
  if (!state.ball || state.ball.airborne) return;
  state.ball.airborne = true;
  if (pending) pending.flightStartedAt = now;
  playKick();
}

function shotPostHitPoint(result) {
  if (!result.post) return null;
  return worldFromAim(result.aim);
}

/** セーブ時：ボールはキーパー（手・腹）で止まり、ネット奥へは行かない */
function keeperSavePoint(result) {
  const dive = result.dive || { dir: "center", height: "mid" };
  const diveAim = keeperDiveAim(dive.dir, dive.height);
  const isSideLow = dive.height === "low" && dive.dir !== "center";
  const catchAim = {
    x: lerp(diveAim.x, result.aim.x, isSideLow ? 0.68 : dive.dir === "center" ? 0.38 : 0.52),
    y: lerp(diveAim.y, result.aim.y, isSideLow ? 0.5 : 0.22),
  };
  if (dive.dir === "center") {
    const readyY = keeperReadyAim().y;
    catchAim.y = Math.min(catchAim.y, readyY + 0.05);
  }
  const p = worldFromAim(catchAim);
  if (dive.dir === "center") {
    const g = goalRect();
    p.y = Math.max(p.y, g.y + g.h * 0.4);
  }
  return p;
}

/** ゴール時：ネット奥まで入る（キーパー位置で止めない） */
function goalNetPoint(result) {
  const g = goalRect();
  const aim = result.aim;
  const isLow = result.zone?.height === "low";
  const isSide = result.zone?.dir === "left" || result.zone?.dir === "right";
  const depth = isLow ? (isSide ? 0.16 : 0.12) : 0.09;
  const deepAim = {
    x: aim.x,
    y: clamp(aim.y + depth, 0, 0.98),
  };
  const mouth = worldFromAim(aim);
  const deep = worldFromAim(deepAim);
  return {
    x: lerp(mouth.x, deep.x, 0.55) + (mouth.x - (g.x + g.w * 0.5)) * (isSide ? 0.04 : 0.02),
    y: lerp(mouth.y, deep.y, 0.65) + g.h * (isLow ? 0.06 : 0.04),
  };
}

function shotEndPoint(result, ballSpot) {
  const g = goalRect();
  if (!result.onTarget) {
    const side = result.zone.dir === "left" ? -1 : result.zone.dir === "right" ? 1 : result.aim.x < 0.5 ? -1 : 1;
    return {
      x: side < 0 ? g.x - g.w * 0.1 : g.x + g.w + g.w * 0.1,
      y: g.y + cellCenter(result.zone.dir, result.zone.height).y * g.h,
    };
  }
  if (result.post) {
    const hit = worldFromAim(result.aim);
    const scatter = (result.postScatter ?? 0) * g.w;
    if (result.postIn) {
      // 当たって内側へこぼれる（ネット方向＋少し落下）
      if (result.post === "left") {
        return { x: hit.x + g.w * 0.18, y: hit.y + g.h * 0.1 + Math.abs(scatter) * 0.3 };
      }
      if (result.post === "right") {
        return { x: hit.x - g.w * 0.18, y: hit.y + g.h * 0.1 + Math.abs(scatter) * 0.3 };
      }
      // バー → 下へ落ちて中へ
      return { x: hit.x + scatter * 0.9, y: hit.y + g.h * 0.28 };
    }
    // 外へ弾かれる（速度を失って落ちる）
    if (result.post === "left") {
      return { x: hit.x - g.w * 0.16, y: hit.y + g.h * 0.14 };
    }
    if (result.post === "right") {
      return { x: hit.x + g.w * 0.16, y: hit.y + g.h * 0.14 };
    }
    // バー → 上に跳ねて外側へ落ちる
    return { x: hit.x + scatter * 1.1, y: hit.y - g.h * 0.08 };
  }
  if (result.saved) return keeperSavePoint(result);
  if (result.goal) return goalNetPoint(result);
  return worldFromAim(result.aim);
}

/**
 * 飛翔軌道。
 * ポスト／バー時: 接近（減速）→ 密着の一瞬 → 跳ね返り（落下・スピン変化）
 */
function flightBallScale(u, result, scaleMul = 1) {
  const end = result?.goal ? 0.72 : result?.saved ? 0.78 : result?.post ? 0.78 : 0.62;
  const travelU = result?.saved ? Math.min(u / 0.84, 1) : u;
  const start = result?.goal ? 1.05 : 1.2;
  return lerp(start, end, travelU) * scaleMul;
}

function sampleFlightPosition(from, end, postHit, result, u, h) {
  if (result.post && postHit) {
    const hitU = 0.52;
    const dwell = 0.09;
    const reboundAt = hitU + dwell;

    if (u <= hitU) {
      // ポストへ向かって減速しながら接近
      const t = u / hitU;
      const ease = 1 - Math.pow(1 - t, 1.55);
      const arc = Math.sin(ease * Math.PI * 0.95) * h * 0.08;
      return {
        x: lerp(from.x, postHit.x, ease),
        y: lerp(from.y, postHit.y, ease) - arc,
        spinMul: 1,
        scaleMul: 1,
        atImpact: false,
      };
    }

    if (u <= reboundAt) {
      // 当たった瞬間：わずかに潰れて押し戻される
      const t = (u - hitU) / dwell;
      const pulse = Math.sin(t * Math.PI);
      const nx = result.post === "left" ? -1 : result.post === "right" ? 1 : 0;
      const ny = result.post === "bar" ? -1 : 0.15;
      return {
        x: postHit.x + nx * pulse * 2.2,
        y: postHit.y + ny * pulse * 2.8,
        spinMul: 1 - t * 0.3,
        scaleMul: 1 - pulse * 0.1,
        atImpact: true,
      };
    }

    // 跳ね返り：最初は速く離れ、その後落ちて収まる
    const t = (u - reboundAt) / (1 - reboundAt);
    const leave = 1 - Math.pow(1 - t, 2.35);
    // 重力（外れたときは大きめ、入るときはネットへ落ちる程度）
    const gravity = t * t * h * (result.postIn ? 0.025 : 0.06);
    // 減衰する揺れ
    const wobble = Math.sin(t * Math.PI * 2.6) * (1 - t) * (result.post === "bar" ? 5.5 : 3.5);
    const wx = result.post === "bar" ? wobble : wobble * 0.25;
    const wy = result.post === "bar" ? wobble * 0.15 : wobble * 0.35;

    // 跳ねたあとの軌道は直線補間＋落下（バー外れは一度上がってから落ちる）
    let x = lerp(postHit.x, end.x, leave);
    let y = lerp(postHit.y, end.y, leave);
    if (result.post === "bar" && !result.postIn) {
      const loft = Math.sin(Math.min(1, t * 1.35) * Math.PI) * h * 0.035 * (1 - t);
      y -= loft;
    }
    y += gravity;

    return {
      x: x + wx,
      y: y + wy,
      spinMul: result.postIn ? 0.4 : -0.7,
      scaleMul: 1,
      atImpact: t < 0.04,
    };
  }

  if (result.saved) {
    const catchU = 0.84;
    const flyU = Math.min(u / catchU, 1);
    const ease = 1 - Math.pow(1 - flyU, 2.8);
    const arc = h * 0.035;
    let x = lerp(from.x, end.x, ease);
    let y = lerp(from.y, end.y, ease) - Math.sin(ease * Math.PI) * arc;
    if (u > catchU) {
      const settle = (u - catchU) / (1 - catchU);
      y += settle * settle * h * 0.014;
    }
    return {
      x,
      y,
      spinMul: u > catchU ? 0.12 : 1,
      scaleMul: 1,
      atImpact: u >= catchU && u < catchU + 0.06,
    };
  }

  const ease = 1 - Math.pow(1 - u, 3);
  const arc = h * 0.08;
  return {
    x: lerp(from.x, end.x, ease),
    y: lerp(from.y, end.y, ease) - Math.sin(ease * Math.PI) * arc,
    spinMul: 1,
    scaleMul: 1,
    atImpact: false,
  };
}

function bindFlightPath(pending, result) {
  // 跳ねのばらつきを結果に固定
  if (result.post && result.postScatter == null) {
    result.postScatter = (Math.random() - 0.5) * 0.12;
  }
  pending.end = shotEndPoint(result, pending.ballSpot);
  pending.postHit = shotPostHitPoint(result);
  pending.postClangPlayed = false;
  // バウンドが見えるよう飛翔を少し長く
  if (result.post && pending.flightMs) {
    pending.flightMs = pending.flightMs * 1.4;
  }
}

/** CPUキック：助走開始。ダイブはキック瞬間のクリックで決定 */
function startCpuRunup() {
  if (state.turn !== "you-save") return;
  if (state.phase !== "ready-save" && state.phase !== "whistle") return;

  const approach = state.approach?.from ? state.approach : rollApproach(false);
  state.approach = approach;
  const runFrom = { ...approach.from };
  const runTo = { ...approach.to };
  const runDist = Math.hypot(runTo.x - runFrom.x, runTo.y - runFrom.y);
  const ballSpot = penaltyLayout().spot;
  const cpuShotAim = cpuAim();
  const cpuPower = 0.55 + Math.random() * 0.35;

  const { runMs, kickMs } = strikeTiming(runDist, approach.kickStyle);
  const flightMs = 820;
  const aimOpen = runMs * 0.72;
  const aimClose = runMs + kickMs * 0.75;
  const perfectHit = runMs + kickMs * 0.5;

  state.phase = "runup";
  state.diveLocked = false;
  state.aimLocked = false;
  state.pointerAim = null;
  state.cpuShotAim = cpuShotAim;
  state.cpuPower = cpuPower;
  state.pendingStrike = {
    mode: "save",
    runFrom,
    runTo,
    runDist,
    runMs,
    kickMs,
    flightMs,
    aimOpen,
    aimClose,
    perfectHit,
    ballSpot,
    approach,
    started: performance.now(),
    result: null,
    end: null,
    spinYaw: 0,
    spinPitch: 0,
    flightStartedAt: 0,
    cpuShotAim,
    cpuPower,
  };

  state.ball = {
    x: ballSpot.x,
    y: ballSpot.y,
    start: ballSpot,
    end: ballSpot,
    t: 0,
    scale: 1,
    spinY: 0,
    spinX: 0,
    trail: [],
    airborne: false,
  };
  state.kicker = {
    side: "cpu",
    x: runFrom.x,
    y: runFrom.y,
    run: 0,
    stride: 0,
    kick: 0,
    pose: "run",
    facing: approach.facing,
    idlePose: approach.idlePose,
    kickStyle: approach.kickStyle,
  };
  state.keeperDir = "center";
  state.keeperHeight = "mid";
  state.keeperProgress = 0;
  showControls("none");
  setPrompt("CPU助走！キックの瞬間にゴールをクリックしてダイブ");

  requestAnimationFrame(stepCpuShot);
}

function lockPlayerDive(clientX, clientY, elapsed) {
  const pending = state.pendingStrike;
  if (!pending || pending.mode !== "save" || state.diveLocked) return;
  if (elapsed < pending.aimOpen || elapsed > pending.aimClose) return;

  const { aim, inside } = aimFromClient(clientX, clientY);
  const dive = inside
    ? zoneFromAim(aim)
    : { dir: "center", height: "mid" };

  state.pointerAim = inside ? aim : null;
  state.aim = aim;
  state.diveLocked = true;
  applyKeeperDive(dive);

  const result = resolveShot(pending.cpuShotAim, pending.cpuPower, dive);
  state.shot = result;
  pending.result = result;
  bindFlightPath(pending, result);
  const dx = pending.end.x - pending.ballSpot.x;
  const dy = pending.end.y - pending.ballSpot.y;
  const dist = Math.hypot(dx, dy) || 1;
  pending.spinYaw = (dx / dist) * Math.PI * 5.2;
  pending.spinPitch = (dy / dist) * Math.PI * 3.4 + Math.PI * 2.2;

  showControls("none");
  setPrompt(inside ? "ダイブ！" : "反応遅れ…");
}

function autoLockMissedDive() {
  const pending = state.pendingStrike;
  if (!pending || pending.mode !== "save" || state.diveLocked) return;

  const dive = state.pointerAim
    ? zoneFromAim(state.pointerAim)
    : { dir: randChoice(DIRS), height: randChoice(HEIGHTS) };

  state.diveLocked = true;
  applyKeeperDive(dive);
  const result = resolveShot(pending.cpuShotAim, pending.cpuPower, dive);
  state.shot = result;
  pending.result = result;
  bindFlightPath(pending, result);
  const dx = pending.end.x - pending.ballSpot.x;
  const dy = pending.end.y - pending.ballSpot.y;
  const dist = Math.hypot(dx, dy) || 1;
  pending.spinYaw = (dx / dist) * Math.PI * 5.2;
  pending.spinPitch = (dy / dist) * Math.PI * 3.4 + Math.PI * 2.2;
  showControls("none");
  setPrompt("反応遅れ…");
}

function stepCpuShot(now) {
  const pending = state.pendingStrike;
  if (!pending || pending.mode !== "save") return;

  const {
    runFrom,
    runTo,
    runDist,
    runMs,
    kickMs,
    flightMs,
    aimOpen,
    aimClose,
    ballSpot,
    approach,
  } = pending;
  const elapsed = now - pending.started;

  if (!state.diveLocked && elapsed >= aimOpen && elapsed <= aimClose) {
    if (state.phase !== "dive-click") {
      state.phase = "dive-click";
      showControls("dive-click");
      setPrompt("今だ！ゴールをクリックしてダイブ");
    }
  }

  if (!state.diveLocked && elapsed > aimClose) {
    autoLockMissedDive();
  }

  if (!state.ball.airborne) {
    if (state.phase !== "dive-click" && elapsed < runMs) state.phase = "runup";
    applyKickerMotion(state.kicker, {
      elapsed,
      runMs,
      kickMs,
      runFrom,
      runTo,
      runDist,
      approach,
      side: "cpu",
    });

    if (state.diveLocked && pending.result && elapsed >= kickerBallLaunchElapsed(runMs, kickMs, approach.kickStyle)) {
      launchBall(now, pending);
      state.phase = "flight";
      showControls("none");
      setPrompt(pending.result.saved ? "セーブチャンス！" : "来る！");
    }
  }

  // ダイブが決まったらキーパーを伸ばす（飛翔前から）
  if (state.diveLocked) {
    const diveT = clamp((elapsed - aimOpen) / (runMs + kickMs * 0.5 - aimOpen), 0, 1);
    if (!state.ball.airborne) state.keeperProgress = diveT * 0.85;
  }

  if (state.diveLocked && state.ball.airborne && pending.result) {
    const flightElapsed = now - pending.flightStartedAt;
    const u = clamp(flightElapsed / flightMs, 0, 1);
    const result = pending.result;
    const end = pending.end;
    const pos = sampleFlightPosition(ballSpot, end, pending.postHit, result, u, state.h);
    if (result.post && (pos.atImpact || u >= 0.52) && !pending.postClangPlayed) {
      pending.postClangPlayed = true;
      playPostHit(result.post);
    }
    state.phase = "flight";
    state.ball.t = u;
    state.ball.x = pos.x;
    state.ball.y = pos.y;
    state.ball.scale = flightBallScale(u, result, pos.scaleMul ?? 1);
    state.ball.spinY = u * pending.spinYaw * (pos.spinMul ?? 1);
    state.ball.spinX = u * pending.spinPitch * (pos.spinMul ?? 1);
    state.ball.trail.push({
      x: state.ball.x,
      y: state.ball.y,
      a: 1,
      spinY: state.ball.spinY,
      spinX: state.ball.spinX,
      scale: state.ball.scale,
    });
    if (state.ball.trail.length > 8) state.ball.trail.shift();

    applyKickerMotion(state.kicker, {
      elapsed: runMs + kickMs,
      runMs,
      kickMs,
      runFrom,
      runTo,
      runDist,
      approach,
      flightElapsed,
      airborne: true,
      side: "cpu",
    });
    state.keeperProgress = clamp(0.85 + u * 0.15, 0, 1);

    if (u >= 1) {
      state.ball.x = end.x;
      state.ball.y = end.y;
      state.ball.t = 1;
      state.keeperProgress = 1;
      const resultFinal = pending.result;
      state.pendingStrike = null;
      finishKick(resultFinal, "cpu");
      return;
    }
  }

  requestAnimationFrame(stepCpuShot);
}

/** クリック後：ホイッスル → キーパーフェイント中にキッカー助走 */
function signalAndStartRunup(kind) {
  if (state.whistlePending) return;
  if (kind === "shoot" && !(state.phase === "ready" && state.turn === "you-shoot")) return;
  if (kind === "save" && !(state.phase === "ready-save" && state.turn === "you-save")) return;

  state.whistlePending = true;
  state.phase = "whistle";
  showControls("none");
  setPrompt("ホイッスル！");
  rollKeeperFeint();

  try {
    unlockAudio();
    playWhistle();
  } catch (_) {
    /* ignore */
  }

  const delay = 480;
  setTimeout(() => {
    state.whistlePending = false;
    try {
      if (kind === "shoot") startPlayerRunup();
      else startCpuRunup();
    } catch (err) {
      console.error(err);
      state.phase = kind === "shoot" ? "ready" : "ready-save";
      showControls(kind === "shoot" ? "ready" : "ready-save");
    }
  }, delay);
}

/** プレイヤー：クリックで助走開始 */
function startPlayerRunup() {
  if (state.turn !== "you-shoot") return;
  if (state.phase !== "ready" && state.phase !== "whistle") return;

  const isYou = true;
  const approach = state.approach?.from ? state.approach : rollApproach(true);
  state.approach = approach;
  const runFrom = { ...approach.from };
  const runTo = { ...approach.to };
  const runDist = Math.hypot(runTo.x - runFrom.x, runTo.y - runFrom.y);
  const ballSpot = penaltyLayout().spot;

  const { runMs, kickMs } = strikeTiming(runDist, approach.kickStyle);
  const flightMs = 820;
  // 狙いクリック受付：助走終盤〜キック接触あたり
  const aimOpen = runMs * 0.72;
  const aimClose = runMs + kickMs * 0.75;
  const perfectHit = runMs + kickMs * 0.5;

  state.phase = "runup";
  state.aimLocked = false;
  state.pointerAim = null;
  state.pendingStrike = {
    mode: "shoot",
    runFrom,
    runTo,
    runDist,
    runMs,
    kickMs,
    flightMs,
    aimOpen,
    aimClose,
    perfectHit,
    ballSpot,
    approach,
    started: performance.now(),
    result: null,
    end: null,
    spinYaw: 0,
    spinPitch: 0,
    flightStartedAt: 0,
  };

  state.ball = {
    x: ballSpot.x,
    y: ballSpot.y,
    start: ballSpot,
    end: ballSpot,
    t: 0,
    scale: 1,
    spinY: 0,
    spinX: 0,
    trail: [],
    airborne: false,
  };
  state.kicker = {
    side: "you",
    x: runFrom.x,
    y: runFrom.y,
    run: 0,
    stride: 0,
    kick: 0,
    pose: "run",
    facing: approach.facing,
    idlePose: approach.idlePose,
    kickStyle: approach.kickStyle,
  };
  state.keeperProgress = 0;
  showControls("none");
  setPrompt("助走！キックの瞬間にゴールをクリック");

  requestAnimationFrame(stepPlayerShot);
}

function lockPlayerAim(clientX, clientY, elapsed) {
  const pending = state.pendingStrike;
  if (!pending || pending.mode !== "shoot" || state.aimLocked) return;
  if (elapsed < pending.aimOpen || elapsed > pending.aimClose) return;

  const { aim, inside } = aimFromClient(clientX, clientY);
  const timingErr = Math.abs(elapsed - pending.perfectHit) / (pending.kickMs * 0.55);
  const power = inside ? clamp(0.98 - timingErr * 0.55, 0.4, 1) : 0.25;

  state.aim = aim;
  state.aimLocked = true;
  state.pointerAim = aim;

  const dive = cpuKeeperGuess(playerAimHistory);
  playerAimHistory.push({ ...aim });

  let result = resolveShot(aim, power, dive);
  if (!inside) {
    result = { ...result, onTarget: false, saved: false, post: null, postIn: false, postScatter: null, goal: false };
  }
  applyKeeperDive(result.dive);
  state.shot = result;
  pending.result = result;
  bindFlightPath(pending, result);
  const dx = pending.end.x - pending.ballSpot.x;
  const dy = pending.end.y - pending.ballSpot.y;
  const dist = Math.hypot(dx, dy) || 1;
  pending.spinYaw = (dx / dist) * Math.PI * 5.2;
  pending.spinPitch = (dy / dist) * Math.PI * 3.4 + Math.PI * 2.2;

  showControls("none");
  setPrompt(inside ? "シュート！" : "枠を外した！");
}

function autoLockMissedAim(elapsed) {
  const pending = state.pendingStrike;
  if (!pending || pending.mode !== "shoot" || state.aimLocked) return;

  const dive = cpuKeeperGuess(playerAimHistory);
  let aim = state.pointerAim || { x: 0.5, y: 0.5 };
  let inside = !!state.pointerAim;
  const power = inside ? 0.45 : 0.2;
  state.aim = aim;
  state.aimLocked = true;

  let result = resolveShot(aim, power, dive);
  if (!inside) {
    result = { ...result, onTarget: false, saved: false, post: null, postIn: false, postScatter: null, goal: false };
  }
  playerAimHistory.push({ ...aim });
  applyKeeperDive(result.dive);
  state.shot = result;
  pending.result = result;
  bindFlightPath(pending, result);
  const dx = pending.end.x - pending.ballSpot.x;
  const dy = pending.end.y - pending.ballSpot.y;
  const dist = Math.hypot(dx, dy) || 1;
  pending.spinYaw = (dx / dist) * Math.PI * 5.2;
  pending.spinPitch = (dy / dist) * Math.PI * 3.4 + Math.PI * 2.2;
  showControls("none");
  setPrompt(inside ? "タイミング遅れ…" : "枠を外した！");
}

function stepPlayerShot(now) {
  const pending = state.pendingStrike;
  if (!pending) return;

  const {
    runFrom,
    runTo,
    runDist,
    runMs,
    kickMs,
    flightMs,
    aimOpen,
    aimClose,
    ballSpot,
    approach,
  } = pending;
  const elapsed = now - pending.started;

  if (!state.aimLocked && elapsed >= aimOpen && elapsed <= aimClose) {
    if (state.phase !== "aim-click") {
      state.phase = "aim-click";
      showControls("aim-click");
      setPrompt("今だ！ゴールをクリック");
    }
  }

  if (!state.aimLocked && elapsed > aimClose) {
    autoLockMissedAim(elapsed);
  }

  // 助走〜キック動作
  if (!state.ball.airborne) {
    if (state.phase !== "aim-click" && elapsed < runMs) state.phase = "runup";
    applyKickerMotion(state.kicker, {
      elapsed,
      runMs,
      kickMs,
      runFrom,
      runTo,
      runDist,
      approach,
      side: "you",
    });

    if (state.aimLocked && pending.result && elapsed >= kickerBallLaunchElapsed(runMs, kickMs, approach.kickStyle)) {
      launchBall(now, pending);
      state.phase = "flight";
      showControls("none");
    }
  }

  if (state.aimLocked && state.ball.airborne && pending.result) {
    const flightElapsed = now - pending.flightStartedAt;
    const u = clamp(flightElapsed / flightMs, 0, 1);
    const result = pending.result;
    const end = pending.end;
    const pos = sampleFlightPosition(ballSpot, end, pending.postHit, result, u, state.h);
    if (result.post && (pos.atImpact || u >= 0.52) && !pending.postClangPlayed) {
      pending.postClangPlayed = true;
      playPostHit(result.post);
    }
    state.phase = "flight";
    state.ball.t = u;
    state.ball.x = pos.x;
    state.ball.y = pos.y;
    state.ball.scale = flightBallScale(u, result, pos.scaleMul ?? 1);
    state.ball.spinY = u * pending.spinYaw * (pos.spinMul ?? 1);
    state.ball.spinX = u * pending.spinPitch * (pos.spinMul ?? 1);
    state.ball.trail.push({
      x: state.ball.x,
      y: state.ball.y,
      a: 1,
      spinY: state.ball.spinY,
      spinX: state.ball.spinX,
      scale: state.ball.scale,
    });
    if (state.ball.trail.length > 8) state.ball.trail.shift();

    applyKickerMotion(state.kicker, {
      elapsed: runMs + kickMs,
      runMs,
      kickMs,
      runFrom,
      runTo,
      runDist,
      approach,
      flightElapsed,
      airborne: true,
      side: "you",
    });
    state.keeperProgress = clamp((u - 0.08) / 0.65, 0, 1);

    if (u >= 1) {
      state.ball.x = end.x;
      state.ball.y = end.y;
      state.ball.t = 1;
      state.keeperProgress = 1;
      const resultFinal = pending.result;
      state.pendingStrike = null;
      finishKick(resultFinal, "you");
      return;
    }
  }

  requestAnimationFrame(stepPlayerShot);
}

function finishKick(result, shooter) {
  const key = shooter === "you" ? "you" : "cpu";
  const outcome = result.goal ? "goal" : "miss";
  state.history[key].push(outcome);
  const wood = result.post === "bar" ? "バー" : "ポスト";
  if (result.goal) {
    state.scores[key] += 1;
    state.flash = 1;
    state.crowdPulse = 1;
    // ゴールネットは揺らさない
    // 自軍ゴールは歓声、相手ゴールは残念な声
    if (shooter === "you") playCheer();
    else playMiss();
    if (result.post) {
      if (result.post === "bar") {
        setPrompt(
          shooter === "you" ? "バーに当てて決めた" : "バーに当たって決められた",
          { result: true }
        );
      } else {
        setPrompt(
          shooter === "you" ? "ポストに当てて決めた" : "ポストに当たって決められた…",
          { result: true }
        );
      }
    } else {
      setPrompt(shooter === "you" ? "ゴーール！！" : "決められた…", { result: true });
    }
  } else if (result.saved) {
    state.flash = 0.45;
    // 自軍キーパーのセーブは歓声
    if (shooter === "cpu") playCheer();
    setPrompt(shooter === "you" ? "阻まれた！" : "セーブ！", { result: true });
  } else if (result.post) {
    state.flash = 0.7;
    // 金属音は飛翔中に再生済み。ここでは反応のみ
    playMiss();
    setPrompt(`${wood}に阻まれた！`, { result: true });
  } else {
    state.flash = 0.45;
    playMiss();
    setPrompt(shooter === "you" ? "枠を外した！" : "外した！", { result: true });
  }

  updateHud();
  state.phase = "result-beat";

  setTimeout(() => {
    state.ball = null;
    state.kicker = null;
    state.pendingStrike = null;
    state.aimLocked = false;
    state.diveLocked = false;
    state.pointerAim = null;
    advanceTurn(shooter);
  }, 1100);
}

function kicksRemaining(side) {
  if (state.suddenDeath) return 0;
  return 5 - state.history[side].length;
}

function maxPossible(side) {
  return state.scores[side] + kicksRemaining(side);
}

function checkEarlyEnd() {
  if (state.suddenDeath) return null;
  if (state.history.you.length < 5 || state.history.cpu.length < 5) {
    if (state.scores.you > maxPossible("cpu")) return "you";
    if (state.scores.cpu > maxPossible("you")) return "cpu";
  }
  return null;
}

function advanceTurn(lastShooter) {
  if (state.suddenDeath) {
    if (state.history.you.length === state.history.cpu.length) {
      if (state.scores.you !== state.scores.cpu) {
        endMatch(state.scores.you > state.scores.cpu ? "you" : "cpu");
        return;
      }
      state.kickIndex += 1;
      beginYouShoot();
      return;
    }
    if (lastShooter === "you") {
      beginYouSave();
      return;
    }
    if (state.scores.you !== state.scores.cpu) {
      endMatch(state.scores.you > state.scores.cpu ? "you" : "cpu");
      return;
    }
    state.kickIndex += 1;
    beginYouShoot();
    return;
  }

  const early = checkEarlyEnd();
  if (early) {
    endMatch(early);
    return;
  }

  if (lastShooter === "you") {
    beginYouSave();
    return;
  }

  state.kickIndex += 1;

  if (state.history.you.length >= 5 && state.history.cpu.length >= 5) {
    if (state.scores.you !== state.scores.cpu) {
      endMatch(state.scores.you > state.scores.cpu ? "you" : "cpu");
      return;
    }
    state.suddenDeath = true;
    state.kickIndex = 0;
    setPrompt("サドンデス！");
    setTimeout(() => beginYouShoot(), 700);
    return;
  }

  beginYouShoot();
}

function endMatch(winner) {
  state.mode = "result";
  clearFixedGoal();
  state.phase = "idle";
  els.controls.hidden = true;
  els.result.hidden = false;
  els.resultKicker.textContent = state.suddenDeath ? "SUDDEN DEATH" : "MATCH OVER";
  els.resultTitle.textContent = winner === "you" ? "歓喜" : "残念";
  els.resultTitle.style.color = winner === "you" ? "var(--accent)" : "var(--danger)";
  els.resultScore.textContent = `${state.scores.you} - ${state.scores.cpu}`;
  setPrompt(winner === "you" ? "PK戦を制した！" : "次こそ決める。");
  if (winner === "you") playVictoryCelebration();
  else playMiss();
}

function onPointerDown(e) {
  if (state.mode !== "play") return;
  if (e.target && e.target.closest && e.target.closest("button")) return;
  unlockAudio();

  const point = e.touches ? e.touches[0] : e;
  if (!point) return;

  if (state.phase === "ready" && state.turn === "you-shoot") {
    e.preventDefault();
    signalAndStartRunup("shoot");
    return;
  }

  if (state.phase === "ready-save" && state.turn === "you-save") {
    e.preventDefault();
    signalAndStartRunup("save");
    return;
  }

  if (state.phase === "aim-click" && state.turn === "you-shoot" && state.pendingStrike) {
    e.preventDefault();
    const elapsed = performance.now() - state.pendingStrike.started;
    lockPlayerAim(point.clientX, point.clientY, elapsed);
    return;
  }

  if (state.phase === "dive-click" && state.turn === "you-save" && state.pendingStrike) {
    e.preventDefault();
    const elapsed = performance.now() - state.pendingStrike.started;
    lockPlayerDive(point.clientX, point.clientY, elapsed);
  }
}

function onPointerMove(e) {
  if (state.mode !== "play") return;
  if (state.phase !== "aim-click" && state.phase !== "dive-click") return;
  const point = e.touches ? e.touches[0] : e;
  if (!point) return;
  const { aim, inside } = aimFromClient(point.clientX, point.clientY);
  state.pointerAim = inside ? aim : null;
  if (inside) state.aim = aim;
}

function activeVenue() {
  if (!state.scene) state.scene = buildScene(state.oppKit);
  return state.scene;
}

function drawSky() {
  const { w, h } = state;
  const v = activeVenue();
  const grad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  grad.addColorStop(0, v.sky[0]);
  grad.addColorStop(0.55, v.sky[1]);
  grad.addColorStop(1, v.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // スタジアム外周（芝の外）
  ctx.fillStyle = v.apron;
  ctx.fillRect(0, h * 0.16, w, h);

  if (v.sun) {
    const sx = w * (v.id === "golden" ? 0.82 : 0.78);
    const sy = h * (v.id === "noon" ? 0.07 : 0.09);
    const sun = ctx.createRadialGradient(sx, sy, 2, sx, sy, v.id === "noon" ? 36 : 48);
    sun.addColorStop(0, v.id === "golden" ? "rgba(255,200,100,0.85)" : "rgba(255,250,220,0.9)");
    sun.addColorStop(0.35, v.id === "golden" ? "rgba(255,140,60,0.35)" : "rgba(255,240,200,0.25)");
    sun.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(sx - 60, sy - 60, 120, 120);
  }

  drawStadiumLights(v);

  const haze = ctx.createRadialGradient(w * 0.5, h * 0.04, 8, w * 0.5, h * 0.2, w * 0.55);
  haze.addColorStop(0, v.haze);
  haze.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, w, h * 0.45);

  if (v.lights) {
    for (const side of [-1, 1]) {
      const lx = w * 0.5 + side * w * 0.36;
      const beam = ctx.createRadialGradient(lx, h * 0.02, 2, lx, h * 0.16, w * 0.2);
      beam.addColorStop(0, v.haze);
      beam.addColorStop(0.4, "rgba(255,255,255,0.04)");
      beam.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = beam;
      ctx.fillRect(lx - w * 0.2, 0, w * 0.4, h * 0.32);
    }
  }
}

function crowdHash(col, row, salt = 0) {
  return ((col * 73856093) ^ (row * 19349663) ^ salt) >>> 0;
}

/** スタジアム上部の照明塔シルエット */
function drawStadiumLights(v) {
  const { w, h } = state;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  for (const px of [0.06, 0.94]) {
    const x = w * px;
    ctx.fillRect(x - 3, h * 0.01, 6, h * 0.09);
    ctx.beginPath();
    ctx.moveTo(x - 14, h * 0.1);
    ctx.lineTo(x + 14, h * 0.1);
    ctx.lineTo(x + 9, h * 0.035);
    ctx.lineTo(x - 9, h * 0.035);
    ctx.closePath();
    ctx.fill();
    if (v.lights) {
      const lx = x + (px < 0.5 ? 8 : -8);
      const beam = ctx.createRadialGradient(lx, h * 0.05, 1, lx, h * 0.18, w * 0.22);
      beam.addColorStop(0, "rgba(255,248,220,0.22)");
      beam.addColorStop(0.35, "rgba(255,248,220,0.06)");
      beam.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = beam;
      ctx.fillRect(lx - w * 0.22, 0, w * 0.44, h * 0.35);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
    }
  }
}

/** 観客席ブロック（通路の間） */
function standBlocks() {
  return [
    { x0: 0.015, x1: 0.23 },
    { x0: 0.27, x1: 0.48 },
    { x0: 0.52, x1: 0.73 },
    { x0: 0.77, x1: 0.985 },
  ];
}

/** 縦通路の中心（画面幅比率） */
function standAisleCenters() {
  return [0.25, 0.5, 0.75];
}

function drawStandAisles(standTop, standBottom, tierH, tierCount) {
  const { w } = state;
  const aisleHalf = w * 0.024;

  for (const ax of standAisleCenters()) {
    const cx = w * ax;
    const grad = ctx.createLinearGradient(cx - aisleHalf, 0, cx + aisleHalf, 0);
    grad.addColorStop(0, "rgba(24,28,34,0.98)");
    grad.addColorStop(0.5, "rgba(42,48,56,0.95)");
    grad.addColorStop(1, "rgba(24,28,34,0.98)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - aisleHalf, standTop, aisleHalf * 2, standBottom - standTop);

    // 段ごとの階段
    for (let t = 0; t < tierCount; t++) {
      const ty = standTop + (t + 1) * tierH;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(cx - aisleHalf, ty - 2.5, aisleHalf * 2, 2.5);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(cx - aisleHalf, ty - 2.5, aisleHalf * 2, 0.8);
    }

    // 通路手すり
    ctx.fillStyle = "rgba(180,190,200,0.35)";
    ctx.fillRect(cx - aisleHalf - 1.5, standTop, 2, standBottom - standTop);
    ctx.fillRect(cx + aisleHalf - 0.5, standTop, 2, standBottom - standTop);
  }

  // 横通路（中段・上段）
  for (const tier of [2, 5]) {
    const wy = standTop + tier * tierH;
    ctx.fillStyle = "rgba(32,38,46,0.92)";
    ctx.fillRect(0, wy, w, tierH * 0.92);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, wy + tierH * 0.88, w, 2);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, wy + tierH * 0.45);
    ctx.lineTo(w, wy + tierH * 0.45);
    ctx.stroke();
  }
}

/** 観客席とピッチの境界フェンス */
function drawStandFence(fenceY) {
  const { w } = state;
  const fenceH = 30;
  const top = fenceY - fenceH;
  const postW = 5.5;
  const spacing = 34;

  // フェンス台座
  ctx.fillStyle = "#2a3038";
  ctx.fillRect(0, top - 9, w, 9);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, top - 9, w, 2.5);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(0, top - 1, w, 1.5);

  // 支柱
  for (let x = 0; x <= w + spacing; x += spacing) {
    const px = x - postW * 0.5;
    const grad = ctx.createLinearGradient(px, top, px + postW, top);
    grad.addColorStop(0, "#4a525a");
    grad.addColorStop(0.4, "#a8b2ba");
    grad.addColorStop(1, "#3a424a");
    ctx.fillStyle = grad;
    ctx.fillRect(px, top - 3, postW, fenceH + 6);
  }

  // 横バー（4本）
  for (const ry of [0.16, 0.38, 0.62, 0.86]) {
    const ryPx = top + fenceH * ry;
    ctx.strokeStyle = "#c0c8d0";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(0, ryPx);
    ctx.lineTo(w, ryPx);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ryPx + 1.6);
    ctx.lineTo(w, ryPx + 1.6);
    ctx.stroke();
  }

  // 上縁キャップ
  ctx.fillStyle = "#d0d8e0";
  ctx.fillRect(0, top - 3, w, 5);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(0, top - 3, w, 2);

  // ピッチ側の影
  const sh = ctx.createLinearGradient(0, fenceY, 0, fenceY + 16);
  sh.addColorStop(0, "rgba(0,0,0,0.36)");
  sh.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sh;
  ctx.fillRect(0, fenceY - 1, w, 16);
}

function drawCrowdSpectator(x, shoulderY, scale, color, hash, cheer, depth) {
  const s = scale;
  const skin =
    hash % 7 === 0 ? "#f2dcc8" : hash % 5 === 0 ? "#e8c4a8" : hash % 3 === 0 ? "#d9b896" : "#cfa882";
  const pants = hash % 4 === 0 ? "#243048" : "#1a2030";
  const hair = hash % 2 === 0 ? "#2a2018" : "#141010";
  const limbW = Math.max(1.6, s * 0.34);
  const pose = cheer ? 2 : hash % 4;

  ctx.globalAlpha = lerp(0.68, 0.98, 1 - depth * 0.3) + (hash % 7) * 0.008;

  const headR = s * 0.92;
  const headY = shoulderY - headR * 1.15;
  const neckBot = shoulderY - s * 0.05;
  const hipY = shoulderY + s * (cheer ? 2.6 : 2.1);
  const footY = hipY + s * (cheer ? 2.2 : 1.35);
  const shoulderW = s * 1.25;

  // 脚（座席／立ち上がり）
  if (cheer) {
    drawLimb(x - s * 0.42, hipY, x - s * 0.48, footY, limbW, pants);
    drawLimb(x + s * 0.42, hipY, x + s * 0.48, footY, limbW, pants);
  } else {
    const kneeY = hipY + s * 0.55;
    drawLimb(x - s * 0.38, hipY, x - s * 0.72, kneeY, limbW, pants);
    drawLimb(x - s * 0.72, kneeY, x - s * 0.62, footY, limbW * 0.92, pants);
    drawLimb(x + s * 0.38, hipY, x + s * 0.72, kneeY, limbW, pants);
    drawLimb(x + s * 0.72, kneeY, x + s * 0.62, footY, limbW * 0.92, pants);
  }

  // 胴体（ジャージ）
  const torsoGrad = ctx.createLinearGradient(x - s, shoulderY, x + s, hipY);
  torsoGrad.addColorStop(0, color);
  torsoGrad.addColorStop(1, shadeColor(color, -18));
  ctx.fillStyle = torsoGrad;
  ctx.beginPath();
  ctx.moveTo(x - shoulderW * 0.42, shoulderY);
  ctx.lineTo(x + shoulderW * 0.42, shoulderY);
  ctx.lineTo(x + shoulderW * 0.32, hipY);
  ctx.lineTo(x - shoulderW * 0.32, hipY);
  ctx.closePath();
  ctx.fill();

  // 腕
  const handY = cheer ? headY - s * 0.35 : hipY - s * 0.1;
  if (cheer) {
    drawLimb(x - shoulderW * 0.38, shoulderY + s * 0.1, x - s * 1.05, handY, limbW, color);
    drawLimb(x - s * 1.05, handY, x - s * 1.15, handY - s * 0.5, limbW * 0.85, skin);
    drawLimb(x + shoulderW * 0.38, shoulderY + s * 0.1, x + s * 1.05, handY, limbW, color);
    drawLimb(x + s * 1.05, handY, x + s * 1.15, handY - s * 0.5, limbW * 0.85, skin);
  } else if (pose === 1) {
    drawLimb(x - shoulderW * 0.38, shoulderY + s * 0.15, x - s * 0.55, headY + s * 0.2, limbW, color);
    drawLimb(x + shoulderW * 0.38, shoulderY + s * 0.15, x + s * 0.85, hipY, limbW, color);
  } else if (pose === 3) {
    drawLimb(x - shoulderW * 0.38, shoulderY + s * 0.2, x + s * 0.15, shoulderY + s * 0.65, limbW, color);
    drawLimb(x + shoulderW * 0.38, shoulderY + s * 0.2, x - s * 0.15, shoulderY + s * 0.65, limbW, color);
  } else {
    drawLimb(x - shoulderW * 0.4, shoulderY + s * 0.12, x - s * 0.82, hipY - s * 0.05, limbW, color);
    drawLimb(x + shoulderW * 0.4, shoulderY + s * 0.12, x + s * 0.82, hipY - s * 0.05, limbW, color);
  }

  // 首
  drawLimb(x, headY + headR * 0.85, x, neckBot, limbW * 0.78, skin);

  // 頭
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  ctx.fillStyle = skin;
  ctx.fill();

  // 髪／帽子
  if (hash % 6 === 0) {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(x, headY - headR * 0.12, headR * 1.02, Math.PI, 0);
    ctx.fill();
  } else if (hash % 9 === 0) {
    ctx.fillStyle = color;
    ctx.fillRect(x - headR * 0.9, headY - headR * 1.15, headR * 1.8, headR * 0.42);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(x - headR * 0.9, headY - headR * 0.78, headR * 1.8, headR * 0.12);
  } else if (hash % 11 === 0) {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(x, headY - headR * 0.05, headR * 1.05, headR * 0.55, 0, Math.PI, 0);
    ctx.fill();
  }

  // 顔（手前の観客ほど詳しく）
  if (s > 4.2) {
    ctx.fillStyle = "rgba(40,30,25,0.85)";
    ctx.beginPath();
    ctx.arc(x - headR * 0.32, headY + headR * 0.08, headR * 0.11, 0, Math.PI * 2);
    ctx.arc(x + headR * 0.32, headY + headR * 0.08, headR * 0.11, 0, Math.PI * 2);
    ctx.fill();
    if (cheer && s > 4.8) {
      ctx.beginPath();
      ctx.ellipse(x, headY + headR * 0.42, headR * 0.22, headR * 0.14, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(60,25,25,0.7)";
      ctx.fill();
    }
  }
}

/** 色を少し暗く／明るく */
function shadeColor(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(((n >> 16) & 255) + amount, 0, 255);
  const g = clamp(((n >> 8) & 255) + amount, 0, 255);
  const b = clamp((n & 255) + amount, 0, 255);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function drawCrowd() {
  const { w } = state;
  const v = activeVenue();
  const g = goalRect();
  const goalLineY = g.y + g.h;
  const fenceY = goalLineY;
  const pulse = state.crowdPulse;
  const pulseAmt = 0.05 * pulse;
  const seats = v.seats;
  const now = performance.now();
  const standTop = 0;
  const standBottom = fenceY - 32;
  const blocks = standBlocks();

  // スタジアムボウル（コンクリート）
  const bowlGrad = ctx.createLinearGradient(0, standTop, 0, standBottom);
  bowlGrad.addColorStop(0, "rgba(10,12,18,0.96)");
  bowlGrad.addColorStop(0.45, "rgba(16,20,28,0.94)");
  bowlGrad.addColorStop(1, "rgba(22,26,34,0.9)");
  ctx.fillStyle = bowlGrad;
  ctx.fillRect(0, standTop, w, standBottom - standTop);

  // 左右の曲線
  ctx.fillStyle = "rgba(8,10,14,0.55)";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    if (side < 0) {
      ctx.moveTo(0, standBottom);
      ctx.quadraticCurveTo(w * 0.08, standBottom * 0.55, w * 0.22, standTop);
      ctx.lineTo(0, standTop);
    } else {
      ctx.moveTo(w, standBottom);
      ctx.quadraticCurveTo(w * 0.92, standBottom * 0.55, w * 0.78, standTop);
      ctx.lineTo(w, standTop);
    }
    ctx.closePath();
    ctx.fill();
  }

  const tierCount = 7;
  const tierH = (standBottom - standTop) / tierCount;
  const walkwayTiers = new Set([2, 5]);

  // 段差
  for (let t = 1; t < tierCount; t++) {
    const ty = standTop + t * tierH;
    ctx.fillStyle = "rgba(0,0,0,0.26)";
    ctx.fillRect(0, ty, w, 3);
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.fillRect(0, ty + 3, w, 1.5);
  }

  drawStandAisles(standTop, standBottom, tierH, tierCount);

  // ブロックごとに観客を配置（通路を避ける）
  for (let tier = 0; tier < tierCount; tier++) {
    if (walkwayTiers.has(tier)) continue;

    const depth = tier / (tierCount - 1);
    const rowY = standTop + tier * tierH + tierH * 0.14;
    const rowH = tierH * 0.78;
    const headR = lerp(3.2, 5.8, 1 - depth);
    const wave = pulseAmt * lerp(10, 28, 1 - depth);
    const colsPerBlock = Math.floor(
      lerp(4, 8, 1 - depth * 0.2) * (state.w < 560 ? 0.72 : 1)
    );

    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b];
      const blockW = (block.x1 - block.x0) * w;

      for (let col = 0; col < colsPerBlock; col++) {
        const hash = crowdHash(col, tier, b * 31 + 17);
        const pad = blockW * 0.08;
        const x =
          w * block.x0 +
          pad +
          (col / Math.max(1, colsPerBlock - 1)) * (blockW - pad * 2) +
          ((hash % 5) - 2) * 0.5;
        const bob =
          Math.sin(col * 0.45 + tier * 0.85 + b + now * 0.0025 + pulse * 5) * wave +
          Math.sin(col * 0.13 + now * 0.001) * wave * 0.3;
        const shoulderY = rowY + rowH * 0.22 + bob + (hash % 6) * 0.4;

        const color = seats[(hash + tier + b) % seats.length];
        const cheer =
          (pulse > 0.06 && hash % 4 === 0) ||
          (tier >= tierCount - 2 && pulse > 0.03 && hash % 3 === 0);
        drawCrowdSpectator(x, shoulderY, headR, color, hash, cheer, depth);

        if (tier >= tierCount - 2 && hash % 12 === 0) {
          ctx.globalAlpha = 0.82;
          ctx.fillStyle = seats[(hash + 2) % seats.length];
          ctx.fillRect(x + headR * 0.6, shoulderY - headR * 1.8, headR * 3, headR * 1.6);
        }
      }
    }
  }
  ctx.globalAlpha = 1;

  const lip = ctx.createLinearGradient(0, standBottom - tierH, 0, standBottom);
  lip.addColorStop(0, "rgba(0,0,0,0)");
  lip.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = lip;
  ctx.fillRect(0, standBottom - tierH * 0.6, w, tierH * 0.6);

  if (pulse > 0.05) {
    ctx.fillStyle = `rgba(255,255,255,${0.03 + pulse * 0.08})`;
    ctx.fillRect(0, 0, w, standBottom);
  }

  drawStandFence(fenceY);
}

function drawWeatherOverlay() {
  const { w, h } = state;
  const v = activeVenue();
  if (v.fog > 0.01) {
    ctx.fillStyle = `rgba(200,210,220,${v.fog * 0.55})`;
    ctx.fillRect(0, 0, w, h * 0.55);
    const mist = ctx.createLinearGradient(0, h * 0.12, 0, h * 0.4);
    mist.addColorStop(0, `rgba(220,230,240,${v.fog * 0.35})`);
    mist.addColorStop(1, "rgba(220,230,240,0)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, h * 0.1, w, h * 0.35);
  }
  if (v.rain > 0.05) {
    const now = performance.now();
    ctx.strokeStyle = `rgba(200,220,240,${0.12 + v.rain * 0.18})`;
    ctx.lineWidth = 1.2;
    const n = Math.min(40, Math.floor(50 + v.rain * 70));
    for (let i = 0; i < n; i++) {
      const x = ((i * 97 + now * 0.35) % (w + 40)) - 20;
      const y = ((i * 53 + now * 0.9) % (h * 0.7));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 12 + v.rain * 6);
      ctx.stroke();
    }
  }
}

function goalDepth() {
  const g = goalRect();
  // 実寸: 高さ2.44m / 奥行き約2.0m。正面寄りカメラでは大きく短縮される
  return Math.min(46, g.h * 0.34);
}

/** ゴール奥枠の透視比率（drawGoal の back と共通） */
const GOAL_DEPTH_IN = 0.42; // 奥へ入るほど内側へ
const GOAL_DEPTH_UP = 0.38; // 奥へ入るほど上へ（0.32+0.06）

/** ゴール奥行きラインと共通の消失点 Y（ピッチ縦ラインもここへ収束） */
function goalVanishY() {
  const g = goalRect();
  const gy = g.y + g.h;
  // 左右の奥下端を延長した交点（中央）
  return gy - (g.w * GOAL_DEPTH_UP) / (GOAL_DEPTH_IN * 2);
}

/** ゴール奥枠の矩形（正面枠 g に対する奥） */
function goalBackRect() {
  const g = goalRect();
  const depth = goalDepth();
  return {
    x: g.x + depth * GOAL_DEPTH_IN,
    y: g.y - depth * 0.32,
    w: g.w - depth * GOAL_DEPTH_IN * 2,
    h: g.h - depth * 0.06,
  };
}

/** PKスポット・エリアの配置（実寸比: 6yd / 12ydスポット / 18yd） */
function penaltyLayout() {
  const { w, h } = state;
  const g = goalRect();
  const gy = g.y + g.h;
  const gCx = g.x + g.w * 0.5;
  const goalHalf = g.w * 0.5;
  // 実寸: スポットはゴールから11m。正面寄りカメラでは短縮しつつ、手前寄りに
  const spotY = gy + Math.min(g.h * 1.38, (h - gy) * 0.44);
  const spotFromGoal = Math.max(36, spotY - gy);
  // ゴールエリアは浅めだが、少し手前へ
  const sixY = gy + spotFromGoal * 0.3;
  // ペナ手前辺は画面のずっと手前まで
  const penY = Math.min(h * 0.96, Math.max(spotY + (h - spotY) * 0.78, gy + (h - gy) * 0.82));
  const penFarHalf = Math.min(goalHalf * 3.45, w * 0.52);
  // 実寸: ゴールエリア幅 18.32m / ゴール 7.32m ≒ 2.5倍
  const sixFarHalf = Math.min(goalHalf * 2.5, penFarHalf * 0.78);
  return {
    gy,
    gCx,
    spotY,
    penY,
    sixY,
    penFarHalf,
    sixFarHalf,
    spot: { x: w * 0.5, y: spotY },
  };
}

function drawPitch() {
  const { w, h } = state;
  const g = goalRect();
  const v = activeVenue();
  const layout = penaltyLayout();
  // ゴール裏の奥行きは無し／ゴールラインは画面端まで
  const goalLineY = layout.gy;
  const sideY = g.y + g.h * 0.55;
  const leftGL = 0;
  const rightGL = w;

  const grass = v.grass || ["#0f4f2c", "#146338", "#0b3a22"];
  const shift = (v.grassShift || 0) * 0.004;
  const grad = ctx.createLinearGradient(0, goalLineY, 0, h);
  grad.addColorStop(0, grass[0]);
  grad.addColorStop(0.28 + shift, grass[1]);
  grad.addColorStop(1, grass[2]);
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, sideY);
  ctx.lineTo(leftGL, goalLineY);
  ctx.lineTo(rightGL, goalLineY);
  ctx.lineTo(w, sideY);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, sideY);
  ctx.lineTo(leftGL, goalLineY);
  ctx.lineTo(rightGL, goalLineY);
  ctx.lineTo(w, sideY);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < 12; i++) {
    const y = goalLineY + i * ((h - goalLineY) / 11);
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)";
    ctx.fillRect(0, y, w, (h - goalLineY) / 11);
  }

  drawBoxLines();
  ctx.restore();

  const spot = layout.spot;
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(236,245,232,0.5)";
  ctx.fill();
}

/** ピッチ上のゴールエリア・ペナルティエリアライン */
function drawBoxLines() {
  const { w, h } = state;
  const layout = penaltyLayout();
  const { gy, gCx, penY, sixY, penFarHalf, sixFarHalf } = layout;
  const yVanish = goalVanishY();

  ctx.lineJoin = "round";
  ctx.lineCap = "butt";

  // ゴールラインはタッチライン間＝画面の左端から右端まで
  ctx.strokeStyle = "rgba(236,245,232,0.72)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, gy);
  ctx.lineTo(w, gy);
  ctx.stroke();

  function boxAt(y2, farHalf) {
    const scale = (y2 - yVanish) / (gy - yVanish);
    const nearHalf = farHalf * scale;
    return {
      y1: gy,
      y2,
      ox1: gCx - farHalf,
      ox2: gCx + farHalf,
      x1: gCx - nearHalf,
      x2: gCx + nearHalf,
    };
  }

  function strokeBox(box) {
    // ゴールライン辺は全幅線と重ねない（左右・手前の3辺だけ）
    ctx.beginPath();
    ctx.moveTo(box.ox1, box.y1);
    ctx.lineTo(box.x1, box.y2);
    ctx.lineTo(box.x2, box.y2);
    ctx.lineTo(box.ox2, box.y1);
    ctx.stroke();
  }

  // ゴールエリア（6ヤード）
  ctx.strokeStyle = "rgba(236,245,232,0.52)";
  ctx.lineWidth = 2.1;
  strokeBox(boxAt(sixY, sixFarHalf));

  // ペナルティエリア（18ヤード）
  const pen = boxAt(penY, penFarHalf);
  const frontThick = 8.4; // 手前辺は太い1本線
  const frontTop = pen.y2 - frontThick * 0.35;

  ctx.strokeStyle = "rgba(236,245,232,0.62)";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "butt";
  // 左右辺は手前辺の上端まで（手前辺と重ねない）
  ctx.beginPath();
  ctx.moveTo(pen.ox1, pen.y1);
  ctx.lineTo(pen.x1, frontTop);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pen.ox2, pen.y1);
  ctx.lineTo(pen.x2, frontTop);
  ctx.stroke();

  // 手前辺：strokeではなく塗り帯で確実に1本
  ctx.fillStyle = "rgba(236,245,232,0.78)";
  ctx.fillRect(pen.x1, frontTop, pen.x2 - pen.x1, frontThick);
}

function drawGoal() {
  const g = goalRect();
  const depth = goalDepth();
  // 透視: goalBackRect / GOAL_DEPTH_* と共通
  const back = goalBackRect();

  function lerp2(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  const fl = { x: g.x, y: g.y };
  const fr = { x: g.x + g.w, y: g.y };
  const bl = { x: back.x, y: back.y };
  const br = { x: back.x + back.w, y: back.y };
  const flb = { x: g.x, y: g.y + g.h };
  const frb = { x: g.x + g.w, y: g.y + g.h };
  const blb = { x: back.x, y: back.y + back.h };
  const brb = { x: back.x + back.w, y: back.y + back.h };

  // ゴール内の地面（少し暗い芝）
  const turf = ctx.createLinearGradient(0, g.y + g.h, 0, back.y + back.h + 18);
  turf.addColorStop(0, "rgba(8, 40, 22, 0.55)");
  turf.addColorStop(1, "rgba(6, 28, 16, 0.35)");
  ctx.fillStyle = turf;
  ctx.beginPath();
  ctx.moveTo(flb.x - 4, flb.y + 2);
  ctx.lineTo(frb.x + 4, frb.y + 2);
  ctx.lineTo(brb.x + 6, brb.y + 16);
  ctx.lineTo(blb.x - 6, blb.y + 16);
  ctx.closePath();
  ctx.fill();

  // 接地影
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.moveTo(flb.x - 10, flb.y + 5);
  ctx.lineTo(frb.x + 10, frb.y + 5);
  ctx.lineTo(brb.x + 14, brb.y + 20);
  ctx.lineTo(blb.x - 14, blb.y + 20);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  const shake = state.netShake || 0;
  const now = performance.now();
  const ix = g.x + (state.netImpact?.x ?? 0.5) * g.w;
  const iy = g.y + (state.netImpact?.y ?? 0.5) * g.h;
  // ゴール時：衝撃点から自然に波打つ
  const amp = shake * 14;

  function netOffset(px, py) {
    if (shake <= 0.01) return { dx: 0, dy: 0 };
    const dist = Math.hypot(px - ix, py - iy) / Math.max(g.w, g.h);
    const falloff = Math.exp(-dist * 2.8);
    const punch = Math.exp(-dist * 6.5) * shake;
    const wave = Math.sin(now / 42 - dist * 12) * amp * falloff;
    const wave2 = Math.cos(now / 52 - dist * 9) * amp * 0.55 * falloff;
    const ang = Math.atan2(py - iy || 0.001, px - ix || 0.001);
    const bulge = punch * 10;
    return {
      dx: wave * 0.5 + Math.cos(ang) * bulge,
      dy: wave2 + wave * 0.3 + Math.sin(ang) * bulge * 0.75,
    };
  }

  // たるみ（重力で中央が奥・下へ）＋揺れ中は少し膨らむ
  function sagPoint(p, u, v, amount) {
    const s = Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 1.05));
    const boom = 1 + shake * 0.55;
    const impactU = state.netImpact?.x ?? 0.5;
    const impactV = state.netImpact?.y ?? 0.5;
    const localPunch =
      shake *
      Math.exp(-((u - impactU) ** 2 * 16 + (v - impactV) ** 2 * 12)) *
      0.22;
    return {
      x:
        p.x +
        (g.x + g.w * 0.5 - p.x) * s * amount * 0.08 * boom +
        (u - 0.5) * localPunch * g.w * 0.04,
      y: p.y + s * amount * depth * (0.06 * boom + localPunch * 0.18),
    };
  }

  function facePoint(tl, tr, blp, brp, u, v, sagAmt) {
    const top = lerp2(tl, tr, u);
    const bot = lerp2(blp, brp, u);
    const p = lerp2(top, bot, v);
    return sagPoint(p, u, v, sagAmt);
  }

  // ゴール内部の陰影（奥行きの暗さ）
  const mouth = ctx.createRadialGradient(
    g.x + g.w * 0.5,
    g.y + g.h * 0.45,
    g.h * 0.1,
    g.x + g.w * 0.5,
    g.y + g.h * 0.5,
    g.w * 0.72
  );
  mouth.addColorStop(0, "rgba(0,0,0,0.02)");
  mouth.addColorStop(0.55, "rgba(0,0,0,0.14)");
  mouth.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = mouth;
  ctx.beginPath();
  ctx.moveTo(fl.x, fl.y);
  ctx.lineTo(fr.x, fr.y);
  ctx.lineTo(frb.x, frb.y);
  ctx.lineTo(flb.x, flb.y);
  ctx.closePath();
  ctx.fill();

  // 側面・奥面の暗い塗り
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.moveTo(fl.x, fl.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.lineTo(blb.x, blb.y);
  ctx.lineTo(flb.x, flb.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.moveTo(fr.x, fr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(brb.x, brb.y);
  ctx.lineTo(frb.x, frb.y);
  ctx.closePath();
  ctx.fill();

  const backShade = ctx.createLinearGradient(back.x, back.y, back.x, back.y + back.h);
  backShade.addColorStop(0, "rgba(210,220,210,0.07)");
  backShade.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = backShade;
  ctx.beginPath();
  ctx.moveTo(bl.x, bl.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(brb.x, brb.y);
  ctx.lineTo(blb.x, blb.y);
  ctx.closePath();
  ctx.fill();

  // 上面（バーから奥）の薄い影
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.beginPath();
  ctx.moveTo(fl.x, fl.y);
  ctx.lineTo(fr.x, fr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.fill();

  // —— ネットメッシュ（細かい六角） ——
  function strokeNetFace(tl, tr, blp, brp, cols, rows, sagAmt, alpha) {
    function pt(u, v) {
      let p = facePoint(tl, tr, blp, brp, clamp(u, 0, 1), clamp(v, 0, 1), sagAmt);
      const o = netOffset(p.x, p.y);
      return { x: p.x + o.dx, y: p.y + o.dy };
    }

    const ru = 0.52 / cols;
    const rv = 0.58 / rows;
    ctx.lineWidth = 0.7;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(232,238,230,${alpha * 0.85})`;

    // 扁平六角（flat-top）をレンガ積みで敷き詰め
    for (let j = 0; j < rows; j++) {
      const odd = j % 2;
      for (let i = -1; i <= cols; i++) {
        const cu = (i + 0.5 + odd * 0.5) / cols;
        const cv = (j + 0.5) / rows;
        if (cu < -0.08 || cu > 1.08 || cv < -0.05 || cv > 1.05) continue;

        const verts = [];
        for (let k = 0; k < 6; k++) {
          const ang = (Math.PI / 3) * k;
          verts.push(pt(cu + ru * Math.cos(ang), cv + rv * Math.sin(ang)));
        }
        ctx.beginPath();
        ctx.moveTo(verts[0].x, verts[0].y);
        for (let k = 1; k < 6; k++) ctx.lineTo(verts[k].x, verts[k].y);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  // 奥ネット（軽量メッシュ）
  strokeNetFace(bl, br, blb, brb, 18, 10, 0.7, 0.36);
  // 左側面ネット
  const leftBulge = {
    tl: fl,
    tr: { x: bl.x - depth * 0.05, y: bl.y + depth * 0.02 },
    bl: flb,
    br: { x: blb.x - depth * 0.07, y: blb.y + depth * 0.01 },
  };
  strokeNetFace(leftBulge.tl, leftBulge.tr, leftBulge.bl, leftBulge.br, 6, 10, 0.35, 0.24);
  // 右側面
  const rightBulge = {
    tl: fr,
    tr: { x: br.x + depth * 0.05, y: br.y + depth * 0.02 },
    bl: frb,
    br: { x: brb.x + depth * 0.07, y: brb.y + depth * 0.01 },
  };
  strokeNetFace(rightBulge.tl, rightBulge.tr, rightBulge.bl, rightBulge.br, 6, 10, 0.35, 0.24);
  // 天井ネット
  strokeNetFace(fl, fr, bl, br, 14, 5, 0.22, 0.18);

  // —— 奥のフレーム（細い白パイプ） ——
  function strokePipe(a, b, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  strokePipe(bl, br, 5, "#9aa498");
  strokePipe(blb, brb, 4.5, "#8e968b");
  strokePipe(bl, blb, 4.5, "#9aa498");
  strokePipe(br, brb, 4.5, "#8a9286");

  // 手前→奥の支柱・レール
  strokePipe(fl, bl, 3.2, "rgba(190,198,188,0.75)");
  strokePipe(fr, br, 3.2, "rgba(170,178,168,0.7)");
  strokePipe(flb, blb, 2.8, "rgba(160,168,158,0.55)");
  strokePipe(frb, brb, 2.8, "rgba(150,158,148,0.55)");
  // 上面サイドレール
  strokePipe(lerp2(fl, fr, 0.25), lerp2(bl, br, 0.25), 2, "rgba(200,208,198,0.35)");
  strokePipe(lerp2(fl, fr, 0.75), lerp2(bl, br, 0.75), 2, "rgba(200,208,198,0.35)");

  // —— 手前ポスト／クロスバー（円筒の白い柱） ——
  const postW = 11;
  const barH = 11;

  function drawPost(x, y, hgt, side) {
    // 接地の小さなベース
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(x + postW * 0.35, y + hgt + 3, postW * 0.7, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 奥面（暗）
    ctx.fillStyle = side < 0 ? "#b4beb4" : "#a8b2a8";
    ctx.fillRect(x + (side < 0 ? -2 : postW * 0.55), y, postW * 0.5, hgt);

    // 正面グラデ（ハイライト帯）
    const grad = ctx.createLinearGradient(x - 1, 0, x + postW + 1, 0);
    if (side < 0) {
      grad.addColorStop(0, "#c5cdc3");
      grad.addColorStop(0.22, "#f4f7f2");
      grad.addColorStop(0.45, "#ffffff");
      grad.addColorStop(0.72, "#d5ddd2");
      grad.addColorStop(1, "#9aa498");
    } else {
      grad.addColorStop(0, "#9aa498");
      grad.addColorStop(0.28, "#d5ddd2");
      grad.addColorStop(0.55, "#ffffff");
      grad.addColorStop(0.78, "#f4f7f2");
      grad.addColorStop(1, "#c5cdc3");
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    roundRectPath(x, y, postW, hgt, 3);
    ctx.fill();

    // 内側の影縁
    ctx.fillStyle = "rgba(40,50,40,0.18)";
    ctx.fillRect(side < 0 ? x + postW - 3 : x, y, 3, hgt);
  }

  drawPost(g.x - 3, g.y, g.h, -1);
  drawPost(g.x + g.w - postW + 3, g.y, g.h, 1);

  // クロスバー上面
  ctx.fillStyle = "#e8eee5";
  ctx.beginPath();
  ctx.moveTo(g.x - 4, g.y);
  ctx.lineTo(g.x + g.w + 4, g.y);
  ctx.lineTo(g.x + g.w - 2, g.y - barH * 0.62);
  ctx.lineTo(g.x + 2, g.y - barH * 0.62);
  ctx.closePath();
  ctx.fill();

  // クロスバー正面
  const barGrad = ctx.createLinearGradient(0, g.y - 3, 0, g.y + barH);
  barGrad.addColorStop(0, "#ffffff");
  barGrad.addColorStop(0.35, "#f2f5f0");
  barGrad.addColorStop(0.7, "#cfd6cb");
  barGrad.addColorStop(1, "#9aa498");
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  roundRectPath(g.x - 4, g.y - 3, g.w + 8, barH, 3);
  ctx.fill();

  // バー下の細い影
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(g.x, g.y + barH - 4, g.w, 2);

  // コーナー接合のハイライト
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(g.x - 2, g.y - 2, 8, 6);
  ctx.fillRect(g.x + g.w - 6, g.y - 2, 8, 6);

  // ネットがバーに結ばれている感じの短い垂れ
  ctx.strokeStyle = "rgba(220,228,218,0.4)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 18; i++) {
    const x = g.x + (g.w * i) / 18;
    ctx.beginPath();
    ctx.moveTo(x, g.y + barH - 2);
    ctx.quadraticCurveTo(x + 1, g.y + barH + 10, x, g.y + barH + 16);
    ctx.stroke();
  }

  ctx.restore();

  // キック／ダイブ瞬間のレティクル
  if (state.mode === "play" && (state.phase === "aim-click" || state.phase === "dive-click")) {
    const pulse = 0.5 + Math.sin(performance.now() / 90) * 0.5;
    const col = state.phase === "dive-click" ? "125,200,255" : "232,255,106";
    ctx.strokeStyle = `rgba(${col},${0.35 + pulse * 0.45})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(g.x - 2, g.y - 2, g.w + 4, g.h + 4);

    const locked = state.phase === "aim-click" ? state.aimLocked : state.diveLocked;
    if (state.pointerAim || locked) {
      const target = locked
        ? state.phase === "dive-click"
          ? cellCenter(state.keeperDir, state.keeperHeight)
          : state.aim
        : state.pointerAim || state.aim;
      const p = worldFromAim(target);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${col},0.95)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x - 22, p.y);
      ctx.lineTo(p.x + 22, p.y);
      ctx.moveTo(p.x, p.y - 22);
      ctx.lineTo(p.x, p.y + 22);
      ctx.stroke();
    }
  }
}

function roundRectPath(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawLimb(x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawKeeper() {
  const dir = state.keeperDir || "center";
  const height = state.keeperHeight || "mid";
  const t = state.keeperProgress;
  const feint = sampleKeeperFeint();
  const g = goalRect();
  const rest = worldFromAim(keeperReadyAim());
  rest.x += feint.ox;
  rest.y = Math.min(rest.y + feint.oy, g.y + g.h - keeperFootDrop(g));
  const target = worldFromAim(keeperDiveAim(dir, height));
  const diveSide = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  const diveLift = height === "high" ? -1 : height === "low" ? 1 : 0;
  const stretch = t * t * (3 - 2 * t);
  const idle = stretch < 0.05 ? Math.sin(performance.now() / 320) * 0.35 : 0;
  const isLowCatch = height === "low" && stretch > 0.02;
  const isHighDive = height === "high" && diveSide !== 0 && stretch > 0.02;
  const isCenterCatch = height === "mid" && diveSide === 0 && stretch > 0.02;
  const isSideMidDive = height === "mid" && diveSide !== 0 && stretch > 0.02;
  const isSideDive = isSideMidDive;
  // 下枠は沈む／上段は踏み込み→ジャンプ／左右中段は浮き3・沈み3
  let slideDrop = 0;
  if (isLowCatch) {
    slideDrop = stretch * (diveSide !== 0 ? 6 : 4);
  } else if (isHighDive) {
    const plant = Math.sin(clamp(t / 0.32, 0, 1) * Math.PI) * 1.2 * (1 - stretch);
    const leap = -Math.pow(stretch, 1.8) * 7;
    slideDrop = plant + leap;
  } else if (isSideMidDive) {
    const plantPhase = Math.sin(clamp(t / 0.32, 0, 1) * Math.PI) * (1 - stretch);
    slideDrop = -plantPhase * 3 + stretch * 3;
  }
  const moveT = isHighDive || isSideDive ? stretch : t;
  const x = lerp(rest.x, target.x, moveT);
  const y = isSideMidDive ? rest.y + slideDrop : lerp(rest.y, target.y, t) + slideDrop;

  let hipX;
  let hipY;
  let shoulderX;
  let shoulderY;
  let headX;
  let headY;
  let kneeL;
  let kneeR;
  let footL;
  let footR;
  let handL;
  let handR;
  let shoulderL;
  let shoulderR;
  let elbowL;
  let elbowR;
  let bodyRot;

  if (isLowCatch) {
    // 下枠：正面のまま、斜めに沈みながら横へ倒れて手を伸ばす（真横90°にはしない）
    const s = stretch;
    const side = diveSide;
    const crouch = Math.min(1, s / 0.28);
    const tip = clamp((s - 0.12) / 0.88, 0, 1);
    const tipEase = tip * tip * (3 - 2 * tip);

    if (side === 0) {
      const c = crouch * crouch * (3 - 2 * crouch);
      hipX = idle * 0.5;
      hipY = lerp(46, 52, c);
      shoulderX = 0;
      shoulderY = lerp(12, 20, c);
      headX = 0;
      headY = shoulderY - 12;
      kneeL = { x: -12, y: hipY + lerp(18, 14, c) };
      kneeR = { x: 12, y: hipY + lerp(18, 14, c) };
      footL = { x: -14, y: kneeL.y + lerp(14, 11, c) };
      footR = { x: 14, y: kneeR.y + lerp(14, 11, c) };
      handL = { x: lerp(-22, -10, c), y: lerp(10, 20, c) };
      handR = { x: lerp(22, 10, c), y: lerp(11, 20, c) };
      shoulderL = { x: -11, y: shoulderY + 1 };
      shoulderR = { x: 11, y: shoulderY + 1 };
      elbowL = { x: -12, y: (shoulderL.y + handL.y) * 0.55 + 5 };
      elbowR = { x: 12, y: (shoulderR.y + handR.y) * 0.55 + 5 };
      bodyRot = 0;
    } else {
      // 約55°まで：板のように真横へは倒さない
      bodyRot = side * tipEase * 0.95;

      const settle = tipEase;
      hipX = side * lerp(2, 8, settle);
      hipY = lerp(46, 44, crouch) + settle * 3;
      shoulderX = side * lerp(6, 22, settle);
      shoulderY = lerp(12, 16, crouch) + settle * 2;
      headX = shoulderX + side * 3 * settle;
      headY = shoulderY - 12;

      const downKnee = {
        x: hipX + side * lerp(8, 14, settle),
        y: hipY + lerp(18, 16, settle),
      };
      const upKnee = {
        x: hipX - side * lerp(12, 16, settle),
        y: hipY + lerp(18, 14, settle),
      };
      const downFoot = {
        x: downKnee.x + side * lerp(5, 8, settle),
        y: downKnee.y + lerp(12, 10, settle),
      };
      const upFoot = {
        x: upKnee.x - side * lerp(4, 10, settle),
        y: upKnee.y + lerp(14, 11, settle),
      };
      if (side > 0) {
        kneeL = upKnee;
        kneeR = downKnee;
        footL = upFoot;
        footR = downFoot;
      } else {
        kneeL = downKnee;
        kneeR = upKnee;
        footL = downFoot;
        footR = upFoot;
      }

      // 両手はボール方向へ（伸ばしすぎない）
      const catchX = side * lerp(24, 36, settle);
      const catchY = lerp(10, 17, settle);
      const handLead = {
        x: lerp(side > 0 ? 24 : -24, catchX + side * 1, tipEase),
        y: lerp(8, catchY - 1, tipEase),
      };
      const handTrail = {
        x: lerp(side > 0 ? -24 : 24, catchX - side * 4, tipEase * tipEase),
        y: lerp(9, catchY + 2, tipEase * 0.9),
      };
      if (side > 0) {
        handR = handLead;
        handL = handTrail;
      } else {
        handL = handLead;
        handR = handTrail;
      }

      shoulderL = { x: shoulderX - 10, y: shoulderY + 1 };
      shoulderR = { x: shoulderX + 10, y: shoulderY + 1 };
      // 肘を曲げて腕の見かけの長さを抑える
      elbowL = {
        x: shoulderL.x * 0.55 + handL.x * 0.45,
        y: shoulderL.y * 0.4 + handL.y * 0.6 + 5,
      };
      elbowR = {
        x: shoulderR.x * 0.55 + handR.x * 0.45,
        y: shoulderR.y * 0.4 + handR.y * 0.6 + 5,
      };
    }
  } else if (isHighDive) {
    // 左右上枠：斜め上へのコーナーダイブ（体のラインを揃えた自然な姿勢）
    const side = diveSide;
    const tipEase = stretch * stretch * (3 - 2 * stretch);
    // 真横に倒れすぎず、斜め45°前後
    bodyRot = side * tipEase * 0.62;

    // 腰→肩→頭：横へ倒れて腕で届く（体全体は浮かない）
    hipX = side * tipEase * 6;
    hipY = lerp(46, 44, tipEase);
    shoulderX = side * tipEase * 24;
    shoulderY = lerp(12, 5, tipEase);
    headX = shoulderX + side * tipEase * 5;
    headY = shoulderY - lerp(12, 10, tipEase);

    // 押し脚は後ろ下へ、もう一方は軽く後方に流す
    const trailKnee = {
      x: hipX - side * lerp(10, 26, tipEase),
      y: hipY + lerp(20, 16, tipEase),
    };
    const leadKnee = {
      x: hipX + side * lerp(4, 14, tipEase),
      y: hipY + lerp(18, 12, tipEase),
    };
    const trailFoot = {
      x: trailKnee.x - side * lerp(6, 14, tipEase),
      y: trailKnee.y + lerp(14, 10, tipEase),
    };
    const leadFoot = {
      x: leadKnee.x + side * lerp(2, 8, tipEase),
      y: leadKnee.y + lerp(14, 11, tipEase),
    };
    if (side > 0) {
      kneeL = trailKnee;
      kneeR = leadKnee;
      footL = trailFoot;
      footR = leadFoot;
    } else {
      kneeL = leadKnee;
      kneeR = trailKnee;
      footL = leadFoot;
      footR = trailFoot;
    }

    // 両手を広げた上でコーナー方向へ（ワイドな上げ狙い）
    const cornerX = side * lerp(24, 42, tipEase);
    const cornerY = lerp(4, -16, tipEase);
    const armSpread = lerp(10, 16, tipEase);
    const handLead = {
      x: lerp(side > 0 ? 22 : -22, cornerX + side * armSpread * 0.45, tipEase),
      y: lerp(6, cornerY - 3, tipEase),
    };
    const handTrail = {
      x: lerp(side > 0 ? -22 : 22, cornerX - side * armSpread * 0.75, tipEase),
      y: lerp(7, cornerY - 5, tipEase),
    };
    if (side > 0) {
      handR = handLead;
      handL = handTrail;
    } else {
      handL = handLead;
      handR = handTrail;
    }

    shoulderL = { x: shoulderX - 10, y: shoulderY };
    shoulderR = { x: shoulderX + 10, y: shoulderY };
    // 肘も外側へ開いて両腕を広げる
    elbowL = {
      x: shoulderL.x * 0.28 + handL.x * 0.72 - side * 2,
      y: shoulderL.y * 0.22 + handL.y * 0.78,
    };
    elbowR = {
      x: shoulderR.x * 0.28 + handR.x * 0.72 + side * 2,
      y: shoulderR.y * 0.22 + handR.y * 0.78,
    };
  } else if (isCenterCatch) {
    // 中央中段：正面から踏み込み、両手を広げて止める
    const tipEase = stretch * stretch * (3 - 2 * stretch);
    bodyRot = 0;

    hipX = idle * 0.4;
    hipY = lerp(46, 43, tipEase);
    shoulderX = 0;
    shoulderY = lerp(12, 8, tipEase);
    headX = 0;
    headY = shoulderY - lerp(12, 10, tipEase);

    kneeL = { x: -13, y: hipY + lerp(20, 17, tipEase) };
    kneeR = { x: 13, y: hipY + lerp(20, 17, tipEase) };
    footL = { x: -15, y: kneeL.y + lerp(15, 13, tipEase) };
    footR = { x: 15, y: kneeR.y + lerp(15, 13, tipEase) };

    const catchY = lerp(6, 12, tipEase);
    handL = {
      x: lerp(-24, -14, tipEase),
      y: lerp(4, catchY, tipEase),
    };
    handR = {
      x: lerp(24, 14, tipEase),
      y: lerp(4, catchY + 1, tipEase),
    };

    shoulderL = { x: -10, y: shoulderY + 1 };
    shoulderR = { x: 10, y: shoulderY + 1 };
    elbowL = {
      x: shoulderL.x * 0.35 + handL.x * 0.65,
      y: shoulderL.y * 0.3 + handL.y * 0.7 + 2,
    };
    elbowR = {
      x: shoulderR.x * 0.35 + handR.x * 0.65,
      y: shoulderR.y * 0.3 + handR.y * 0.7 + 2,
    };
  } else if (isSideDive) {
    // 左右中段：横伸び＋浮き上がり3・沈み込み3
    const side = diveSide;
    const tipEase = stretch * stretch * (3 - 2 * stretch);
    const plantPhase = Math.sin(clamp(t / 0.32, 0, 1) * Math.PI) * (1 - stretch);
    const vertShift = -plantPhase * 3 + stretch * 3;
    bodyRot = side * tipEase * 0.78;

    hipX = side * tipEase * 8;
    hipY = 46 + vertShift;
    shoulderX = side * tipEase * 26;
    shoulderY = 12 + vertShift * 0.6;
    headX = shoulderX + side * tipEase * 5;
    headY = shoulderY - 12;

    const trailKnee = {
      x: hipX - side * lerp(10, 28, tipEase),
      y: hipY + lerp(20, 19, tipEase),
    };
    const leadKnee = {
      x: hipX + side * lerp(4, 14, tipEase),
      y: hipY + lerp(18, 17, tipEase),
    };
    const trailFoot = {
      x: trailKnee.x - side * lerp(6, 16, tipEase),
      y: trailKnee.y + lerp(14, 13, tipEase),
    };
    const leadFoot = {
      x: leadKnee.x + side * lerp(2, 8, tipEase),
      y: leadKnee.y + lerp(14, 13, tipEase),
    };
    if (side > 0) {
      kneeL = trailKnee;
      kneeR = leadKnee;
      footL = trailFoot;
      footR = leadFoot;
    } else {
      kneeL = leadKnee;
      kneeR = trailKnee;
      footL = leadFoot;
      footR = trailFoot;
    }

    const catchX = side * lerp(24, 38, tipEase);
    const catchY = lerp(10, 11, tipEase);
    const handLead = {
      x: lerp(side > 0 ? 22 : -22, catchX + side * 2, tipEase),
      y: lerp(8, catchY - 1, tipEase) + vertShift * 0.4,
    };
    const handTrail = {
      x: lerp(side > 0 ? -22 : 22, catchX - side * 8, tipEase * tipEase),
      y: lerp(9, catchY + 1, tipEase) + vertShift * 0.35,
    };
    if (side > 0) {
      handR = handLead;
      handL = handTrail;
    } else {
      handL = handLead;
      handR = handTrail;
    }

    shoulderL = { x: shoulderX - 9, y: shoulderY + 1 };
    shoulderR = { x: shoulderX + 9, y: shoulderY + 1 };
    const leadHand = side > 0 ? handR : handL;
    elbowL = {
      x: shoulderL.x * 0.38 + handL.x * 0.62,
      y: shoulderL.y * 0.32 + handL.y * 0.68 + (handL === leadHand ? 2 : 5),
    };
    elbowR = {
      x: shoulderR.x * 0.38 + handR.x * 0.62,
      y: shoulderR.y * 0.32 + handR.y * 0.68 + (handR === leadHand ? 2 : 5),
    };
  } else {
    // 中央・待機：腕をやや伸ばしたまま開閉・上下
    hipX = idle * 1.2 + feint.hipX * (1 - stretch);
    hipY =
      lerp(46, 40, stretch) - diveLift * stretch * 18 + Math.abs(idle) * 1.5 + feint.hipY * (1 - stretch);
    shoulderX = 0;
    shoulderY =
      lerp(12, 6, stretch) - diveLift * stretch * 8 + idle * 0.8 + feint.shoulderY * (1 - stretch);
    headX = 0;
    headY = shoulderY - 14;

    const plantSpread = 12 + idle * 1.2 + feint.plant * (1 - stretch);
    kneeL = {
      x: hipX - lerp(plantSpread, 14, stretch),
      y: hipY + lerp(20, 16 + (diveLift > 0 ? 10 : 4), stretch),
    };
    kneeR = {
      x: hipX + lerp(plantSpread, 14, stretch),
      y: hipY + lerp(20, 14 + (diveLift > 0 ? 8 : 2), stretch),
    };
    footL = {
      x: kneeL.x - lerp(4, 6, stretch),
      y: kneeL.y + lerp(16, 12 + Math.abs(diveLift) * stretch * 6, stretch),
    };
    footR = {
      x: kneeR.x + lerp(4, 6, stretch),
      y: kneeR.y + lerp(16, 11 + Math.abs(diveLift) * stretch * 5, stretch),
    };

    const nowArm = performance.now();
    const breath = Math.sin(nowArm / 520);
    const openClose = 0.5 + 0.5 * Math.sin(nowArm / 640);
    const bobL = Math.sin(nowArm / 360);
    const bobR = Math.sin(nowArm / 380 + 1.1);
    const readyMix = 1 - stretch;

    const baseSpread =
      lerp(20, 27, openClose) +
      breath * 0.9 +
      (feint.handSpread || 0) * readyMix;

    const readyHandLX =
      -baseSpread + bobL * 1.2 + (feint.handLX || 0) * readyMix;
    const readyHandRX =
      baseSpread + bobR * 1.2 + (feint.handRX || 0) * readyMix;
    const readyHandLY =
      2 +
      breath * 1.3 +
      bobL * 2.4 -
      openClose * 1.2 +
      (feint.handLY || 0) * readyMix;
    const readyHandRY =
      2.5 +
      breath * 1.3 +
      bobR * 2.4 -
      openClose * 1.2 +
      (feint.handRY || 0) * readyMix;

    handL = {
      x: lerp(readyHandLX, -6, stretch),
      y: lerp(readyHandLY, diveLift * stretch * 5 - 1, stretch),
    };
    handR = {
      x: lerp(readyHandRX, 6, stretch),
      y: lerp(readyHandRY, diveLift * stretch * 5 + 1, stretch),
    };
    shoulderL = { x: shoulderX - lerp(11, 9, stretch), y: shoulderY + 2 };
    shoulderR = { x: shoulderX + lerp(11, 9, stretch), y: shoulderY + 2 };
    const readyElbowLX = shoulderL.x * 0.28 + handL.x * 0.72 + 0.8;
    const readyElbowRX = shoulderR.x * 0.28 + handR.x * 0.72 - 0.8;
    const readyElbowLY = shoulderL.y * 0.35 + handL.y * 0.65 + 2.5 + bobL * 0.35;
    const readyElbowRY = shoulderR.y * 0.35 + handR.y * 0.65 + 2.5 + bobR * 0.35;
    elbowL = {
      x: lerp(readyElbowLX, (shoulderL.x + handL.x) * 0.55 - 2, stretch),
      y: lerp(readyElbowLY, (shoulderL.y + handL.y) * 0.55 + 6, stretch),
    };
    elbowR = {
      x: lerp(readyElbowRX, (shoulderR.x + handR.x) * 0.55 + 2, stretch),
      y: lerp(readyElbowRY, (shoulderR.y + handR.y) * 0.55 + 6, stretch),
    };
    bodyRot = feint.lean * (1 - stretch);
  }

  ctx.save();
  ctx.translate(x, y);
  const keeperScale = keeperScaleForGoal(g);
  ctx.scale(keeperScale, keeperScale);
  ctx.rotate(bodyRot);

  const diveShade = isLowCatch || isSideDive || isHighDive || isCenterCatch;
  ctx.beginPath();
  ctx.ellipse(
    hipX,
    hipY + (diveShade ? 18 : 34),
    (diveShade ? 20 : 14) + stretch * (diveShade ? 12 : 9),
    diveShade ? 4.0 : 5,
    bodyRot * 0.42,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = `rgba(0,0,0,${0.16 + stretch * 0.1})`;
  ctx.fill();

  const kit = state.turn === "you-save" ? state.youKit : state.oppKit;
  const skin = "#e6b589";
  const skinShade = "#c9956e";
  const jersey = kit.jersey;
  const jerseyDark = kit.jerseyDark;
  const shorts = kit.shorts;
  const socks = kit.socks;
  const boots = "#1a1a1a";
  const glove = state.turn === "you-save" ? "#d8ff4a" : "#f5f5f5";
  const gloveDark = state.turn === "you-save" ? "#a8c922" : "#c0c0c0";

  drawLimb(hipX - 4, hipY + 2, kneeL.x, kneeL.y, 5.2, kit.exposeThigh ? skin : shorts);
  drawLimb(hipX + 4, hipY + 2, kneeR.x, kneeR.y, 5.2, kit.exposeThigh ? skin : shorts);
  if (kit.exposeThigh) {
    const shortT = 0.4;
    drawLimb(
      hipX - 4,
      hipY + 2,
      hipX - 4 + (kneeL.x - (hipX - 4)) * shortT,
      hipY + 2 + (kneeL.y - (hipY + 2)) * shortT,
      5.6,
      shorts
    );
    drawLimb(
      hipX + 4,
      hipY + 2,
      hipX + 4 + (kneeR.x - (hipX + 4)) * shortT,
      hipY + 2 + (kneeR.y - (hipY + 2)) * shortT,
      5.6,
      shorts
    );
  }
  drawLimb(kneeL.x, kneeL.y, footL.x, footL.y, 4.4, socks);
  drawLimb(kneeR.x, kneeR.y, footR.x, footR.y, 4.4, socks);
  roundRectPath(footL.x - 6, footL.y - 2, 11, 5.5, 2);
  ctx.fillStyle = boots;
  ctx.fill();
  roundRectPath(footR.x - 5, footR.y - 2, 11, 5.5, 2);
  ctx.fill();

  const torsoTopX = shoulderX;
  const torsoTopY = shoulderY - 2;
  const torsoCX = (hipX + torsoTopX) / 2;
  const torsoCY = (hipY + torsoTopY) / 2;
  const torsoLen = Math.max(30, Math.hypot(torsoTopX - hipX, torsoTopY - hipY) + 6);
  const torsoAng = Math.atan2(torsoTopY - hipY, torsoTopX - hipX || 0.001);
  ctx.save();
  ctx.translate(torsoCX, torsoCY);
  ctx.rotate(torsoAng - Math.PI / 2);
  const torsoGrad = ctx.createLinearGradient(0, -torsoLen / 2, 0, torsoLen / 2);
  torsoGrad.addColorStop(0, jersey);
  torsoGrad.addColorStop(1, jerseyDark);
  const torsoW = lerp(22, isLowCatch || isSideDive || isHighDive || isCenterCatch ? 18.5 : 18, stretch);
  roundRectPath(-torsoW / 2, -torsoLen / 2, torsoW, torsoLen, 6);
  ctx.fillStyle = torsoGrad;
  ctx.fill();
  if (kit.trim) {
    ctx.fillStyle = kit.trim;
    ctx.fillRect(-torsoW / 2, -torsoLen / 2, torsoW, 2.5);
  }
  ctx.fillStyle = kit.number || "#ffffff";
  ctx.font = "bold 10px Bebas Neue, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("1", 0, 2);
  ctx.restore();

  ctx.strokeStyle = skin;
  ctx.lineWidth = 6.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY - 1);
  ctx.lineTo(headX, headY + 5);
  ctx.stroke();
  const headGrad = ctx.createRadialGradient(headX - 3, headY - 2, 2, headX, headY, 11);
  headGrad.addColorStop(0, skin);
  headGrad.addColorStop(1, skinShade);
  ctx.beginPath();
  ctx.arc(headX, headY, 9.5, 0, Math.PI * 2);
  ctx.fillStyle = headGrad;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headX, headY - 5, 9, 5.5, 0, Math.PI, 0);
  ctx.fillStyle = "#2a2118";
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(headX - 3.2, headY + 1, 1.1, 0, Math.PI * 2);
  ctx.arc(headX + 3.2, headY + 1, 1.1, 0, Math.PI * 2);
  ctx.fill();

  const armW = lerp(4.6, 3.9, stretch);
  drawLimb(shoulderL.x, shoulderL.y, elbowL.x, elbowL.y, armW, jersey);
  drawLimb(elbowL.x, elbowL.y, handL.x, handL.y, armW * 0.9, jersey);
  drawLimb(shoulderR.x, shoulderR.y, elbowR.x, elbowR.y, armW, jersey);
  drawLimb(elbowR.x, elbowR.y, handR.x, handR.y, armW * 0.9, jersey);

  const tipLen = isLowCatch || isSideDive || isHighDive || isCenterCatch ? 6 + stretch * (isHighDive ? 8 : 6) : 7 + stretch * 9;
  const hands = [
    { hand: handL, elbow: elbowL, thumbSign: 1 },
    { hand: handR, elbow: elbowR, thumbSign: -1 },
  ];
  for (const { hand, elbow, thumbSign } of hands) {
    // 指先の向きは「肘→手首」の延長（横向き固定にしない）
    const armDx = hand.x - elbow.x;
    const armDy = hand.y - elbow.y;
    const armLen = Math.hypot(armDx, armDy) || 1;
    const ux = armDx / armLen;
    const uy = armDy / armLen;
    // キャッチ時はわずかにボール方向へ寄せる
    let tipBiasX = 0;
    let tipBiasY = 0;
    if (isHighDive) {
      tipBiasX = diveSide * tipLen * 0.35;
      tipBiasY = -tipLen * 0.28;
    } else if (isCenterCatch) {
      tipBiasY = tipLen * 0.12;
    } else if (isSideDive) {
      tipBiasX = ux * tipLen * 0.16 + diveSide * tipLen * 0.22;
      tipBiasY = uy * tipLen * 0.12 + tipLen * 0.06;
    } else if (isLowCatch && diveSide !== 0) {
      tipBiasX = ux * tipLen * 0.15 + diveSide * tipLen * 0.25;
      tipBiasY = uy * tipLen * 0.1 + tipLen * 0.12;
    } else if (stretch > 0.05) {
      const catchMidX = (handL.x + handR.x) * 0.5;
      const catchMidY = (handL.y + handR.y) * 0.5;
      tipBiasX = (catchMidX - hand.x) * 0.15 + diveSide * tipLen * 0.15;
      tipBiasY = (catchMidY - hand.y) * 0.1 + diveLift * tipLen * 0.2;
    }
    const dirX = ux * tipLen + tipBiasX;
    const dirY = uy * tipLen + tipBiasY;
    const gloveAng = Math.atan2(dirY, dirX || 0.001);
    const reach = Math.max(8, Math.hypot(dirX, dirY));
    const palmLen = Math.max(5.8, reach * 0.42);
    const fingerLen = Math.max(4.8, reach * 0.48);
    const palmW = 5.6 + stretch * 0.5;

    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(gloveAng);

    // 掌：カメラ向きの扁平ミット（横長の塊にしない）
    const palmGrad = ctx.createLinearGradient(0, -palmW * 0.4, palmLen, palmW * 0.4);
    palmGrad.addColorStop(0, glove);
    palmGrad.addColorStop(1, gloveDark);
    ctx.fillStyle = palmGrad;
    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = 1;
    roundRectPath(0.2, -palmW * 0.48, palmLen, palmW, 1.8);
    ctx.fill();
    ctx.stroke();

    // 指4本（腕の延長方向）
    const fingerSpread = palmW * 0.38;
    for (let i = 0; i < 4; i++) {
      const t = (i - 1.5) / 1.5;
      const fy = t * fingerSpread;
      const fTipX = palmLen + fingerLen;
      const fTipY = t * fingerSpread * 1.05;
      ctx.strokeStyle = i % 2 === 0 ? glove : gloveDark;
      ctx.lineWidth = 1.9 - Math.abs(t) * 0.12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(palmLen - 0.4, fy);
      ctx.lineTo(fTipX, fTipY);
      ctx.stroke();
      ctx.fillStyle = gloveDark;
      ctx.beginPath();
      ctx.ellipse(fTipX, fTipY, 1.35, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 親指（掌の側面）
    ctx.strokeStyle = gloveDark;
    ctx.lineWidth = 2.1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(palmLen * 0.25, thumbSign * palmW * 0.12);
    ctx.quadraticCurveTo(
      palmLen * 0.4,
      thumbSign * palmW * 0.72,
      palmLen * 0.62,
      thumbSign * palmW * 0.48
    );
    ctx.stroke();
    ctx.fillStyle = glove;
    ctx.beginPath();
    ctx.ellipse(palmLen * 0.62, thumbSign * palmW * 0.48, 1.55, 1.25, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

function drawPlayerFigure(opts) {
  const {
    x,
    y,
    scale = 1,
    pose = "ready",
    kickT = 0,
    stride = 0,
    kit = SAMURAI_BLUE,
    number = "9",
    facing = 1,
    idlePose = "sides",
    kickStyle = null,
  } = opts;

  const skin = "#e6b589";
  const skinShade = "#c9956e";
  const jersey = kit.jersey;
  const jerseyDark = kit.jerseyDark;
  const shorts = kit.shorts || "#1c2430";
  const socks = kit.socks || jersey;
  const boots = "#111";
  const numColor = kit.number || "#ffffff";
  const trim = kit.trim || null;
  const kt = clamp(kickT, 0, 1);
  const legAmp = kickStyle?.legAmp ?? 1;
  const leftFooted = !!kickStyle?.leftFooted;

  let lean = -0.08;
  let hipSwingL = 0.1;
  let hipSwingR = -0.12;
  let kneeL = 0.25;
  let kneeR = 0.2;
  let armL = -0.3;
  let armR = 0.35;
  let elbowL = 0.55;
  let elbowR = 0.5;
  let bob = 0;
  let torsoTwist = 0;
  let kickFootLift = 0;
  let plantFootLift = 0;

  if (pose === "run") {
    const s = Math.sin(stride);
    const c = Math.cos(stride);
    lean = -0.14 - Math.max(0, -s) * 0.05;
    bob = Math.max(0, s) * 1.8;
    hipSwingL = s * 0.88;
    hipSwingR = -s * 0.88;
    kneeL = 0.1 + Math.max(0, -s) * 0.62;
    kneeR = 0.1 + Math.max(0, s) * 0.62;
    plantFootLift = Math.max(0, -s) * 2.5;
    kickFootLift = Math.max(0, s) * 3.2;
    armL = c * 0.42;
    armR = -c * 0.42;
    elbowL = 0.35 + Math.abs(c) * 0.2;
    elbowR = 0.35 + Math.abs(c) * 0.2;
    torsoTwist = s * 0.07;
  } else if (pose === "plant") {
    const p = clamp(kt / 0.36, 0, 1);
    lean = lerp(-0.1, -0.03, p);
    bob = lerp(0.8, 0, p);
    hipSwingL = lerp(0.12, 0.04, p);
    hipSwingR = lerp(-0.22, -1.32, p);
    kneeL = lerp(0.16, 0.08, p);
    kneeR = lerp(0.28, 1.02, p);
    kickFootLift = lerp(0, 7.5, p);
    armL = lerp(0.18, -0.08, p);
    armR = lerp(-0.1, 0.32, p);
    elbowL = lerp(0.48, 0.38, p);
    elbowR = lerp(0.42, 0.34, p);
    torsoTwist = lerp(0.04, -0.12, p);
  } else if (pose === "kick") {
    const strike = clamp((kt - 0.36) / 0.64, 0, 1);
    const wind = clamp(strike / 0.38, 0, 1);
    const thru = clamp((strike - 0.38) / 0.62, 0, 1);
    lean = lerp(-0.03, -0.38, wind * 0.5 + thru * 0.5);
    bob = thru > 0.2 ? -2.4 : lerp(0, -1.0, wind);
    hipSwingL = lerp(0.04, 0.18, thru);
    hipSwingR = lerp(-1.32, 1.28, wind * 0.35 + thru * 0.65);
    kneeL = lerp(0.08, 0.3, thru);
    kneeR = lerp(1.02, 0.05, wind);
    kickFootLift = lerp(7.5, -5.5, wind) + thru * 3.5;
    armL = lerp(-0.08, -0.45, wind);
    armR = lerp(0.32, -0.06, thru);
    elbowL = lerp(0.38, 0.55, wind);
    elbowR = lerp(0.34, 0.44, thru);
    torsoTwist = lerp(-0.12, 0.16, thru);
  } else if (pose === "follow") {
    lean = lerp(-0.34, -0.1, kt);
    bob = lerp(-1.8, 0, kt);
    hipSwingL = lerp(0.18, 0.08, kt);
    hipSwingR = lerp(1.28, -0.12, kt);
    kneeL = lerp(0.3, 0.22, kt);
    kneeR = lerp(0.05, 0.28, kt);
    kickFootLift = lerp(2, 0, kt);
    armL = lerp(-0.45, -0.18, kt);
    armR = lerp(-0.06, 0.18, kt);
    elbowL = lerp(0.55, 0.42, kt);
    elbowR = lerp(0.44, 0.38, kt);
    torsoTwist = lerp(0.16, 0, kt);
  } else {
    // ready：待機ポーズをバリエーション（常にゴールへ前傾）
    const idle = Math.sin(performance.now() / 380);
    const idle2 = Math.sin(performance.now() / 520);
    lean = -0.1;
    bob = Math.abs(idle) * 0.7;
    hipSwingL = 0.08 + idle * 0.03;
    hipSwingR = -0.14 - idle * 0.025;
    kneeL = 0.2;
    kneeR = 0.18;
    torsoTwist = 0;

    switch (idlePose) {
      case "hips": // 腰に手（後ろ手に見えない範囲）
        lean = -0.08;
        armL = 0.55 + idle * 0.03;
        armR = -0.55 - idle * 0.03;
        elbowL = 0.95;
        elbowR = 0.95;
        hipSwingL = 0.14;
        hipSwingR = -0.2;
        break;
      case "front": // 前で構える
        armL = 0.32 + idle * 0.02;
        armR = -0.32 - idle * 0.02;
        elbowL = 0.75;
        elbowR = 0.75;
        break;
      case "focus": // 片方を前に構える
        lean = -0.14;
        armL = 0.28 + idle * 0.04;
        armR = -0.06 + idle2 * 0.03;
        elbowL = 0.45;
        elbowR = 0.22;
        torsoTwist = -0.04;
        break;
      case "bounce": // 軽く弾む・腕は自然に
        bob = 1.2 + Math.abs(idle) * 1.6;
        lean = -0.12 + idle2 * 0.02;
        hipSwingL = 0.12 + idle * 0.06;
        hipSwingR = -0.16 - idle * 0.05;
        kneeL = 0.28 + Math.abs(idle) * 0.08;
        kneeR = 0.24 + Math.abs(idle2) * 0.08;
        armL = 0.1 + idle * 0.1;
        armR = -0.08 - idle * 0.1;
        elbowL = 0.25;
        elbowR = 0.24;
        break;
      case "sides":
      case "behind": // 旧後ろ手は側面下ろしにフォールバック
      default: // 腕を下ろす
        armL = 0.08 + idle * 0.04;
        armR = -0.06 - idle * 0.04;
        elbowL = 0.18;
        elbowR = 0.16;
        break;
    }
  }

  hipSwingL *= legAmp;
  hipSwingR *= legAmp;
  kneeL = 0.1 + (kneeL - 0.1) * legAmp;
  kneeR = 0.1 + (kneeR - 0.1) * legAmp;
  kickFootLift *= legAmp;
  plantFootLift *= legAmp;

  let drawPlantSwing = hipSwingL;
  let drawPlantKnee = kneeL;
  let drawPlantLift = plantFootLift;
  let drawKickSwing = hipSwingR;
  let drawKickKnee = kneeR;
  let drawKickLift = kickFootLift;
  if (leftFooted) {
    drawPlantSwing = hipSwingR;
    drawPlantKnee = kneeR;
    drawPlantLift = kickFootLift;
    drawKickSwing = hipSwingL;
    drawKickKnee = kneeL;
    drawKickLift = plantFootLift;
  }

  ctx.save();
  ctx.translate(x, y - bob);
  // ゴールは画面上方向。左右反転だけ facing で、常に背中側を見せる
  ctx.scale(scale * facing, scale);

  ctx.beginPath();
  ctx.ellipse(0, 5 + bob, 15, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fill();

  // ゴール方向へ軽く前傾（正=仰け、負=ゴールへ）
  ctx.rotate(lean);

  function drawLeg(side, hipSwing, kneeBend, flash, footLift = 0) {
    ctx.save();
    ctx.translate(side * 3.2, -8);
    ctx.rotate(hipSwing);
    const thighLen = 17 + (side > 0 && footLift !== 0 ? 1.5 : 0);
    const shinLen = 16 + (side > 0 && footLift < 0 ? 2 : 0);
    const kneeX = side * 1.2;
    const kneeY = thighLen;
    if (kit.exposeThigh) {
      drawLimb(0, 0, kneeX, kneeY, 5.0, skin);
      const shortT = 0.4;
      drawLimb(0, 0, kneeX * shortT, kneeY * shortT, 5.5, shorts);
    } else {
      drawLimb(0, 0, kneeX, kneeY, 5.2, shorts);
    }
    ctx.translate(kneeX, kneeY);
    ctx.rotate(kneeBend);
    const ankleY = shinLen - footLift;
    const ankleX = side * (1.6 + Math.max(0, -footLift) * 0.08);
    drawLimb(0, 0, ankleX, ankleY, 4.5, socks);
    roundRectPath(ankleX - 6, ankleY - 2, 11, 5.5, 2);
    ctx.fillStyle = boots;
    ctx.fill();
    if (flash) {
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(ankleX - 3, ankleY + 1, 6, 2);
    }
    ctx.restore();
  }

  const kickFlash = pose === "kick" && kt > 0.42 && kt < 0.6;
  drawLeg(-1, leftFooted ? drawKickSwing : drawPlantSwing, leftFooted ? drawKickKnee : drawPlantKnee, false, leftFooted ? drawKickLift : drawPlantLift);
  drawLeg(1, leftFooted ? drawPlantSwing : drawKickSwing, leftFooted ? drawPlantKnee : drawKickKnee, kickFlash, leftFooted ? drawPlantLift : drawKickLift);

  // 腕は胴より先に描く（背中に貼り付いて見えないよう、体側から下ろす）
  function drawArm(side, shoulderRot, elbowBend) {
    ctx.save();
    // 肩は胴の外側。後ろ姿でも側面から腕が下りる
    ctx.translate(side * 11.2, -45);
    // 後ろ手に見えないよう振りを制限（左は過負回転、右は過正回転をカット）
    const rot =
      side < 0
        ? clamp(shoulderRot, -0.2, 0.7)
        : clamp(shoulderRot, -0.7, 0.2);
    ctx.rotate(rot);
    // 上腕：外側へ開きつつ下へ
    const upX = side * 3.2;
    const upY = 12.5;
    drawLimb(0, 0, upX, upY, 4.0, jersey);
    ctx.translate(upX, upY);
    // 肘：軽く曲げて前腕を体に沿わせる
    ctx.rotate(elbowBend * side);
    const lowX = side * 1.2;
    const lowY = 11.5;
    drawLimb(0, 0, lowX, lowY, 3.5, jersey);
    ctx.translate(lowX, lowY);

    // 手の甲がこちら、親指は外側
    ctx.save();
    ctx.rotate(side * 0.08);
    ctx.fillStyle = skin;
    ctx.strokeStyle = skinShade;
    ctx.lineWidth = 0.65;
    roundRectPath(-1.8, -0.3, 3.6, 3.3, 1.0);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(160,110,75,0.3)";
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(-1.4, 2.4);
    ctx.lineTo(1.4, 2.4);
    ctx.stroke();
    ctx.lineCap = "round";
    ctx.strokeStyle = skinShade;
    for (let i = 0; i < 4; i++) {
      const t = (i - 1.5) / 1.5;
      const fx = t * 1.25;
      ctx.lineWidth = 1.15 - Math.abs(t) * 0.08;
      ctx.beginPath();
      ctx.moveTo(fx, 2.5);
      ctx.quadraticCurveTo(fx + side * 0.2, 3.8, fx + side * 0.25, 5.0);
      ctx.stroke();
    }
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(side * 1.4, 0.4);
    ctx.quadraticCurveTo(side * 2.4, 1.0, side * 2.15, 2.4);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(side * 2.15, 2.4, 1.1, 0.9, side * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  drawArm(-1, armL, elbowL);
  drawArm(1, armR, elbowR);

  // 胴（背中）細身 — 腕の上に重ねて肩の付きを自然に
  ctx.save();
  ctx.rotate(torsoTwist);
  const torsoGrad = ctx.createLinearGradient(-10, -52, 10, -10);
  torsoGrad.addColorStop(0, jerseyDark);
  torsoGrad.addColorStop(0.45, jersey);
  torsoGrad.addColorStop(1, jerseyDark);
  roundRectPath(-10, -52, 20, 42, 6);
  ctx.fillStyle = torsoGrad;
  ctx.fill();
  // 肩の厚み（後ろ姿）
  ctx.fillStyle = jerseyDark;
  ctx.beginPath();
  ctx.ellipse(-9.5, -46, 3.5, 5.5, -0.2, 0, Math.PI * 2);
  ctx.ellipse(9.5, -46, 3.5, 5.5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  if (trim) {
    ctx.fillStyle = trim;
    ctx.fillRect(-10, -52, 20, 2.5);
    ctx.fillRect(-10, -13, 20, 2.5);
  }
  // 背番号
  ctx.fillStyle = numColor;
  ctx.font = `bold ${Math.round(13 * Math.min(1.2, 1 / scale))}px Bebas Neue, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.save();
  ctx.scale(facing, 1);
  ctx.globalAlpha = 0.95;
  ctx.fillText(number, 0, -30);
  ctx.restore();

  // 首・後頭部（顔は描かない＝ゴール向き）
  ctx.fillStyle = skin;
  ctx.fillRect(-2.6, -58, 5.2, 7);
  const hair = "#2c2118";
  const hairDark = "#1a1410";
  // 後頭部の球体
  const headGrad = ctx.createRadialGradient(-2, -66, 2, 0, -64, 9);
  headGrad.addColorStop(0, "#3a2c20");
  headGrad.addColorStop(0.55, hair);
  headGrad.addColorStop(1, hairDark);
  ctx.beginPath();
  ctx.arc(0, -64, 8.2, 0, Math.PI * 2);
  ctx.fillStyle = headGrad;
  ctx.fill();
  // 髪のボリューム（後頭部をほぼ覆う）
  ctx.beginPath();
  ctx.moveTo(-8.2, -62);
  ctx.bezierCurveTo(-9, -69, -5, -75, 0, -76);
  ctx.bezierCurveTo(5, -75, 9, -69, 8.2, -62);
  ctx.quadraticCurveTo(6.5, -58, 4, -57);
  ctx.quadraticCurveTo(0, -59, -4, -57);
  ctx.quadraticCurveTo(-6.5, -58, -8.2, -62);
  ctx.closePath();
  ctx.fillStyle = hairDark;
  ctx.fill();
  // 耳（後ろ姿の両脇）
  ctx.fillStyle = skinShade;
  ctx.beginPath();
  ctx.ellipse(-7.8, -63, 1.8, 2.6, -0.2, 0, Math.PI * 2);
  ctx.ellipse(7.8, -63, 1.8, 2.6, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function kickerDrawScale(y, isNear) {
  const { h } = state;
  const g = goalRect();
  // ゴール高さ基準＋手前ほど少し大きく
  const goalRef = clamp((g.h * 0.78) / 78, 1.12, 1.48);
  const t = clamp((y - h * 0.48) / (h * 0.48), 0, 1);
  const depthBoost = lerp(1.02, 1.36, t * t * (3 - 2 * t));
  const base = goalRef * depthBoost;
  return isNear ? base * 1.12 : base * 1.05;
}

function drawShooter() {
  if (state.mode !== "play") return;

  // アニメ中は kicker ステートを優先
  if (state.kicker) {
    const k = state.kicker;
    const isYou = k.side === "you";
    drawPlayerFigure({
      x: k.x,
      y: k.y,
      scale: kickerDrawScale(k.y, isYou),
      pose: k.pose,
      kickT: k.kick,
      stride: k.stride,
      kit: isYou ? state.youKit : state.oppKit,
      number: isYou ? "9" : "10",
      facing: k.facing ?? (isYou ? 1 : -1),
      idlePose: k.idlePose || state.approach?.idlePose || "sides",
      kickStyle: k.kickStyle || state.approach?.kickStyle || null,
    });
    return;
  }

  // 待機／ホイッスル中：助走スタート位置に立つ
  if (state.turn === "you-shoot" && (state.phase === "ready" || state.phase === "whistle")) {
    const a = state.approach || rollApproach(true);
    state.approach = a;
    drawPlayerFigure({
      x: a.from.x,
      y: a.from.y,
      scale: kickerDrawScale(a.from.y, true),
      pose: "ready",
      kit: state.youKit,
      number: "9",
      facing: a.facing,
      idlePose: a.idlePose || "sides",
    });
    return;
  }

  if (state.turn === "you-save" && (state.phase === "ready-save" || state.phase === "whistle")) {
    const a = state.approach || rollApproach(false);
    state.approach = a;
    drawPlayerFigure({
      x: a.from.x,
      y: a.from.y,
      scale: kickerDrawScale(a.from.y, false),
      pose: "ready",
      kit: state.oppKit,
      number: "10",
      facing: a.facing,
      idlePose: a.idlePose || "sides",
    });
  }
}

const PHI = (1 + Math.sqrt(5)) / 2;

/** 正二十面体の頂点 = サッカーボール黒パネル中心 */
function soccerPanelCenters() {
  const raw = [
    [0, 1, PHI],
    [0, -1, PHI],
    [0, 1, -PHI],
    [0, -1, -PHI],
    [1, PHI, 0],
    [-1, PHI, 0],
    [1, -PHI, 0],
    [-1, -PHI, 0],
    [PHI, 0, 1],
    [-PHI, 0, 1],
    [PHI, 0, -1],
    [-PHI, 0, -1],
  ];
  return raw.map((p) => {
    const len = Math.hypot(p[0], p[1], p[2]);
    return [p[0] / len, p[1] / len, p[2] / len];
  });
}

const SOCCER_PANELS = soccerPanelCenters();

function rotX3(p, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
}

function rotY3(p, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}

function cross3(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function norm3(p) {
  const len = Math.hypot(p[0], p[1], p[2]) || 1;
  return [p[0] / len, p[1] / len, p[2] / len];
}

/** 3D投影の白黒サッカーボール（spinX / spinY で球体回転） */
function drawSoccerBall(x, y, radius, spinY = 0, spinX = 0) {
  ctx.save();
  ctx.translate(x, y);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.clip();

  // 皮革の下地
  const body = ctx.createRadialGradient(-radius * 0.32, -radius * 0.38, radius * 0.08, 0, 0, radius);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.45, "#f4f5f2");
  body.addColorStop(0.82, "#d9dcd6");
  body.addColorStop(1, "#b4b8b0");
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();

  // 微細な皮目
  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.92, radius * (0.35 + Math.abs(i) * 0.08), 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const panels = [];
  for (const base of SOCCER_PANELS) {
    let p = rotY3(base, spinY);
    p = rotX3(p, spinX);
    if (p[2] <= 0.05) continue;

    // 接平面上の五角形を投影
    const n = p;
    let u = norm3(cross3(Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], n));
    const v = norm3(cross3(n, u));
    const size = radius * 0.3;
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const wx = n[0] * radius * 0.92 + (u[0] * Math.cos(a) + v[0] * Math.sin(a)) * size;
      const wy = n[1] * radius * 0.92 + (u[1] * Math.cos(a) + v[1] * Math.sin(a)) * size;
      const wz = n[2] * radius * 0.92 + (u[2] * Math.cos(a) + v[2] * Math.sin(a)) * size;
      if (wz < 0) continue;
      pts.push([wx, wy, wz]);
    }
    if (pts.length >= 3) {
      panels.push({ pts, z: p[2], nx: p[0], ny: p[1] });
    }
  }

  panels.sort((a, b) => a.z - b.z);

  for (const panel of panels) {
    const shade = 0.16 + panel.z * 0.55;
    ctx.beginPath();
    panel.pts.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt[0], pt[1]);
      else ctx.lineTo(pt[0], pt[1]);
    });
    ctx.closePath();
    ctx.fillStyle = `rgb(${Math.round(18 * shade)},${Math.round(18 * shade)},${Math.round(18 * shade)})`;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = Math.max(0.6, radius * 0.03);
    ctx.stroke();
  }

  // 縫い目リング（奥行き感）
  ctx.strokeStyle = "rgba(40,40,40,0.18)";
  ctx.lineWidth = Math.max(0.8, radius * 0.035);
  for (let i = 0; i < 4; i++) {
    const a = spinY * 0.7 + i * 0.9;
    ctx.beginPath();
    ctx.ellipse(Math.sin(a) * radius * 0.08, 0, radius * 0.78, radius * 0.86, a * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 固定ハイライト（光源は画面左上）
  const shine = ctx.createRadialGradient(-radius * 0.42, -radius * 0.48, 0, -radius * 0.15, -radius * 0.2, radius * 0.75);
  shine.addColorStop(0, "rgba(255,255,255,0.62)");
  shine.addColorStop(0.3, "rgba(255,255,255,0.16)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = shine;
  ctx.fill();

  const shade = ctx.createRadialGradient(radius * 0.4, radius * 0.45, radius * 0.05, 0, 0, radius);
  shade.addColorStop(0.5, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = shade;
  ctx.fill();

  // リムライト
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.97, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = Math.max(1, radius * 0.04);
  ctx.stroke();

  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = Math.max(1, radius * 0.045);
  ctx.stroke();
}

function drawBall() {
  const g = goalRect();
  const baseR = ballBaseRadius(g);
  const flightR = baseR * (13 / 12);
  const shadowRX = baseR * (10 / 12);
  const shadowRY = baseR * (3.5 / 12);
  const shadowDrop = baseR;

  if (!state.ball) {
    if (
      state.mode === "play" &&
      (state.phase === "ready" || state.phase === "ready-save" || state.phase === "whistle")
    ) {
      const spot = penaltyLayout().spot;
      const bx = spot.x;
      const by = spot.y;
      ctx.beginPath();
      ctx.ellipse(bx, by + shadowDrop, shadowRX, shadowRY, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fill();
      drawSoccerBall(bx, by, baseR, 0.35, 0.2);
    }
    return;
  }

  // 助走・キック直前は静止したまま
  if (!state.ball.airborne) {
    ctx.beginPath();
    ctx.ellipse(state.ball.x, state.ball.y + shadowDrop, shadowRX, shadowRY, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fill();
    drawSoccerBall(state.ball.x, state.ball.y, baseR, 0.35, 0.2);
    return;
  }

  for (const t of state.ball.trail) {
    if (t.a < 0.05) continue;
    ctx.globalAlpha = t.a * 0.32;
    ctx.beginPath();
    ctx.arc(
      t.x,
      t.y,
      baseR * 0.85 * (t.scale || state.ball.scale),
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "#f0f2ee";
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const lift = (1 - state.ball.scale) * 8;
  ctx.beginPath();
  ctx.ellipse(
    state.ball.x,
    state.ball.y + shadowDrop * 0.92 * state.ball.scale + lift * 0.2,
    shadowRX * state.ball.scale,
    shadowRY * state.ball.scale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = `rgba(0,0,0,${0.18 + state.ball.scale * 0.1})`;
  ctx.fill();

  drawSoccerBall(
    state.ball.x,
    state.ball.y,
    flightR * state.ball.scale,
    state.ball.spinY || 0,
    state.ball.spinX || 0
  );
}

function drawFlash() {
  if (state.flash <= 0) return;
  ctx.fillStyle = `rgba(232,255,106,${state.flash * 0.18})`;
  ctx.fillRect(0, 0, state.w, state.h);
}

function update(dt) {
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 1.8);
  if (state.crowdPulse > 0) state.crowdPulse = Math.max(0, state.crowdPulse - dt * 0.9);
  if (state.netShake > 0) state.netShake = Math.max(0, state.netShake - dt * 0.9);
  if (state.ball?.trail?.length) {
    for (const t of state.ball.trail) t.a *= 0.86;
    state.ball.trail = state.ball.trail.filter((t) => t.a >= 0.05);
  }
}

function renderBackdrop() {
  const grad = ctx.createLinearGradient(0, 0, 0, state.h);
  grad.addColorStop(0, "#0c1a14");
  grad.addColorStop(1, "#06110d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, state.w, state.h);
}

function render() {
  try {
    if (state.mode === "title" || state.mode === "result") {
      renderBackdrop();
      return;
    }

    drawSky();
    drawCrowd();
    drawPitch();
    drawGoal();
    // 奥（小さい y）から手前へ。ボールがキッカー背中に張り付いて見えないようにする
    const spot = penaltyLayout().spot;
    const layers = [];

    const diveAim =
      state.keeperProgress > 0.02
        ? keeperDiveAim(state.keeperDir || "center", state.keeperHeight || "mid")
        : keeperReadyAim();
    layers.push({ y: worldFromAim(diveAim).y, tie: 0, draw: drawKeeper });

    let ballY = null;
    if (state.ball) ballY = state.ball.y;
    else if (
      state.mode === "play" &&
      (state.phase === "ready" ||
        state.phase === "ready-save" ||
        state.phase === "whistle")
    ) {
      ballY = spot.y;
    }
    if (ballY != null) layers.push({ y: ballY, tie: 1, draw: drawBall });

    let shooterY = null;
    if (state.kicker) shooterY = state.kicker.y;
    else if (
      state.mode === "play" &&
      ((state.turn === "you-shoot" &&
        (state.phase === "ready" || state.phase === "whistle")) ||
        (state.turn === "you-save" &&
          (state.phase === "ready-save" || state.phase === "whistle")))
    ) {
      const a = state.approach;
      if (a?.from) shooterY = a.from.y;
      else shooterY = spot.y + state.h * 0.12;
    }
    if (shooterY != null) layers.push({ y: shooterY, tie: 2, draw: drawShooter });

    layers.sort((a, b) => a.y - b.y || a.tie - b.tie);
    for (const layer of layers) layer.draw();

    drawWeatherOverlay();
    drawFlash();
  } catch (err) {
    console.error("render", err);
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

els.btnStart.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  startMatch();
});
els.btnRetry.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  startMatch();
});

window.addEventListener("keydown", (e) => {
  if (state.mode === "title" && (e.key === "Enter" || e.key === " ")) {
    startMatch();
    return;
  }
  if (e.key === " ") {
    if (state.phase === "ready" && state.turn === "you-shoot") {
      e.preventDefault();
      signalAndStartRunup("shoot");
    } else if (state.phase === "ready-save" && state.turn === "you-save") {
      e.preventDefault();
      signalAndStartRunup("save");
    }
  }
});

canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
window.addEventListener("pointermove", onPointerMove);

let resizeTimer = 0;
function scheduleLayoutRefresh() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resize();
    if (state.mode === "play") refreshFixedGoal();
  }, 32);
}

window.addEventListener("resize", scheduleLayoutRefresh);
const layoutObserver = new ResizeObserver(scheduleLayoutRefresh);
layoutObserver.observe(canvas);
resize();
requestAnimationFrame(loop);

window.__PK_LOADED = true;
