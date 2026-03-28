"use client";

/**
 * 酵母の妖精SVGイラスト
 * 8種類の妖精それぞれに固有のかわいいデザイン
 */

function YuzuFairy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes fairy-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        .fairy-float { animation: fairy-float 3s ease-in-out infinite; }
      `}</style>
      <g className="fairy-float">
        {/* 羽（オレンジ） */}
        <ellipse cx="18" cy="22" rx="8" ry="12" fill="#FFB74D" opacity="0.4" transform="rotate(-20 18 22)" />
        <ellipse cx="46" cy="22" rx="8" ry="12" fill="#FFB74D" opacity="0.4" transform="rotate(20 46 22)" />
        {/* しずく型の体（黄色） */}
        <path d="M32 12 C32 12, 20 28, 20 38 C20 44.6 25.4 50 32 50 C38.6 50 44 44.6 44 38 C44 28 32 12 32 12Z" fill="url(#yuzu-body)" />
        {/* 葉っぱの髪飾り */}
        <ellipse cx="32" cy="14" rx="4" ry="6" fill="#8BC34A" transform="rotate(-15 32 14)" />
        <line x1="32" y1="10" x2="32" y2="18" stroke="#689F38" strokeWidth="0.8" />
        {/* ほっぺ */}
        <circle cx="25" cy="38" r="3" fill="#FFAB91" opacity="0.5" />
        <circle cx="39" cy="38" r="3" fill="#FFAB91" opacity="0.5" />
        {/* 目（キラキラ） */}
        <circle cx="27" cy="34" r="3" fill="#4A3728" />
        <circle cx="37" cy="34" r="3" fill="#4A3728" />
        <circle cx="28" cy="33" r="1.2" fill="white" />
        <circle cx="38" cy="33" r="1.2" fill="white" />
        <circle cx="26.5" cy="34.5" r="0.6" fill="white" />
        <circle cx="36.5" cy="34.5" r="0.6" fill="white" />
        {/* にっこり口 */}
        <path d="M29 41 Q32 44 35 41" stroke="#4A3728" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      <defs>
        <radialGradient id="yuzu-body" cx="0.4" cy="0.3">
          <stop offset="0%" stopColor="#FFF9C4" />
          <stop offset="100%" stopColor="#FFD54F" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function AppleFairy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes fairy-float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        .fairy-float2 { animation: fairy-float2 3s ease-in-out infinite 0.3s; }
      `}</style>
      <g className="fairy-float2">
        {/* 羽（赤） */}
        <ellipse cx="16" cy="24" rx="7" ry="11" fill="#EF5350" opacity="0.35" transform="rotate(-15 16 24)" />
        <ellipse cx="48" cy="24" rx="7" ry="11" fill="#EF5350" opacity="0.35" transform="rotate(15 48 24)" />
        {/* 丸い体（クリーム色） */}
        <circle cx="32" cy="36" r="16" fill="url(#apple-body)" />
        {/* 緑の葉っぱ帽子 */}
        <path d="M26 20 Q32 10 38 20 Q32 16 26 20Z" fill="#66BB6A" />
        <path d="M32 12 Q34 16 32 20" stroke="#43A047" strokeWidth="1" fill="none" />
        {/* ほっぺ（赤い） */}
        <circle cx="24" cy="38" r="3.5" fill="#EF5350" opacity="0.4" />
        <circle cx="40" cy="38" r="3.5" fill="#EF5350" opacity="0.4" />
        {/* 目 */}
        <circle cx="27" cy="34" r="3" fill="#4A3728" />
        <circle cx="37" cy="34" r="3" fill="#4A3728" />
        <circle cx="28" cy="33" r="1.2" fill="white" />
        <circle cx="38" cy="33" r="1.2" fill="white" />
        <circle cx="26.5" cy="34.5" r="0.6" fill="white" />
        <circle cx="36.5" cy="34.5" r="0.6" fill="white" />
        {/* 口 */}
        <path d="M29 41 Q32 44 35 41" stroke="#4A3728" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      <defs>
        <radialGradient id="apple-body" cx="0.4" cy="0.35">
          <stop offset="0%" stopColor="#FFF8E1" />
          <stop offset="100%" stopColor="#FFECB3" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function StrawberryFairy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes fairy-float3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        .fairy-float3 { animation: fairy-float3 3s ease-in-out infinite 0.6s; }
      `}</style>
      <g className="fairy-float3">
        {/* 羽（ピンク） */}
        <ellipse cx="17" cy="22" rx="7" ry="11" fill="#F48FB1" opacity="0.35" transform="rotate(-20 17 22)" />
        <ellipse cx="47" cy="22" rx="7" ry="11" fill="#F48FB1" opacity="0.35" transform="rotate(20 47 22)" />
        {/* しずく型の体（ピンク） */}
        <path d="M32 12 C32 12, 19 28, 19 38 C19 44.6 25 51 32 51 C39 51 45 44.6 45 38 C45 28 32 12 32 12Z" fill="url(#strawberry-body)" />
        {/* いちごの種模様 */}
        <circle cx="26" cy="42" r="0.8" fill="#E91E63" opacity="0.3" />
        <circle cx="32" cy="45" r="0.8" fill="#E91E63" opacity="0.3" />
        <circle cx="38" cy="42" r="0.8" fill="#E91E63" opacity="0.3" />
        <circle cx="29" cy="48" r="0.8" fill="#E91E63" opacity="0.3" />
        <circle cx="35" cy="48" r="0.8" fill="#E91E63" opacity="0.3" />
        {/* ヘタ的な飾り */}
        <path d="M28 16 L32 12 L36 16" stroke="#66BB6A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* ほっぺ */}
        <circle cx="25" cy="38" r="2.5" fill="#F48FB1" opacity="0.5" />
        <circle cx="39" cy="38" r="2.5" fill="#F48FB1" opacity="0.5" />
        {/* 目 */}
        <circle cx="28" cy="34" r="3" fill="#4A3728" />
        <circle cx="36" cy="34" r="3" fill="#4A3728" />
        <circle cx="29" cy="33" r="1.2" fill="white" />
        <circle cx="37" cy="33" r="1.2" fill="white" />
        <circle cx="27.5" cy="34.5" r="0.6" fill="white" />
        <circle cx="35.5" cy="34.5" r="0.6" fill="white" />
        {/* 口 */}
        <path d="M30 40 Q32 43 34 40" stroke="#4A3728" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      <defs>
        <radialGradient id="strawberry-body" cx="0.4" cy="0.3">
          <stop offset="0%" stopColor="#FCE4EC" />
          <stop offset="100%" stopColor="#F48FB1" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function HerbFairy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes fairy-float4 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        .fairy-float4 { animation: fairy-float4 3s ease-in-out infinite 0.9s; }
      `}</style>
      <g className="fairy-float4">
        {/* 羽（緑） */}
        <ellipse cx="16" cy="22" rx="7" ry="10" fill="#81C784" opacity="0.35" transform="rotate(-20 16 22)" />
        <ellipse cx="48" cy="22" rx="7" ry="10" fill="#81C784" opacity="0.35" transform="rotate(20 48 22)" />
        {/* 少し細長い体（エルフっぽい） */}
        <ellipse cx="32" cy="36" rx="12" ry="16" fill="url(#herb-body)" />
        {/* 葉っぱの耳 */}
        <path d="M18 26 Q14 20 20 22 Q18 26 20 28Z" fill="#66BB6A" />
        <path d="M46 26 Q50 20 44 22 Q46 26 44 28Z" fill="#66BB6A" />
        {/* 葉っぱの髪 */}
        <ellipse cx="28" cy="20" rx="3" ry="5" fill="#81C784" transform="rotate(-10 28 20)" />
        <ellipse cx="36" cy="20" rx="3" ry="5" fill="#81C784" transform="rotate(10 36 20)" />
        <ellipse cx="32" cy="19" rx="2.5" ry="5" fill="#A5D6A7" />
        {/* ほっぺ */}
        <circle cx="24" cy="38" r="2.5" fill="#FFAB91" opacity="0.4" />
        <circle cx="40" cy="38" r="2.5" fill="#FFAB91" opacity="0.4" />
        {/* 目（少し切れ長、エルフ風） */}
        <ellipse cx="27" cy="34" rx="2.5" ry="2.8" fill="#4A3728" />
        <ellipse cx="37" cy="34" rx="2.5" ry="2.8" fill="#4A3728" />
        <circle cx="28" cy="33" r="1" fill="white" />
        <circle cx="38" cy="33" r="1" fill="white" />
        <circle cx="26.5" cy="34.5" r="0.5" fill="white" />
        <circle cx="36.5" cy="34.5" r="0.5" fill="white" />
        {/* 口 */}
        <path d="M30 41 Q32 43 34 41" stroke="#4A3728" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
      <defs>
        <radialGradient id="herb-body" cx="0.4" cy="0.3">
          <stop offset="0%" stopColor="#E8F5E9" />
          <stop offset="100%" stopColor="#A5D6A7" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function GrapeFairy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes fairy-float5 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        .fairy-float5 { animation: fairy-float5 3s ease-in-out infinite 1.2s; }
      `}</style>
      <g className="fairy-float5">
        {/* 羽（紫） */}
        <ellipse cx="14" cy="20" rx="7" ry="10" fill="#CE93D8" opacity="0.35" transform="rotate(-20 14 20)" />
        <ellipse cx="50" cy="20" rx="7" ry="10" fill="#CE93D8" opacity="0.35" transform="rotate(20 50 20)" />
        {/* ぶどう粒の体（上1個 + 下2個） */}
        <circle cx="32" cy="24" r="10" fill="url(#grape-body1)" />
        <circle cx="25" cy="38" r="9" fill="url(#grape-body2)" />
        <circle cx="39" cy="38" r="9" fill="url(#grape-body2)" />
        {/* ツタ */}
        <path d="M32 14 Q36 8 34 6" stroke="#8BC34A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <ellipse cx="35" cy="7" rx="3" ry="2" fill="#8BC34A" transform="rotate(20 35 7)" />
        {/* ほっぺ（メインの粒に） */}
        <circle cx="27" cy="25" r="2" fill="#F48FB1" opacity="0.4" />
        <circle cx="37" cy="25" r="2" fill="#F48FB1" opacity="0.4" />
        {/* 目（上の粒に） */}
        <circle cx="29" cy="23" r="2.5" fill="#3E2723" />
        <circle cx="35" cy="23" r="2.5" fill="#3E2723" />
        <circle cx="30" cy="22" r="1" fill="white" />
        <circle cx="36" cy="22" r="1" fill="white" />
        <circle cx="28.5" cy="23.5" r="0.5" fill="white" />
        <circle cx="34.5" cy="23.5" r="0.5" fill="white" />
        {/* 口 */}
        <path d="M31 27 Q32 29 33 27" stroke="#3E2723" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
      <defs>
        <radialGradient id="grape-body1" cx="0.4" cy="0.3">
          <stop offset="0%" stopColor="#E1BEE7" />
          <stop offset="100%" stopColor="#AB47BC" />
        </radialGradient>
        <radialGradient id="grape-body2" cx="0.4" cy="0.3">
          <stop offset="0%" stopColor="#CE93D8" />
          <stop offset="100%" stopColor="#8E24AA" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function WinterYuzuFairy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes fairy-float6 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes sparkle { 0%,100%{opacity:0.3} 50%{opacity:1} }
        .fairy-float6 { animation: fairy-float6 3s ease-in-out infinite 0.5s; }
        .sparkle { animation: sparkle 1.5s ease-in-out infinite; }
      `}</style>
      <g className="fairy-float6">
        {/* 羽（金色） */}
        <ellipse cx="18" cy="22" rx="8" ry="12" fill="#FFD54F" opacity="0.4" transform="rotate(-20 18 22)" />
        <ellipse cx="46" cy="22" rx="8" ry="12" fill="#FFD54F" opacity="0.4" transform="rotate(20 46 22)" />
        {/* しずく型の体（金色バージョン） */}
        <path d="M32 12 C32 12, 20 28, 20 38 C20 44.6 25.4 50 32 50 C38.6 50 44 44.6 44 38 C44 28 32 12 32 12Z" fill="url(#winter-yuzu-body)" />
        {/* マフラー */}
        <path d="M22 42 Q27 46 32 44 Q37 46 42 42" stroke="#E57373" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M22 42 Q20 46 22 50" stroke="#E57373" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* キラキラエフェクト */}
        <text x="12" y="16" fontSize="6" className="sparkle" style={{ animationDelay: "0s" }}>✦</text>
        <text x="48" y="14" fontSize="5" className="sparkle" style={{ animationDelay: "0.5s" }}>✦</text>
        <text x="46" y="48" fontSize="4" className="sparkle" style={{ animationDelay: "1s" }}>✦</text>
        <text x="14" y="46" fontSize="5" className="sparkle" style={{ animationDelay: "0.7s" }}>✦</text>
        {/* ほっぺ */}
        <circle cx="25" cy="38" r="3" fill="#FFAB91" opacity="0.5" />
        <circle cx="39" cy="38" r="3" fill="#FFAB91" opacity="0.5" />
        {/* 目 */}
        <circle cx="27" cy="34" r="3" fill="#4A3728" />
        <circle cx="37" cy="34" r="3" fill="#4A3728" />
        <circle cx="28" cy="33" r="1.2" fill="white" />
        <circle cx="38" cy="33" r="1.2" fill="white" />
        <circle cx="26.5" cy="34.5" r="0.6" fill="white" />
        <circle cx="36.5" cy="34.5" r="0.6" fill="white" />
        {/* 口 */}
        <path d="M29 41 Q32 44 35 41" stroke="#4A3728" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      <defs>
        <radialGradient id="winter-yuzu-body" cx="0.4" cy="0.3">
          <stop offset="0%" stopColor="#FFF8E1" />
          <stop offset="100%" stopColor="#FFB300" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function RoseFairy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes fairy-float7 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        .fairy-float7 { animation: fairy-float7 3s ease-in-out infinite 0.2s; }
      `}</style>
      <g className="fairy-float7">
        {/* 羽（ピンク〜赤グラデーション、大きめ） */}
        <ellipse cx="14" cy="22" rx="9" ry="13" fill="url(#rose-wing-l)" opacity="0.35" transform="rotate(-20 14 22)" />
        <ellipse cx="50" cy="22" rx="9" ry="13" fill="url(#rose-wing-r)" opacity="0.35" transform="rotate(20 50 22)" />
        {/* 丸い体（ピンク〜赤グラデーション） */}
        <circle cx="32" cy="36" r="15" fill="url(#rose-body)" />
        {/* 花びらの髪 */}
        <path d="M24 22 Q20 14 26 16 Q24 12 30 14 Q28 8 34 12 Q36 8 38 14 Q42 12 40 16 Q44 14 40 22" fill="url(#rose-petals)" />
        {/* ほっぺ */}
        <circle cx="24" cy="38" r="3" fill="#F48FB1" opacity="0.5" />
        <circle cx="40" cy="38" r="3" fill="#F48FB1" opacity="0.5" />
        {/* 目（まつげ付き、最も美しい） */}
        <circle cx="27" cy="34" r="3.2" fill="#4A3728" />
        <circle cx="37" cy="34" r="3.2" fill="#4A3728" />
        <circle cx="28.2" cy="32.8" r="1.3" fill="white" />
        <circle cx="38.2" cy="32.8" r="1.3" fill="white" />
        <circle cx="26.3" cy="34.8" r="0.6" fill="white" />
        <circle cx="36.3" cy="34.8" r="0.6" fill="white" />
        {/* まつげ */}
        <path d="M24 31.5 L25 32.5" stroke="#4A3728" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M24.5 30.8 L26 32" stroke="#4A3728" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M40 31.5 L39 32.5" stroke="#4A3728" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M39.5 30.8 L38 32" stroke="#4A3728" strokeWidth="0.8" strokeLinecap="round" />
        {/* 口（にっこり） */}
        <path d="M29 41 Q32 44 35 41" stroke="#4A3728" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      <defs>
        <radialGradient id="rose-body" cx="0.4" cy="0.3">
          <stop offset="0%" stopColor="#FCE4EC" />
          <stop offset="100%" stopColor="#F48FB1" />
        </radialGradient>
        <linearGradient id="rose-petals" x1="24" y1="8" x2="40" y2="22">
          <stop offset="0%" stopColor="#F48FB1" />
          <stop offset="100%" stopColor="#E91E63" />
        </linearGradient>
        <linearGradient id="rose-wing-l" x1="5" y1="10" x2="23" y2="35">
          <stop offset="0%" stopColor="#F48FB1" />
          <stop offset="100%" stopColor="#E91E63" />
        </linearGradient>
        <linearGradient id="rose-wing-r" x1="41" y1="10" x2="59" y2="35">
          <stop offset="0%" stopColor="#F48FB1" />
          <stop offset="100%" stopColor="#E91E63" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function HoneyFairy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes fairy-float8 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes wing-buzz { 0%,100%{opacity:0.25} 50%{opacity:0.45} }
        .fairy-float8 { animation: fairy-float8 3s ease-in-out infinite 0.8s; }
        .wing-buzz { animation: wing-buzz 0.15s ease-in-out infinite; }
      `}</style>
      <g className="fairy-float8">
        {/* 蜂の羽（透明） */}
        <ellipse cx="16" cy="22" rx="9" ry="12" fill="#B3E5FC" opacity="0.3" className="wing-buzz" transform="rotate(-25 16 22)" />
        <ellipse cx="48" cy="22" rx="9" ry="12" fill="#B3E5FC" opacity="0.3" className="wing-buzz" transform="rotate(25 48 22)" />
        <ellipse cx="18" cy="18" rx="6" ry="8" fill="#B3E5FC" opacity="0.25" className="wing-buzz" transform="rotate(-35 18 18)" />
        <ellipse cx="46" cy="18" rx="6" ry="8" fill="#B3E5FC" opacity="0.25" className="wing-buzz" transform="rotate(35 46 18)" />
        {/* 丸い体（金色） */}
        <ellipse cx="32" cy="36" rx="14" ry="15" fill="url(#honey-body)" />
        {/* ストライプ模様 */}
        <path d="M20 32 Q32 30 44 32" stroke="#F57F17" strokeWidth="2.5" opacity="0.3" fill="none" />
        <path d="M19 38 Q32 36 45 38" stroke="#F57F17" strokeWidth="2.5" opacity="0.3" fill="none" />
        <path d="M20 44 Q32 42 44 44" stroke="#F57F17" strokeWidth="2.5" opacity="0.3" fill="none" />
        {/* 触角 */}
        <path d="M28 22 Q26 16 24 14" stroke="#4A3728" strokeWidth="1" fill="none" strokeLinecap="round" />
        <circle cx="24" cy="13" r="1.5" fill="#FFD54F" />
        <path d="M36 22 Q38 16 40 14" stroke="#4A3728" strokeWidth="1" fill="none" strokeLinecap="round" />
        <circle cx="40" cy="13" r="1.5" fill="#FFD54F" />
        {/* ほっぺ */}
        <circle cx="24" cy="38" r="3" fill="#FFAB91" opacity="0.5" />
        <circle cx="40" cy="38" r="3" fill="#FFAB91" opacity="0.5" />
        {/* 目 */}
        <circle cx="27" cy="34" r="3" fill="#4A3728" />
        <circle cx="37" cy="34" r="3" fill="#4A3728" />
        <circle cx="28" cy="33" r="1.2" fill="white" />
        <circle cx="38" cy="33" r="1.2" fill="white" />
        <circle cx="26.5" cy="34.5" r="0.6" fill="white" />
        <circle cx="36.5" cy="34.5" r="0.6" fill="white" />
        {/* 口 */}
        <path d="M29 41 Q32 44 35 41" stroke="#4A3728" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      <defs>
        <radialGradient id="honey-body" cx="0.4" cy="0.3">
          <stop offset="0%" stopColor="#FFF8E1" />
          <stop offset="100%" stopColor="#FFB300" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const FAIRY_MAP: Record<string, React.FC<{ size: number }>> = {
  "yeast-yuzu": YuzuFairy,
  "yeast-apple": AppleFairy,
  "yeast-strawberry": StrawberryFairy,
  "yeast-herb": HerbFairy,
  "yeast-grape": GrapeFairy,
  "yeast-yuzu-special": WinterYuzuFairy,
  "yeast-rose": RoseFairy,
  "yeast-honey": HoneyFairy,
};

export function FairySVG({ yeastId, size = 64 }: { yeastId: string; size?: number }) {
  const FairyComponent = FAIRY_MAP[yeastId];

  if (!FairyComponent) {
    // フォールバック: 未知のIDの場合はデフォルトの妖精
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="36" r="14" fill="#E0E0E0" />
        <circle cx="27" cy="34" r="2.5" fill="#757575" />
        <circle cx="37" cy="34" r="2.5" fill="#757575" />
        <path d="M29 41 Q32 44 35 41" stroke="#757575" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  return <FairyComponent size={size} />;
}
