// data.js — 全テキスト・商品・セリフ・クエスト定義（純データ、DOM/THREE非依存）。
// ロアの出典: /minecraft 版 (shop.js / cafe.js / sanpo.js / mobs.js) と About。
// 価格はゲーム内の架空価格（雰囲気のための演出）。

// ---------------------------------------------------------------------------
// パンのラインナップ（プチヘルメース店頭）
// ---------------------------------------------------------------------------
export const BREADS = [
  { id: 'campagne',       name: 'カンパーニュ',           emoji: '🍞', price: 980,
    story: '看板のまるいパン。自家製酵母でゆっくり発酵させた、毎日食べたい味。' },
  { id: 'ichigo',         name: 'いちご酵母のカンパーニュ', emoji: '🍓', price: 1100,
    story: '春限定。地元のいちごから起こした酵母で焼く、ほんのり甘い香り。' },
  { id: 'baguette',       name: 'バゲット',               emoji: '🥖', price: 420,
    story: '皮パリッと中もっちり。スープと一緒にどうぞ。' },
  { id: 'pain_de_mie',    name: '食パン',                 emoji: '🍞', price: 520,
    story: 'はちみつ酵母のやさしい食パン。トーストで耳までおいしい。' },
  { id: 'fruit_campagne', name: '季節のフルーツカンパーニュ', emoji: '🍑', price: 1200,
    story: '季節の規格外フルーツがごろごろ。「もったいない」を「おいしい」に。' },
  { id: 'croissant',      name: 'クロワッサン',           emoji: '🥐', price: 380,
    story: 'バター香る焼きたて。数が少ないので早いもの勝ち。' },
  { id: 'quiche',         name: 'キッシュ',               emoji: '🥧', price: 680,
    story: '畑の野菜がぎゅっと詰まった一切れ。旧給食室で仕込んでいます。' },
];

// 酵母の瓶棚（6種）— 工房の見せ場
export const JARS = [
  { id: 'strawberry', name: 'いちご酵母',     color: 0xe06a7a, story: '春。地元農家の規格外いちごから。やわらかな甘い香り。' },
  { id: 'yuzu',       name: 'ゆず酵母',       color: 0xe8c84a, story: '通年＋冬の特別仕込み。すっと爽やかな香りが立つ。' },
  { id: 'rosemary',   name: 'ローズマリー酵母', color: 0x6f8f6a, story: '夏。校庭のハーブ花壇から摘んだ枝で起こす。' },
  { id: 'grape',      name: 'ぶどう酵母',     color: 0x7a5a8f, story: '秋。皮ごと仕込む、いちばん元気な酵母。' },
  { id: 'rose',       name: 'バラ酵母',       color: 0xd88aa0, story: '店主の原点。はじまりの一瓶はバラの花からだった。' },
  { id: 'honey',      name: 'はちみつ酵母',   color: 0xd8a23a, story: '町の養蜂家さんのはちみつから。食パンの相棒。' },
];

// カフェ「South in North」メニュー
export const CAFE_MENU = [
  { id: 'spice_curry',    name: 'スパイスカレー',   emoji: '🍛', price: 900,  story: '旧給食室で仕込む日替わりカレー。' },
  { id: 'tartine',        name: 'タルティーヌ',     emoji: '🥪', price: 650,  story: 'プチヘルメースのパンに畑の野菜をのせて。' },
  { id: 'veg_soup',       name: '野菜スープ',       emoji: '🍲', price: 480,  story: '規格外野菜たっぷり。パンを浸して。' },
  { id: 'baked_sweets',   name: '焼き菓子',         emoji: '🍪', price: 320,  story: '酵母の余り種で焼くおやつ。' },
  { id: 'seasonal_drink', name: '季節のドリンク',   emoji: '🥤', price: 400,  story: 'ゆずスカッシュや甘酒など、季節で変わる。' },
];

