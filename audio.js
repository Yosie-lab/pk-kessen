window.__PK_LOADED = true;
try {
  const errEl = document.getElementById("boot-error");
  if (errEl) errEl.hidden = true;
} catch (_) {}

/** Mixkit 無料効果音（Mixkit License）＋合成crowdレイヤー */

const FILES = {
  kick: "sounds/kick.mp3",
  kickQuick: "sounds/kick-quick.mp3",
  cheer: "sounds/cheer.mp3",
  cheerYell: "sounds/cheer-yell.mp3",
  cheerVictory: "sounds/cheer-victory.mp3",
  cheerWhistle: "sounds/cheer-whistle.mp3",
  cheerShort: "sounds/cheer-short.mp3",
  cheerChant: "sounds/cheer-chant.mp3",
  cheerChaos: "sounds/cheer-chaos.mp3",
  crowdStadium: "sounds/crowd-stadium.mp3",
  applauseMedium: "sounds/applause-medium.mp3",
  applauseStadium: "sounds/applause-stadium.mp3",
  applauseCrowd: "sounds/applause-crowd.mp3",
  applauseStrong: "sounds/applause-strong.mp3",
  applauseRhythm: "sounds/applause-rhythm.mp3",
  applauseHall: "sounds/applause-hall.mp3",
  postHit1: "sounds/post-hit-1.mp3",
  postHit2: "sounds/post-hit-2.mp3",
  postHit3: "sounds/post-hit-3.mp3",
  postHit4: "sounds/post-hit-4.mp3",
  barHit1: "sounds/bar-hit-1.mp3",
  barHit2: "sounds/bar-hit-2.mp3",
  barHit3: "sounds/bar-hit-3.mp3",
  metalTap: "sounds/metal-tap.mp3",
  whistleBlast: "sounds/whistle-blast.m4a",
};

/** 歓声のベース候補（毎回ランダムに組み合わせ） */
const CHEER_BEDS = ["cheer", "cheerVictory", "cheerChaos", "cheerChant", "crowdStadium"];
const CHEER_YELLS = ["cheerYell", "cheerShort", "cheerVictory", "cheerChaos"];
const CHEER_EXTRAS = ["cheerWhistle", "cheerShort", "cheerChant"];
const APPLAUSE = [
  "applauseMedium",
  "applauseStadium",
  "applauseCrowd",
  "applauseStrong",
  "applauseRhythm",
  "applauseHall",
];

let unlocked = false;
let cheerTimer = null;
let victoryTimer = null;
let activeCheer = [];
let cheerGen = 0;
let playGen = 0;
let audioCtx = null;

/** 
 * ファイルキーごとのオンデマンドオーディオスロット（Lazy Static Sound Pool）
 * 起動時に84個を一斉生成せず、必要時に最大2個まで遅延生成。
 * iOS Safari でのモジュール初期化メモリクラッシュを完全防止。
 */
const SLOTS_PER_KEY = 6;
const soundPools = {};
const activePoolAudioSet = new Set();

function acquirePoolAudio(key) {
  if (!FILES[key]) return null;
  if (!soundPools[key]) {
    soundPools[key] = [];
  }
  const pool = soundPools[key];

  // 空いている（再生が完了している／停止中）エレメントを優先して即座に解放＆再利用
  for (let i = 0; i < pool.length; i++) {
    const el = pool[i];
    if (el && (el.paused || el.ended || !el._inUse)) {
      el._inUse = true;
      el._instanceGen = (el._instanceGen || 0) + 1;
      try {
        el.volume = 1.0;
      } catch (_) {}
      activePoolAudioSet.add(el);
      return el;
    }
  }

  if (pool.length < SLOTS_PER_KEY) {
    try {
      const el = new Audio(FILES[key]);
      el.preload = "auto";
      el._inUse = true;
      el._key = key;
      el._instanceGen = 1;
      pool.push(el);
      activePoolAudioSet.add(el);
      return el;
    } catch (_) {}
  }

  // スロットが全て埋まっている場合、最も古いエレメントを強制リセットして再利用（2回目以降の音落流し防止）
  const el = pool[0];
  if (el) {
    el._inUse = true;
    el._instanceGen = (el._instanceGen || 0) + 1;
    try {
      el.pause();
      el.currentTime = 0;
      el.volume = 1.0;
    } catch (_) {}
    activePoolAudioSet.add(el);
    return el;
  }

  return null;
}

function releasePoolAudio(el) {
  if (!el) return;
  el._inUse = false;
  el._instanceGen = (el._instanceGen || 0) + 1;
  activePoolAudioSet.delete(el);
  try {
    el.pause();
    el.currentTime = 0;
    el.volume = 1.0;
  } catch (_) {}
}

