"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { BREADS, YEASTS, type Season } from "@/lib/game-data";
import BreadDetail from "@/components/collection/BreadDetail";
import BreadSVG from "@/components/BreadSVG";

const SEASON_TABS: { label: string; value: Season | "all" }[] = [
  { label: "通年", value: "all" },
  { label: "春", value: "spring" },
  { label: "夏", value: "summer" },
  { label: "秋", value: "autumn" },
  { label: "冬", value: "winter" },
];

export default function CollectionPage() {
  const ownedBreads = useGameStore((s) => s.ownedBreads);
  const [activeSeason, setActiveSeason] = useState<Season | "all">("all");
  const [selectedBreadId, setSelectedBreadId] = useState<string | null>(null);

  const filteredBreads = BREADS.filter((b) =>
    activeSeason === "all" ? b.season === "all" : b.season === activeSeason
  );

  const ownedBreadIds = new Set(ownedBreads.map((b) => b.breadId));
  const completionCount = filteredBreads.filter((b) => ownedBreadIds.has(b.id)).length;

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* ヘッダー */}
      <header className="bg-[#D4A574] text-white px-4 py-3 flex items-center">
        <button onClick={() => window.history.back()} className="mr-3 text-lg">
          ←
        </button>
        <h1 className="text-lg font-bold">パン図鑑</h1>
      </header>

      {/* 季節タブ */}
      <div className="flex gap-1 p-3 overflow-x-auto">
        {SEASON_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveSeason(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeSeason === tab.value
                ? "bg-[#D4A574] text-white"
                : "bg-white text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* コンプ率 */}
      <div className="px-4 mb-3">
        <p className="text-sm text-gray-500">
          {completionCount}/{filteredBreads.length} 種類コンプリート
        </p>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-[#D4A574] rounded-full transition-all"
            style={{ width: `${filteredBreads.length > 0 ? (completionCount / filteredBreads.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* パングリッド */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {filteredBreads.map((bread, i) => {
          const isOwned = ownedBreadIds.has(bread.id);
          const yeast = YEASTS.find((y) => y.id === bread.yeastId);
          return (
            <motion.button
              key={bread.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => isOwned && setSelectedBreadId(bread.id)}
              className={`bg-white rounded-2xl p-3 shadow-sm text-center aspect-square flex flex-col items-center justify-center ${
                isOwned ? "hover:shadow-md transition-shadow" : "opacity-40"
              }`}
            >
              {isOwned ? (
                <>
                  <BreadSVG className="w-12 h-12 mb-1" toppings={bread.toppings} showFace={false} />
                  <p className="text-[10px] text-gray-600 leading-tight line-clamp-2">
                    {bread.name}
                  </p>
                  {yeast && <p className="text-[9px] text-gray-400">{yeast.emoji}</p>}
                </>
              ) : (
                <>
                  <span className="text-3xl mb-1">❓</span>
                  <p className="text-[10px] text-gray-400">？？？</p>
                </>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* パン詳細モーダル */}
      {selectedBreadId && (
        <BreadDetail
          breadId={selectedBreadId}
          onClose={() => setSelectedBreadId(null)}
        />
      )}
    </div>
  );
}
