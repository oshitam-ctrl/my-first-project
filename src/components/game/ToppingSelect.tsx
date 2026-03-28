"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { TOPPINGS, BREADS } from "@/lib/game-data";

export default function ToppingSelect() {
  const { selectedBreadId, setSelectedToppings, setStep } = useGameStore();
  const bread = BREADS.find((b) => b.id === selectedBreadId);
  const [selected, setSelected] = useState<string[]>([]);

  function toggleTopping(toppingId: string) {
    setSelected((prev) =>
      prev.includes(toppingId)
        ? prev.filter((t) => t !== toppingId)
        : prev.length < 3
        ? [...prev, toppingId]
        : prev
    );
  }

  function handleComplete() {
    setSelectedToppings(selected);
    setStep("complete");
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-[#8B6914]">トッピングを選ぼう</h2>
        <p className="text-sm text-gray-500 mt-1">最大3つまで選べます</p>
      </div>

      {/* パンのプレビュー */}
      <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
        <p className="text-5xl mb-2">🍞</p>
        {bread && <p className="font-bold text-[#D4A574]">{bread.name}</p>}
        {selected.length > 0 && (
          <div className="flex justify-center gap-2 mt-2">
            {selected.map((id) => {
              const topping = TOPPINGS.find((t) => t.id === id);
              return topping ? (
                <span key={id} className="text-2xl">{topping.emoji}</span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* トッピング一覧 */}
      <div className="grid grid-cols-3 gap-3">
        {TOPPINGS.map((topping, i) => (
          <motion.button
            key={topping.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => toggleTopping(topping.id)}
            className={`bg-white rounded-2xl p-4 shadow-sm text-center transition-all active:scale-90 ${
              selected.includes(topping.id)
                ? "ring-2 ring-[#D4A574] bg-[#FFF8F0]"
                : ""
            }`}
          >
            <span className="text-3xl block mb-1">{topping.emoji}</span>
            <span className="text-xs text-gray-600">{topping.name}</span>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleComplete}
          className="flex-1 bg-[#D4A574] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          ✨ 完成！
        </button>
        <button
          onClick={() => {
            setSelectedToppings([]);
            setStep("complete");
          }}
          className="py-4 px-4 text-gray-400 text-sm"
        >
          スキップ
        </button>
      </div>
    </div>
  );
}
