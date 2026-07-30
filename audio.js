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

const cache = {};
let unlocked = false;
let cheerTimer = null;
let activeCheer = [];
let cheerGen = 0;
let playGen = 0;
let audioCtx = null;

/** 
 * 固定 HTMLAudioElement プール（Zero-Allocation Fixed Audio Pool）
 * 毎回の cloneNode や new Audio を完全追放し、メディアデコーダーのリークを100%防止。
 * 本来の HTMLAudioElement の圧倒的な高音質・重低音・臨場感をそのまま維持。
 */
const POOL_SIZE = 36;
const audioPool = [];
const activePoolSet = new Set();

for (let i = 0; i < POOL_SIZE; i++) {
  const el = new Audio();
  el.preload = "auto";
  audioPool.push(el);
}

function acquirePoolAudio() {
  for (let i = 0; i < POOL_SIZE; i++) {
    const el = audioPool[i];
    if (!activePoolSet.has(el)) {
      activePoolSet.add(el);
      return el;
    }
  }
  // 万が一あふれたら一番古いものを再利用
  const oldest = activePoolSet.values().next().value;
  if (oldest) {
    try { oldest.pause(); } catch (_) {}
    return oldest;
  }
  return null;
}

function releasePoolAudio(el) {
  if (!el) return;
  activePoolSet.delete(el);
  try {
    el.pause();
    el.currentTime = 0;
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

function getAudio(key) {
  if (!cache[key]) {
    const a = new Audio(FILES[key]);
    a.preload = "auto";
    cache[key] = a;
  }
  return cache[key];
}

/** 起動時にサンプルを先読み（ゴール時の無音対策） */
function preloadSounds() {
  Object.keys(FILES).forEach((key) => {
    try {
      getAudio(key).load();
    } catch (_) {}
  });
}
preloadSounds();

function trackPlayTimer(id) {
  pendingPlayTimers.add(id);
  return id;
}

function clearPlayTimers() {
  for (const id of pendingPlayTimers) clearTimeout(id);
  pendingPlayTimers.clear();
}

function playClone(key, volume = 1, rate = 1, startAt = 0, delayMs = 0) {
  const fileUrl = FILES[key];
  if (!fileUrl) return null;

  const a = acquirePoolAudio();
  if (!a) return null;

  a.src = fileUrl;
  a.volume = Math.max(0, Math.min(1, volume));
  a.playbackRate = rate;
  
  const gen = playGen;

  const onEnded = () => {
    a.removeEventListener("ended", onEnded);
    releasePoolAudio(a);
  };
  a.addEventListener("ended", onEnded, { once: true });

  const tryPlay = (attempt = 0) => {
    if (gen !== playGen) {
      releasePoolAudio(a);
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
        if (gen === playGen && attempt < 2) {
          trackPlayTimer(setTimeout(() => tryPlay(attempt + 1), 60 + attempt * 80));
        } else {
          releasePoolAudio(a);
        }
      });
    }
  };

  const start = () => {
    if (gen !== playGen) {
      releasePoolAudio(a);
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

/** ブラウザの自動再生制限を解除（最初のユーザー操作で呼ぶ） */
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  if (unlocked) return;
  unlocked = true;
  Object.keys(FILES).forEach((key) => {
    const a = getAudio(key);
    a.volume = 0;
    const p = a.play();
    if (p && p.then) {
      p.then(() => {
        a.pause();
        a.currentTime = 0;
        a.volume = 1;
      }).catch(() => {});
    }
  });
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
 * ポスト／バーに当たった金属音（実サンプル＋軽い打撃レイヤー）
 * @param {"left"|"right"|"bar"} part
 */
export function playPostHit(part = "left") {
  unlockAudio();
  const isBar = part === "bar";
  const key = pick(isBar ? BAR_HITS : POST_HITS);

  if (isBar) {
    const a = playClone(key, rand(0.35, 0.5), rand(0.92, 1.08), rand(0, 0.05));
    trackPlayTimer(setTimeout(() => fadeOut(a, rand(400, 650)), rand(160, 280)));
    if (Math.random() > 0.45) {
      const tap = playClone("metalTap", rand(0.18, 0.3), rand(1.05, 1.25), 0, rand(8, 20));
      trackPlayTimer(setTimeout(() => fadeOut(tap, 280), 200));
    }
    playWoodworkThump(rand(0.08, 0.14), rand(120, 170));
  } else {
    const a = playClone(key, rand(0.55, 0.8), rand(0.88, 1.05), rand(0, 0.04));
    trackPlayTimer(setTimeout(() => fadeOut(a, rand(280, 480)), rand(120, 220)));
    if (Math.random() > 0.5) {
      const layer = playClone(pick(POST_HITS), rand(0.2, 0.35), rand(0.95, 1.15), 0, rand(10, 28));
      trackPlayTimer(setTimeout(() => fadeOut(layer, 260), 180));
    }
    playWoodworkThump(rand(0.12, 0.22), rand(90, 140));
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
  for (const cancel of activeFadeCancels) cancel();
  activeFadeCancels.clear();
  const cheerClones = activeCheer.slice();
  activeCheer = [];
  for (const a of cheerClones) {
    if (a) fadeOut(a, 250);
  }
}

/** 試合開始時：再生中サウンドとプールを一括リセット */
export function resetMatchAudio() {
  playGen++;
  clearPlayTimers();
  stopCheer();
  for (const el of Array.from(activePoolSet)) {
    releasePoolAudio(el);
  }
  for (const src of Array.from(activeAudioSources)) {
    releaseSource(src);
  }
  for (const master of Array.from(activeMasterNodes)) {
    releaseMaster(master);
  }
}

/** ゴール直後に必ず鳴る強力な地鳴りアクセント */
function playGoalSting() {
  const yell = playClone("cheerYell", 1.0, rand(0.98, 1.06), 0, 0);
  if (yell) activeCheer.push(yell);
  const short = playClone("cheerShort", 1.0, rand(0.95, 1.05), 0, rand(0, 20));
  if (short) activeCheer.push(short);
  const chaos = playClone("cheerChaos", 0.9, rand(0.98, 1.1), 0, rand(5, 30));
  if (chaos) activeCheer.push(chaos);
  const whistle = playClone("cheerWhistle", 0.7, rand(1.0, 1.15), 0, rand(10, 40));
  if (whistle) activeCheer.push(whistle);
  playKickBodyThump(0.35, 90);
}

/**
 * スタジアム大歓声（重厚・大迫力・毎回違う多層レイヤー）
 */
export function playCheer(opts = {}) {
  const lite = opts?.lite;
  unlockAudio();
  stopCheer();
  const gen = cheerGen;

  playGoalSting();

  if (lite) {
    const yell = playClone(pick(CHEER_YELLS), 0.88, rand(0.96, 1.12), rand(0, 1.2));
    if (yell) activeCheer.push(yell);
    const clap = playClone(pick(APPLAUSE), 0.7, rand(0.94, 1.08), rand(0, 90));
    if (clap) activeCheer.push(clap);
    cheerTimer = trackPlayTimer(setTimeout(() => {
      if (gen !== cheerGen) return;
      for (const a of activeCheer) fadeOut(a, rand(420, 620) | 0);
      cheerTimer = null;
    }, rand(1800, 2500) | 0));
    return;
  }

  // 背景の歓声ベース（2枚重ね）
  const bedKeys = pickN(CHEER_BEDS, 2);
  bedKeys.forEach((key, i) => {
    const bed = playClone(key, i === 0 ? 0.85 : 0.65, rand(0.94, 1.08), rand(0, 2.5), i * 40);
    if (bed) activeCheer.push(bed);
  });

  // メイン歓声叫び（3〜4枚の多層レイヤー）
  const yellKeys = pickN(CHEER_YELLS, 4);
  yellKeys.forEach((key, i) => {
    const delay = i === 0 ? 0 : rand(20, 120);
    const a = playClone(
      key,
      i === 0 ? 1.0 : rand(0.75, 0.92),
      rand(0.96, 1.14),
      rand(0, 1.8),
      delay
    );
    if (a) activeCheer.push(a);
  });

  // アクセント（ホイッスル/短歓声）
  const extraKey = pick(CHEER_EXTRAS);
  const extra = playClone(extraKey, rand(0.5, 0.75), rand(0.98, 1.15), rand(0, 1.2), rand(50, 200));
  if (extra) activeCheer.push(extra);

  // 大拍手（4枚重ね）
  const clapKeys = pickN(APPLAUSE, 4);
  clapKeys.forEach((key, i) => {
    const a = playClone(
      key,
      rand(0.7, 0.95) * (i === 0 ? 1 : 0.85),
      rand(0.94, 1.12),
      rand(0, 1.6),
      rand(15, 120) + i * rand(20, 60)
    );
    if (a) activeCheer.push(a);
  });

  // 時間差で湧き起こる拍手
  for (let wave = 0; wave < 2; wave++) {
    const late = playClone(
      pick(APPLAUSE),
      rand(0.5, 0.75),
      rand(0.96, 1.1),
      rand(0.2, 2.0),
      rand(140, 360) + wave * 220
    );
    if (late) activeCheer.push(late);
  }

  const swellOpts = {
    intensity: rand(0.75, 1.0),
    bright: rand(0.5, 1.0),
    dur: rand(2.2, 3.5),
    rise: rand(0.04, 0.15),
  };
  const textureOpts = {
    intensity: rand(0.8, 1.0),
    dur: rand(2.2, 3.5),
    density: rand(0.8, 1.3),
  };
  trackPlayTimer(
    setTimeout(() => {
      if (gen !== cheerGen) return;
      playCrowdSwell(swellOpts);
      playApplauseTexture(textureOpts);
    }, 0)
  );

  const holdMs = rand(2400, 3800) | 0;
  const fadeMs = rand(600, 1000) | 0;

  cheerTimer = trackPlayTimer(
    setTimeout(() => {
      if (gen !== cheerGen) return;
      for (const a of activeCheer) fadeOut(a, fadeMs + ((Math.random() * 150) | 0));
      cheerTimer = null;
    }, holdMs)
  );
}

/** PK戦勝利：圧倒的大歓声＋大拍手の祝福 */
export function playVictoryCelebration() {
  unlockAudio();
  stopCheer();
  const gen = cheerGen;

  playGoalSting();

  const bedKeys = pickN(["cheerVictory", "cheer", "cheerChaos", "crowdStadium"], 4);
  const yellKeys = pickN(CHEER_YELLS, 4);
  const clapKeys = pickN(APPLAUSE, 6);

  const holdMs = rand(4500, 6500) | 0;
  const fadeMs = rand(1000, 1500) | 0;

  bedKeys.forEach((key, i) => {
    const a = playClone(key, 1.0 * (i === 0 ? 1 : 0.85), rand(0.94, 1.08), rand(0, 2.2), i * rand(20, 80));
    if (a) activeCheer.push(a);
  });

  yellKeys.forEach((key, i) => {
    const a = playClone(
      key,
      1.0 * (i === 0 ? 1 : rand(0.75, 0.95)),
      rand(0.96, 1.14),
      rand(0, 1.8),
      rand(0, 150) + i * rand(50, 110)
    );
    if (a) activeCheer.push(a);
  });

  const extraKeys = pickN(CHEER_EXTRAS, 3);
  extraKeys.forEach((key, i) => {
    const a = playClone(key, rand(0.55, 0.82), rand(0.98, 1.12), rand(0, 1.5), rand(60, 280) + i * rand(60, 140));
    if (a) activeCheer.push(a);
  });

  clapKeys.forEach((key, i) => {
    const a = playClone(
      key,
      1.0 * (i === 0 ? 1 : rand(0.8, 0.98)),
      rand(0.94, 1.1),
      rand(0, 2.0),
      rand(0, 180) + i * rand(40, 100)
    );
    if (a) activeCheer.push(a);
  });

  for (let wave = 0; wave < 3; wave++) {
    pickN(APPLAUSE, 3).forEach((key, i) => {
      const a = playClone(
        key,
        rand(0.6, 0.88),
        rand(0.96, 1.08),
        rand(0.1, 2.4),
        rand(400, 900) + wave * rand(400, 700) + i * rand(50, 120)
      );
      if (a) activeCheer.push(a);
    });
  }

  playCrowdSwell({
    intensity: 1.0,
    bright: rand(0.7, 1.0),
    dur: rand(4.0, 6.0),
    rise: rand(0.03, 0.1),
  });
  playApplauseTexture({
    intensity: 1.0,
    dur: rand(4.0, 6.0),
    density: rand(1.0, 1.5),
  });

  cheerTimer = trackPlayTimer(
    setTimeout(() => {
      if (gen !== cheerGen) return;
      for (const a of activeCheer) fadeOut(a, fadeMs + ((Math.random() * 200) | 0));
      cheerTimer = null;
    }, holdMs)
  );
}

/** 相手キーパーに阻まれたとき：悔しさと緊迫の反応（重厚な低音・大喝采） */
export function playBlockedByKeeper(opts = {}) {
  const lite = opts?.lite;
  unlockAudio();
  stopCheer();
  const gen = cheerGen;

  const sting = playClone("cheerShort", rand(0.7, 0.88), rand(0.94, 1.06), 0, 0);
  if (sting) activeCheer.push(sting);
  const crowd = playClone("crowdStadium", rand(0.55, 0.72), rand(0.74, 0.9), rand(0, 1.4), rand(0, 30));
  if (crowd) activeCheer.push(crowd);

  if (Math.random() > 0.25) {
    const clap = playClone(
      pick(APPLAUSE),
      rand(0.42, 0.62),
      rand(0.92, 1.06),
      rand(0, 1.2),
      rand(20, 90)
    );
    if (clap) activeCheer.push(clap);
  }

  if (!lite) {
    playCrowdSwell({
      intensity: rand(0.42, 0.65),
      bright: rand(0.42, 0.72),
      dur: rand(1.2, 1.85),
      rise: rand(0.04, 0.1),
    });
    playApplauseTexture({
      intensity: rand(0.45, 0.68),
      dur: rand(1.3, 1.9),
      density: rand(0.55, 0.85),
    });
  }

  const holdMs = rand(1100, 1650) | 0;
  const fadeMs = rand(420, 680) | 0;
  cheerTimer = trackPlayTimer(
    setTimeout(() => {
      if (gen !== cheerGen) return;
      for (const a of activeCheer) fadeOut(a, fadeMs);
      cheerTimer = null;
    }, holdMs)
  );
}

/** 枠外・シュートミス・失点時：ため息と落胆の大どよめき（大迫力） */
export function playMiss() {
  unlockAudio();
  stopCheer();

  const bed = pick(["crowdStadium", "cheerYell", "cheerChant"]);
  const murmur = playClone(bed, rand(0.48, 0.68), rand(0.62, 0.82), rand(0, 1.5));
  if (murmur) activeCheer = [murmur];
  const hold = rand(850, 1300) | 0;
  trackPlayTimer(setTimeout(() => fadeOut(murmur, rand(450, 750) | 0), hold));
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
    releasePoolAudio(audio);
  };

  const tick = () => {
    if (done) return;
    step++;
    const t = Math.min(1, step / STEPS);
    try { audio.volume = Math.max(0, startVol * (1 - t)); } catch (_) {}
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
    releasePoolAudio(audio);
  };
  activeFadeCancels.add(cancel);
  timerId = setTimeout(tick, stepMs);
  pendingPlayTimers.add(timerId);
}
