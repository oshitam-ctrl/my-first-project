export type Season = "all" | "spring" | "summer" | "autumn" | "winter";
export type Rarity = 1 | 2 | 3;

export interface YeastData {
  id: string;
  name: string;
  rarity: Rarity;
  season: Season;
  description: string;
  emoji: string;
}

export interface BreadData {
  id: string;
  name: string;
  yeastId: string;
  toppings: string[];
  season: Season;
  description: string;
  tasteDescription: string;
  recommendation: string;
  shopName: string | null;
}

export interface ToppingData {
  id: string;
  name: string;
  emoji: string;
}

// 酵母マスターデータ
export const YEASTS: YeastData[] = [
  // 通年酵母（★）
  { id: "yeast-yuzu", name: "ゆず酵母", rarity: 1, season: "all", description: "ゆずの妖精。柑橘色の羽を持つ。", emoji: "🧚‍♀️" },
  { id: "yeast-apple", name: "りんご酵母", rarity: 1, season: "all", description: "りんごの妖精。赤いほっぺが可愛い。", emoji: "🧚" },
  // 季節酵母（★★）
  { id: "yeast-strawberry", name: "いちご酵母", rarity: 2, season: "spring", description: "いちごの妖精。ピンクの髪が特徴。", emoji: "🧚‍♀️" },
  { id: "yeast-herb", name: "ハーブ酵母", rarity: 2, season: "summer", description: "ハーブの妖精。緑の衣をまとう。", emoji: "🧝‍♀️" },
  { id: "yeast-grape", name: "ぶどう酵母", rarity: 2, season: "autumn", description: "ぶどうの妖精。紫色に輝く羽。", emoji: "🧚" },
  { id: "yeast-yuzu-special", name: "ゆず酵母〈特別版〉", rarity: 2, season: "winter", description: "冬のゆず妖精。金色の光を放つ。", emoji: "✨" },
  // レア酵母（★★★）
  { id: "yeast-rose", name: "バラ酵母", rarity: 3, season: "all", description: "バラの妖精。最も美しく気高い。オーナーの原点。", emoji: "🌹" },
  { id: "yeast-honey", name: "はちみつ酵母", rarity: 3, season: "all", description: "はちみつの妖精。蜂と友達。", emoji: "🐝" },
];

// トッピングマスターデータ
export const TOPPINGS: ToppingData[] = [
  { id: "topping-walnut", name: "クルミ", emoji: "🥜" },
  { id: "topping-raisin", name: "レーズン", emoji: "🍇" },
  { id: "topping-chocolate", name: "チョコチップ", emoji: "🍫" },
  { id: "topping-cheese", name: "チーズ", emoji: "🧀" },
  { id: "topping-honey", name: "はちみつ", emoji: "🍯" },
  { id: "topping-herb", name: "ハーブ", emoji: "🌿" },
];

