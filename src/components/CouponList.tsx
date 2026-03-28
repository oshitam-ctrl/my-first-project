"use client";

import { useGameStore } from "@/lib/game-state";

export default function CouponList() {
  const coupons = useGameStore((s) => s.coupons);

  if (coupons.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-[#8B6914]">獲得クーポン</h3>
      {coupons.map((coupon, i) => (
        <div
          key={i}
          className={`rounded-2xl p-4 shadow-sm border-2 ${
            coupon.redeemed
              ? "bg-gray-50 border-gray-200 opacity-60"
              : "bg-gradient-to-r from-[#FFF8F0] to-[#FFE8CC] border-[#D4A574]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">クーポン{coupon.type}</span>
              <p className="font-bold text-[#8B6914]">
                {coupon.type === "A" ? "5ポイント特典" : "10ポイント特典"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                内容は店頭でご確認ください
              </p>
            </div>
            <div className="text-3xl">
              {coupon.redeemed ? "✅" : "🎫"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