const activeFadeCancels = new Set();
const pendingPlayTimers = new Set();
const activeMasterNodes = new Set();
const activeAudioSources = new Set();

function trackMaster(master) {
  if (master) activeMasterNodes.add(master);
  return master;
}

function releaseMaster(master) {
  if (!master) return;
  activeMasterNodes.delete(master);
  try {
    master.disconnect();
  } catch (_) {}
}

function trackSource(src) {
  if (src) activeAudioSources.add(src);
  return src;
}

function releaseSource(src) {
  if (!src) return;
  activeAudioSources.delete(src);
  try {
    src.stop();
  } catch (_) {}
  try {
    src.disconnect();
  } catch (_) {}
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

function pickN(arr, n) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}



function trackPlayTimer(id) {
  pendingPlayTimers.add(id);
  return id;
}

function clearPlayTimers() {
  for (const id of pendingPlayTimers) clearTimeout(id);
  pendingPlayTimers.clear();
}

function playClone(key, volume = 1, rate = 1, startAt = 0, delayMs = 0) {
  const a = acquirePoolAudio(key);
  if (!a) return null;

  const currentGen = a._instanceGen;

  try {
    a.volume = Math.max(0, Math.min(1, volume));
    a.playbackRate = Math.max(0.5, Math.min(2.0, rate));
  } catch (_) {}
  
  const gen = playGen;

  const onEnded = () => {
    a.removeEventListener("ended", onEnded);
    if (a._instanceGen === currentGen) {
      releasePoolAudio(a);
    }
  };
  a.addEventListener("ended", onEnded, { once: true });

  const tryPlay = (attempt = 0) => {
    if (gen !== playGen || a._instanceGen !== currentGen) {
      if (a._instanceGen === currentGen) releasePoolAudio(a);
      return;
    }
    try {
      const dur = a.duration;
      if (Number.isFinite(dur) && dur > 0.4) {
        const maxStart = Math.max(0, dur * 0.55);
        a.currentTime = Math.min(startAt, maxStart);
      } else {
        a.currentTime = startAt;
      }
    } catch (_) {}
    const p = a.play();
    if (p && p.catch) {
      p.catch(() => {
        if (gen === playGen && a._instanceGen === currentGen && attempt < 2) {
          trackPlayTimer(setTimeout(() => tryPlay(attempt + 1), 60 + attempt * 80));
        } else if (a._instanceGen === currentGen) {
          releasePoolAudio(a);
        }
      });
    }
  };

  const start = () => {
    if (gen !== playGen || a._instanceGen !== currentGen) {
      if (a._instanceGen === currentGen) releasePoolAudio(a);
      return;
    }
    tryPlay(0);
  };

  if (delayMs > 8) {
    trackPlayTimer(setTimeout(start, delayMs));
  } else {
    start();
  }

  return a;
}

function getCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

/** ブラウザの自動再生制限を軽量に解除（メインスレッドをブロックしない） */
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  if (unlocked) return;
  unlocked = true;

  // 1つのダミー音声のみアンロックし、ブラウザの音声を即時権限解除
  const pool = soundPools.whistleBlast;
  if (pool && pool[0]) {
    const a = pool[0];
    const origVol = a.volume;
    a.volume = 0.001;
    const p = a.play();
    if (p && p.then) {
      p.then(() => {
        a.pause();
        a.currentTime = 0;
        a.volume = origVol;
      }).catch(() => {});
    }
  }
}

/** キック開始の審判ホイッスル（サッカーの短い「ピー」） */
export function playWhistle() {
  unlockAudio();
  try {
    playClone("whistleBlast", 1, 1, 0, 0);
  } catch (_) {}
}

/** ボールを蹴った瞬間（重い／普通／軽いをその都度変える） */
export function playKick() {
  unlockAudio();
  const roll = Math.random();
  if (roll < 0.22) playKickLight();
  else if (roll < 0.42) playKickSoft();
  else if (roll < 0.72) playKickMedium();
  else playKickHard();
}

/** しっかり蹴った音 */
function playKickHard() {
  const rate = rand(0.88, 1.02);
  playClone("kick", rand(0.88, 1.0), rate, 0, 0);
  playClone("kickQuick", rand(0.4, 0.6), rand(0.95, 1.08), 0, rand(12, 28));
  playKickBodyThump(rand(0.25, 0.38), rand(90, 130));
}

/** 普通のキック */
function playKickMedium() {
  const which = Math.random() > 0.45 ? "kick" : "kickQuick";
  playClone(which, rand(0.75, 0.95), rand(0.96, 1.12), 0, 0);
  if (Math.random() > 0.4) {
    playClone(which === "kick" ? "kickQuick" : "kick", rand(0.3, 0.48), rand(1.05, 1.2), 0, rand(10, 22));
  }
  playKickBodyThump(rand(0.15, 0.25), rand(110, 160));
}

