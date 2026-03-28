"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { IRREGULAR_FRUITS, getAvailableYeasts } from "@/lib/game-data";

const FRUIT_GRADIENTS = [
  "from-[#FFF5F5] to-[#FFE4E1]",  // ピンク系
  "from-[#FFFFF0] to-[#FFF8DC]",  // レモン系
  "from-[#F5F0FF] to-[#E8E0F0]",  // ぶどう系
  "from-[#FFF0F5] to-[#FFE4EC]",  // ベリー系
];

export default function MaterialSelect() {
  const { ownedYeasts, setSelectedYeast, setStep } = useGameStore();

  const availableFruits = useMemo(() => {
    const available = getAvailableYeasts();
    const owned = ownedYeasts.map((o) => o.yeastId);
    const usable = available.filter((y) => owned.includes(y.id));

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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2"
      >
        <motion.p
          className="text-4xl mb-2"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🧺
        </motion.p>
        <h2 className="text-lg font-bold text-[#8B6914]">今日届いた規格外の果物</h2>
        <p className="text-sm text-gray-500 mt-1">どれを使って酵母を育てますか？</p>
      </motion.div>

      <div className="space-y-3">
        {availableFruits.map(({ yeast, fruitName }, i) => (
          <motion.button
            key={yeast.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, type: "spring", stiffness: 200 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSelect(yeast.id)}
            className={`w-full bg-gradient-to-r ${FRUIT_GRADIENTS[i % FRUIT_GRADIENTS.length]} rounded-3xl p-5 shadow-dreamy border-2 border-transparent hover:border-[#D4A574]/30 transition-all text-left fruit-card relative overflow-hidden`}
          >
            <div className="flex items-center gap-4 relative z-10">
              <motion.div
                className="w-16 h-16 bg-white/60 rounded-2xl flex items-center justify-center shadow-sm"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
              >
                <span className="text-4xl">{yeast.emoji}</span>
              </motion.div>
              <div className="flex-1">
                <p className="font-bold text-[#8B6914] text-base">{fruitName}</p>
                <p className="text-sm text-gray-500 mt-0.5">{yeast.name}が育ちます</p>
                <div className="flex items-center gap-1 mt-1.5">
                  {[...Array(yeast.rarity)].map((_, si) => (
                    <span key={si} className="text-xs text-[#E8913A]">★</span>
                  ))}
                  {[...Array(3 - yeast.rarity)].map((_, si) => (
                    <span key={si} className="text-xs text-gray-200">★</span>
                  ))}
                </div>
              </div>
              <motion.span
                className="text-[#D4A574] text-xl"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ›
              </motion.span>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => setStep("idle")}
        className="w-full py-3 text-gray-400 text-sm"
      >
        ← 戻る
      </motion.button>
    </div>
  );
}
