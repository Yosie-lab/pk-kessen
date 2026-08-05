import { Container, Graphics } from "pixi.js";

const MUTATION_COLORS = {
  horn: 0xffb4de,
  cap: 0x7dcea0,
  droplet: 0x7ec8ff,
  key: 0xffd76a,
};

/**
 * スライム見た目（Graphicsベース・拡大しても綺麗）
 * ループ内 new を避けるため、パーツは使い回す
 */
export function createSlime() {
  const root = new Container();
  const shadow = new Graphics();
  const body = new Graphics();
  const face = new Graphics();
  const extras = new Graphics();
  root.addChild(shadow, body, face, extras);

  const state = {
    level: 1,
    mutations: [],
    squash: 1,
    wobble: 0,
  };

  function bodyRadius() {
    return 28 + (state.level - 1) * 7.5;
  }

  function redraw() {
    const r = bodyRadius();
    const blush = Math.min(0.2 + state.level * 0.04, 0.45);

    shadow.clear();
    shadow.ellipse(0, r * 0.92, r * 0.78, r * 0.22);
    shadow.fill({ color: 0x1a1028, alpha: 0.28 });

    body.clear();
    body.ellipse(0, 0, r, r * 0.92);
    body.fill({ color: 0xb8f3ff });
    body.ellipse(-r * 0.28, -r * 0.28, r * 0.34, r * 0.22);
    body.fill({ color: 0xffffff, alpha: 0.55 });
    body.ellipse(r * 0.35, r * 0.1, r * 0.18, r * 0.12);
    body.fill({ color: 0xff9ad5, alpha: blush });
    body.ellipse(-r * 0.35, r * 0.1, r * 0.18, r * 0.12);
    body.fill({ color: 0xff9ad5, alpha: blush });

    face.clear();
    const eyeY = -r * 0.08;
    const eyeX = r * 0.22;
    face.circle(-eyeX, eyeY, Math.max(3.2, r * 0.09));
    face.fill(0x2a2438);
    face.circle(eyeX, eyeY, Math.max(3.2, r * 0.09));
    face.fill(0x2a2438);
    face.circle(-eyeX + 1.2, eyeY - 1.2, Math.max(1.1, r * 0.03));
    face.fill(0xffffff);
    face.circle(eyeX + 1.2, eyeY - 1.2, Math.max(1.1, r * 0.03));
    face.fill(0xffffff);
    face.moveTo(-r * 0.12, r * 0.22);
    face.quadraticCurveTo(0, r * 0.34, r * 0.12, r * 0.22);
    face.stroke({ width: Math.max(2, r * 0.05), color: 0x2a2438, cap: "round" });

    extras.clear();
    for (let i = 0; i < state.mutations.length; i++) {
      drawMutation(extras, state.mutations[i], r);
    }
  }

  function drawMutation(g, kind, r) {
    const c = MUTATION_COLORS[kind] ?? 0xffb4de;
    if (kind === "horn") {
      g.moveTo(-r * 0.18, -r * 0.75);
      g.lineTo(-r * 0.05, -r * 1.15);
      g.lineTo(r * 0.08, -r * 0.78);
      g.fill(c);
      g.moveTo(r * 0.1, -r * 0.75);
      g.lineTo(r * 0.22, -r * 1.12);
      g.lineTo(r * 0.34, -r * 0.72);
      g.fill(c);
    } else if (kind === "cap") {
      g.ellipse(0, -r * 0.85, r * 0.55, r * 0.22);
      g.fill(0x5dae7a);
      g.circle(0, -r * 1.05, r * 0.18);
      g.fill(0xffffff);
    } else if (kind === "droplet") {
      g.ellipse(r * 0.7, -r * 0.1, r * 0.16, r * 0.22);
      g.fill(0x7ec8ff);
      g.circle(r * 0.7, -r * 0.28, r * 0.08);
      g.fill(0x7ec8ff);
    } else if (kind === "key") {
      g.circle(r * 0.55, -r * 0.55, r * 0.14);
      g.stroke({ width: 3, color: 0xffd76a });
      g.moveTo(r * 0.55, -r * 0.42);
      g.lineTo(r * 0.55, -r * 0.05);
      g.lineTo(r * 0.7, -r * 0.05);
      g.stroke({ width: 3, color: 0xffd76a, cap: "round", join: "round" });
    }
  }

  function setLevel(level) {
    state.level = Math.max(1, Math.min(7, level));
    redraw();
  }

  function addMutation(kind) {
    if (!kind || state.mutations.includes(kind)) return;
    state.mutations.push(kind);
    redraw();
  }

  function reset() {
    state.level = 1;
    state.mutations.length = 0;
    state.squash = 1;
    redraw();
  }

  function tick(now) {
    state.wobble = Math.sin(now * 0.006) * 0.03;
    root.scale.y = state.squash * (1 + state.wobble);
    root.scale.x = state.squash * (1 - state.wobble * 0.7);
  }

  function playGrowPulse() {
    state.squash = 1.18;
  }

  function playShrinkPulse() {
    state.squash = 0.72;
  }

  function settleSquash(dt) {
    // 指数減衰で元のスケールへ
    state.squash += (1 - state.squash) * Math.min(1, dt * 6);
  }

  redraw();
  return {
    root,
    state,
    setLevel,
    addMutation,
    reset,
    tick,
    playGrowPulse,
    playShrinkPulse,
    settleSquash,
    bodyRadius,
  };
}
