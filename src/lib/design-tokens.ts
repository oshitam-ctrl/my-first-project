/**
 * プチヘルメース デザイントークン
 *
 * ベースインスピレーション:
 * 「夕暮れの工房で、焼きたてのパンのそばで頬杖をつく少女と、
 *  そっと寄り添う小さな妖精」
 *
 * 窓から差し込む琥珀色の光、深い森のような緑、
 * あたたかい古木のブラウン、ふと添えられる赤いリボンの一点。
 * その静かであたたかい一瞬を、すべての色とトーンの基準にしています。
 */

export const palette = {
  primary: [
    { name: "クリームベージュ", hex: "#F6E9D6", note: "やさしい光と紙のような余白" },
    { name: "ハニーゴールド", hex: "#D8B785", note: "夕日と焼きたてのパンの色" },
    { name: "ハーブグリーン", hex: "#8FA57B", note: "窓辺の蔦と森の静けさ" },
    { name: "スカイブルー", hex: "#7FAAD4", note: "花柄ワンピースの澄んだ青" },
    { name: "リボンレッド", hex: "#C65A4A", note: "髪を結ぶ赤いリボンのアクセント" },
  ],
  secondary: [
    { name: "ココアブラウン", hex: "#6B4E3D", note: "古い木のカウンター" },
    { name: "オリーブ", hex: "#8C7A56", note: "麦と薬草のニュアンス" },
    { name: "ディープティール", hex: "#51706B", note: "妖精の羽の影色" },
    { name: "ダスティモーブ", hex: "#8E6D7A", note: "夕暮れに溶ける薄紅" },
    { name: "マスタード", hex: "#E1C46A", note: "ランプの灯りの黄み" },
  ],
  neutral: [
    { name: "ホワイトクリーム", hex: "#FCF8F3" },
    { name: "ライトサンド", hex: "#EDE4D2" },
    { name: "ストーン", hex: "#B8B2A6" },
    { name: "チャコール", hex: "#5A5650" },
    { name: "インクブラック", hex: "#2A2A29" },
  ],
} as const;

export const typeScaleJP = [
  { label: "H1", size: "40px", weight: "Bold" },
  { label: "H2", size: "28px", weight: "Bold" },
  { label: "H3", size: "20px", weight: "Bold" },
  { label: "Body", size: "16px", weight: "Regular" },
  { label: "Small", size: "14px", weight: "Regular" },
  { label: "Caption", size: "12px", weight: "Regular" },
] as const;

export const spacingScale = [4, 8, 16, 24, 32, 48, 64, 80, 96] as const;

export const radiusScale = [4, 8, 16, 24] as const;

export const brandTone = ["やさしい", "あたたかい", "ナチュラル", "親しみやすい", "丁寧"] as const;

export const languageGuide = [
  "やさしく語りかけるような言葉づかい",
  "自然や暮らしの美しさを大切に",
  "手づくりの価値や楽しさを伝える",
  "大きな声ではなく、静かにそっと寄り添うトーン",
] as const;

/**
 * キーキャラクター: あゆみ
 *  - 茶色のおさげと赤いリボン、青い小花柄のワンピース
 *  - 工房で頬杖をつき、焼きたてのパンと妖精を見つめる静かな表情
 *  - すべてのコピーとUIは「彼女のとなりにいる感覚」を目指す
 */
export const heroCharacter = {
  name: "あゆみ",
  role: "工房の店主",
  vibe: ["静かなぬくもり", "丁寧な手仕事", "やわらかな微笑み"],
  signatureColors: ["#C65A4A", "#7FAAD4", "#D8B785"],
} as const;