/** 軽めのサンプルキック */
function playKickSoft() {
  playClone("kickQuick", rand(0.5, 0.75), rand(1.12, 1.35), 0, 0);
  if (Math.random() > 0.5) {
    playClone("kick", rand(0.25, 0.42), rand(1.15, 1.4), 0, rand(8, 18));
  }
  playKickLeatherTap(rand(0.2, 0.35));
  playKickBodyThump(rand(0.08, 0.15), rand(140, 200));
}

/** そっと触れるような軽いキック（合成） */
function playKickLight() {
  playKickLeatherTap(rand(0.3, 0.5));
  playKickBodyThump(rand(0.1, 0.18), rand(160, 240));
  if (Math.random() > 0.35) {
    playClone("kickQuick", rand(0.15, 0.32), rand(1.25, 1.55), 0, rand(4, 14));
  }
}

/** 靴×ボールの短いパチッ／トン */
function playKickLeatherTap(intensity = 0.3) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const master = trackMaster(ctx.createGain());
  master.gain.value = intensity;
  master.connect(ctx.destination);

  const nLen = Math.floor(ctx.sampleRate * rand(0.025, 0.05));
  const buf = ctx.createBuffer(1, nLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < nLen; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (nLen * 0.18));
  }
  const noise = trackSource(ctx.createBufferSource());
  noise.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = rand(900, 2200);
  bp.Q.value = rand(0.7, 1.6);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = rand(400, 800);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(rand(0.45, 0.8), now + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, now + rand(0.04, 0.09));
  noise.connect(hp);
  hp.connect(bp);
  bp.connect(g);
  g.connect(master);
  noise.start(now);
  noise.stop(now + 0.1);
  noise.onended = () => {
    releaseSource(noise);
    releaseMaster(master);
    try { hp.disconnect(); bp.disconnect(); g.disconnect(); } catch (_) {}
  };
}

/** ボールの胴に当たる低いトン */
function playKickBodyThump(intensity = 0.2, freq = 120) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = trackSource(ctx.createOscillator());
  const g = trackMaster(ctx.createGain());
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.45), now + 0.12);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(intensity, now + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, now + rand(0.1, 0.18));
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
  osc.onended = () => {
    releaseSource(osc);
    releaseMaster(g);
    try { g.disconnect(); } catch (_) {}
  };
}

const POST_HITS = ["postHit1", "postHit2", "postHit3", "postHit4", "metalTap"];
const BAR_HITS = ["barHit1", "barHit2", "barHit3", "postHit2", "metalTap"];

/**
 * ポスト／バーに当たった金属音（実サンプル＋重厚打撃＋歓喜/悲鳴アクセント）
 * @param {"left"|"right"|"bar"} part
 */
export function playPostHit(part = "left") {
  unlockAudio();
  const isBar = part === "bar";
  const key = pick(isBar ? BAR_HITS : POST_HITS);

  if (isBar) {
    const a = playClone(key, rand(0.7, 0.95), rand(0.92, 1.08), rand(0, 0.05));
    trackPlayTimer(setTimeout(() => fadeOut(a, rand(400, 650)), rand(160, 280)));
    if (Math.random() > 0.3) {
      const tap = playClone("metalTap", rand(0.4, 0.65), rand(1.05, 1.25), 0, rand(8, 20));
      trackPlayTimer(setTimeout(() => fadeOut(tap, 280), 200));
    }
    const gasp = playClone("cheerShort", rand(0.65, 0.88), rand(1.02, 1.14), 0, 10);
    if (gasp) activeCheer.push(gasp);
    playWoodworkThump(rand(0.25, 0.4), rand(110, 160));
  } else {
    const a = playClone(key, rand(0.8, 1.0), rand(0.88, 1.05), rand(0, 0.04));
    trackPlayTimer(setTimeout(() => fadeOut(a, rand(280, 480)), rand(120, 220)));
    if (Math.random() > 0.4) {
      const layer = playClone(pick(POST_HITS), rand(0.45, 0.7), rand(0.95, 1.15), 0, rand(10, 28));
      trackPlayTimer(setTimeout(() => fadeOut(layer, 260), 180));
    }
    const gasp = playClone("cheerShort", rand(0.65, 0.88), rand(0.98, 1.12), 0, 15);
    if (gasp) activeCheer.push(gasp);
    playWoodworkThump(rand(0.3, 0.45), rand(85, 130));
  }
}

