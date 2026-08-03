# Automation セットアップ手順（従量課金なし）

## 結論

**Mac の Cursor デスクトップ → Customize → Automations** で設定してください。  
**cursor.com/automations（Cloud）は使わないでください** — Cloud Agent の従量課金が発生します。

---

## 課金の違い

| 方式 | 実行場所 | 課金 |
|------|---------|------|
| ✅ ローカル IDE Automation | Mac 上の Cursor | プラン内の利用枠のみ |
| ✅ 手動 `/ai-daily-news-briefing` | Mac 上の Agent チャット | 同上 |
| ❌ Cloud Automation | cursor.com / クラウド VM | **Cloud Agent 従量課金** |
| ❌ `/automate` → Cloud 作成 | 同上 | **従量課金** |

---

## 手順（ローカル IDE Automation）

### 1. スキルをグローバルに配置（推奨・1回だけ）

どのプロジェクトからでも `/ai-daily-news-briefing` を使えるようにします。

```bash
mkdir -p ~/.cursor/skills
cp -r ~/path/to/pk-kessen/.cursor/skills/ai-daily-news-briefing ~/.cursor/skills/
```

Cursor を再起動 → **Customize → Skills** に表示されることを確認。

### 2. Automation を作成

1. Cursor（Mac）→ **Customize** → **Automations**
2. **New Automation**
3. 以下を設定:

| フィールド | 入力値 |
|-----------|--------|
| Name | `AI デイリーブリーフィング（毎朝6時）` |
| Prompt | 下記「プロンプト」をコピー |
| Schedule | **Daily** |
| Time | **06:00** |
| Workspace folder | ホームフォルダ or よく使うプロジェクト（Browse で選択） |
| Agent Mode | **Agent** |
| Permission Mode | **Default Approvals** |

4. **Save**
5. **Run now** でテスト → 日本語要約が返ることを確認
6. 一覧で **Enabled**（有効）になっていることを確認

### プロンプト（コピー用）

```text
/ai-daily-news-briefing を実行してください。

過去24時間のAIニュースを WebSearch で収集し、仕事・ビジネス向けに重要度順で日本語要約してください。
コード変更・PR 作成は不要。要約の出力のみ。
```

---

## 手動実行（追加課金なし）

Automation を使わず、朝 Cursor を開いて以下でも OK:

```text
/ai-daily-news-briefing
```

プラン内の利用枠のみ消費。Cloud 課金は発生しません。

---

## Mac が 6 時にスリープしている場合

ローカル Automation は Mac + Cursor が起動中のみ動作します。

### 対処A: 電源設定（電源接続時）

1. **システム設定 → バッテリー → オプション**
2. 「電源アダプタ接続時」→ ディスプレイオフ後も Mac をスリープさせない

### 対処B: 起動後にキャッチアップ

6 時を逃しても問題なし。Cursor を開いて:

- Automations 一覧 → **Run now**
- または Agent チャットで `/ai-daily-news-briefing`

---

## 利用枠を節約するコツ

| コツ | 効果 |
|------|------|
| 短いプロンプト + スキル参照 | トークン削減 |
| WebSearch 6回（スキル既定） | 過剰検索を避ける |
| Agent Mode（Edit 不要） | コード変更なしで軽量 |
| 結果を Markdown ファイルに保存しない | ファイル操作コスト削減 |

---

## やってはいけないこと

- ❌ [cursor.com/automations](https://cursor.com/automations) で Cloud Automation を作成
- ❌ Agent チャットで `/automate` し Cloud 版を作る
- ❌ Automation に MCP / Computer use / Slack 等の Cloud ツールを追加（Cloud 実行になる場合あり）

---

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| 6 時に実行されない | Mac がスリープしていないか確認。Cursor が起動中か確認 |
| スキルが見つからない | `~/.cursor/skills/` にコピー済みか確認。Cursor 再起動 |
| `/ai-daily-news-briefing` が効かない | `standalone-prompt.md` の全文プロンプトを Automation に貼る |
| 英語で出力 | プロンプトに「必ず日本語」を追記 |
| 従量課金が発生 | Cloud Automation を無効化。ローカルのみ使用 |

---

## グローバルスキル配置コマンド（再掲）

```bash
mkdir -p ~/.cursor/skills
cp -r /path/to/pk-kessen/.cursor/skills/ai-daily-news-briefing ~/.cursor/skills/
```

Cursor 再起動後、Customize → Skills に `ai-daily-news-briefing` が表示されます。
