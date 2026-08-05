/** 縦スライス用異変定義（異変リストの★優先） */

export const ANOMALIES = {
  D01: {
    id: "D01",
    name: "青の松明",
    type: "flee",
    prompt: "なんか冷たい…？",
    reveal: "松明だけ青かった…",
    hintTint: 0x88ccff,
  },
  D02: {
    id: "D02",
    name: "ニヤける壁画",
    type: "eat",
    prompt: "壁の絵が気になる",
    reveal: "壁画がニヤニヤしてた",
    hintTint: 0xff9ad5,
    mutation: "horn",
  },
  D03: {
    id: "D03",
    name: "二重の影",
    type: "flee",
    prompt: "影がおかしい…",
    reveal: "影がもうひとり",
    hintTint: 0x88ccff,
  },
  D04: {
    id: "D04",
    name: "逆さの苔",
    type: "eat",
    prompt: "床がちょっと変？",
    reveal: "苔がさかさま",
    hintTint: 0xff9ad5,
    mutation: "cap",
  },
  D05: {
    id: "D05",
    name: "時計の視線",
    type: "flee",
    prompt: "見られている気がする",
    reveal: "時計に見られてた",
    hintTint: 0x88ccff,
  },
  D06: {
    id: "D06",
    name: "水たまりぷに",
    type: "eat",
    prompt: "床になにかいる？",
    reveal: "水たまりが仲間みたい",
    hintTint: 0xff9ad5,
    mutation: "droplet",
  },
  D07: {
    id: "D07",
    name: "ドアの呼吸",
    type: "flee",
    prompt: "ドアが…動いてる？",
    reveal: "ドアが息してた",
    hintTint: 0x88ccff,
  },
  D08: {
    id: "D08",
    name: "鍵の置き忘れ",
    type: "eat",
    prompt: "きらり、と光った",
    reveal: "鍵がひょっこり",
    hintTint: 0xff9ad5,
    mutation: "key",
  },
  D09: {
    id: "D09",
    name: "足の向きタイル",
    type: "flee",
    prompt: "床の矢印が怪しい",
    reveal: "矢印タイルが裏切者",
    hintTint: 0x88ccff,
  },
  D12: {
    id: "D12",
    name: "偽物の出口印",
    type: "flee",
    prompt: "出口のしるし…逆？",
    reveal: "出口のしるしが逆",
    hintTint: 0x88ccff,
  },
};

/**
 * 7部屋ステージ（基準提示後の本編）
 * null = 正常部屋
 */
export const STAGE_ROOMS = [
  null, // 1 正常（成功体験）
  "D06", // 2 かわいい捕食
  null, // 3 正常
  "D01", // 4 ほの怖・逃げ
  "D02", // 5 捕食変異
  "D03", // 6 小差分・逃げ
  "D12", // 7 出口前の罠
];

export function getAnomaly(id) {
  return id ? ANOMALIES[id] ?? null : null;
}