// 通年パン16種（4酵母 × 4トッピング）
export const BREADS: BreadData[] = [
  // ゆず酵母のパン
  { id: "bread-yuzu-walnut", name: "ゆずとクルミのカンパーニュ", yeastId: "yeast-yuzu", toppings: ["topping-walnut"], season: "all", description: "ゆずの爽やかさとクルミの香ばしさが絶妙。", tasteDescription: "外はカリッと、中はしっとり。ゆずの香りがふわっと広がる。", recommendation: "クリームチーズと合わせて。白ワインとも◎", shopName: "ゆずのカンパーニュ" },
  { id: "bread-yuzu-raisin", name: "ゆずとレーズンのプチパン", yeastId: "yeast-yuzu", toppings: ["topping-raisin"], season: "all", description: "柑橘と干しぶどうの甘酸っぱいハーモニー。", tasteDescription: "もちっとした食感にレーズンの甘さがアクセント。", recommendation: "そのままおやつに。紅茶と一緒にどうぞ。", shopName: "季節のプチパン" },
  { id: "bread-yuzu-chocolate", name: "ゆずショコラ", yeastId: "yeast-yuzu", toppings: ["topping-chocolate"], season: "all", description: "ゆずとチョコレートの意外な組み合わせ。", tasteDescription: "ビターチョコとゆずの酸味が大人の味わい。", recommendation: "コーヒーのお供に最適。", shopName: "ゆずショコラ" },
  { id: "bread-yuzu-cheese", name: "ゆずとチーズのフォカッチャ", yeastId: "yeast-yuzu", toppings: ["topping-cheese"], season: "all", description: "ゆずの風味が効いたチーズフォカッチャ。", tasteDescription: "もっちりした生地にチーズのコク。トーストすると絶品。", recommendation: "オリーブオイルを添えて。スープと一緒に。", shopName: "チーズフォカッチャ" },
  // りんご酵母のパン
  { id: "bread-apple-walnut", name: "りんごとクルミの田舎パン", yeastId: "yeast-apple", toppings: ["topping-walnut"], season: "all", description: "りんごの優しい甘さとクルミの食感が楽しい。", tasteDescription: "噛むほどにりんごの風味。翌日トーストするとまた違う表情に。", recommendation: "バターをたっぷり塗って。シードルとも合う。", shopName: "りんごの田舎パン" },
  { id: "bread-apple-raisin", name: "りんごとレーズンのシナモンロール", yeastId: "yeast-apple", toppings: ["topping-raisin"], season: "all", description: "りんご酵母で作る贅沢シナモンロール。", tasteDescription: "ふんわり柔らかく、レーズンの甘みがたっぷり。", recommendation: "温めて食べるのがおすすめ。カフェラテと。", shopName: "シナモンロール" },
  { id: "bread-apple-chocolate", name: "りんごショコラブレッド", yeastId: "yeast-apple", toppings: ["topping-chocolate"], season: "all", description: "りんごの爽やかさがチョコの甘さを引き立てる。", tasteDescription: "しっとりリッチな味わい。チョコがとろける瞬間が幸せ。", recommendation: "冷やして食べても美味しい。", shopName: "ショコラブレッド" },
  { id: "bread-apple-cheese", name: "りんごとカマンベールのパン", yeastId: "yeast-apple", toppings: ["topping-cheese"], season: "all", description: "りんご酵母とカマンベールの贅沢な組み合わせ。", tasteDescription: "りんごの酸味とチーズのクリーミーさが絶妙なバランス。", recommendation: "赤ワインと一緒に。おもてなしの一品に。", shopName: "カマンベールパン" },
  // いちご酵母のパン（春限定）
  { id: "bread-strawberry-walnut", name: "春いちごのプチカンパーニュ", yeastId: "yeast-strawberry", toppings: ["topping-walnut"], season: "spring", description: "春だけの特別なカンパーニュ。いちごの香りが春を運ぶ。", tasteDescription: "ほんのりピンク色の生地。クルミの香ばしさといちごの甘さ。", recommendation: "クリームチーズと合わせて。白ワインとも◎", shopName: "季節のプチカンパーニュ" },
  { id: "bread-strawberry-chocolate", name: "いちごショコラ", yeastId: "yeast-strawberry", toppings: ["topping-chocolate"], season: "spring", description: "いちごとチョコの王道コンビを天然酵母で。", tasteDescription: "甘酸っぱさとビターチョコが口の中でとろける。", recommendation: "バレンタインの贈り物にも。", shopName: "いちごショコラ" },
  // ハーブ酵母のパン（夏限定）
  { id: "bread-herb-cheese", name: "夏のハーブチーズフォカッチャ", yeastId: "yeast-herb", toppings: ["topping-cheese"], season: "summer", description: "校庭のハーブが香る夏だけのフォカッチャ。", tasteDescription: "ローズマリーとチーズの地中海風味。夏の食卓にぴったり。", recommendation: "トマトスープと一緒に。冷たいビールとも。", shopName: "ハーブフォカッチャ" },
  { id: "bread-herb-honey", name: "ハーブとはちみつのパン", yeastId: "yeast-herb", toppings: ["topping-honey"], season: "summer", description: "ハーブの爽やかさとはちみつの甘さのマリアージュ。", tasteDescription: "ふわっと広がるハーブの香りと優しいはちみつの甘さ。", recommendation: "アイスティーと一緒に涼しい午後のおやつに。", shopName: "はちみつハーブパン" },
  // ぶどう酵母のパン（秋限定）
  { id: "bread-grape-walnut", name: "秋のぶどうカンパーニュ", yeastId: "yeast-grape", toppings: ["topping-walnut"], season: "autumn", description: "ぶどうの芳醇さとクルミで秋を味わう。", tasteDescription: "深い味わいの生地にクルミがアクセント。赤ワインのような余韻。", recommendation: "チーズプレートと一緒に。秋の夜長に。", shopName: "ぶどうのカンパーニュ" },
  { id: "bread-grape-raisin", name: "ダブルぶどうのパン", yeastId: "yeast-grape", toppings: ["topping-raisin"], season: "autumn", description: "ぶどう酵母×レーズンのぶどうづくし。", tasteDescription: "ぶどうの風味が二重に楽しめる贅沢な一品。", recommendation: "ブルーチーズを添えて。デザートワインとも。", shopName: "ぶどうパン" },
  // ゆず酵母〈特別版〉のパン（冬限定）
  { id: "bread-yuzu-special-honey", name: "冬至のゆずはちみつパン", yeastId: "yeast-yuzu-special", toppings: ["topping-honey"], season: "winter", description: "冬至の特別なゆず酵母とはちみつで作る冬の定番。", tasteDescription: "濃厚なゆずの香りにはちみつの温かい甘さ。身体の芯から温まる。", recommendation: "温かいミルクティーと。風邪予防にも。", shopName: "冬至のゆずパン" },
  { id: "bread-yuzu-special-chocolate", name: "冬のゆずショコラスペシャル", yeastId: "yeast-yuzu-special", toppings: ["topping-chocolate"], season: "winter", description: "冬限定の濃厚ゆずとベルギーチョコの特別版。", tasteDescription: "通常版より深みのあるゆずの香り。ビターチョコとの相性は冬だけの特権。", recommendation: "クリスマスのテーブルに。ホットチョコレートと。", shopName: "冬のゆずショコラ" },
];

