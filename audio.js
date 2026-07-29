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
/** cloneNode した HTMLAudioElement の上限（溜まると iOS Safari が重くなる） */
const MAX_PLAYING_CLONES = 18;
const playingClones = [];
const activeFadeCancels = new Set();
const pendingPlayTimers = new Set();

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

function releaseClone(a) {
  const idx = playingClones.indexOf(a);
  if (idx >= 0) playingClones.splice(idx, 1);
}

function trimPlayingClones() {
  while (playingClones.length > MAX_PLAYING_CLONES) {
    const old = playingClones.shift();
    try {
      old.pause();
      old.currentTime = 0;
    } catch (_) {}
  }
}

function trackClone(a) {
  playingClones.push(a);
  trimPlayingClones();
  a.addEventListener(
    "ended",
    () => releaseClone(a),
    { once: true }
  );
  a.addEventListener(
    "pause",
    () => {
      if (a.currentTime <= 0.01 || a.ended) releaseClone(a);
    },
    { once: true }
  );
}

function playClone(key, volume = 1, rate = 1, startAt = 0, delayMs = 0) {
  const base = getAudio(key);
  const a = base.cloneNode();
  a.volume = Math.max(0, Math.min(1, volume));
  a.playbackRate = rate;
  a.preload = "auto";
  trackClone(a);
  const gen = playGen;

  const tryPlay = (attempt = 0) => {
    if (gen !== playGen) return;
    try {
      const dur = a.duration;
      if (Number.isFinite(dur) && dur > 0.4) {
        const maxStart = Math.max(0, dur * 0.55);
        a.currentTime = Math.min(startAt, maxStart);
      }
    } catch (_) {}
    const p = a.play();
    if (p && p.catch) {
      p.catch(() => {
        if (gen === playGen && attempt < 2) {
          trackPlayTimer(setTimeout(() => tryPlay(attempt + 1), 60 + attempt * 80));
        }
      });
    }
  };

  const start = () => {
    if (gen !== playGen) return;
    tryPlay(0);
  };
  if (a.readyState >= 2) {
    if (delayMs > 8) {
      trackPlayTimer(setTimeout(start, delayMs));
    } else {
      start();
    }
  } else {
    a.addEventListener(
      "canplay",
      () => {
        if (gen !== playGen) return;
        if (delayMs > 8) trackPlayTimer(setTimeout(start, delayMs));
        else start();
      },
      { once: true }
    );
    try {
      a.load();
    } catch (_) {}
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
    // Mixkit 警察ホイッスル実録音を短く切ったもの（自然な豆ホイッスルの揺れあり）
    playClone("whistleBlast", 1, 1, 0, 0);
  } catch (_) {
    /* 音声失敗でもゲームは進める */
  }
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
  playClone("kick", rand(0.85, 1), rate, 0, 0);
  playClone("kickQuick", rand(0.35, 0.55), rand(0.95, 1.08), 0, rand(12, 28));
  playKickBodyThump(rand(0.22, 0.35), rand(90, 130));
}

/** 普通のキック */
function playKickMedium() {
  const which = Math.random() > 0.45 ? "kick" : "kickQuick";
  playClone(which, rand(0.7, 0.92), rand(0.96, 1.12), 0, 0);
  if (Math.random() > 0.4) {
    playClone(which === "kick" ? "kickQuick" : "kick", rand(0.25, 0.42), rand(1.05, 1.2), 0, rand(10, 22));
  }
  playKickBodyThump(rand(0.12, 0.22), rand(110, 160));
}

/** 軽めのサンプルキック */
function playKickSoft() {
  playClone("kickQuick", rand(0.45, 0.7), rand(1.12, 1.35), 0, 0);
  if (Math.random() > 0.5) {
    playClone("kick", rand(0.2, 0.38), rand(1.15, 1.4), 0, rand(8, 18));
  }
  playKickLeatherTap(rand(0.18, 0.32));
  playKickBodyThump(rand(0.06, 0.12), rand(140, 200));
}

