"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { YEASTS, DUPLICATE_STORIES } from "@/lib/game-data";

type GachaPhase = "compost" | "growing" | "reveal";

export default function Gacha() {
  const { drawGacha, breadCrumbs, setStep, ownedYeasts, initGachaPool, gachaPool } = useGameStore();
  const [phase, setPhase] = useState<GachaPhase>("compost");
  const [drawnYeastId, setDrawnYeastId] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateStory, setDuplicateStory] = useState<string | null>(null);

  function handleCompostTap() {
    if (breadCrumbs <= 0) return;

    // ガチャプールが空なら初期化
    if (gachaPool.length === 0) {
      initGachaPool();
    }

    // パンくずを使用
    useGameStore.getState().useBreadCrumb();

    setPhase("growing");

    setTimeout(() => {
      const yeastId = drawGacha();
      if (!yeastId) return;
      setDrawnYeastId(yeastId);

      // 被り判定
      const wasOwned = ownedYeasts.some((y) => y.yeastId === yeastId);
      setIsDuplicate(wasOwned);

      if (wasOwned) {
        const owned = ownedYeasts.find((y) => y.yeastId === yeastId);
        const stories = DUPLICATE_STORIES[yeastId] || [];
        const storyIndex = Math.min((owned?.duplicateCount || 0), stories.length - 1);
        if (stories[storyIndex]) {
          setDuplicateStory(stories[storyIndex]);
        }
      }

      setPhase("reveal");
    }, 2000);
  }

  function handleFinish() {
    useGameStore.setState({
      fermentation: null,
      selectedYeastId: null,
      selectedBreadId: null,
      selectedToppings: [],
    });
    setStep("idle");
  }

  const drawnYeast = drawnYeastId ? YEASTS.find((y) => y.id === drawnYeastId) : null;

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <AnimatePresence mode="wait">
        {/* Phase 1: コンポスト */}
        {phase === "compost" && (
          <motion.div
            key="compost"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-lg font-bold text-[#8B6914] mb-4">土に還そう</p>
            <p className="text-sm text-gray-500 mb-6">
              パンくずと残りの酵母をコンポストに入れます
            </p>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCompostTap}
              className="text-8xl mb-4 block mx-auto"
              disabled={breadCrumbs <= 0}
            >
              🌱
            </motion.button>
            <p className="text-sm text-gray-400">タップしてコンポストに入れる</p>
            <p className="text-xs text-gray-300 mt-2">パンくず: {breadCrumbs}</p>
          </motion.div>
        )}

        {/* Phase 2: 成長アニメーション */}
        {phase === "growing" && (
          <motion.div
            key="growing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="text-8xl mb-4"
            >
              🌀
            </motion.div>
            <p className="font-bold text-[#8B6914]">ぐるぐるコンポスト...</p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4"
            >
              <motion.p
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-4xl"
              >
                🌿
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* Phase 3: 結果表示 */}
        {phase === "reveal" && drawnYeast && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center w-full max-w-sm"
          >
            {/* レアリティに応じたエフェクト */}
            {drawnYeast.rarity === 3 && (
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-4xl mb-2"
              >
                🌈
              </motion.div>
            )}

            <motion.div
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <p className="text-6xl mb-3">{drawnYeast.emoji}</p>
              <p className="text-lg font-bold text-[#D4A574]">{drawnYeast.name}</p>
              <p className="text-sm text-gray-400">{"★".repeat(drawnYeast.rarity)}</p>
              <p className="text-sm text-gray-500 mt-2">{drawnYeast.description}</p>

              {isDuplicate ? (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-[#D4A574] font-bold mb-1">被り！ストーリー解放 📖</p>
                  {duplicateStory && (
                    <p className="text-sm text-gray-600 italic">&ldquo;{duplicateStory}&rdquo;</p>
                  )}
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-[#7CB342] font-bold">✨ NEW! 新しい酵母を獲得！</p>
                </div>
              )}
            </motion.div>

            <button
              onClick={handleFinish}
              className="mt-6 w-full bg-[#D4A574] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