/** ボールが当たったときの低い胴鳴り（ごく薄く） */
function playWoodworkThump(intensity = 0.12, freq = 130) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = trackSource(ctx.createOscillator());
  const g = trackMaster(ctx.createGain());
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(45, freq * 0.5), now + 0.14);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(intensity, now + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.18);
  osc.onended = () => {
    releaseSource(osc);
    releaseMaster(g);
    try { g.disconnect(); } catch (_) {}
  };
}

function stopCheer() {
  cheerGen++;
  if (cheerTimer) {
    clearTimeout(cheerTimer);
    cheerTimer = null;
  }
  if (victoryTimer) {
    clearTimeout(victoryTimer);
    victoryTimer = null;
  }
  for (const cancel of activeFadeCancels) cancel();
  activeFadeCancels.clear();
  const cheerClones = activeCheer.slice();
  activeCheer = [];
  for (const a of cheerClones) {
    if (a) releasePoolAudio(a);
  }
}

/** 試合開始時：再生中サウンドとプールを一括リセット */
export function resetMatchAudio() {
  playGen++;
  clearPlayTimers();
  stopCheer();
  for (const el of Array.from(activePoolAudioSet)) {
    releasePoolAudio(el);
  }
  for (const src of Array.from(activeAudioSources)) {
    releaseSource(src);
  }
  for (const master of Array.from(activeMasterNodes)) {
    releaseMaster(master);
  }
}

const CHEER_VOL_SCALE = 0.8;
const VICTORY_VOL = 1.0;
/** 勝利歓声：毎回同じ長さ（2.5〜3.5秒） */
const VICTORY_HOLD_MS = 2600;
const VICTORY_FADE_MS = 600;
const VICTORY_SWELL_DUR = 3.0;

function playVictoryClone(key, delayMs = 0, startAt = 0) {
  return playClone(key, VICTORY_VOL, rand(0.98, 1.04), startAt, delayMs);
}

/** ゴール直後に必ず鳴る限界突破の極上爆発地鳴りアクセント */
function playGoalSting(targetList = null, volScale = CHEER_VOL_SCALE) {
  const list = targetList || activeCheer;
  const victory = playClone("cheerVictory", 1.0 * volScale, rand(0.96, 1.06), 0, 0);
  if (victory) list.push(victory);
  const yell = playClone("cheerYell", 1.0 * volScale, rand(0.98, 1.08), 0, rand(0, 10));
  if (yell) list.push(yell);
  const chaos = playClone("cheerChaos", 1.0 * volScale, rand(0.96, 1.1), 0, rand(5, 20));
  if (chaos) list.push(chaos);
  const short = playClone("cheerShort", 1.0 * volScale, rand(0.95, 1.05), 0, rand(0, 15));
  if (short) list.push(short);
  const whistle = playClone("cheerWhistle", 1.0 * volScale, rand(1.0, 1.15), 0, rand(5, 25));
  if (whistle) list.push(whistle);
  
  // 歓喜の出だしと完全同時に鳴り響く大拍手
  const clap1 = playClone("applauseStrong", 1.1 * volScale, rand(0.96, 1.08), 0, 0);
  if (clap1) list.push(clap1);
  const clap2 = playClone("applauseStadium", 1.0 * volScale, rand(0.95, 1.05), 0, rand(0, 15));
  if (clap2) list.push(clap2);
  
  // 地鳴りのダブル重低音インパクト
  playKickBodyThump(0.5 * volScale, 75);
  playKickBodyThump(0.35 * volScale, 110);
}

/** 試合開始（キックオフ／もう一度）時のスタジアム歓迎大歓声 */
export function playKickoffCheer() {
  unlockAudio();
  stopCheer();
  const gen = cheerGen;
  const myCheer = [];
  activeCheer = myCheer;

  try {
    const crowd = playClone("crowdStadium", rand(0.75, 0.95) * CHEER_VOL_SCALE, rand(0.96, 1.06), 0, 0);
    if (crowd) myCheer.push(crowd);
    const chant = playClone("cheerChant", rand(0.7, 0.9) * CHEER_VOL_SCALE, rand(0.98, 1.08), 0, rand(20, 80));
    if (chant) myCheer.push(chant);
    const yell = playClone("cheerShort", rand(0.65, 0.85) * CHEER_VOL_SCALE, rand(1.0, 1.12), 0, rand(10, 50));
    if (yell) myCheer.push(yell);

    if (Array.isArray(APPLAUSE)) {
      const clapKeys = pickN(APPLAUSE, 3);
      clapKeys.forEach((key, i) => {
        const clap = playClone(key, rand(0.6, 0.85) * CHEER_VOL_SCALE, rand(0.95, 1.08), 0, rand(10, 60) + i * 40);
        if (clap) myCheer.push(clap);
      });
    }

    try {
      playCrowdSwell({
        intensity: rand(0.65, 0.85) * CHEER_VOL_SCALE,
        bright: rand(0.5, 0.85),
        dur: rand(2.2, 3.2),
        rise: rand(0.04, 0.12),
      });
      playApplauseTexture({
        intensity: rand(0.7, 0.95) * CHEER_VOL_SCALE,
        dur: rand(2.2, 3.2),
        density: rand(0.8, 1.2),
      });
    } catch (_) {}

    const holdMs = rand(2200, 3200) | 0;
    const fadeMs = rand(600, 1000) | 0;

    cheerTimer = trackPlayTimer(
      setTimeout(() => {
        if (gen !== cheerGen) return;
        for (const a of myCheer) fadeOut(a, fadeMs);
        cheerTimer = null;
      }, holdMs)
    );
  } catch (_) {}
}