/** そっと触れるような軽いキック（合成） */
function playKickLight() {
  playKickLeatherTap(rand(0.28, 0.48));
  playKickBodyThump(rand(0.08, 0.16), rand(160, 240));
  // ごく小さくサンプルを重ねて実在感
  if (Math.random() > 0.35) {
    playClone("kickQuick", rand(0.12, 0.28), rand(1.25, 1.55), 0, rand(4, 14));
  }
}

/** 靴×ボールの短いパチッ／トン */
function playKickLeatherTap(intensity = 0.3) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = intensity;
  master.connect(ctx.destination);

  const nLen = Math.floor(ctx.sampleRate * rand(0.025, 0.05));
  const buf = ctx.createBuffer(1, nLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < nLen; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (nLen * 0.18));
  }
  const noise = ctx.createBufferSource();
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
}

/** ボールの胴に当たる低いトン */
function playKickBodyThump(intensity = 0.2, freq = 120) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
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
    // バーは少し抑えめ・やや高め
    const a = playClone(key, rand(0.28, 0.42), rand(0.92, 1.08), rand(0, 0.05));
    setTimeout(() => fadeOut(a, rand(400, 650)), rand(160, 280));
    if (Math.random() > 0.45) {
      const tap = playClone("metalTap", rand(0.12, 0.22), rand(1.05, 1.25), 0, rand(8, 20));
      setTimeout(() => fadeOut(tap, 280), 200);
    }
    playWoodworkThump(rand(0.06, 0.1), rand(120, 170));
  } else {
    // ポストは短めの鈍い金属
    const a = playClone(key, rand(0.45, 0.7), rand(0.88, 1.05), rand(0, 0.04));
    setTimeout(() => fadeOut(a, rand(280, 480)), rand(120, 220));
    if (Math.random() > 0.5) {
      const layer = playClone(pick(POST_HITS), rand(0.15, 0.28), rand(0.95, 1.15), 0, rand(10, 28));
      setTimeout(() => fadeOut(layer, 260), 180);
    }
    playWoodworkThump(rand(0.1, 0.18), rand(90, 140));
  }
}

/** ボールが当たったときの低い胴鳴り（ごく薄く） */
function playWoodworkThump(intensity = 0.12, freq = 130) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
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
}

function stopCheer() {
  cheerGen++;
  if (cheerTimer) {
    clearTimeout(cheerTimer);
    cheerTimer = null;
  }
  for (const cancel of activeFadeCancels) cancel();
  activeFadeCancels.clear();
  for (const a of activeCheer) {
    try {
      a.pause();
      a.currentTime = 0;
    } catch (_) {}
  }
  activeCheer = [];
}

/** 試合開始時：再生中サウンドと clone を一括停止（連プレイ時のメモリ・rAF 溜まり対策） */
export function resetMatchAudio() {
  playGen++;
  clearPlayTimers();
  stopCheer();
  for (const a of playingClones) {
    try {
      a.pause();
      a.currentTime = 0;
    } catch (_) {}
  }
  playingClones.length = 0;

  // ※ audioCtx.close() は iOS Safari でスレッドブロック・再生拒否を引き起こすため
  // クローズせず、クローン音源の停止のみ行う
}

/** ゴール直後に必ず鳴る短いアクセント（歓声レイヤーの遅延・失敗対策） */
function playGoalSting() {
  const yell = playClone("cheerYell", rand(0.78, 0.92), rand(1.0, 1.1), 0, 0);
  activeCheer.push(yell);
  const short = playClone("cheerShort", rand(0.62, 0.78), rand(0.98, 1.08), 0, rand(0, 35));
  activeCheer.push(short);
  playKickBodyThump(rand(0.14, 0.22), rand(95, 130));
}

/**
 * スタジアム歓声（短め・毎回違うレイヤー／速度／入り）
 */
