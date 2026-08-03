# Automation セットアップ手順

Cursor Automations は **UI からのみ作成** できます（2026年8月時点で公開 API なし）。

---

## 方法A: Cloud Automation（推奨）

Mac がスリープ中でも毎朝6時に実行されます。

### 手順

1. [cursor.com/automations](https://cursor.com/automations) を開く
2. **New Automation** をクリック
3. 以下を設定:

| フィールド | 入力値 |
|-----------|--------|
| Name | `AI デイリーブリーフィング（毎朝6時）` |
| Repository | **None / なし** |
| Trigger | **Scheduled** |
| Schedule | Custom cron → `0 6 * * *` |
| Timezone | `Asia/Tokyo` |
| Status | **Active**（トグル ON） |

4. **Prompt** 欄に `../AUTOMATION.md` のプロンプトブロックをコピー＆ペースト
5. **Save** をクリック
6. **Run now** でテスト実行

### オプション: Slack 通知

結果を Slack に届けたい場合:

1. Automation 編集画面 → **Add Tool** → **Send to Slack**
2. 送信先チャンネルを指定（例: `#ai-news`）
3. プロンプト末尾に追加:

```text
要約が完成したら、上記フォーマットの全文を指定 Slack チャンネルに投稿してください。
```

---

## 方法B: ローカル IDE Automation（Mac）

Cursor デスクトップアプリから設定。Mac が起動・ログイン中のみ実行。

### 手順

1. Cursor → **Customize**（サイドバー）→ **Automations**
2. **New Automation** をクリック
3. 以下を設定:

| フィールド | 入力値 |
|-----------|--------|
| Name | `AI デイリーブリーフィング（毎朝6時）` |
| Prompt | `AUTOMATION.md` のプロンプトをコピー |
| Schedule | **Daily** |
| Time | **06:00** |
| Workspace folder | 任意（スキル読込用に本リポジトリを指定推奨） |
| Agent Mode | **Agent** |

4. **Save** → **Run now** でテスト

### スキル読込について

- Workspace folder に `.cursor/skills/` があるリポジトリを指定すると `/ai-daily-news-briefing` が使える
- グローバルスキル（`~/.cursor/skills/`）にコピーしても全プロジェクトで利用可能

---

## 方法C: `/automate` スキル（Mac の Agent チャット）

Cursor デスクトップの Agent チャットで以下を送信:

```text
/automate

毎朝6時（JST）に過去24時間のAI関連ニュースを仕事・ビジネス向けに重要度順で日本語要約するAutomationを作成してください。

- 名前: AI デイリーブリーフィング（毎朝6時）
- スケジュール: 毎日 06:00 Asia/Tokyo（cron: 0 6 * * *）
- リポジトリ: なし
- プロンプト: .cursor/automations/ai-daily-news-briefing/AUTOMATION.md を参照
```

`/automate` ビルトインスキルが Automation 設定を自動生成します。

---

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| 6時に実行されない | Timezone が `Asia/Tokyo` か確認。Status が Active か確認 |
| スキルが読み込まれない | リポジトリなし Automation では `standalone-prompt.md` を使用 |
| 英語で出力される | プロンプトに「必ず日本語」を明記（既に含まれています） |
| 古いニュースが混ざる | Run now の実行時刻を基準に24時間以内か確認 |
| 課金が気になる | Cloud Automation は従量課金。ローカル Automation に切替 |

---

## グローバルスキルの配置（任意）

全プロジェクトで `/ai-daily-news-briefing` を使う場合、Mac のターミナルで:

```bash
mkdir -p ~/.cursor/skills
cp -r /path/to/pk-kessen/.cursor/skills/ai-daily-news-briefing ~/.cursor/skills/
```

Cursor を再起動すると Customize → Skills に表示されます。