// ガチャの排出率設定（パッケージガチャ方式）
export const GACHA_RATES: Record<Rarity, number> = {
  1: 40, // ★
  2: 15, // ★★（各季節）
  3: 5,  // ★★★
};

// 被りストーリー
export const DUPLICATE_STORIES: Record<string, string[]> = {
  "yeast-yuzu": [
    "ゆずは毎年11月、地元のおじいちゃんが軽トラで届けてくれます。「傷もんでええか？」「もちろん！」",
    "ゆず酵母のパンは、翌日トーストするとゆずの香りがもう一度ふわっと立ちます。",
    "この廃校の教室で最初にパンを焼いた日。ゆず酵母の香りが教室中に広がった瞬間、「ここでやっていける」と思いました。",
  ],
  "yeast-apple": [
    "りんごは隣町の果樹園から。落ちたりんごも、傷ついたりんごも、酵母にとっては最高の素材です。",
    "りんご酵母のパンは焼いてから2日目が実は一番おいしい。水分がなじんで、もっちり感が増します。",
    "「規格外」って言葉、パン屋を始めてから好きになりました。形が変でも、味は変わらない。",
  ],
  "yeast-strawberry": [
    "いちごの季節は短い。だからこそ、春のいちご酵母は特別なんです。",
    "いちご酵母のパンにクリームチーズ、その上にスライスいちご。これが春の朝の贅沢。",
    "地元の農家さんが「小さすぎて出荷できん」と持ってきてくれたいちご。小さいほど味が濃い。",
  ],
  "yeast-herb": [
    "校庭の片隅にハーブ畑を作りました。ローズマリー、タイム、バジル…パンに使える子たちばかり。",
    "ハーブ酵母のパンは、オリーブオイルとの相性が抜群。夏のお昼に最高です。",
    "夏の暑い日、教室の窓を全開にしてパンを焼く。ハーブの香りが風に乗って、校庭の向こうまで届く。",
  ],
  "yeast-grape": [
    "ぶどう酵母は発酵力が強い。ワイン酵母と親戚みたいなもので、元気いっぱいに膨らんでくれます。",
    "ぶどうのカンパーニュは、チーズと赤ワインと一緒に。秋の夜長のお供にどうぞ。",
    "秋の収穫祭のあと、規格外のぶどうをたくさんもらいます。これが一年分のぶどう酵母になる。",
  ],
  "yeast-yuzu-special": [
    "冬至の日に仕込むゆず酵母は、なぜか通常版より香りが濃い。冬のゆずは力がある。",
    "冬至のゆずパンを食べると風邪をひかない…というのは迷信ですが、温まるのは本当です。",
    "12月の教室は寒い。でもオーブンに火を入れると、教室全体が暖かくなる。冬のパン作りが一番好き。",
  ],
  "yeast-rose": [
    "バラ酵母は北海道の叔母の庭のバラがきっかけ。「これで何かできないの？」という一言から始まりました。",
    "バラの酵母パンは、ほんのりフローラルな香り。プレーンで食べるのが一番おすすめ。",
    "パン屋を始める前、いろんな酵母を試しました。バラが一番難しくて、一番美しかった。原点です。",
  ],
  "yeast-honey": [
    "はちみつは北広島町の養蜂家さんから。山の花の蜜で、季節ごとに色が違うんです。",
    "はちみつ酵母のパンにバターを塗って、その上にまたはちみつ。背徳の味です。",
    "蜂の巣箱を見せてもらったとき、蜂たちが花から花へ飛ぶ姿に、循環の美しさを感じました。",
  ],
};

// 現在の季節を取得
export function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

// 現在入手可能な酵母を取得
export function getAvailableYeasts(): YeastData[] {
  const currentSeason = getCurrentSeason();
  return YEASTS.filter(y => y.season === "all" || y.season === currentSeason);
}

// 規格外の果物表示テキスト
export const IRREGULAR_FRUITS: Record<string, string[]> = {
  "yeast-yuzu": ["傷ついたゆず", "小さすぎるゆず", "形の悪いゆず"],
  "yeast-apple": ["傷ついたりんご", "小さすぎるりんご", "色むらのあるりんご"],
  "yeast-strawberry": ["小さすぎるいちご", "形の悪いいちご", "熟しすぎたいちご"],
  "yeast-herb": ["曲がったローズマリー", "虫食いのバジル", "伸びすぎたタイム"],
  "yeast-grape": ["割れたぶどう", "小粒のぶどう", "色むらのあるぶどう"],
  "yeast-yuzu-special": ["冬至のゆず", "霜にあたったゆず", "最後の収穫のゆず"],
  "yeast-rose": ["花びらが散りかけのバラ", "虫に食われたバラ", "短く切られたバラ"],
  "yeast-honey": ["結晶化したはちみつ", "色の濃いはちみつ", "少量残ったはちみつ"],
};