/**
 * スタジアム超大歓声（通常の歓声：3.5〜5.0秒）
 */
export function playCheer(opts = {}) {
  const lite = opts?.lite;
  unlockAudio();
  stopCheer();
  const gen = cheerGen;
  const myCheer = [];
  activeCheer = myCheer;

  playGoalSting(myCheer);

  if (lite) {
    const yell = playClone(pick(CHEER_YELLS), 1.0 * CHEER_VOL_SCALE, rand(0.96, 1.12), 0, rand(0, 1.2));
    if (yell) myCheer.push(yell);
    const clap = playClone(pick(APPLAUSE), 1.0 * CHEER_VOL_SCALE, rand(0.94, 1.08), 0, rand(0, 90));
    if (clap) myCheer.push(clap);
    cheerTimer = trackPlayTimer(setTimeout(() => {
      if (gen !== cheerGen) return;
      for (const a of myCheer) fadeOut(a, rand(500, 750) | 0);
      cheerTimer = null;
    }, rand(2500, 3500) | 0));
    return;
  }

  // 4枚のベース歓声（全開フルパワー）
  const bedKeys = pickN(["cheerVictory", "cheer", "cheerChaos", "crowdStadium"], 4);
  bedKeys.forEach((key, i) => {
    const bed = playClone(key, 1.0 * CHEER_VOL_SCALE, rand(0.94, 1.08), 0, i * rand(15, 40));
    if (bed) myCheer.push(bed);
  });

  // メイン歓声叫び（4枚全開・ステレオデチューン）
  const yellKeys = pickN(CHEER_YELLS, 4);
  yellKeys.forEach((key, i) => {
    const delay = i === 0 ? 0 : rand(10, 60);
    const a = playClone(
      key,
      1.0 * CHEER_VOL_SCALE,
      rand(0.94, 1.14),
      0,
      delay
    );
    if (a) myCheer.push(a);
  });

  // 3枚のアクセント（ホイッスル/短歓声/チャント）
  const extraKeys = pickN(CHEER_EXTRAS, 3);
  extraKeys.forEach((key, i) => {
    const a = playClone(key, 1.0 * CHEER_VOL_SCALE, rand(0.98, 1.12), 0, rand(30, 150) + i * rand(40, 90));
    if (a) myCheer.push(a);
  });

  // 6枚のスタジアム大拍手
  const clapKeys = pickN(APPLAUSE, 6);
  clapKeys.forEach((key, i) => {
    const a = playClone(
      key,
      1.0 * CHEER_VOL_SCALE,
      rand(0.94, 1.12),
      0,
      rand(5, 80) + i * rand(15, 40)
    );
    if (a) myCheer.push(a);
  });

  // 時間差で押し寄せる大拍手の大波（2波）
  for (let wave = 0; wave < 2; wave++) {
    pickN(APPLAUSE, 3).forEach((key, i) => {
      const late = playClone(
        key,
        rand(0.8, 1.0) * CHEER_VOL_SCALE,
        rand(0.96, 1.08),
        0,
        rand(150, 450) + wave * rand(250, 500) + i * rand(30, 80)
      );
      if (late) myCheer.push(late);
    });
  }

  // 限界突破のスタジアムスウェルと拍手テクスチャ（ダブル重層）
  playCrowdSwell({
    intensity: 1.0 * CHEER_VOL_SCALE,
    bright: rand(0.7, 1.0),
    dur: rand(4.0, 5.0),
    rise: rand(0.02, 0.08),
  });
  playApplauseTexture({
    intensity: 1.0 * CHEER_VOL_SCALE,
    dur: rand(4.0, 5.0),
    density: 1.4,
  });

  const holdMs = rand(3500, 5000) | 0;
  const fadeMs = rand(800, 1200) | 0;

  cheerTimer = trackPlayTimer(
    setTimeout(() => {
      if (gen !== cheerGen) return;
      for (const a of myCheer) fadeOut(a, fadeMs + ((Math.random() * 150) | 0));
      cheerTimer = null;
    }, holdMs)
  );
}

