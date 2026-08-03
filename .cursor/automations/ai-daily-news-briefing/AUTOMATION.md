---
name: ai-daily-news-briefing
displayName: "AI デイリーブリーフィング（毎朝6時）"
description: 過去24時間のAI関連ニュースを仕事・ビジネス向けに重要度順で日本語要約する定時Automation
enabled: true
permission: private
repository: none
timezone: Asia/Tokyo
model: default
triggers:
  - type: schedule
    cron: "0 6 * * *"
    label: "毎日 06:00 JST"
tools: []
related_skill: ai-daily-news-briefing
---

# AI デイリーブリーフィング Automation

このファイルは Cursor Automations への登録用定義です。  
**Cursor には Automation 作成 API がないため**、[setup-guide.md](references/setup-guide.md) の手順で UI から登録してください。

## 推奨設定（Cloud Automation）

| 項目 | 値 |
|------|-----|
| 名前 | `AI デイリーブリーフィング（毎朝6時）` |
| リポジトリ | **なし**（ニュース収集のみ。Mac オフでも実行） |
| トリガー | Scheduled / cron `0 6 * * *` |
| タイムゾーン | `Asia/Tokyo` |
| 権限 | Private |
| 状態 | Active |

## プロンプト

以下を Automation のプロンプト欄に **そのままコピー＆ペースト** してください。

```text
/ai-daily-news-briefing スキルを実行してください。

過去24時間以内の AI 関連ニュースを WebSearch で収集し、仕事・ビジネスへの影響度が高い順に日本語で要約してください。

## 必須ルール
- 回答は必ず日本語。結論ファースト。挨拶・前置き不要
- 対象期間: 実行時刻から遡って24時間（JST で明記）
- WebSearch を最低6回（英語・日本語混在）実行
- 個人完結型（AI/自動化/直販）の視点で示唆を書く
- 不確かな情報は推測せず「未確認」と明記

## 収集カテゴリ（各1クエリ以上）
1. 大手モデル・API（OpenAI / Anthropic / Google / Microsoft）
2. 規制・政策
3. エンタープライズ向けツール・料金
4. 開発者向け SDK / フレームワーク
5. 資金調達・M&A
6. 日本国内の生成AIビジネスニュース

## スコアリング（各ニュース 1〜5点）
- 収益・コストへの影響（0〜2）
- 仕事のやり方の変化（0〜2）
- 競争優位の変化（0〜1）
- 規制・リスク（0〜1）
- 実用性（0〜1）

## 出力形式
1. 📅 対象期間
2. ⚡ 3行サマリー
3. 🔴 重要ニュース TOP 3〜7（見出し / 概要 / ビジネス影響 / 個人向けアクション / ソースURL）
4. 🟡 その他の注目（表形式）
5. 👀 ウォッチリスト
6. ✅ 今日の1アクション（5分以内でできる具体行動1つ）

コード変更・PR 作成は不要。要約の出力のみ行ってください。
```

## スキル未読込時の代替プロンプト

リポジトリなし Automation ではプロジェクトスキルが読み込まれない場合があります。  
その場合は `references/standalone-prompt.md` の全文プロンプトを使用してください。

## 検証

1. Automation 作成後 **Run now** で手動実行
2. 日本語要約が返ることを確認
3. 翌朝 6:00 JST に自動実行されることを確認
