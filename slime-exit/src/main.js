import { Game } from "./game/Game.js";

const ui = {
  title: document.getElementById("title-screen"),
  result: document.getElementById("result-screen"),
  hud: document.getElementById("hud"),
  controls: document.getElementById("controls"),
  prompt: document.getElementById("prompt"),
  roomLabel: document.getElementById("room-label"),
  lvLabel: document.getElementById("lv-label"),
  btnStart: document.getElementById("btn-start"),
  btnRetry: document.getElementById("btn-retry"),
  btnForward: document.getElementById("btn-forward"),
  btnBack: document.getElementById("btn-back"),
  resultKicker: document.getElementById("result-kicker"),
  resultTitle: document.getElementById("result-title"),
  resultSub: document.getElementById("result-sub"),
};

const canvas = document.getElementById("game");
const game = new Game(canvas, ui);

game.init().catch((err) => {
  console.error(err);
  const p = document.querySelector(".hint");
  if (p) {
    p.textContent = "起動エラー: " + (err?.message || err);
    p.style.color = "#c45c8a";
  }
});

window.__SLIME_EXIT = game;