export function playCheer(opts = {}) {
  const lite = opts?.lite;
  unlockAudio();
  stopCheer();
  const gen = cheerGen;

  playGoalSting();

  if (lite) {
    const yell = playClone(pick(CHEER_YELLS), rand(0.58, 0.76), rand(0.96, 1.12), rand(0, 1.2));
    activeCheer.push(yell);
    const clap = playClone(pick(APPLAUSE), rand(0.34, 0.52), rand(0.94, 1.08), rand(0, 90));
    activeCheer.push(clap);
    cheerTimer = setTimeout(() => {
      if (gen !== cheerGen) return;
      for (const a of activeCheer) fadeOut(a, rand(420, 620) | 0);
      cheerTimer = null;
    }, rand(1500, 2100) | 0);
    return;
  }

  const style = Math.random(); // 反応の型を変える
  const bedKey = pick(CHEER_BEDS);
  const yellKeys = pickN(CHEER_YELLS, style > 0.55 ? 2 : 1);
  const useExtra = Math.random() > 0.35;
  const extraKey = useExtra ? pick(CHEER_EXTRAS) : null;

  const bedRate = rand(0.92, 1.12);
  const yellRate = rand(0.95, 1.18);
  const bedVol = rand(0.38, 0.52);
  const yellVol = rand(0.62, 0.82);
  const holdMs = rand(1400, 2300) | 0;
  const fadeMs = rand(380, 700) | 0;

  const bed = playClone(bedKey, bedVol, bedRate, rand(0, 2.8));
  activeCheer.push(bed);

  // メインの叫び声（わずかにずらして厚み）
  yellKeys.forEach((key, i) => {
    const delay = i === 0 ? 0 : rand(40, 160);
    const a = playClone(
      key,
      yellVol * (i === 0 ? 1 : rand(0.45, 0.7)),
      yellRate * (i === 0 ? 1 : rand(0.96, 1.08)),
      rand(0, 1.8),
      delay
    );
    activeCheer.push(a);
  });

  // ホイッスル／短歓声などアクセント
  if (extraKey && extraKey !== bedKey && !yellKeys.includes(extraKey)) {
    const delay = rand(80, 280) | 0;
    const a = playClone(extraKey, rand(0.18, 0.42), rand(0.98, 1.15), rand(0, 1.2), delay);
    activeCheer.push(a);
  }

  // 拍手（ほぼ毎回・レイヤー数と入りを変える）
  const clapKeys = pickN(APPLAUSE, style > 0.5 ? 2 : 1);
  clapKeys.forEach((key, i) => {
    const a = playClone(
      key,
      rand(0.32, 0.62) * (i === 0 ? 1 : 0.7),
      rand(0.94, 1.12),
      rand(0, 1.6),
      rand(20, 180) + i * rand(30, 90)
    );
    activeCheer.push(a);
  });
  // ときどきもう一枚、遅れて厚くする
  if (Math.random() > 0.55) {
    const late = playClone(
      pick(APPLAUSE),
      rand(0.22, 0.4),
      rand(0.96, 1.1),
      rand(0.2, 2.0),
      rand(220, 480)
    );
    activeCheer.push(late);
  }

  // 合成のざわめき＋拍手粒でスタジアム感を毎回変える（描画フレームをブロックしないよう次 tick へ）
  const swellOpts = {
    intensity: rand(0.45, 0.8),
    bright: rand(0.35, 0.9),
    dur: rand(1.5, 2.6),
    rise: rand(0.05, 0.18),
  };
  const textureOpts = {
    intensity: rand(0.5, 0.9),
    dur: rand(1.6, 2.8),
    density: rand(0.55, 1),
  };
  setTimeout(() => {
    if (gen !== cheerGen) return;
    playCrowdSwell(swellOpts);
    playApplauseTexture(textureOpts);
  }, 0);

  cheerTimer = setTimeout(() => {
    if (gen !== cheerGen) return;
    for (const a of activeCheer) fadeOut(a, fadeMs + ((Math.random() * 120) | 0));
    cheerTimer = null;
  }, holdMs);
}