/** 勝利歓声用：プール・タイマー・合成レイヤーを全解放（2回目以降も1回目と同じ） */
function prepareVictoryCelebration() {
  playGen++;
  clearPlayTimers();
  stopCheer();
  for (const el of Array.from(activePoolAudioSet)) {
    releasePoolAudio(el);
  }
  for (const src of Array.from(activeAudioSources)) {
    releaseSource(src);
  }
  for (const master of Array.from(activeMasterNodes)) {
    releaseMaster(master);
  }
}

/** PK戦勝利：歓声100%＋拍手（2.5〜3.5秒・再勝利時も同一） */
export function playVictoryCelebration() {
  unlockAudio();
  prepareVictoryCelebration();

  const victoryGen = cheerGen;
  const victoryCheer = [];
  activeCheer = victoryCheer;

  // 歓声インパクト＋即時拍手
  playGoalSting(victoryCheer, VICTORY_VOL);

  // メイン歓声ベッド
  pickN(["crowdStadium", "cheerVictory", "cheer"], 2).forEach((key, i) => {
    const a = playVictoryClone(key, i * 20);
    if (a) victoryCheer.push(a);
  });

  // 歓声の叫び
  pickN(CHEER_YELLS, 2).forEach((key, i) => {
    const a = playVictoryClone(key, 40 + i * 40);
    if (a) victoryCheer.push(a);
  });

  // 拍手サンプル（歓声と同時〜0.5秒）
  pickN(APPLAUSE, 4).forEach((key, i) => {
    const a = playVictoryClone(key, i * 80);
    if (a) victoryCheer.push(a);
  });

  // 合成レイヤー：歓声スウェル＋拍手テクスチャ
  playCrowdSwell({
    intensity: VICTORY_VOL,
    bright: rand(0.6, 0.85),
    dur: VICTORY_SWELL_DUR,
    rise: rand(0.08, 0.16),
  });
  playApplauseTexture({
    intensity: VICTORY_VOL,
    dur: VICTORY_SWELL_DUR,
    density: rand(1.1, 1.45),
  });

  victoryTimer = trackPlayTimer(
    setTimeout(() => {
      if (victoryGen !== cheerGen) return;
      for (const a of victoryCheer) fadeOut(a, VICTORY_FADE_MS);
      victoryTimer = null;
    }, VICTORY_HOLD_MS)
  );
}

/** 相手キーパーに阻まれた・ファインセーブ成功時：最大級のスタジアム大歓喜・大喝采 */
export function playBlockedByKeeper(opts = {}) {
  const lite = opts?.lite;
  unlockAudio();
  stopCheer();
  const gen = cheerGen;
  const myCheer = [];
  activeCheer = myCheer;

  const sting = playClone("cheerShort", 1.0 * CHEER_VOL_SCALE, rand(0.96, 1.08), 0, 0);
  if (sting) myCheer.push(sting);
  const yell = playClone("cheerYell", 1.0 * CHEER_VOL_SCALE, rand(0.98, 1.12), 0, rand(0, 15));
  if (yell) myCheer.push(yell);
  const chaos = playClone("cheerChaos", 0.9 * CHEER_VOL_SCALE, rand(0.96, 1.08), 0, rand(10, 30));
  if (chaos) myCheer.push(chaos);

  const crowd = playClone("crowdStadium", rand(0.8, 1.0) * CHEER_VOL_SCALE, rand(0.76, 0.92), rand(0, 1.4), rand(0, 25));
  if (crowd) myCheer.push(crowd);

  const clapKeys = pickN(APPLAUSE, 3);
  clapKeys.forEach((key, i) => {
    const clap = playClone(key, rand(0.7, 0.95) * CHEER_VOL_SCALE, rand(0.92, 1.08), rand(0, 1.2), rand(15, 80) + i * 30);
    if (clap) myCheer.push(clap);
  });

  if (!lite) {
    playCrowdSwell({
      intensity: 0.95 * CHEER_VOL_SCALE,
      bright: rand(0.6, 0.95),
      dur: rand(1.8, 2.8),
      rise: rand(0.03, 0.1),
    });
    playApplauseTexture({
      intensity: 0.95 * CHEER_VOL_SCALE,
      dur: rand(1.8, 3.0),
      density: rand(0.85, 1.3),
    });
  }

  const holdMs = rand(1500, 2400) | 0;
  const fadeMs = rand(500, 850) | 0;
  cheerTimer = trackPlayTimer(
    setTimeout(() => {
      if (gen !== cheerGen) return;
      for (const a of myCheer) fadeOut(a, fadeMs);
      cheerTimer = null;
    }, holdMs)
  );
}