// ---------------------------------------------------------------------------
// セリフ
// ---------------------------------------------------------------------------
export const OSHITA_DIALOG = [
  ['大下さん', 'いらっしゃいませ。ようこそ、プチヘルメースへ。\nここは2013年に閉校した南方小学校の校舎なんです。'],
  ['大下さん', '2025年の1月にここでパン屋をはじめました。\n酵母は地元の規格外の野菜や果物から起こしています。'],
  ['大下さん', 'うちは「売り切れたらおしまい」。\n水曜と土曜だけ、11時半から15時半まで開けています。'],
  ['大下さん', 'パンの耳や残りは、校舎うらのぐるぐるコンポストへ。\n堆肥になって、来年の野菜に還るんですよ。\n——今日のパンが、明日の野菜に。'],
];

export const OSHITA_SHORT = [
  ['大下さん', 'ゆっくり見ていってくださいね。\n窯の火が落ち着いたら、次のカンパーニュが焼き上がります。'],
  ['大下さん', '校庭のベンチで食べていく人も多いんですよ。\n天気のいい日は、それが一番おいしい。'],
];

export const BARISTA_DIALOG = [
  ['カフェの店主', 'いらっしゃい。ここは旧教室のカフェ「South in North」。\n料理は廊下の先の旧給食室で仕込んでるんだ。'],
  ['カフェの店主', '机ごと校庭に持ち出して食べてもいいよ。\nのんびりしていって。'],
];

export const VILLAGER_LINES = [
  ['近所のおばあちゃん', '水曜と土曜はね、この坂をパンの匂いがのぼってくるのよ。'],
  ['近所のおばあちゃん', '校舎が静かになって寂しかったけど、\nまた人が集まるようになって嬉しいわねえ。'],
];

export const KID_LINES = [
  ['じてんしゃの子', 'クロワッサンはすぐ売り切れるよ！いそげー！'],
  ['じてんしゃの子', '神社の石段、上まで競争しない？'],
];

// ---------------------------------------------------------------------------
// 案内板・ホットスポットの読み物
// ---------------------------------------------------------------------------
export const INFO = {
  busstop: {
    title: '🚌 南方小学校前 バス停',
    body: 'プチヘルメース（旧南方小学校内）\n営業: 水曜・土曜 11:30〜15:30\n※売り切れ次第閉店\n\n坂をのぼって、桜並木の先が校舎です。',
  },
  school_plate: {
    title: '🏫 旧 南方小学校',
    body: '木造二階建ての校舎。2013年に閉校。\n地域の人たちの「旧南方小学校再生プロジェクト」によって\nパン屋とカフェのある集いの場に生まれ変わった。',
  },
  plaza: {
    title: '🪑 コミュニティー広場',
    body: '工業大学の学生と町の大工さんが、町産木材で作ったベンチとパーゴラ。\n買ったパンをここで食べるのが南方流。',
  },
  compost: {
    title: '♻️ ぐるぐるコンポスト',
    body: 'パンの耳や生ごみはここへ。\n堆肥になって畑の野菜を育て、その野菜からまた酵母が生まれる。\n\n——今日のパンが、明日の野菜に。',
  },
  herb: {
    title: '🌿 ハーブ花壇',
    body: '校庭の花壇には、ローズマリーやバラ。\n夏のローズマリー酵母はここから生まれる。',
  },
  gym: {
    title: '🏀 体育館',
    body: '今日は鍵がかかっているみたい。\n月に一度、マルシェの会場になるらしい。',
  },
  shrine: {
    title: '⛩ 八幡神社',
    body: '石段の上から、南方の谷が一望できる。\nお参りした。今日もパンがおいしく焼けますように。',
  },
  bridge: {
    title: '🌉 石橋',
    body: '出原川にかかる古い石のアーチ橋。\n春は桜の花びらが川面を流れていく。',
  },
  blackboard: {
    title: '🖤 緑黒板',
    body: '「きょうのパン」がチョークで書いてある。\nカンパーニュ / バゲット / いちご酵母 / クロワッサン……',
  },
  paddy: {
    title: '🌾 棚田',
    body: '南方の谷の棚田。秋には稲穂が金色になる。\n規格外のお米も、カフェのごはんになる。',
  },
};

