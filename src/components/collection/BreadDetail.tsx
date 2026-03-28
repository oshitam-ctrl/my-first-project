"use client";

import { motion } from "framer-motion";
import { BREADS, YEASTS, TOPPINGS } from "@/lib/game-data";
import BreadSVG from "@/components/BreadSVG";

interface BreadDetailProps {
  breadId: string;
  onClose: () => void;
}

export default function BreadDetail({ breadId, onClose }: BreadDetailProps) {
  const bread = BREADS.find((b) => b.id === breadId);
  if (!bread) return null;

  const yeast = YEASTS.find((y) => y.id === bread.yeastId);
  const toppings = bread.toppings
    .map((id) => TOPPINGS.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ドラッグハンドル */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        {/* パンイラスト */}
        <div className="text-center mb-4">
          <BreadSVG className="w-32 h-32 mx-auto" toppings={bread.toppings} showFace={true} />
          {yeast && <p className="text-sm text-gray-400 mt-1">{yeast.emoji} {yeast.name}</p>}
        </div>

        {/* パン名 */}
        <h2 className="text-xl font-bold text-[#8B6914] text-center mb-1">{bread.name}</h2>
        {yeast && (
          <p className="text-center text-xs text-gray-400 mb-4">
            {"★".repeat(yeast.rarity)}
          </p>
        )}

        {/* 説明 */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">酵母について</p>
            <p className="text-sm text-gray-600">{bread.description}</p>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">味わい</p>
            <p className="text-sm text-gray-600">{bread.tasteDescription}</p>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">おすすめの食べ方</p>
            <p className="text-sm text-gray-600">💡 {bread.recommendation}</p>
          </div>

          {toppings.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">トッピング</p>
              <div className="flex gap-2">
                {toppings.map((t) => (
                  <span key={t!.id} className="bg-[#FFF8F0] px-3 py-1 rounded-lg text-sm">
                    {t!.emoji} {t!.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {bread.shopName && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm text-[#A0522D]">
                🏪 お店では「{bread.shopName}」として販売中
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium"
        >
          閉じる
        </button>
      </motion.div>
    </div>
  );
}
