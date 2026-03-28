"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { YEASTS, BREADS } from "@/lib/game-data";

export default function BakeReveal() {
  const { selectedYeastId, setSelectedBread, setStep, fermentation } = useGameStore();
  const yeast = YEASTS.find((y) => y.id === selectedYeastId || y.id === fermentation?.yeastId);

  // この酵母で焼けるパンをランダムに1つ選ぶ
  const bread = useMemo(() => {
    const yeastId = selectedYeastId || fermentation?.yeastId;
    if (!yeastId) return null;
    const possibleBreads = BREADS.filter((b) => b.yeastId === yeastId);
    if (possibleBreads.length === 0) return null;
    return possibleBreads[Math.floor(Math.random() * possibleBreads.length)];
  }, [selectedYeastId, fermentation]);

  function handleContinue() {
    if (bread) {
      setSelectedBread(bread.id);
      setStep("topping");
    }
  }

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
      {/* 窯のドアが開くアニメーション */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
        className="text-center"
      >
        {/* 窯 */}
        <motion.div
          initial={{ rotateX: -90 }}
          animate={{ rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-8xl mb-6"
        >
          🍞
        </motion.div>

        {/* 湯気エフェクト */}
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.8, 0], y: -30 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-3xl mb-2"
        >
          ♨️
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-xl font-bold text-[#8B6914] mb-2"
        >
          焼き上がりました！
        </motion.h2>

        {bread && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="bg-white rounded-2xl p-5 shadow-md mt-4"
          >
            <p className="text-lg font-bold text-[#D4A574]">{bread.name}</p>
            <p className="text-sm text-gray-500 mt-2">{bread.description}</p>
            {yeast && (
              <p className="text-xs text-gray-400 mt-1">
                {yeast.emoji} {yeast.name}で焼きました
              </p>
            )}
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          onClick={handleContinue}
          className="mt-6 bg-[#D4A574] text-white font-bold py-4 px-8 rounded-2xl text-lg active:scale-95 transition-transform shadow-lg"
        >
          🎨 トッピングする
        </motion.button>
      </motion.div>
    </div>
  );
}