/** 枠外・シュートミス・失点時：スタジアム数万人の大ため息・落胆の大どよめき（超大迫力） */
export function playMiss() {
  unlockAudio();
  stopCheer();

  const bed1 = playClone("crowdStadium", 0.95, rand(0.6, 0.8), rand(0, 1.2));
  if (bed1) activeCheer.push(bed1);
  const bed2 = playClone("cheerYell", 0.9, rand(0.65, 0.82), rand(0, 1.0));
  if (bed2) activeCheer.push(bed2);
  const bed3 = playClone("cheerChaos", 0.85, rand(0.6, 0.78), rand(0, 1.5));
  if (bed3) activeCheer.push(bed3);

  playCrowdSwell({
    intensity: 0.9,
    bright: rand(0.3, 0.6),
    dur: rand(2.0, 3.2),
    rise: rand(0.04, 0.15),
  });

  const hold = rand(1400, 2200) | 0;
  trackPlayTimer(setTimeout(() => {
    for (const a of activeCheer) fadeOut(a, rand(500, 850) | 0);
  }, hold));
  
  playDisappointedCrowd();
}

/** 歓声の下に敷く、毎回違う群衆スウェル */
function playCrowdSwell({ intensity = 0.5, bright = 0.6, dur = 2, rise = 0.1 } = {}) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const master = trackMaster(ctx.createGain());
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.0001 + intensity * 0.55, now + rise);
  master.gain.linearRampToValueAtTime(intensity * 0.35, now + dur * 0.55);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  master.connect(ctx.destination);

  const layers = 2 + ((Math.random() * 2) | 0);
  for (let i = 0; i < layers; i++) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let pink = 0;
    for (let s = 0; s < len; s++) {
      const white = Math.random() * 2 - 1;
      pink = pink * 0.86 + white * 0.14;
      const env = Math.sin((Math.PI * s) / len);
      data[s] = (pink * 0.7 + white * 0.3) * env * 0.7;
    }
    const src = trackSource(ctx.createBufferSource());
    src.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 350 + bright * 900 + i * 180 + rand(-60, 60);
    bp.Q.value = rand(0.5, 1.4);
    const g = ctx.createGain();
    g.gain.value = 0.18 + intensity * 0.12;
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(now + i * rand(0, 0.05));
    src.stop(now + dur);
    src.onended = () => {
      releaseSource(src);
      try { bp.disconnect(); g.disconnect(); } catch (_) {}
    };
  }

  if (Math.random() > 0.4) {
    const bursts = 2 + ((Math.random() * 4) | 0);
    for (let i = 0; i < bursts; i++) {
      const t0 = now + rand(0.05, dur * 0.55);
      const osc = trackSource(ctx.createOscillator());
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      osc.type = "triangle";
      osc.frequency.value = rand(220, 680);
      f.type = "bandpass";
      f.frequency.value = rand(800, 2200);
      f.Q.value = 4;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(rand(0.03, 0.09), t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + rand(0.12, 0.35));
      osc.connect(f);
      f.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.4);
      osc.onended = () => {
        releaseSource(osc);
        try { f.disconnect(); g.disconnect(); } catch (_) {}
      };
    }
  }

  trackPlayTimer(setTimeout(() => {
    releaseMaster(master);
  }, Math.ceil((dur + 0.3) * 1000)));
}

let sharedClapBuffer = null;
let sharedNoiseBuffer = null;

function getSharedClapBuffer(ctx) {
  if (!sharedClapBuffer && ctx) {
    const len = Math.floor(ctx.sampleRate * 0.045);
    sharedClapBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = sharedClapBuffer.getChannelData(0);
    for (let s = 0; s < len; s++) {
      data[s] = (Math.random() * 2 - 1) * Math.exp(-s / (len * 0.22));
    }
  }
  return sharedClapBuffer;
}

function getSharedNoiseBuffer(ctx) {
  if (!sharedNoiseBuffer && ctx) {
    const len = Math.floor(ctx.sampleRate * 2.5);
    sharedNoiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = sharedNoiseBuffer.getChannelData(0);
    let pink = 0;
    for (let s = 0; s < len; s++) {
      const white = Math.random() * 2 - 1;
      pink = pink * 0.86 + white * 0.14;
      data[s] = (pink * 0.7 + white * 0.3) * 0.7;
    }
  }
  return sharedNoiseBuffer;
}

