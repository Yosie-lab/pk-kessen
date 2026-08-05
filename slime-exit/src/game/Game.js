import { Application, Container, Graphics } from "pixi.js";
import { STAGE_ROOMS, getAnomaly } from "./anomalies.js";
import { createSlime } from "./slime.js";
import { createRoomView } from "./roomView.js";

const ROOM_COUNT = STAGE_ROOMS.length;
const GROW_MS = 750;
const FAIL_MS = 800;
const INTRO_MS = 2200;

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ui = ui;
    this.app = null;
    this.mode = "title"; // title | intro | play | grow | fail | result
    this.phase = "idle";
    this.roomIndex = 0;
    this.level = 1;
    this.timer = 0;
    this.pendingMutation = null;
    this.lastReveal = "";
    this.world = null;
    this.roomView = null;
    this.slime = null;
    this.flash = null;
    this._boundTick = (ticker) => this.update(ticker);
    this._resizeObs = null;
    this._lastTs = 0;
  }

  async init() {
    this.app = new Application();
    await this.app.init({
      canvas: this.canvas,
      width: 390,
      height: 700,
      background: "#21182f",
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    this.world = new Container();
    this.roomView = createRoomView();
    this.slime = createSlime();
    this.flash = new Graphics();
    this.world.addChild(this.roomView.root, this.slime.root, this.flash);
    this.app.stage.addChild(this.world);

    this.bindUi();
    this.bindInput();
    this.resize();
    this._resizeObs = new ResizeObserver(() => this.scheduleResize());
    this._resizeObs.observe(this.canvas.parentElement || document.body);

    this.app.ticker.add(this._boundTick);
    this.showTitle();
  }

  scheduleResize() {
    clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => this.resize(), 80);
  }

  resize() {
    const parent = this.canvas.parentElement || document.body;
    const w = Math.max(280, parent.clientWidth || 390);
    const h = Math.max(480, parent.clientHeight || 700);
    this.app.renderer.resize(w, h);
    this.roomView.layout(w, h);
    this.slime.root.x = w * 0.5;
    this.slime.root.y = h * 0.72;
    if (this.mode === "play" || this.mode === "intro" || this.mode === "grow" || this.mode === "fail") {
      this.roomView.setRoom(getAnomaly(STAGE_ROOMS[this.roomIndex]));
    } else {
      this.roomView.setRoom(null);
    }
  }

  bindUi() {
    this.ui.btnStart.addEventListener("click", () => this.startMatch());
    this.ui.btnRetry.addEventListener("click", () => this.startMatch());
    this.ui.btnForward.addEventListener("click", () => this.onForward());
    this.ui.btnBack.addEventListener("click", () => this.onBack());
  }

  bindInput() {
    const el = this.canvas;
    el.addEventListener(
      "pointerdown",
      (e) => {
        if (this.mode !== "play") return;
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * this.app.screen.width;
        const y = ((e.clientY - rect.top) / rect.height) * this.app.screen.height;
        const hit = this.roomView.hitTest(x, y);
        if (hit) this.onEat(hit);
      },
      { passive: true }
    );
  }

  showTitle() {
    this.mode = "title";
    this.ui.title.hidden = false;
    this.ui.result.hidden = true;
    this.ui.hud.hidden = true;
    this.ui.controls.hidden = true;
    this.roomView.setRoom(null);
    this.slime.reset();
  }

  startMatch() {
    this.mode = "intro";
    this.roomIndex = 0;
    this.level = 1;
    this.timer = INTRO_MS;
    this.pendingMutation = null;
    this.lastReveal = "";
    this.slime.reset();
    this.ui.title.hidden = true;
    this.ui.result.hidden = true;
    this.ui.hud.hidden = false;
    this.ui.controls.hidden = true;
    this.roomView.setRoom(null);
    this.setPrompt("これが正常な部屋だよ\nよく覚えてね");
    this.updateHud();
    this.resize();
  }

  enterPlayRoom() {
    this.mode = "play";
    this.ui.controls.hidden = false;
    const anomaly = getAnomaly(STAGE_ROOMS[this.roomIndex]);
    this.roomView.setRoom(anomaly);
    if (anomaly) {
      this.setPrompt(anomaly.prompt + (anomaly.type === "eat" ? "\n（怪しいものをタップでもOK）" : "\n（おかしいときは引き返して）"));
    } else {
      this.setPrompt("いつもどおり？\n大丈夫なら進もう");
    }
    this.updateHud();
  }

  updateHud() {
    this.ui.roomLabel.textContent = `部屋 ${Math.min(this.roomIndex + 1, ROOM_COUNT)} / ${ROOM_COUNT}`;
    this.ui.lvLabel.textContent = `Lv.${this.level}`;
  }

  setPrompt(text) {
    this.ui.prompt.textContent = text;
  }

  onForward() {
    if (this.mode !== "play") return;
    const anomaly = getAnomaly(STAGE_ROOMS[this.roomIndex]);
    if (!anomaly) {
      this.resolveSuccess(null);
      return;
    }
    // 異変部屋で前進＝失敗
    this.resolveFail(anomaly);
  }

  onBack() {
    if (this.mode !== "play") return;
    const anomaly = getAnomaly(STAGE_ROOMS[this.roomIndex]);
    if (!anomaly) {
      // 正常なのに引き返した＝失敗
      this.resolveFail({ reveal: "正常な部屋だったよ", prompt: "" });
      return;
    }
    if (anomaly.type === "flee") {
      this.resolveSuccess(null);
      return;
    }
    // 捕食すべき異変を引き返した＝失敗
    this.resolveFail(anomaly);
  }

  onEat(id) {
    if (this.mode !== "play") return;
    const anomaly = getAnomaly(STAGE_ROOMS[this.roomIndex]);
    if (!anomaly || anomaly.id !== id) return;
    if (anomaly.type === "eat") {
      this.resolveSuccess(anomaly.mutation || null);
      return;
    }
    // 逃げ系を食べた＝失敗
    this.resolveFail(anomaly);
  }

  resolveSuccess(mutation) {
    this.mode = "grow";
    this.ui.controls.hidden = true;
    this.timer = GROW_MS;
    this.pendingMutation = mutation;
    this.level = Math.min(7, this.level + 1);
    this.slime.setLevel(this.level);
    if (mutation) this.slime.addMutation(mutation);
    this.slime.playGrowPulse();
    this.setPrompt(mutation ? "ぱくっ…ぷに〜っ！\n変異成長！" : "正解！\nぷにっと成長！");
    this.updateHud();
    this.flashScreen(0xffc1e8, 0.35);
  }

  resolveFail(anomaly) {
    this.mode = "fail";
    this.ui.controls.hidden = true;
    this.timer = FAIL_MS;
    this.level = 1;
    this.roomIndex = 0;
    this.lastReveal = anomaly?.reveal || "ざんねん…";
    this.slime.playShrinkPulse();
    this.slime.reset();
    this.setPrompt(`ぷしゅ〜…\n${this.lastReveal}`);
    this.updateHud();
    this.flashScreen(0x88a0ff, 0.3);
  }

  flashScreen(color, alpha) {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.flash.clear();
    this.flash.rect(0, 0, w, h);
    this.flash.fill({ color, alpha });
    this.flash.alpha = 1;
  }

  afterGrow() {
    this.roomIndex += 1;
    if (this.roomIndex >= ROOM_COUNT) {
      this.showResult(true);
      return;
    }
    this.enterPlayRoom();
  }

  afterFail() {
    // 最初からやり直し（基準提示を短く再掲）
    this.mode = "intro";
    this.timer = 1200;
    this.roomView.setRoom(null);
    this.ui.controls.hidden = true;
    this.setPrompt("もう一回！\n正常な部屋をおさらい");
  }

  showResult(cleared) {
    this.mode = "result";
    this.ui.controls.hidden = true;
    this.ui.hud.hidden = true;
    this.ui.result.hidden = false;
    this.ui.resultKicker.textContent = cleared ? "CLEAR" : "RETRY";
    this.ui.resultTitle.textContent = cleared ? "脱出成功！" : "ぷしゅ…";
    this.ui.resultSub.textContent = cleared
      ? `Lv.${this.level} まで成長して出口へ`
      : this.lastReveal || "異変を見破ろう";
  }

  update(ticker) {
    const dt = Math.min(0.05, ticker.deltaMS / 1000);
    const now = performance.now();

    this.slime.settleSquash(dt);
    this.slime.tick(now);
    this.roomView.tick(dt);

    // 二重影（D03）
    const dual = this.roomView.getDualShadowOffset(true);
    if (dual && this.mode === "play") {
      this.slime.root.x = this.app.screen.width * 0.5 + Math.sin(now * 0.01) * 0;
      // 影オフセットは slime 側スケールで疑似表現
      this.slime.root.pivot.x = Math.sin(now * 0.008) * dual * 0.15;
    } else {
      this.slime.root.pivot.x = 0;
    }

    if (this.flash.alpha > 0) {
      this.flash.alpha = Math.max(0, this.flash.alpha - dt * 2.8);
    }

    if (this.mode === "intro") {
      this.timer -= ticker.deltaMS;
      if (this.timer <= 0) this.enterPlayRoom();
      return;
    }

    if (this.mode === "grow") {
      this.timer -= ticker.deltaMS;
      if (this.timer <= 0) this.afterGrow();
      return;
    }

    if (this.mode === "fail") {
      this.timer -= ticker.deltaMS;
      if (this.timer <= 0) this.afterFail();
    }
  }

  dispose() {
    if (this._resizeObs) this._resizeObs.disconnect();
    clearTimeout(this._resizeTimer);
    if (this.app) {
      this.app.ticker.remove(this._boundTick);
      this.app.destroy(true);
    }
  }
}
