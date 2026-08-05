import { Container, Graphics } from "pixi.js";

/**
 * ダンジョン部屋の描画と異変ホットスポット
 * 差分は差し替え／色変更で明示する
 */
export function createRoomView() {
  const root = new Container();
  const bg = new Graphics();
  const props = new Graphics();
  const anomalyFx = new Graphics();
  const doorBreath = { t: 0, active: false };
  root.addChild(bg, props, anomalyFx);

  let hotspot = null; // { x, y, r, id }
  let anomalyId = null;
  let w = 390;
  let h = 700;

  function layout(width, height) {
    w = width;
    h = height;
  }

  function clearHotspot() {
    hotspot = null;
  }

  function setRoom(anomaly) {
    anomalyId = anomaly?.id ?? null;
    doorBreath.active = anomalyId === "D07";
    doorBreath.t = 0;
    clearHotspot();
    drawBase();
    drawProps(anomaly);
  }

  function drawBase() {
    bg.clear();
    // 奥壁
    bg.rect(0, 0, w, h * 0.58);
    bg.fill(0x3a2f55);
    // 床
    bg.moveTo(0, h * 0.58);
    bg.lineTo(w * 0.12, h * 0.58);
    bg.lineTo(0, h);
    bg.lineTo(0, h * 0.58);
    bg.fill(0x2b2340);
    bg.moveTo(w, h * 0.58);
    bg.lineTo(w * 0.88, h * 0.58);
    bg.lineTo(w, h);
    bg.lineTo(w, h * 0.58);
    bg.fill(0x2b2340);
    bg.rect(0, h * 0.58, w, h * 0.42);
    bg.fill(0x352a4d);

    // 床グリッド
    for (let i = 0; i < 6; i++) {
      const y = h * 0.62 + i * (h * 0.06);
      bg.moveTo(w * 0.08, y);
      bg.lineTo(w * 0.92, y);
      bg.stroke({ width: 1, color: 0x5a4a72, alpha: 0.35 });
    }
  }

  function torchColor(anomaly) {
    if (anomaly?.id === "D01") return 0x88ccff;
    return 0xffb060;
  }

  function drawTorch(g, x, y, color) {
    g.roundRect(x - 4, y, 8, 28, 3);
    g.fill(0x5a4030);
    g.ellipse(x, y - 2, 10, 14);
    g.fill(color);
    g.ellipse(x - 2, y - 6, 3, 4);
    g.fill({ color: 0xffffff, alpha: 0.45 });
  }

  function drawProps(anomaly) {
    props.clear();
    anomalyFx.clear();

    const gy = h * 0.58;
    const doorW = w * 0.28;
    const doorH = h * 0.3;
    const doorX = w * 0.5 - doorW * 0.5;
    const doorY = gy - doorH;

    // ドア
    const breath = doorBreath.active ? 1 + Math.sin(doorBreath.t) * 0.03 : 1;
    props.roundRect(doorX, doorY, doorW * breath, doorH, 10);
    props.fill(0x6b4e9e);
    props.roundRect(doorX + 8, doorY + 10, doorW * breath - 16, doorH - 20, 8);
    props.fill(0x4b3478);

    // 出口印
    const markFlip = anomaly?.id === "D12" ? -1 : 1;
    const mx = w * 0.5;
    const my = doorY - 18;
    props.moveTo(mx, my - 10 * markFlip);
    props.lineTo(mx - 12, my + 8 * markFlip);
    props.lineTo(mx + 12, my + 8 * markFlip);
    props.fill(0xffe28a);

    // 松明
    const tc = torchColor(anomaly);
    drawTorch(props, w * 0.18, h * 0.28, tc);
    drawTorch(props, w * 0.82, h * 0.28, tc);

    // 壁画
    const muralX = w * 0.68;
    const muralY = h * 0.3;
    props.roundRect(muralX - 34, muralY - 40, 68, 78, 8);
    props.fill(0x5c4a36);
    props.circle(muralX, muralY - 12, 12);
    props.fill(0xe8d5b5);
    props.ellipse(muralX, muralY + 18, 16, 18);
    props.fill(0xd4b896);
    if (anomaly?.id === "D02") {
      props.moveTo(muralX - 6, muralY - 6);
      props.quadraticCurveTo(muralX, muralY + 4, muralX + 6, muralY - 6);
      props.stroke({ width: 2.5, color: 0xc45c8a, cap: "round" });
      hotspot = { x: muralX, y: muralY, r: 42, id: "D02" };
    } else {
      props.moveTo(muralX - 5, muralY - 4);
      props.lineTo(muralX + 5, muralY - 4);
      props.stroke({ width: 2, color: 0x8a6a50, cap: "round" });
    }

    // 時計
    const cx = w * 0.28;
    const cy = h * 0.32;
    props.circle(cx, cy, 22);
    props.fill(0xf2e6c8);
    props.circle(cx, cy, 22);
    props.stroke({ width: 3, color: 0x8a7048 });
    if (anomaly?.id === "D05") {
      // 針が下（プレイヤー）を指す
      props.moveTo(cx, cy);
      props.lineTo(cx + 4, cy + 14);
      props.stroke({ width: 3, color: 0x2a2438, cap: "round" });
      props.circle(cx + 3, cy + 10, 2.5);
      props.fill(0xc45c8a);
    } else {
      props.moveTo(cx, cy);
      props.lineTo(cx + 8, cy - 10);
      props.stroke({ width: 3, color: 0x2a2438, cap: "round" });
      props.moveTo(cx, cy);
      props.lineTo(cx - 2, cy + 12);
      props.stroke({ width: 2.5, color: 0x2a2438, cap: "round" });
    }

    // 苔／床アクセント
    for (let i = 0; i < 5; i++) {
      const tx = w * (0.2 + i * 0.15);
      const ty = h * 0.72;
      const flip = anomaly?.id === "D04" ? -1 : 1;
      props.moveTo(tx, ty);
      props.lineTo(tx - 8, ty + 12 * flip);
      props.lineTo(tx + 8, ty + 12 * flip);
      props.fill({ color: 0x5dae7a, alpha: 0.75 });
    }
    if (anomaly?.id === "D04") {
      hotspot = { x: w * 0.5, y: h * 0.74, r: 50, id: "D04" };
    }

    // 水たまり
    if (anomaly?.id === "D06") {
      const px = w * 0.55;
      const py = h * 0.78;
      props.ellipse(px, py, 36, 16);
      props.fill({ color: 0x7ec8ff, alpha: 0.75 });
      props.ellipse(px, py - 10, 18, 14);
      props.fill({ color: 0x9fd9ff, alpha: 0.9 });
      props.circle(px - 6, py - 14, 2.5);
      props.fill(0x2a2438);
      props.circle(px + 6, py - 14, 2.5);
      props.fill(0x2a2438);
      hotspot = { x: px, y: py - 4, r: 40, id: "D06" };
    } else {
      props.ellipse(w * 0.55, h * 0.8, 30, 10);
      props.fill({ color: 0x5a7aaa, alpha: 0.35 });
    }

    // 鍵
    if (anomaly?.id === "D08") {
      const kx = w * 0.84;
      const ky = h * 0.52;
      props.circle(kx, ky, 8);
      props.stroke({ width: 3, color: 0xffd76a });
      props.moveTo(kx, ky + 8);
      props.lineTo(kx, ky + 24);
      props.lineTo(kx + 8, ky + 24);
      props.stroke({ width: 3, color: 0xffd76a, cap: "round" });
      hotspot = { x: kx, y: ky + 8, r: 36, id: "D08" };
    }

    // 矢印タイル
    const ax = w * 0.22;
    const ay = h * 0.86;
    props.roundRect(ax - 18, ay - 18, 36, 36, 6);
    props.fill(0x4a3a62);
    if (anomaly?.id === "D09") {
      props.moveTo(ax, ay + 10);
      props.lineTo(ax - 10, ay - 6);
      props.lineTo(ax + 10, ay - 6);
      props.fill(0xff8fab);
    } else {
      props.moveTo(ax, ay - 10);
      props.lineTo(ax - 10, ay + 6);
      props.lineTo(ax + 10, ay + 6);
      props.fill(0xffe28a);
    }

    // 二重影（D03）
    if (anomaly?.id === "D03") {
      const sx = w * 0.5 + 18;
      const sy = h * 0.78;
      props.ellipse(sx, sy, 40, 12);
      props.fill({ color: 0x1a1028, alpha: 0.35 });
      props.ellipse(sx + 22, sy + 4, 34, 10);
      props.fill({ color: 0x1a1028, alpha: 0.22 });
    }

    // ヒント色の薄いオーラ（捕食／逃げの学習用・弱め）
    if (anomaly && hotspot) {
      anomalyFx.circle(hotspot.x, hotspot.y, hotspot.r);
      anomalyFx.stroke({ width: 2, color: anomaly.hintTint ?? 0xff9ad5, alpha: 0.35 });
    }
  }

  function tick(dt) {
    if (!doorBreath.active) return;
    doorBreath.t += dt * 3.2;
  }

  function hitTest(x, y) {
    if (!hotspot) return null;
    const dx = x - hotspot.x;
    const dy = y - hotspot.y;
    if (dx * dx + dy * dy <= hotspot.r * hotspot.r) return hotspot.id;
    return null;
  }

  function getDualShadowOffset(anomalyActive) {
    return anomalyActive && anomalyId === "D03" ? 14 : 0;
  }

  return {
    root,
    layout,
    setRoom,
    tick,
    hitTest,
    getDualShadowOffset,
    get anomalyId() {
      return anomalyId;
    },
  };
}
