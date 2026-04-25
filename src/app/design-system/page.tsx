import type { Metadata } from "next";
import Link from "next/link";
import {
  palette,
  typeScaleJP,
  spacingScale,
  radiusScale,
  brandTone,
  languageGuide,
  heroCharacter,
} from "@/lib/design-tokens";
import { HeroScene } from "./HeroScene";

export const metadata: Metadata = {
  title: "デザインシステム | プチヘルメース",
  description:
    "夕暮れの工房で頬杖をつく少女と妖精の物語を起点とした、プチヘルメースのデザインシステム",
};

const sectionCard =
  "rounded-3xl bg-[#FCF8F3] border border-[#E6D9BF] p-6 md:p-8 shadow-[0_2px_18px_rgba(107,78,61,0.08)]";

const sectionNumber = "text-[#C65A4A] font-serif tracking-wide";

const sectionHeading =
  "text-2xl md:text-[28px] font-bold text-[#2A2A29] mb-6 flex items-baseline gap-3";

export default function DesignSystemPage() {
  return (
    <main
      className="min-h-screen px-4 md:px-10 py-10 md:py-14"
      style={{
        background:
          "linear-gradient(180deg, #F6E9D6 0%, #EDE0C4 40%, #E6D2A8 100%)",
        fontFamily:
          '"Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif',
      }}
    >
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        {/* ===== ヒーロー ===== */}
        <section
          className="relative overflow-hidden rounded-3xl border border-[#C9B68F]"
          style={{
            background:
              "linear-gradient(135deg, #FCF8F3 0%, #F6E9D6 60%, #EDE0C4 100%)",
            boxShadow: "0 8px 36px rgba(107, 78, 61, 0.18)",
          }}
        >
          <div className="grid md:grid-cols-[1.1fr_1fr] gap-0">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <p className="text-[#8C7A56] tracking-[0.3em] text-xs mb-4">
                PETIT HERMÈS · DESIGN SYSTEM
              </p>
              <h1 className="text-4xl md:text-[44px] font-bold text-[#2A2A29] leading-tight mb-4">
                デザインシステム
              </h1>
              <p
                className="text-[#6B4E3D] text-base md:text-lg leading-relaxed mb-6"
                style={{ fontFamily: '"Noto Serif JP", serif' }}
              >
                夕暮れの工房で頬杖をつく少女と、そっと寄り添う妖精。
                <br />
                その静かな一瞬を起点に、やさしい光と手づくりのぬくもりを
                <br className="hidden md:block" />
                一貫して表現するためのビジュアル＆言葉のガイドラインです。
              </p>
              <div className="flex flex-wrap gap-2">
                {heroCharacter.vibe.map((v) => (
                  <span
                    key={v}
                    className="px-3 py-1 rounded-full text-xs bg-[#F6E9D6] text-[#6B4E3D] border border-[#D8B785]"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative bg-[#3F4F3A] min-h-[260px] md:min-h-[420px]">
              <HeroScene />
            </div>
          </div>
        </section>

        {/* ===== 01 + 02 ===== */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* 01 カラーパレット */}
          <section className={sectionCard}>
            <h2 className={sectionHeading}>
              <span className={sectionNumber}>01.</span>
              <span>カラーパレット</span>
            </h2>
            <ColorRow title="プライマリカラー" items={palette.primary} />
            <ColorRow title="セカンダリカラー" items={palette.secondary} />
            <ColorRow title="ニュートラルカラー" items={palette.neutral} />
          </section>

          {/* 02 タイポグラフィ */}
          <section className={sectionCard}>
            <h2 className={sectionHeading}>
              <span className={sectionNumber}>02.</span>
              <span>タイポグラフィ</span>
            </h2>
            <div className="grid sm:grid-cols-[1fr_auto] gap-6">
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-[#8C7A56] mb-1">見出し（和文）</p>
                  <p
                    className="text-[28px] md:text-[34px] font-bold text-[#2A2A29] leading-tight"
                    style={{ fontFamily: '"Noto Serif JP", serif' }}
                  >
                    やさしい光に包まれて
                  </p>
                  <p
                    className="text-[#6B4E3D]"
                    style={{ fontFamily: '"Noto Serif JP", serif' }}
                  >
                    花や緑とともにある、あたたかな毎日。
                  </p>
                  <p className="text-[11px] text-[#8C7A56] mt-1">
                    Noto Serif JP / Bold
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8C7A56] mb-1">本文（和文）</p>
                  <p
                    className="text-[#2A2A29] leading-relaxed"
                    style={{ fontFamily: '"Noto Serif JP", serif' }}
                  >
                    ここでは、自然の恵みと手づくりの楽しさを大切にしながら、
                    日々の暮らしを豊かにするヒントをお届けします。
                  </p>
                  <p className="text-[11px] text-[#8C7A56] mt-1">
                    Noto Serif JP / Regular
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8C7A56] mb-1">見出し（欧文）</p>
                  <p
                    className="text-2xl md:text-[26px] font-semibold text-[#2A2A29]"
                    style={{ fontFamily: '"EB Garamond", "Georgia", serif' }}
                  >
                    Wrapped in Gentle Light
                  </p>
                  <p className="text-[11px] text-[#8C7A56]">EB Garamond / Bold</p>
                </div>
                <div>
                  <p className="text-xs text-[#8C7A56] mb-1">本文（欧文）</p>
                  <p
                    className="text-[#2A2A29] leading-relaxed"
                    style={{ fontFamily: '"EB Garamond", "Georgia", serif' }}
                  >
                    Here, we cherish the gifts of nature and the joy of handmade
                    things, offering ideas to enrich your everyday life.
                  </p>
                  <p className="text-[11px] text-[#8C7A56]">EB Garamond / Regular</p>
                </div>
              </div>
              <div className="border-l border-[#E6D9BF] pl-6 space-y-4 hidden sm:block">
                <p className="text-xs text-[#8C7A56]">タイプスケール（和文）</p>
                {typeScaleJP.map((t) => (
                  <div key={t.label} className="flex items-baseline gap-3">
                    <span
                      className="font-bold text-[#2A2A29]"
                      style={{
                        fontSize: t.size,
                        fontFamily: '"Noto Serif JP", serif',
                      }}
                    >
                      {t.label}
                    </span>
                    <span className="text-[11px] text-[#8C7A56]">
                      {t.size} / {t.weight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ===== 03 + 05 ===== */}
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-6 md:gap-8">
          {/* 03 イラストスタイル */}
          <section className={sectionCard}>
            <h2 className={sectionHeading}>
              <span className={sectionNumber}>03.</span>
              <span>イラストスタイル</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div
                className="w-full sm:w-44 aspect-square rounded-full overflow-hidden flex-shrink-0 border-2 border-[#D8B785]"
                style={{ boxShadow: "0 6px 22px rgba(107,78,61,0.18)" }}
              >
                <div className="w-full h-full bg-gradient-to-br from-[#3F4F3A] via-[#6B5A3A] to-[#D8B785] relative">
                  <div className="absolute inset-0 scale-150 -translate-x-2 translate-y-2">
                    <HeroScene />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <p
                  className="text-[#2A2A29] mb-4 leading-relaxed"
                  style={{ fontFamily: '"Noto Serif JP", serif' }}
                >
                  水彩のような柔らかい質感と、
                  <br />
                  自然光のきらめきが特徴の
                  <br />
                  手描き風イラストレーション。
                </p>
                <ul
                  className="space-y-1.5 text-sm text-[#6B4E3D]"
                  style={{ fontFamily: '"Noto Serif JP", serif' }}
                >
                  <li>・やさしい線と温かみのある色合い</li>
                  <li>・自然モチーフや手づくりの要素</li>
                  <li>・光と影のコントラストをやわらかく表現</li>
                  <li>・主役は「あゆみ」の静かな表情</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 05 UIコンポーネント */}
          <section className={sectionCard}>
            <h2 className={sectionHeading}>
              <span className={sectionNumber}>05.</span>
              <span>UIコンポーネント</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-[#8C7A56] mb-2">ボタン</p>
                  <div className="space-y-3">
                    <button
                      className="px-6 py-2.5 rounded-full text-white font-semibold shadow"
                      style={{ background: "#C65A4A" }}
                    >
                      プライマリボタン
                    </button>
                    <br />
                    <button
                      className="px-6 py-2.5 rounded-full font-semibold"
                      style={{
                        background: "transparent",
                        color: "#6B4E3D",
                        border: "1.5px solid #8FA57B",
                      }}
                    >
                      セカンダリボタン
                    </button>
                    <br />
                    <a
                      href="#"
                      className="text-[#8FA57B] font-semibold inline-flex items-center gap-1"
                    >
                      テキストリンク <span aria-hidden>›</span>
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#8C7A56] mb-2">カード</p>
                  <div
                    className="rounded-2xl bg-white border border-[#E6D9BF] p-3 flex gap-3 items-center"
                    style={{ boxShadow: "0 4px 14px rgba(107,78,61,0.08)" }}
                  >
                    <div
                      className="w-16 h-16 rounded-xl flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg,#E9C58A 0%,#9C6B3C 100%)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#F6E0DC] text-[#C65A4A] mb-1">
                        レシピ
                      </span>
                      <p
                        className="text-sm font-bold text-[#2A2A29]"
                        style={{ fontFamily: '"Noto Serif JP", serif' }}
                      >
                        森の恵みのパン
                      </p>
                      <p className="text-[11px] text-[#8C7A56]">2024.05.12</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-[#8C7A56] mb-2">入力フィールド</p>
                  <p className="text-[11px] text-[#8C7A56] mb-1">通常</p>
                  <input
                    placeholder="テキストを入力"
                    className="w-full px-4 py-2 rounded-xl bg-[#FCF8F3] border border-[#E6D9BF] text-sm text-[#2A2A29] outline-none placeholder:text-[#B8B2A6]"
                  />
                  <p className="text-[11px] text-[#8C7A56] mb-1 mt-3">
                    フォーカス
                  </p>
                  <input
                    placeholder="テキストを入力"
                    className="w-full px-4 py-2 rounded-xl bg-white border-2 border-[#8FA57B] text-sm text-[#2A2A29] outline-none placeholder:text-[#B8B2A6]"
                    style={{ boxShadow: "0 0 0 4px rgba(143,165,123,0.15)" }}
                  />
                </div>
                <div>
                  <p className="text-xs text-[#8C7A56] mb-2">タグ</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "レシピ", bg: "#F6E0DC", fg: "#C65A4A" },
                      { label: "暮らし", bg: "#DDE3D5", fg: "#51706B" },
                      { label: "季節", bg: "#F6EBC8", fg: "#8C7A56" },
                      { label: "手づくり", bg: "#E8DCD5", fg: "#8E6D7A" },
                    ].map((t) => (
                      <span
                        key={t.label}
                        className="px-3 py-1 rounded-full text-xs"
                        style={{ background: t.bg, color: t.fg }}
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ===== 04 アイコンセット ===== */}
        <section className={sectionCard}>
          <h2 className={sectionHeading}>
            <span className={sectionNumber}>04.</span>
            <span>アイコンセット</span>
          </h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-6">
            {[
              { label: "ホーム", path: <IconHome /> },
              { label: "レシピ", path: <IconLeaf /> },
              { label: "お気に入り", path: <IconHeart /> },
              { label: "カート", path: <IconBasket /> },
              { label: "プロフィール", path: <IconUser /> },
              { label: "検索", path: <IconSearch /> },
              { label: "カレンダー", path: <IconCalendar /> },
              { label: "お知らせ", path: <IconBell /> },
              { label: "設定", path: <IconGear /> },
              { label: "シェア", path: <IconShare /> },
            ].map((i) => (
              <div key={i.label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 text-[#6B4E3D]">{i.path}</div>
                <span className="text-[11px] text-[#6B4E3D]">{i.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 06 + 07 ===== */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* 06 スペーシング & レイアウト */}
          <section className={sectionCard}>
            <h2 className={sectionHeading}>
              <span className={sectionNumber}>06.</span>
              <span>スペーシング ＆ レイアウト</span>
            </h2>
            <p className="text-xs text-[#8C7A56] mb-3">
              スペーシングスケール（8px基準）
            </p>
            <div className="flex flex-wrap items-end gap-4 mb-6">
              {spacingScale.map((s) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <div
                    className="rounded-md bg-[#F6E9D6] border border-[#D8B785]"
                    style={{ width: s, height: s }}
                  />
                  <span className="text-[11px] text-[#8C7A56]">{s}</span>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-[#8C7A56] mb-2">グリッドシステム</p>
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-16 rounded-sm bg-[#F6E9D6] border border-[#D8B785]"
                    />
                  ))}
                </div>
                <ul className="text-[11px] text-[#8C7A56] leading-relaxed">
                  <li>12カラム</li>
                  <li>カラム幅: 72px</li>
                  <li>ガター幅: 24px</li>
                </ul>
              </div>
              <div>
                <p className="text-xs text-[#8C7A56] mb-2">角丸</p>
                <div className="flex items-end gap-3">
                  {radiusScale.map((r) => (
                    <div key={r} className="flex flex-col items-center gap-1">
                      <div
                        className="w-14 h-14 bg-[#F6E9D6] border border-[#D8B785]"
                        style={{ borderRadius: r }}
                      />
                      <span className="text-[11px] text-[#8C7A56]">{r}px</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 07 写真・テクスチャのトーン */}
          <section className={sectionCard}>
            <h2 className={sectionHeading}>
              <span className={sectionNumber}>07.</span>
              <span>写真・テクスチャのトーン</span>
            </h2>
            <p
              className="text-sm text-[#6B4E3D] mb-4"
              style={{ fontFamily: '"Noto Serif JP", serif' }}
            >
              自然光のやさしさと、手づくりの温かみを伝えるトーン。
              夕暮れの琥珀色を最も大切な指標とします。
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                "linear-gradient(135deg,#F6E9D6 0%,#D8B785 100%)",
                "linear-gradient(135deg,#8FA57B 0%,#51706B 100%)",
                "linear-gradient(135deg,#E9C58A 0%,#9C6B3C 100%)",
                "linear-gradient(135deg,#3F4F3A 0%,#D8B785 100%)",
              ].map((bg, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl"
                  style={{ background: bg }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {["#自然光", "#手づくり", "#ナチュラル", "#温かみ", "#季節感", "#夕暮れ"].map(
                (t) => (
                  <span
                    key={t}
                    className="text-[11px] px-3 py-1 rounded-full bg-[#F6E9D6] text-[#6B4E3D] border border-[#D8B785]"
                  >
                    {t}
                  </span>
                ),
              )}
            </div>
          </section>
        </div>

        {/* ===== 08 + 09 ===== */}
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-6 md:gap-8">
          {/* 08 ブランドトーン & 言語ガイド */}
          <section className={sectionCard}>
            <h2 className={sectionHeading}>
              <span className={sectionNumber}>08.</span>
              <span>ブランドトーン ＆ 言語ガイド</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-[#8C7A56] mb-2">ブランドトーン</p>
                <div className="flex flex-wrap gap-2">
                  {brandTone.map((tone) => (
                    <span
                      key={tone}
                      className="px-3 py-1 rounded-full text-xs bg-[#F6E0DC] text-[#C65A4A] border border-[#E6BFB5]"
                    >
                      {tone}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-[#8C7A56] mb-2">言語ガイド</p>
                <ul
                  className="space-y-1.5 text-sm text-[#6B4E3D]"
                  style={{ fontFamily: '"Noto Serif JP", serif' }}
                >
                  {languageGuide.map((g) => (
                    <li key={g}>・{g}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 09 キービジュアル要素 */}
          <section className={sectionCard}>
            <h2 className={sectionHeading}>
              <span className={sectionNumber}>09.</span>
              <span>キービジュアル要素</span>
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "人物", el: <KeyGirl /> },
                { label: "妖精", el: <KeyFairy /> },
                { label: "パン", el: <KeyBread /> },
                { label: "花", el: <KeyFlower /> },
                { label: "緑", el: <KeyLeaf /> },
              ].map((k) => (
                <div key={k.label} className="flex flex-col items-center gap-2">
                  <div className="w-full aspect-square rounded-xl bg-[#FCF8F3] border border-[#E6D9BF] p-2 flex items-center justify-center">
                    {k.el}
                  </div>
                  <span className="text-[11px] text-[#6B4E3D]">{k.label}</span>
                </div>
              ))}
            </div>
            <p
              className="mt-5 text-sm text-[#6B4E3D] leading-relaxed"
              style={{ fontFamily: '"Noto Serif JP", serif' }}
            >
              中心はいつも「あゆみ」。彼女のとなりに妖精、パン、花、緑が
              そっと寄り添う構図を基本とします。
            </p>
          </section>
        </div>

        <footer className="text-center text-xs text-[#8C7A56] py-6">
          <Link href="/" className="underline underline-offset-4 hover:text-[#C65A4A]">
            ← アプリへ戻る
          </Link>
        </footer>
      </div>
    </main>
  );
}

function ColorRow({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{ name: string; hex: string; note?: string }>;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="text-xs text-[#8C7A56] mb-2">{title}</p>
      <div className="grid grid-cols-5 gap-2">
        {items.map((c) => (
          <div key={c.hex} className="flex flex-col items-center gap-1">
            <div
              className="w-full aspect-square rounded-xl border border-black/5"
              style={{
                background: c.hex,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)",
              }}
              title={c.note ?? c.name}
            />
            <span className="text-[10px] tracking-wider text-[#6B4E3D] font-mono">
              {c.hex}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Icons (line, 1.5px stroke, rounded) ===== */

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      {children}
    </svg>
  );
}

function IconHome() {
  return (
    <IconBase>
      <path d="M5 14 L16 5 L27 14 V25 Q27 27 25 27 H7 Q5 27 5 25 Z" />
      <path d="M13 27 V19 H19 V27" />
    </IconBase>
  );
}
function IconLeaf() {
  return (
    <IconBase>
      <path d="M7 25 Q10 9 25 7 Q23 22 9 25 Z" />
      <path d="M9 25 L20 14" />
    </IconBase>
  );
}
function IconHeart() {
  return (
    <IconBase>
      <path d="M16 26 Q4 18 6 11 Q8 5 12 7 Q15 8 16 11 Q17 8 20 7 Q24 5 26 11 Q28 18 16 26 Z" />
    </IconBase>
  );
}
function IconBasket() {
  return (
    <IconBase>
      <path d="M5 12 H27 L24 26 H8 Z" />
      <path d="M11 12 L13 6 M21 12 L19 6" />
      <path d="M13 17 V22 M19 17 V22 M16 17 V22" />
    </IconBase>
  );
}
function IconUser() {
  return (
    <IconBase>
      <circle cx="16" cy="12" r="5" />
      <path d="M6 27 Q8 18 16 18 Q24 18 26 27" />
    </IconBase>
  );
}
function IconSearch() {
  return (
    <IconBase>
      <circle cx="14" cy="14" r="7" />
      <path d="M19 19 L26 26" />
    </IconBase>
  );
}
function IconCalendar() {
  return (
    <IconBase>
      <rect x="5" y="7" width="22" height="20" rx="2" />
      <path d="M5 13 H27 M11 5 V9 M21 5 V9" />
      <circle cx="11" cy="18" r="1" fill="currentColor" />
      <circle cx="16" cy="18" r="1" fill="currentColor" />
      <circle cx="21" cy="18" r="1" fill="currentColor" />
    </IconBase>
  );
}
function IconBell() {
  return (
    <IconBase>
      <path d="M9 22 Q9 13 16 13 Q23 13 23 22 Z" />
      <path d="M7 22 H25" />
      <path d="M14 25 Q16 27 18 25" />
      <path d="M16 10 V13" />
    </IconBase>
  );
}
function IconGear() {
  return (
    <IconBase>
      <circle cx="16" cy="16" r="4" />
      <path d="M16 4 V8 M16 24 V28 M4 16 H8 M24 16 H28 M7 7 L10 10 M22 22 L25 25 M25 7 L22 10 M10 22 L7 25" />
    </IconBase>
  );
}
function IconShare() {
  return (
    <IconBase>
      <circle cx="9" cy="16" r="3" />
      <circle cx="23" cy="8" r="3" />
      <circle cx="23" cy="24" r="3" />
      <path d="M11.5 14.5 L20.5 9.5 M11.5 17.5 L20.5 22.5" />
    </IconBase>
  );
}

/* ===== Key Visual Mini-Illustrations ===== */

function KeyGirl() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <ellipse cx="32" cy="40" rx="18" ry="20" fill="#3F5C7E" />
      <path d="M14 40 Q32 28 50 40 L50 56 H14 Z" fill="#EDE0C4" />
      <circle cx="32" cy="22" r="14" fill="#F4D8B6" />
      <path
        d="M18 18 Q20 6 32 6 Q44 6 46 18 Q46 26 42 30 Q38 24 32 24 Q26 24 22 30 Q18 26 18 18 Z"
        fill="#3A2418"
      />
      <path d="M22 22 Q18 38 22 46 Q26 46 26 40 Q26 30 24 22 Z" fill="#3A2418" />
      <path d="M42 22 Q46 38 42 46 Q38 46 38 40 Q38 30 40 22 Z" fill="#3A2418" />
      <ellipse cx="28" cy="24" rx="1.4" ry="2" fill="#2A1A12" />
      <ellipse cx="36" cy="24" rx="1.4" ry="2" fill="#2A1A12" />
      <path
        d="M30 30 Q32 32 34 30"
        stroke="#A04437"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M22 8 Q26 4 32 6 Q38 4 42 8 Q40 12 32 12 Q24 12 22 8 Z"
        fill="#C65A4A"
      />
    </svg>
  );
}
function KeyFairy() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <ellipse cx="22" cy="30" rx="10" ry="16" fill="#B8DDC9" opacity="0.7" />
      <ellipse cx="42" cy="30" rx="10" ry="16" fill="#B8DDC9" opacity="0.7" />
      <ellipse cx="32" cy="38" rx="6" ry="10" fill="#EFD8AE" />
      <circle cx="32" cy="24" r="7" fill="#F4D8B6" />
      <path d="M25 22 Q26 14 32 12 Q38 14 39 22 Q36 18 32 18 Q28 18 25 22 Z" fill="#E1C46A" />
      <ellipse cx="29" cy="25" rx="0.8" ry="1.2" fill="#2A1A12" />
      <ellipse cx="35" cy="25" rx="0.8" ry="1.2" fill="#2A1A12" />
    </svg>
  );
}
function KeyBread() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <ellipse cx="32" cy="36" rx="24" ry="16" fill="#9C6B3C" />
      <ellipse cx="32" cy="34" rx="24" ry="16" fill="#E9C58A" />
      <path
        d="M14 32 Q32 24 50 32"
        stroke="#9C6B3C"
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M16 38 Q32 30 48 38"
        stroke="#9C6B3C"
        strokeWidth="1.2"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}
function KeyFlower() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <g transform="translate(32 32)">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-14"
            rx="6"
            ry="10"
            fill="#F4D8B6"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="6" fill="#E1C46A" />
      </g>
      <path d="M32 38 Q32 56 30 60" stroke="#8FA57B" strokeWidth="2" fill="none" />
      <path d="M28 50 Q22 48 22 42" stroke="#8FA57B" strokeWidth="2" fill="none" />
    </svg>
  );
}
function KeyLeaf() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <path d="M14 50 Q22 14 50 14 Q42 46 14 50 Z" fill="#8FA57B" />
      <path
        d="M18 48 L46 18"
        stroke="#51706B"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M24 42 L36 36 M28 38 L40 26"
        stroke="#51706B"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
