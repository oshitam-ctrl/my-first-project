"use client";

import { useGameStore } from "@/lib/game-state";

export default function PointsDisplay() {
  const totalPoints = useGameStore((s) => s.totalPoints);
  const nextCouponAt = totalPoints < 5 ? 5 : totalPoints < 10 ? 10 : null;
  const progress = nextCouponAt ? (totalPoints / nextCouponAt) * 100 : 100;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#8B6914]">来店ポイント</h2>
        <span className="text-3xl font-bold text-[#D4A574]">{totalPoints}<span className="text-sm text-gray-400 ml-1">pt</span></span>
      </div>

      {/* プログレスバー */}
      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-[#D4A574] to-[#E8C9A0] rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        {/* マイルストーン */}
        <div className="absolute top-0 left-[50%] h-full w-0.5 bg-white/50" />
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>0</span>
        <span>5pt (クーポンA)</span>
        <span>10pt (クーポンB)</span>
      </div>

      {nextCouponAt && (
        <p className="text-center text-sm text-[#A0522D] mt-2 font-medium">
          あと {nextCouponAt - totalPoints} ポイントでクーポン獲得！
        </p>
      )}
    </div>
  );
}
