# 独自 GitHub Pages 公開手順

## 想定URL

**https://yosie-lab.github.io/slime-exit/**

`pk-kessen` 配下のパスでは公開しない。

## 1. 専用リポジトリを作成

GitHub 上で空のリポジトリを作成:

| 項目 | 値 |
|------|-----|
| Owner | `Yosie-lab` |
| Repository name | `slime-exit` |
| Visibility | Public（Pages 無料公開のため） |
| README 初期化 | なし（こちらから push） |

## 2. 初回 push（ローカルまたはエージェント）

`slime-exit/` フォルダをリポジトリルートとして push する。

```bash
cd slime-exit
git init
git add .
git commit -m "Initial commit: Slime Exit"
git branch -M main
git remote add origin https://github.com/Yosie-lab/slime-exit.git
git push -u origin main
```

## 3. Pages 設定

1. リポジトリ **Settings → Pages**
2. **Source:** GitHub Actions
3. `Deploy GitHub Pages` ワークフローが走ると自動公開

## 4. 確認

- 反映まで1〜2分かかることがある
- iPhone Safari でスーパーリロード
- `file://` ではなく必ず HTTPS で開く

## 5. Cursor Agent / Actions から push できない場合

### A. Cursor GitHub App に slime-exit を追加（推奨）

1. GitHub → **Settings** → **Applications** → **Cursor** → **Configure**
2. **Repository access** → `Yosie-lab/slime-exit` を追加
3. Cloud Agent を再実行するか、手順 2 の `git push` を再試行

### B. Mac からワンコマンド push

```bash
cd slime-exit
./scripts/push-standalone.sh
```

認証エラー時: `gh auth login`（`repo` スコープ）または SSH remote に切替。

### C. pk-kessen Actions で自動同期

1. Fine-grained PAT を作成（`Yosie-lab/slime-exit` → Contents: Read and write）
2. `pk-kessen` リポジトリ **Settings → Secrets → Actions** → `SLIME_EXIT_PUSH_TOKEN` を追加
3. **Actions** → **Sync Slime Exit to standalone repo** → **Run workflow**
