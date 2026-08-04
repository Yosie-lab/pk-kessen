# 今日のニュース（AIデイリーブリーフィング）

## 見る場所

| 何を見たいか | ファイル |
|-------------|---------|
| **最新1日分** | [`今日のニュース.md`](./今日のニュース.md) |
| 過去分 | [`archive/`](./archive/) |

## 呼び出し方（Cursor）

Agent チャットで次のいずれかを送る:

```text
今日のニュース
```

```text
/ai-daily-news-briefing
```

スキルが過去24時間の AI 関連ニュースを収集し、チャットに要約を出すと同時に `今日のニュース.md` を上書き更新します。

## 毎朝6時（ローカル・従量課金なし）

Mac の Cursor → **Customize → Automations** で Daily 06:00 を設定。  
手順: [../.cursor/automations/ai-daily-news-briefing/references/setup-guide.md](../.cursor/automations/ai-daily-news-briefing/references/setup-guide.md)

⚠️ Cloud Automation（cursor.com/automations）は Cloud Agent 従量課金のため使わない。
