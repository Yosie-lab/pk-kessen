---
name: ai-daily-news-briefing
displayName: "AI デイリーブリーフィング（毎朝6時）"
description: 過去24時間のAI関連ニュースを仕事・ビジネス向けに重要度順で日本語要約する定時Automation
enabled: true
billing: local-only
billing-note: "Cloud Automation（cursor.com/automations）は Cloud Agent 従量課金。本設定はローカル IDE Automation 専用"
permission: private
repository: workspace-with-skill
timezone: Asia/Tokyo
model: default
triggers:
  - type: schedule
    platform: local-ide
    schedule: daily
    time: "06:00"
    label: "毎日 06:00 JST（Mac ローカル）"
tools: []
# 外部アクセスは読み取り専用（WebSearch のみ）。git push / PR / Slack / 投稿は禁止
external_access: read-only
related_skill: ai-daily-news-briefing
---

# AI デイリーブリーフィング Automation

## ⚠️ 課金について（必読）

| 方式 | 課金 | 本プロジェクトでの推奨 |
|------|------|----------------------|
| **ローカル IDE Automation** | Cursor プラン内の利用枠 | ✅ **推奨** |
| 手動 `/ai-daily-news-briefing` | 同上 | ✅ 追加課金なし |
| **Cloud Automation**（cursor.com/automations） | **Cloud Agent 従量課金** | ❌ **使わない** |

Cloud Automation は別途 Cloud Agent 利用料が発生します。従量課金を避けるため、**Mac の Cursor デスクトップ → Customize → Automations** で設定してください。

詳細手順: [references/setup-guide.md](references/setup-guide.md)

---

## 推奨設定（ローカル IDE Automation）

| 項目 | 値 |
|------|-----|
| 名前 | `AI デイリーブリーフィング（毎朝6時）` |
| 実行場所 | **Mac ローカル**（Customize → Automations） |
| スケジュール | **Daily** / **06:00** |
| Workspace folder | スキルがあるフォルダ（下記参照） |
| Agent Mode | **Agent** |
| Permission Mode | **Ask Every Time**（書き込みは都度承認。外部は読み取り専用） |
| 外部アクセス | **読み取り専用** — WebSearch のみ。push / PR / Slack / 投稿は禁止 |

### Workspace folder の指定

いずれか1つ:

1. **本リポジトリ**（`.cursor/skills/` あり）→ 短いプロンプトで `/ai-daily-news-briefing` が使える
2. **`~/.cursor/skills/` にスキルをコピーした任意のフォルダ** → 全プロジェクト共通

```bash
mkdir -p ~/.cursor/skills
cp -r ~/pk-kessen/.cursor/skills/ai-daily-news-briefing ~/.cursor/skills/
```

---

## プロンプト（ローカル用・短い版）

スキルが読み込まれる Workspace を指定した場合、以下をコピー:

```text
今日のニュース

過去24時間のAIニュースを WebSearch で収集し、仕事・ビジネス・株価向けに重要度順で日本語要約してください。
結果はチャットに出し、news/今日のニュース.md と news/archive/YYYY-MM-DD.md も更新してください。
外部アクセスは読み取り専用（WebSearch のみ）。git push・PR作成・Slack/SNS投稿は禁止。
ゲーム本体のコード変更は不要。
```

手動トリガー: Agent チャットで **「今日のニュース」** と送るだけで同じ処理が走る。

## プロンプト（スタンドアロン・全文版）

Workspace にスキルがない場合は [references/standalone-prompt.md](references/standalone-prompt.md) を使用。

---

## Mac が 6 時にスリープしている場合

ローカル Automation は **Mac 起動・Cursor 起動中** にのみ実行されます。

| 対処 | 内容 |
|------|------|
| 電源設定 | システム設定 → バッテリー → 「ディスプレイオフ時に自動スリープ」= オフ（電源接続時） |
| 起動後キャッチアップ | 6 時を逃した場合、起動後に Automation の **Run now** で手動実行 |
| 代替 | 朝 Cursor を開いたら `/ai-daily-news-briefing` を手動実行（追加課金なし） |

---

## 検証

1. Customize → Automations → **Run now** で手動実行
2. 日本語要約が返ることを確認
3. 翌朝 6:00 に自動実行されることを確認（Mac 起動中）
