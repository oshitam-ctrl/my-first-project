"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { BREADS, YEASTS, TOPPINGS } from "@/lib/game-data";

export default function Complete() {
  const {
    selectedBreadId,
    selectedToppings,
    addBread,
    addBreadCrumb,
    setStep,
  } = useGameStore();

  const bread = BREADS.find((b) => b.id === selectedBreadId);
  const yeast = bread ? YEASTS.find((y) => y.id === bread.yeastId) : null;
  const toppings = selectedToppings
    .map((id) => TOPPINGS.find((t) => t.id === id))
    .filter(Boolean);

  useEffect(() => {
    if (selectedBreadId) {
      addBread(selectedBreadId, selectedToppings);
      addBreadCrumb();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!bread) return null;

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
      {/* 紙吹雪エフェクト */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-bold text-[#8B6914] mb-4"
        >
          図鑑に登録されました！
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-md w-full max-w-sm"
        >
          <p className="text-5xl mb-3">🍞</p>
          <p className="text-lg font-bold text-[#D4A574]">{bread.name}</p>

          {yeast && (
            <p className="text-sm text-gray-500 mt-2">
              {yeast.emoji} {yeast.name}
            </p>
          )}

          {toppings.length > 0 && (
            <div className="flex justify-center gap-2 mt-2">
              {toppings.map((t) => (
                <span key={t!.id} className="bg-[#FFF8F0] px-2 py-1 rounded-lg text-sm">
                  {t!.emoji} {t!.name}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-3">{bread.tasteDescription}</p>
          <p className="text-xs text-gray-400 mt-2">💡 {bread.recommendation}</p>

          {bread.shopName && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-[#A0522D]">
                🏪 お店では「{bread.shopName}」として販売中
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 bg-[#FFF8F0] rounded-xl p-3"
        >
          <p className="text-sm text-[#8B6914]">
            🍞 パンくずを1個獲得！ガチャが回せます
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-6 space-y-3 w-full"
        >
          <button
            onClick={() => setStep("gacha")}
            className="w-full bg-[#7CB342] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            🌱 土に還してガチャを回す
          </button>
          <button
            onClick={() => {
              useGameStore.setState({ fermentation: null, selectedYeastId: null, selectedBreadId: null, selectedToppings: [] });
              setStep("idle");
            }}
            className="w-full py-3 text-gray-400 text-sm"
          >
            あとで回す
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