/** PK戦勝利：大歓声＋拍手の声援 */
export function playVictoryCelebration() {
  unlockAudio();
  stopCheer();
  const gen = cheerGen;

  playGoalSting();

  const bedKeys = pickN(["cheerVictory", "cheer", "cheerChaos", "crowdStadium"], 2);
  const yellKeys = pickN(CHEER_YELLS, 3);
  const clapKeys = pickN(APPLAUSE, 4);

  const holdMs = rand(3200, 4800) | 0;
  const fadeMs = rand(700, 1100) | 0;

  bedKeys.forEach((key, i) => {
    const a = playClone(key, rand(0.42, 0.62) * (i === 0 ? 1 : 0.75), rand(0.94, 1.08), rand(0, 2.2), i * rand(40, 120));
    activeCheer.push(a);
  });

  yellKeys.forEach((key, i) => {
    const a = playClone(
      key,
      rand(0.58, 0.88) * (i === 0 ? 1 : rand(0.55, 0.8)),
      rand(0.96, 1.14),
      rand(0, 2.0),
      rand(0, 220) + i * rand(80, 160)
    );
    activeCheer.push(a);
  });

  const extraKeys = pickN(CHEER_EXTRAS, 2);
  extraKeys.forEach((key, i) => {
    const a = playClone(key, rand(0.28, 0.52), rand(0.98, 1.12), rand(0, 1.5), rand(120, 420) + i * rand(100, 200));
    activeCheer.push(a);
  });

  clapKeys.forEach((key, i) => {
    const a = playClone(
      key,
      rand(0.48, 0.82) * (i === 0 ? 1 : rand(0.65, 0.9)),
      rand(0.94, 1.1),
      rand(0, 2.0),
      rand(0, 280) + i * rand(60, 140)
    );
    activeCheer.push(a);
  });

  // 遅れて拍手を重ねてスタジアム感を強める
  for (let wave = 0; wave < 2; wave++) {
    pickN(APPLAUSE, 2).forEach((key, i) => {
      const a = playClone(
        key,
        rand(0.34, 0.58),
        rand(0.96, 1.08),
        rand(0.1, 2.4),
        rand(600, 1200) + wave * rand(500, 900) + i * rand(80, 180)
      );
      activeCheer.push(a);
    });
  }

  playCrowdSwell({
    intensity: rand(0.65, 0.95),
    bright: rand(0.55, 0.95),
    dur: rand(2.8, 4.2),
    rise: rand(0.04, 0.12),
  });
  playApplauseTexture({
    intensity: rand(0.75, 1),
    dur: rand(3.0, 4.5),
    density: rand(0.85, 1.2),
  });

  cheerTimer = setTimeout(() => {
    if (gen !== cheerGen) return;
    for (const a of activeCheer) fadeOut(a, fadeMs + ((Math.random() * 180) | 0));
    cheerTimer = null;
  }, holdMs);
}

/** 相手キーパーに阻まれたとき：小さめのスタジアム反応（必ず聞こえる音量） */
export function playBlockedByKeeper(opts = {}) {
  const lite = opts?.lite;
  unlockAudio();
  stopCheer();
  const gen = cheerGen;

  const sting = playClone("cheerShort", rand(0.55, 0.72), rand(0.94, 1.06), 0, 0);
  activeCheer.push(sting);
  const crowd = playClone("crowdStadium", rand(0.42, 0.58), rand(0.74, 0.9), rand(0, 1.4), rand(0, 40));
  activeCheer.push(crowd);

  if (Math.random() > 0.3) {
    const clap = playClone(
      pick(APPLAUSE),
      rand(0.3, 0.46),
      rand(0.92, 1.06),
      rand(0, 1.2),
      rand(30, 110)
    );
    activeCheer.push(clap);
  }

  if (!lite) {
    playCrowdSwell({
      intensity: rand(0.3, 0.5),
      bright: rand(0.42, 0.72),
      dur: rand(1.0, 1.65),
      rise: rand(0.04, 0.1),
    });
    playApplauseTexture({
      intensity: rand(0.32, 0.52),
      dur: rand(1.1, 1.7),
      density: rand(0.45, 0.75),
    });
  }

  const holdMs = rand(950, 1450) | 0;
  const fadeMs = rand(360, 560) | 0;
  cheerTimer = setTimeout(() => {
    if (gen !== cheerGen) return;
    for (const a of activeCheer) fadeOut(a, fadeMs);
    cheerTimer = null;
  }, holdMs);
}

