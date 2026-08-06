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
Game-specific (iPhone SE is the perf budget):
- Avoid per-frame heavy net meshes, full 3D trail balls, dense crowds, rain, HUD `backdrop-filter` on small screens
- Reuse `mobileLite` / `bgCache`; invalidate cache on resize, kit/scene change, fixed-goal refresh
- Title/result: render backdrop only, not the full pitch every frame
- 汎用の描画ループ / メモリ / イベント規約は `.cursor/rules/engineering.mdc`（常時適用）に集約

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
