"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { TOPPINGS, BREADS } from "@/lib/game-data";
import BreadSVG from "@/components/BreadSVG";

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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-lg font-bold text-[#8B6914]">トッピングを選ぼう</h2>
        <p className="text-sm text-gray-500 mt-1">最大3つまで選べます</p>
      </motion.div>

      {/* パンのプレビュー */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-5 shadow-dreamy text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F5C88A] via-[#D4A574] to-[#F5C88A]" />
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <BreadSVG className="w-24 h-24 mx-auto" toppings={selected} showFace={true} />
        </motion.div>
        {bread && <p className="font-bold text-[#D4A574] mt-1">{bread.name}</p>}
        {selected.length === 0 && (
          <p className="text-xs text-gray-300 mt-2">ここにトッピングが表示されます</p>
        )}
      </motion.div>

      {/* トッピング一覧 */}
      <div className="grid grid-cols-3 gap-3">
        {TOPPINGS.map((topping, i) => (
          <motion.button
            key={topping.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleTopping(topping.id)}
            className={`rounded-2xl p-4 text-center transition-all relative overflow-hidden ${
              selected.includes(topping.id)
                ? "bg-gradient-to-b from-[#FFF8F0] to-[#FFF3E6] ring-2 ring-[#D4A574] shadow-md"
                : "bg-white shadow-sm hover:shadow-md"
            }`}
          >
            {selected.includes(topping.id) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-5 h-5 bg-[#D4A574] rounded-full flex items-center justify-center"
              >
                <span className="text-white text-[10px]">✓</span>
              </motion.div>
            )}
            <motion.span
              className="text-3xl block mb-1"
              animate={selected.includes(topping.id) ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {topping.emoji}
            </motion.span>
            <span className="text-xs text-gray-600">{topping.name}</span>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleComplete}
          className="flex-1 btn-cute btn-bake text-white font-bold py-4"
        >
          <span className="flex items-center justify-center gap-1.5">
            ✨ 完成！
          </span>
        </motion.button>
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