/** 枠外・セーブ失敗など、外れたときの残念な声（毎回変化） */
export function playMiss() {
  unlockAudio();
  stopCheer();

  const bed = pick(["crowdStadium", "cheerYell", "cheerChant"]);
  const murmur = playClone(bed, rand(0.32, 0.48), rand(0.62, 0.82), rand(0, 1.5));
  activeCheer = [murmur];
  const hold = rand(700, 1100) | 0;
  setTimeout(() => fadeOut(murmur, rand(400, 650) | 0), hold);
  playDisappointedCrowd();
}

/** 歓声の下に敷く、毎回違う群衆スウェル */
function playCrowdSwell({ intensity = 0.5, bright = 0.6, dur = 2, rise = 0.1 } = {}) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.0001 + intensity * 0.55, now + rise);
  master.gain.linearRampToValueAtTime(intensity * 0.35, now + dur * 0.55);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  master.connect(ctx.destination);

  // 帯域の違うノイズ群衆を2〜3枚
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
    const src = ctx.createBufferSource();
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
  }

  // たまに短い叫びの粒
  if (Math.random() > 0.4) {
    const bursts = 2 + ((Math.random() * 4) | 0);
    for (let i = 0; i < bursts; i++) {
      const t0 = now + rand(0.05, dur * 0.55);
      const osc = ctx.createOscillator();
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
    }
  }
}

/** 実サンプル下に敷く細かい拍手テクスチャ（毎回密度を変える） */
function playApplauseTexture({ intensity = 0.6, dur = 2.2, density = 0.8 } = {}) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.0001 + intensity * 0.45, now + 0.08);
  master.gain.linearRampToValueAtTime(intensity * 0.28, now + dur * 0.5);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  master.connect(ctx.destination);

  const clapCount = (18 + density * 40) | 0;
  for (let i = 0; i < clapCount; i++) {
    const t0 = now + rand(0.02, dur * 0.85);
    const len = Math.floor(ctx.sampleRate * rand(0.012, 0.045));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let s = 0; s < len; s++) {
      const env = Math.exp(-s / (len * 0.22));
      data[s] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
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
  }
}

function playDisappointedCrowd() {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const dur = rand(1.15, 1.55);
  const peak = rand(0.4, 0.65);
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(peak, now + rand(0.06, 0.12));
  master.gain.exponentialRampToValueAtTime(peak * 0.55, now + dur * 0.4);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  master.connect(ctx.destination);

  const noiseLen = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen) * 0.55;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = rand(420, 620);
  noiseFilter.Q.value = rand(0.55, 0.9);
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = rand(0.28, 0.4);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now);
  noise.stop(now + dur);

  const count = 4 + ((Math.random() * 3) | 0);
  for (let i = 0; i < count; i++) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    osc.type = "triangle";
    const base = rand(260, 980);
    const detune = (Math.random() - 0.5) * 50;
    osc.frequency.setValueAtTime(base + detune, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, (base + detune) * rand(0.55, 0.72)), now + dur * 0.85);
    filt.type = "lowpass";
    filt.frequency.value = rand(1100, 1600);
    const vol = rand(0.05, 0.13);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + rand(0.08, 0.18));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.9);
    osc.connect(filt);
    filt.connect(g);
    g.connect(master);
    osc.start(now + rand(0, 0.08));
    osc.stop(now + dur);
  }
}

function fadeOut(audio, duration) {
  if (!audio) return;
  const start = performance.now();
  const startVol = audio.volume;
  let rafId = 0;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    activeFadeCancels.delete(cancel);
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (_) {}
    releaseClone(audio);
  };
  function step(now) {
    if (done) return;
    const t = Math.min(1, (now - start) / duration);
    audio.volume = Math.max(0, startVol * (1 - t));
    if (t < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      finish();
    }
  }
  const cancel = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(rafId);
    activeFadeCancels.delete(cancel);
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (_) {}
  };
  activeFadeCancels.add(cancel);
  rafId = requestAnimationFrame(step);
}
