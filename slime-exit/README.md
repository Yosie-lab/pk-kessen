# ぷにっと脱出（Slime Exit）

異変観察＆スライム育成パズル（Web / GitHub Pages）。

トーン: **かわいい7割 / ほの怖3割**｜目標: **作品完成優先**

## 成果物

| # | 内容 | パス |
|---|------|------|
| ① | 企画書PDF | [`docs/SlimeExit_企画書_v1.pdf`](docs/SlimeExit_企画書_v1.pdf) |
| ① | 企画書HTML | [`docs/企画書.html`](docs/企画書.html) |
| ② | 異変リスト | [`docs/異変リスト.md`](docs/異変リスト.md) |
| ③ | 遊べる縦スライス | [`play/`](play/)（ビルド済み） |

## 遊び方（縦スライス）

1. タイトルで「はじめる」
2. 正常な部屋を眺める（基準）
3. 各部屋で観察:
   - **いつもどおり** →「進む」
   - **おかしい（逃げ系）** →「引き返す」
   - **おかしい（捕食系）** → 怪しいものをタップ
4. 正解でスライムが成長。失敗すると「ぷしゅ〜」で Lv.1 に戻る

## ローカル起動

```bash
cd slime-exit
npm install
npm run dev
```

→ http://127.0.0.1:5181/

iPhone 実機: 同じ Wi‑Fi で `http://<MacのLAN-IP>:5181/`（`npm run dev` はホスト固定のため、必要なら `vite --host 0.0.0.0`）

## ビルド（Pages用）

```bash
npm run build
```

出力: `play/`（相対パス `base: './'`）

Pages 反映後の想定URL:

`https://yosie-lab.github.io/pk-kessen/slime-exit/play/`

## 技術

| 層 | 採用 |
|----|------|
| 描画 | PixiJS v8 |
| 開発／ビルド | Vite |
| 状態 | 明示的モード（title / intro / play / grow / fail / result） |
| 主ターゲット | iPhone SE3 Safari |
