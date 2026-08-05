# ぷにっと脱出（Slime Exit）

異変観察＆スライム育成パズル（Web / GitHub Pages）。

トーン: **かわいい7割 / ほの怖3割**｜目標: **作品完成優先**

## 成果物

| # | 内容 | パス |
|---|------|------|
| ① | 企画書PDF | [`docs/SlimeExit_企画書_v1.pdf`](docs/SlimeExit_企画書_v1.pdf) |
| ① | 企画書HTML | [`docs/企画書.html`](docs/企画書.html) |
| ② | 異変リスト | [`docs/異変リスト.md`](docs/異変リスト.md) |
| ③ | 遊べる縦スライス | `npm run dev` / ビルドは `dist/`（Pagesは独自URLへ） |

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

## 公開URL（独自リポジトリ）

| 項目 | 内容 |
|------|------|
| 想定Pages URL | **https://yosie-lab.github.io/slime-exit/** |
| リポジトリ | `Yosie-lab/slime-exit`（pk-kessen 配下ではない） |
| Pages設定 | ブランチ `gh-pages` のルート、または Actions で `dist/` をデプロイ |

`pk-kessen` のサブパス（`.../pk-kessen/slime-exit/...`）では公開しない。

## ビルド（Pages用）

```bash
npm run build
```

出力: `dist/`（`base: './'`＝独自ドメイン／独自リポジトリルート向け）

ローカル確認用の静的プレビュー:

```bash
npm run preview
```

## 技術

| 層 | 採用 |
|----|------|
| 描画 | PixiJS v8 |
| 開発／ビルド | Vite |
| 状態 | 明示的モード（title / intro / play / grow / fail / result） |
| 主ターゲット | iPhone SE3 Safari |
| 配信 | 専用 GitHub Pages（独自URL） |
