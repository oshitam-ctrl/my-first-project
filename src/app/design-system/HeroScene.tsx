/**
 * デザインシステムのヒーロー。
 * ユーザーが基準にしたい「夕暮れの工房で頬杖をつく少女と妖精」の
 * 雰囲気をSVGで表現したシンボリックなビジュアル。
 */
export function HeroScene() {
  return (
    <svg
      viewBox="0 0 800 480"
      className="w-full h-full"
      role="img"
      aria-label="夕暮れの工房で頬杖をつく少女と、寄り添う小さな妖精"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3F4F3A" />
          <stop offset="55%" stopColor="#6B5A3A" />
          <stop offset="100%" stopColor="#D8B785" />
        </linearGradient>
        <radialGradient id="sun" cx="0.18" cy="0.35" r="0.45">
          <stop offset="0%" stopColor="#FFE9B8" stopOpacity="1" />
          <stop offset="40%" stopColor="#F4C77A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F4C77A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="counter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5A3E2A" />
          <stop offset="100%" stopColor="#2E1F15" />
        </linearGradient>
        <linearGradient id="bread" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E9C58A" />
          <stop offset="100%" stopColor="#9C6B3C" />
        </linearGradient>
        <linearGradient id="dress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3F5C7E" />
          <stop offset="100%" stopColor="#28425E" />
        </linearGradient>
        <linearGradient id="apron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDE0C4" />
          <stop offset="100%" stopColor="#C9B68F" />
        </linearGradient>
        <radialGradient id="fairyGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFF4C8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFF4C8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 背景: 工房の壁 */}
      <rect width="800" height="480" fill="url(#sky)" />
      <rect width="800" height="480" fill="url(#sun)" />

      {/* 窓 */}
      <g opacity="0.85">
        <rect x="40" y="40" width="180" height="280" rx="6" fill="#F5D88E" opacity="0.75" />
        <rect x="40" y="40" width="180" height="280" rx="6" fill="none" stroke="#3A2A1C" strokeWidth="4" />
        <line x1="130" y1="40" x2="130" y2="320" stroke="#3A2A1C" strokeWidth="3" />
        <line x1="40" y1="180" x2="220" y2="180" stroke="#3A2A1C" strokeWidth="3" />
        {/* 蔦 */}
        <path
          d="M40 80 Q70 110 50 150 Q30 190 60 220 Q80 260 50 300"
          stroke="#5C7A4A"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="55" cy="120" r="8" fill="#7FA065" />
        <circle cx="42" cy="180" r="7" fill="#8FA57B" />
        <circle cx="60" cy="240" r="9" fill="#6E8C58" />
      </g>

      {/* 棚 */}
      <rect x="500" y="80" width="260" height="8" fill="#3A2A1C" />
      <rect x="500" y="160" width="260" height="8" fill="#3A2A1C" />
      <circle cx="540" cy="60" r="22" fill="#C9B68F" />
      <circle cx="540" cy="60" r="14" fill="#FCF8F3" />
      <line x1="540" y1="60" x2="540" y2="50" stroke="#2A2A29" strokeWidth="2" />
      <line x1="540" y1="60" x2="548" y2="60" stroke="#2A2A29" strokeWidth="2" />
      <rect x="600" y="38" width="22" height="38" rx="3" fill="#7E6242" />
      <rect x="640" y="34" width="26" height="42" rx="3" fill="#A0855E" />
      <rect x="690" y="40" width="20" height="36" rx="3" fill="#6B4E3D" />
      <rect x="600" y="118" width="30" height="38" rx="3" fill="#8C7A56" />
      <rect x="650" y="122" width="22" height="34" rx="3" fill="#9C6B3C" />

      {/* カウンター */}
      <rect x="0" y="340" width="800" height="140" fill="url(#counter)" />
      <rect x="0" y="335" width="800" height="14" fill="#7E5638" />

      {/* パン (左) */}
      <g transform="translate(120,310)">
        <ellipse cx="60" cy="40" rx="68" ry="32" fill="url(#bread)" />
        <path
          d="M-5 38 Q60 -6 125 38 L120 50 Q60 70 0 50 Z"
          fill="#EDE0C4"
          opacity="0.6"
        />
        <path d="M0 48 L120 48" stroke="#7E5638" strokeWidth="1" opacity="0.4" />
      </g>

      {/* バスケットのパン (右) */}
      <g transform="translate(620,310)">
        <ellipse cx="60" cy="46" rx="70" ry="22" fill="#5A3E2A" />
        <ellipse cx="35" cy="30" rx="26" ry="18" fill="url(#bread)" />
        <ellipse cx="78" cy="28" rx="24" ry="17" fill="url(#bread)" />
        <ellipse cx="58" cy="22" rx="22" ry="16" fill="#C99767" />
        <path
          d="M-10 46 Q60 60 130 46"
          stroke="#3A2A1C"
          strokeWidth="3"
          fill="none"
        />
      </g>

      {/* 少女 */}
      <g transform="translate(280,200)">
        {/* 体・腕 */}
        <path
          d="M0 150 Q60 90 130 100 Q200 110 240 150 L240 200 L0 200 Z"
          fill="url(#dress)"
        />
        {/* エプロン */}
        <path
          d="M70 140 Q120 125 170 140 L170 200 L70 200 Z"
          fill="url(#apron)"
        />
        {/* 花柄 */}
        <g fill="#7FAAD4" opacity="0.85">
          <circle cx="30" cy="160" r="3" />
          <circle cx="55" cy="180" r="2.5" />
          <circle cx="200" cy="170" r="3" />
          <circle cx="220" cy="155" r="2.5" />
          <circle cx="20" cy="190" r="2.5" />
        </g>
        <g fill="#E1C46A" opacity="0.8">
          <circle cx="40" cy="175" r="1.8" />
          <circle cx="210" cy="190" r="1.8" />
        </g>
        {/* 腕 (頬杖) */}
        <ellipse cx="120" cy="135" rx="80" ry="14" fill="url(#dress)" />
        <ellipse cx="120" cy="132" rx="78" ry="10" fill="#4A6486" opacity="0.5" />
        {/* 手 */}
        <ellipse cx="100" cy="118" rx="14" ry="10" fill="#F1D4B0" />
        <ellipse cx="142" cy="120" rx="13" ry="9" fill="#F1D4B0" />
        {/* 顔 */}
        <ellipse cx="124" cy="92" rx="34" ry="38" fill="#F4D8B6" />
        {/* 髪 */}
        <path
          d="M88 70 Q90 40 124 36 Q160 38 162 72 Q164 96 158 110 L150 96 Q140 86 124 88 Q108 86 98 96 L90 110 Q86 96 88 70 Z"
          fill="#3A2418"
        />
        {/* おさげ */}
        <path
          d="M94 100 Q80 130 86 162 Q92 178 100 178 Q104 162 102 140 Q102 122 100 102 Z"
          fill="#3A2418"
        />
        <path
          d="M154 100 Q170 130 166 162 Q160 178 152 178 Q148 162 150 140 Q150 122 152 102 Z"
          fill="#3A2418"
        />
        {/* リボン */}
        <g transform="translate(124,46)">
          <path
            d="M-22 0 Q-26 -10 -14 -8 Q-4 -4 0 0 Q4 -4 14 -8 Q26 -10 22 0 Q26 10 14 8 Q4 4 0 0 Q-4 4 -14 8 Q-26 10 -22 0 Z"
            fill="#C65A4A"
          />
          <circle cx="0" cy="0" r="4" fill="#A04437" />
        </g>
        {/* 目・口 */}
        <ellipse cx="112" cy="98" rx="2.5" ry="3.5" fill="#2A1A12" />
        <ellipse cx="138" cy="98" rx="2.5" ry="3.5" fill="#2A1A12" />
        <path
          d="M118 108 Q124 112 130 108"
          stroke="#A04437"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* 頬 */}
        <circle cx="105" cy="105" r="4" fill="#E89A85" opacity="0.5" />
        <circle cx="145" cy="105" r="4" fill="#E89A85" opacity="0.5" />
      </g>

      {/* 妖精 */}
      <g transform="translate(470,200)">
        <circle cx="0" cy="0" r="36" fill="url(#fairyGlow)" />
        <ellipse cx="-12" cy="-8" rx="14" ry="22" fill="#B8DDC9" opacity="0.65" />
        <ellipse cx="14" cy="-8" rx="14" ry="22" fill="#B8DDC9" opacity="0.65" />
        <ellipse cx="0" cy="6" rx="6" ry="10" fill="#EFD8AE" />
        <circle cx="0" cy="-8" r="7" fill="#F4D8B6" />
        <circle cx="-2" cy="-9" r="0.8" fill="#2A1A12" />
        <circle cx="2" cy="-9" r="0.8" fill="#2A1A12" />
        <circle cx="0" cy="-13" r="3" fill="#E1C46A" />
      </g>

      {/* 光の粒 */}
      <g fill="#FFF4C8">
        <circle cx="160" cy="120" r="2.5" opacity="0.9" />
        <circle cx="240" cy="80" r="1.8" opacity="0.7" />
        <circle cx="380" cy="160" r="2" opacity="0.8" />
        <circle cx="540" cy="200" r="1.6" opacity="0.7" />
        <circle cx="700" cy="140" r="2.2" opacity="0.85" />
        <circle cx="100" cy="260" r="1.5" opacity="0.6" />
      </g>

      {/* 蔦が手前にも */}
      <g opacity="0.8">
        <path
          d="M740 360 Q720 400 740 440 Q760 470 740 480"
          stroke="#5C7A4A"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="734" cy="400" r="6" fill="#7FA065" />
        <circle cx="744" cy="430" r="7" fill="#6E8C58" />
      </g>
    </svg>
  );
}
