# PK決戦

サッカーの PK 戦を競うブラウザゲームです。Canvas で描画したピッチ上で、交互にシュートとセーブを行います。

## 遊び方

1. **キックオフ** で試合開始
2. **シュート**: クリックで助走開始 → キックの瞬間にゴールをクリックして狙う
3. **セーブ**: クリックで CPU キック開始 → 蹴る瞬間にゴールをクリックしてダイブ
4. 交互に 5 本ずつ。同点ならサドンデス

## 起動

```bash
npm start
```

ブラウザで http://localhost:5180 を開く。

`file://` では ES モジュールが読み込めないため、必ずローカルサーバー経由で開いてください。

## 構成

| ファイル | 内容 |
|----------|------|
| `index.html` | 画面・HUD |
| `game.js` | ゲームロジック・描画 |
| `audio.js` | 効果音 |
| `styles.css` | スタイル |
| `sounds/` | Mixkit 効果音 |

## 効果音

キック音・歓声・ホイッスルは [Mixkit](https://mixkit.co/free-sound-effects/) の無料効果音（Mixkit License）を使用しています。  
ホイッスルは Mixkit Police short whistle を短く切り出した `sounds/whistle-blast.m4a` を使用しています。

## ライセンス

ゲームコード: MIT（このリポジトリ）  
効果音: [Mixkit License](https://mixkit.co/license/)
