"use client";

interface BreadSVGProps {
  size?: number;
  toppings?: string[];
  className?: string;
  showFace?: boolean;
}

/* クルミ: 小さな茶色の粒が3つ */
function WalnutTopping() {
  return (
    <g>
      <ellipse cx="42" cy="30" rx="5" ry="4" fill="#8B6C42" />
      <path d="M39 30 Q42 27 45 30" stroke="#6B4C22" strokeWidth="0.8" fill="none" />
      <ellipse cx="62" cy="26" rx="4.5" ry="3.5" fill="#9B7C52" />
      <path d="M59.5 26 Q62 23 64.5 26" stroke="#6B4C22" strokeWidth="0.8" fill="none" />
      <ellipse cx="76" cy="34" rx="4" ry="3.5" fill="#8B6C42" />
      <path d="M73.5 34 Q76 31 78.5 34" stroke="#6B4C22" strokeWidth="0.8" fill="none" />
    </g>
  );
}

/* レーズン: 小さな紫の粒が3つ */
function RaisinTopping() {
  return (
    <g>
      <ellipse cx="45" cy="32" rx="3.5" ry="4.5" fill="#5B2E6E" opacity="0.85" />
      <ellipse cx="44" cy="31" rx="1.5" ry="1" fill="rgba(255,255,255,0.15)" />
      <ellipse cx="60" cy="27" rx="3" ry="4" fill="#6B3E7E" opacity="0.85" />
      <ellipse cx="59" cy="26" rx="1.5" ry="1" fill="rgba(255,255,255,0.15)" />
      <ellipse cx="72" cy="33" rx="3.5" ry="4" fill="#4B1E5E" opacity="0.85" />
      <ellipse cx="71" cy="32" rx="1.5" ry="1" fill="rgba(255,255,255,0.15)" />
    </g>
  );
}

/* チョコチップ: 小さな焦げ茶の三角が散らばる */
function ChocolateTopping() {
  return (
    <g>
      <polygon points="40,28 44,28 42,24" fill="#3E1F0D" />
      <polygon points="55,25 59,25 57,21" fill="#4E2F1D" />
      <polygon points="70,30 74,30 72,26" fill="#3E1F0D" />
      <polygon points="48,34 51,34 49.5,31" fill="#4E2F1D" />
      <polygon points="64,32 67,32 65.5,29" fill="#3E1F0D" />
    </g>
  );
}

/* チーズ: 黄色いとろけたチーズ */
function CheeseTopping() {
  return (
    <g>
      <path
        d="M35 38 Q38 30, 48 28 Q55 26, 62 28 Q70 30, 78 32 Q82 34, 85 40 Q80 38, 72 36 Q65 33, 55 34 Q45 35, 38 38 Z"
        fill="#FFD54F"
        opacity="0.85"
      />
      <path
        d="M35 38 Q33 44, 30 50"
        stroke="#FFD54F"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M85 40 Q87 46, 88 52"
        stroke="#FFD54F"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <ellipse cx="50" cy="31" rx="4" ry="2" fill="rgba(255,255,255,0.2)" />
    </g>
  );
}

/* はちみつ: 金色のとろっとしたかけ */
function HoneyTopping() {
  return (
    <g>
      <path
        d="M42 30 Q50 24, 60 26 Q70 28, 76 32"
        stroke="#F5A623"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M42 30 Q40 36, 38 44"
        stroke="#F5A623"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M76 32 Q78 38, 80 46"
        stroke="#F5A623"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <ellipse cx="55" cy="27" rx="6" ry="2" fill="rgba(255,255,200,0.3)" />
    </g>
  );
}