/** 実サンプル下に敷く細かい拍手テクスチャ（共有バッファ・ノード自動解放） */
function playApplauseTexture({ intensity = 0.6, dur = 2.2, density = 0.8 } = {}) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const master = trackMaster(ctx.createGain());
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.0001 + intensity * 0.45, now + 0.08);
  master.gain.linearRampToValueAtTime(intensity * 0.28, now + dur * 0.5);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  master.connect(ctx.destination);

  const clapBuf = getSharedClapBuffer(ctx);
  if (!clapBuf) return;

  const clapCount = Math.min(24, (12 + density * 20) | 0);
  for (let i = 0; i < clapCount; i++) {
    const t0 = now + rand(0.02, dur * 0.85);
    const src = trackSource(ctx.createBufferSource());
    src.buffer = clapBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = rand(1200, 3800);
    bp.Q.value = rand(0.6, 1.8);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = rand(400, 900);
    const g = ctx.createGain();
    g.gain.value = rand(0.04, 0.14) * intensity;
    src.connect(hp);
    hp.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(t0);
    const stopTime = t0 + 0.06;
    src.stop(stopTime);
    src.onended = () => {
      releaseSource(src);
      try {
        hp.disconnect();
        bp.disconnect();
        g.disconnect();
      } catch (_) {}
    };
  }

  trackPlayTimer(setTimeout(() => {
    releaseMaster(master);
  }, Math.ceil((dur + 0.2) * 1000)));
}

function playDisappointedCrowd() {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const dur = rand(1.25, 1.75);
  const peak = rand(0.55, 0.82);
  const master = trackMaster(ctx.createGain());
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(peak, now + rand(0.06, 0.12));
  master.gain.exponentialRampToValueAtTime(peak * 0.6, now + dur * 0.4);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  master.connect(ctx.destination);

  const noiseBuf = getSharedNoiseBuffer(ctx);
  if (noiseBuf) {
    const noise = trackSource(ctx.createBufferSource());
    noise.buffer = noiseBuf;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = rand(400, 600);
    noiseFilter.Q.value = rand(0.55, 0.9);
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = rand(0.38, 0.55);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);
    noise.stop(now + dur);
    noise.onended = () => {
      releaseSource(noise);
      try {
        noiseFilter.disconnect();
        noiseGain.disconnect();
      } catch (_) {}
    };
  }

  const count = 4;
  for (let i = 0; i < count; i++) {
    const osc = trackSource(ctx.createOscillator());
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    osc.type = "triangle";
    const base = rand(240, 920);
    const detune = (Math.random() - 0.5) * 60;
    osc.frequency.setValueAtTime(base + detune, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(70, (base + detune) * rand(0.5, 0.68)), now + dur * 0.85);
    filt.type = "lowpass";
    filt.frequency.value = rand(1000, 1500);
    const vol = rand(0.08, 0.18);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + rand(0.08, 0.18));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.9);
    osc.connect(filt);
    filt.connect(g);
    g.connect(master);
    const tStart = now + rand(0, 0.08);
    osc.start(tStart);
    osc.stop(now + dur);
    osc.onended = () => {
      releaseSource(osc);
      try {
        filt.disconnect();
        g.disconnect();
      } catch (_) {}
    };
  }

  trackPlayTimer(setTimeout(() => {
    releaseMaster(master);
  }, Math.ceil((dur + 0.2) * 1000)));
}

function fadeOut(audio, duration) {
  if (!audio) return;
  const currentGen = audio._instanceGen;
  const STEPS = 10;
  const stepMs = Math.max(16, duration / STEPS);
  const startVol = audio.volume;
  let step = 0;
  let done = false;
  let timerId = 0;

  const finish = () => {
    if (done) return;
    done = true;
    pendingPlayTimers.delete(timerId);
    activeFadeCancels.delete(cancel);
    if (audio._instanceGen === currentGen) {
      releasePoolAudio(audio);
    }
  };

  const tick = () => {
    if (done || audio._instanceGen !== currentGen) {
      done = true;
      pendingPlayTimers.delete(timerId);
      activeFadeCancels.delete(cancel);
      return;
    }
    step++;
    const t = Math.min(1, step / STEPS);
    try {
      audio.volume = Math.max(0, Math.min(1, startVol * (1 - t)));
    } catch (_) {}
    if (t < 1) {
      timerId = setTimeout(tick, stepMs);
      pendingPlayTimers.add(timerId);
    } else {
      finish();
    }
  };

  const cancel = () => {
    if (done) return;
    done = true;
    clearTimeout(timerId);
    pendingPlayTimers.delete(timerId);
    activeFadeCancels.delete(cancel);
    if (audio._instanceGen === currentGen) {
      releasePoolAudio(audio);
    }
  };
  activeFadeCancels.add(cancel);
  timerId = setTimeout(tick, stepMs);
  pendingPlayTimers.add(timerId);
}