// ---------------------------------------------------------------------------
// クエストチェーン（線形）— reach: 位置到達 / event: 行動イベントで進む
// ---------------------------------------------------------------------------
export const QUESTS = [
  { id: 'arrive',  banner: 'さかの うえの こうしゃを めざそう',        type: 'reach', x: 0,  z: 0,  r: 16 },
  { id: 'enter',   banner: 'パンや「プチヘルメース」に はいろう',      type: 'reach', x: -14, z: -40, r: 5 },
  { id: 'talk',    banner: 'おおしたさんと はなそう',                  type: 'event', event: 'talk_oshita' },
  { id: 'buy',     banner: 'パンを かってみよう',                      type: 'event', event: 'buy_bread' },
  { id: 'jars',    banner: 'こうぼの びんだなを のぞこう',             type: 'event', event: 'see_jars' },
  { id: 'cafe',    banner: 'カフェ「South in North」で ちゅうもんしよう', type: 'event', event: 'order_cafe' },
  { id: 'lunch',   banner: 'こうていの ベンチで パンを たべよう',      type: 'event', event: 'yard_lunch' },
  { id: 'compost', banner: 'こうしゃうらの コンポストを みにいこう',   type: 'event', event: 'see_compost' },
  { id: 'bridge',  banner: 'さくらなみきを ぬけて いしばしへ',         type: 'reach', x: 10, z: 66, r: 9 },
  { id: 'shrine',  banner: 'はちまんじんじゃに おまいりしよう',        type: 'event', event: 'pray' },
];

export const QUEST_DONE_BANNER = 'クリア！ きょうも いいいちにち 🥖';

export const THANKS_CARD = {
  title: '🌸 ありがとうございました',
  body: '南方さんぽ、完走です。\n\nプチヘルメースは、広島県北広島町の旧南方小学校にある\n小さなパン屋さん（のファンゲーム）。\n\n畑の「もったいない」が酵母になり、パンになり、\n余りはコンポストで畑に還る。\n\n——今日のパンが、明日の野菜に。\n\nおみやげに「ロスパン袋」をどうぞ 🥖',
};

// ---------------------------------------------------------------------------
// 純ロジック: 線形クエストチェーン（sanpo.js のラッチングパターン）
// ---------------------------------------------------------------------------
export function createQuestChain(opts = {}) {
  const steps = opts.steps || QUESTS;
  const onAdvance = opts.onAdvance || (() => {});
  const onAllDone = opts.onAllDone || (() => {});
  let idx = 0;
  let doneOnce = false;

  function current() { return idx < steps.length ? steps[idx] : null; }

  function advance() {
    if (idx >= steps.length) return;
    idx++;
    if (idx >= steps.length) {
      if (!doneOnce) { doneOnce = true; onAllDone(); }
    } else {
      onAdvance(steps[idx], idx);
    }
  }

  // 先取り済みイベントの消化（reach で進んだ直後にも呼ぶ）
  const seen = new Set();
  function drain() {
    let any = false;
    let s = current();
    while (s && s.type === 'event' && seen.has(s.event)) {
      advance(); any = true; s = current();
    }
    return any;
  }

  // 位置更新: 現在ステップが reach なら半径判定で進める。進んだら true。
  function update(pos) {
    const s = current();
    if (!s || s.type !== 'reach' || !pos) return false;
    const dx = pos.x - s.x, dz = pos.z - s.z;
    if (Math.hypot(dx, dz) <= s.r) { advance(); drain(); return true; }
    return false;
  }

  // イベント通知: 現在ステップの event と一致したら進める。進んだら true。
  // （未来のステップのイベントは先取りでラッチして、到達時に自動スキップ）
  function credit(event) {
    seen.add(event);
    return drain();
  }

  return {
    steps, current, update, credit, advance,
    get index() { return idx; },
    get done() { return idx >= steps.length; },
  };
}
