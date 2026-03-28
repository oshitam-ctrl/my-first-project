"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { IRREGULAR_FRUITS, getAvailableYeasts } from "@/lib/game-data";

export default function MaterialSelect() {
  const { ownedYeasts, setSelectedYeast, setStep } = useGameStore();

  // 所持 & 現在季節で利用可能な酵母に対応する果物を表示
  const availableFruits = useMemo(() => {
    const available = getAvailableYeasts();
    const owned = ownedYeasts.map((o) => o.yeastId);
    const usable = available.filter((y) => owned.includes(y.id));

    // ランダムに3〜4個選ぶ（重複なし）
    const shuffled = [...usable].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(4, shuffled.length)).map((yeast) => {
      const fruits = IRREGULAR_FRUITS[yeast.id] || ["規格外の果物"];
      const fruitName = fruits[Math.floor(Math.random() * fruits.length)];
      return { yeast, fruitName };
    });
  }, [ownedYeasts]);

  function handleSelect(yeastId: string) {
    setSelectedYeast(yeastId);
    setStep("nurture");
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-[#8B6914]">今日届いた規格外の果物</h2>
        <p className="text-sm text-gray-500 mt-1">どれを使って酵母を育てますか？</p>
      </div>

      <div className="space-y-3">
        {availableFruits.map(({ yeast, fruitName }, i) => (
          <motion.button
            key={yeast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleSelect(yeast.id)}
            className="w-full bg-white rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-[#D4A574] transition-all active:scale-95 text-left"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{yeast.emoji}</span>
              <div>
                <p className="font-bold text-[#8B6914]">{fruitName}</p>
                <p className="text-sm text-gray-500">{yeast.name}が育ちます</p>
                <p className="text-xs text-gray-400 mt-1">{"★".repeat(yeast.rarity)}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <button
        onClick={() => setStep("idle")}
        className="w-full py-3 text-gray-400 text-sm"
      >
        戻る
      </button>
    </div>
  );
}
