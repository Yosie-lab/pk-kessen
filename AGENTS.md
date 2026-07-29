# AGENTS.md — PK決戦

## Product
- Browser PK shootout: Japan vs random opponent kits; shoot and save alternate (5 each, then sudden death).
- Platforms: desktop browsers + iPhone Safari (especially iPhone SE). GitHub Pages: https://yosie-lab.github.io/pk-kessen/
- Done means: playable on SE without layout jump, keeper/ball fitting the goal, and usable touch timing.

## Commands
- Install: none (`package.json` has no dependencies)
- Dev: `npm start` or `npm run dev` → http://127.0.0.1:5180/ (must use HTTP; `file://` breaks ES modules)
- Mobile on LAN: same Wi‑Fi, open `http://<Mac-LAN-IP>:5180`
- Deployed check: hard-reload https://yosie-lab.github.io/pk-kessen/ after push (Pages can lag 1–2 min)
- No automated test suite; verify by playing the happy path in browser

## Architecture
| Path | Role |
|------|------|
| `index.html` | HUD, title/result overlays, canvas `#pitch` |
| `game.js` | State, input, kick/save flow, Canvas render loop |
| `audio.js` | Unlock + SFX helpers (import from `game.js`) |
| `styles.css` | Layout/HUD; keep canvas flex area stable |
| `sounds/` | Mixkit SFX (Mixkit License) |

- Entry: `index.html` → `game.js` (module) → `audio.js`
- Prefer editing existing files over new frameworks/folders
- Canonical patterns: look at nearby code in `game.js` / `styles.css` before inventing helpers

## Game loop & state
- Loop: `requestAnimationFrame` → `update(dt)` → `render()`
- `state.mode`: `title` | `play` | `result`
- `state.phase` (play): `ready` / `ready-save` / `whistle` / `runup` / `aim-click` / `dive-click` / `flight` / `result-beat`
- Shoot: click pitch → whistle/runup → click goal at kick moment (`aimFromClient`)
- Save: click pitch → CPU runup → click goal at kick moment to dive
- Layout: `goalRect()` / `computeGoalRect()` / `state.fixedGoal` — **do not let HUD/prompt height changes resize the goal mid-play**
- Keeper: `keeperReadyAim()` / `keeperScaleForGoal()` — feet on goal line; scale with goal height; head must stay under crossbar on SE
- Ball: `ballBaseRadius()` / `flightBallScale()` — size scales with goal; keep proportional on small screens
- Mobile: `state.mobileLite` → DPR 1, background cache, lighter crowd/ball/net; keep `#pitch { touch-action: none }`

## UX & design
- Japanese UI copy for prompts; keep result lines short (`.prompt.prompt-result`)
- Scoreboard: JAPAN + opponent country head aligned; don’t cover the goal on SE
- Canvas is the play surface; HUD sits above canvas (flex), not overlaid on goal
- Prefer atmosphere already in venues/kits; no new design system mid-feature

## Performance
- iPhone is the perf budget: avoid per-frame heavy net meshes, full 3D trail balls, dense crowds, rain, HUD `backdrop-filter` on small screens
- Reuse `mobileLite` / `bgCache` patterns; invalidate cache on resize, kit/scene change, fixed-goal refresh
- Title/result: don’t run full pitch render every frame (backdrop only)

## Boundaries
### Always
- Keep diffs scoped to the request
- Preserve touch aim/dive timing windows unless the task is to change feel
- After layout/size/perf changes, reason about ~375×667 (SE) and goal stability

### Ask first
- New dependencies, bundlers, or rewriting away from vanilla Canvas
- Changing scoring, difficulty, or core timing windows
- Push / deploy / force-push

### Never
- Commit `.env`, secrets, or unrelated drive-by refactors
- Break ES-module loading by assuming `file://`
- Let prompt/controls height change `goalRect` during `play` (use `fixedGoal`)
- Make keeper/ball look correct on desktop while overflowing the goal on SE

## Assets
- Put new SFX under `sounds/`; wire through `audio.js` exports used by `game.js`
- Unlock audio on first user gesture (`unlockAudio`)
- Don’t replace Mixkit license attribution in README without cause

## Verification checklist
- [ ] `npm start` → game loads (no boot-error banner)
- [ ] Kickoff → shoot → aim click → result; then save → dive click → result
- [ ] Narrow viewport (~375×667): goal not under HUD; size stable across taps
- [ ] Keeper feet on goal line; head under bar; ball not oversized vs goal
- [ ] Touch on canvas doesn’t scroll/zoom the page
- [ ] If asked to push: commit only when asked; hard-reload Pages URL after push

## Git
- Commit / push only when the user asks
- Prefer short why-focused commit messages (existing style on `master`)
- Remote: https://github.com/Yosie-lab/pk-kessen.git (`master` → GitHub Pages)

## Performance & Optimization Rules

### 1. 描画・ループ処理の高速化（GCハザード防止）
- `requestAnimationFrame`（描画ループ）内での `new` 演算子、オブジェクト生成、配列の即席生成（`.map`, `.filter` 等）を厳禁とすること。
- ループ内で繰り返し使用するベクトル・行列・計算用一時変数は、ループ外で事前生成（オブジェクトプール化）して再利用すること。
- パーティクルや数値データの保持には通常のArrayではなく、TypedArray（Float32Array / Int32Array 等）を使用すること。

### 2. メモリ管理 & リーク防止
- タイマー（setInterval / setTimeout）、アニメーションループ、イベントリスナーは、コンポーネントやクラスの破棄（Dispose）時に必ず確実に削除・解除すること。
- CanvasやWebGL/WebGPUのテクスチャ・バッファ・シェーダープログラム等のグラフィックリソースは、不要になった時点で明示的にメモリ解放（`dispose()` 等）を行うこと。

### 3. イベント・計算負荷の制御
- `resize`, `scroll`, `mousemove`, `touchmove` などの高頻度発火イベントには、必ずスロットル（Throttle）またはデバウンス（Debounce）を適用すること。
- 重い物理演算や数値シミュレーション処理は、可能な限り描画処理と切り離し、Web Workerへオフロードするか、計算頻度（FPS）を描画周波数より低く抑える設計にすること。

### 4. AIコード生成時の制約
- ループ処理を記述する際は、必ずメモリ効率と実行速度（計算量 O(N)）を最優先したコードを生成すること。
- コード変更時には、既存の描画ループ内にパフォーマンス低下を招くコード（メモリ確保や無駄な計算）が混入していないか自己チェックしてから提示すること。