/* ハーブ: 緑の小さな葉っぱが散る */
function HerbTopping() {
  return (
    <g>
      <g transform="translate(40,28) rotate(-20)">
        <ellipse cx="0" cy="0" rx="5" ry="2.5" fill="#4CAF50" opacity="0.8" />
        <line x1="-4" y1="0" x2="4" y2="0" stroke="#2E7D32" strokeWidth="0.5" />
      </g>
      <g transform="translate(58,24) rotate(15)">
        <ellipse cx="0" cy="0" rx="4.5" ry="2" fill="#66BB6A" opacity="0.8" />
        <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#2E7D32" strokeWidth="0.5" />
      </g>
      <g transform="translate(74,30) rotate(-10)">
        <ellipse cx="0" cy="0" rx="4" ry="2" fill="#4CAF50" opacity="0.8" />
        <line x1="-3" y1="0" x2="3" y2="0" stroke="#2E7D32" strokeWidth="0.5" />
      </g>
      <g transform="translate(50,33) rotate(30)">
        <ellipse cx="0" cy="0" rx="3.5" ry="1.8" fill="#81C784" opacity="0.7" />
        <line x1="-2.5" y1="0" x2="2.5" y2="0" stroke="#2E7D32" strokeWidth="0.5" />
      </g>
      <g transform="translate(66,35) rotate(-25)">
        <ellipse cx="0" cy="0" rx="3" ry="1.5" fill="#66BB6A" opacity="0.7" />
        <line x1="-2" y1="0" x2="2" y2="0" stroke="#2E7D32" strokeWidth="0.5" />
      </g>
    </g>
  );
}

const TOPPING_MAP: Record<string, React.FC> = {
  "topping-walnut": WalnutTopping,
  "topping-raisin": RaisinTopping,
  "topping-chocolate": ChocolateTopping,
  "topping-cheese": CheeseTopping,
  "topping-honey": HoneyTopping,
  "topping-herb": HerbTopping,
};

export default function BreadSVG({
  size = 120,
  toppings = [],
  className = "",
  showFace = true,
}: BreadSVGProps) {
  // 最大3つまで
  const activeToppings = toppings.slice(0, 3);
  // gradient IDをユニークにする（同じページで複数使われるため）
  const gradId = `bread-grad-${size}-${showFace ? "f" : "n"}`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="10" y1="20" x2="110" y2="110">
          <stop offset="0%" stopColor="#F5D6A8" />
          <stop offset="40%" stopColor="#E8B87A" />
          <stop offset="100%" stopColor="#C09060" />
        </linearGradient>
      </defs>

      {/* パン本体 - ぷっくりカンパーニュ型 */}
      <ellipse cx="60" cy="65" rx="50" ry="42" fill={`url(#${gradId})`} />

      {/* 底の影 */}
      <ellipse cx="60" cy="100" rx="40" ry="6" fill="rgba(139,105,20,0.08)" />

      {/* ハイライト */}
      <ellipse cx="52" cy="48" rx="24" ry="12" fill="rgba(255,255,255,0.2)" />

      {/* クープ（切れ目） */}
      <path
        d="M30 52 C40 40, 52 36, 60 44 C68 36, 80 40, 90 52"
        stroke="rgba(139,105,20,0.18)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M38 56 C46 48, 54 46, 60 50"
        stroke="rgba(139,105,20,0.1)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* トッピング */}
      {activeToppings.map((id) => {
        const ToppingComponent = TOPPING_MAP[id];
        return ToppingComponent ? <ToppingComponent key={id} /> : null;
      })}

      {/* 顔 */}
      {showFace && (
        <g>
          {/* ほっぺ */}
          <ellipse cx="38" cy="72" rx="8" ry="5" fill="rgba(255,180,150,0.3)" />
          <ellipse cx="82" cy="72" rx="8" ry="5" fill="rgba(255,180,150,0.3)" />
          {/* 目 */}
          <circle cx="45" cy="64" r="3" fill="#5a4a2a" />
          <circle cx="75" cy="64" r="3" fill="#5a4a2a" />
          {/* 目のハイライト */}
          <circle cx="46.2" cy="63" r="1.2" fill="white" />
          <circle cx="76.2" cy="63" r="1.2" fill="white" />
          {/* 口（にっこり） */}
          <path
            d="M52 75 Q60 82 68 75"
            stroke="#5a4a2a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
