"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { YEASTS, DUPLICATE_STORIES } from "@/lib/game-data";
import { FairySVG } from "@/components/FairySVG";

type GachaPhase = "compost" | "growing" | "reveal";

/* キラキラ演出 */
function GachaSparkles() {
  const sparkles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.cos((i / 12) * Math.PI * 2) * 80,
      y: Math.sin((i / 12) * Math.PI * 2) * 80,
      delay: i * 0.08,
      size: 8 + Math.random() * 8,
    }))
  , []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
          transition={{ duration: 0.8, delay: s.delay }}
          className="absolute text-yellow-400"
          style={{ fontSize: s.size }}
        >
          ✦
        </motion.div>
      ))}
    </div>
  );
}

export default function Gacha() {
  const { drawGacha, breadCrumbs, setStep, ownedYeasts, initGachaPool, gachaPool } = useGameStore();
  const [phase, setPhase] = useState<GachaPhase>("compost");
  const [drawnYeastId, setDrawnYeastId] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateStory, setDuplicateStory] = useState<string | null>(null);

  function handleCompostTap() {
    if (breadCrumbs <= 0) return;

    if (gachaPool.length === 0) {
      initGachaPool();
    }

    useGameStore.getState().useBreadCrumb();

    setPhase("growing");

    setTimeout(() => {
      const yeastId = drawGacha();
      if (!yeastId) return;
      setDrawnYeastId(yeastId);

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
    }, 2500);
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <motion.p
              className="text-4xl mb-1"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🌿
            </motion.p>
            <p className="text-lg font-bold text-[#8B6914] mb-3">土に還そう</p>
            <p className="text-sm text-gray-500 mb-6">
              パンくずと残りの酵母をコンポストに入れます
            </p>

            <motion.button
              whileTap={{ scale: 0.88, rotate: [-3, 3, -3, 0] }}
              onClick={handleCompostTap}
              disabled={breadCrumbs <= 0}
              className="relative mb-4 block mx-auto"
            >
              <motion.div
                animate={{ y: [0, -5, 0], rotate: [0, -2, 2, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="relative"
              >
                <div className="w-24 h-8 bg-gradient-to-b from-[#8B6914] to-[#6B4F0A] rounded-t-lg mx-auto" />
                <div className="w-28 h-32 bg-gradient-to-b from-[#4a7c3f] to-[#2d5a24] rounded-b-3xl mx-auto relative overflow-hidden border-2 border-[#3a6830]">
                  <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-[#5a3a1a] to-[#7a5a3a] rounded-b-3xl" />
                  <motion.span
                    className="absolute top-3 left-1/2 -translate-x-1/2 text-3xl"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🌱
                  </motion.span>
                </div>
              </motion.div>
            </motion.button>

            <p className="text-sm text-gray-400">タップしてコンポストに入れる</p>
            <div className="mt-3 bg-[#FFF8F0] rounded-xl py-1.5 px-4 inline-block">
              <p className="text-xs text-[#D4A574] font-medium">パンくず: {breadCrumbs}</p>
            </div>
          </motion.div>
        )}

        {/* Phase 2: 成長アニメーション */}
        {phase === "growing" && (
          <motion.div
            key="growing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center relative"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, ease: "linear", repeat: 1 }}
              className="relative w-32 h-32 mx-auto mb-4"
            >
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: ["#F5C88A", "#7CB342", "#E8913A", "#FFD700", "#8BC34A", "#D4A574"][i],
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${deg}deg) translateY(-50px)`,
                  }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <span className="text-5xl">🌀</span>
              </motion.div>
            </motion.div>

            <p className="font-bold text-[#8B6914] text-lg">ぐるぐるコンポスト...</p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4"
            >
              <motion.p
                animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="text-4xl"
              >
                🌿
              </motion.p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-sm text-gray-400 mt-3"
            >
              何かが生まれそう...
            </motion.p>
          </motion.div>
        )}

        {/* Phase 3: 結果表示 */}
        {phase === "reveal" && drawnYeast && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center w-full max-w-sm relative"
          >
            {drawnYeast.rarity === 3 && <GachaSparkles />}

            {drawnYeast.rarity >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-3 text-sm font-bold py-1.5 px-4 rounded-full inline-block ${
                  drawnYeast.rarity === 3
                    ? "bg-gradient-to-r from-[#FFD700] to-[#FF8C00] text-white shadow-md"
                    : "bg-gradient-to-r from-[#D4A574] to-[#E8913A] text-white"
                }`}
              >
                {drawnYeast.rarity === 3 ? "⭐ SUPER RARE ⭐" : "★ RARE ★"}
              </motion.div>
            )}

            <motion.div
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.6 }}
              className={`bg-white rounded-3xl p-6 shadow-dreamy gacha-card relative overflow-hidden ${
                drawnYeast.rarity === 3 ? "ring-2 ring-[#FFD700]/50" : ""
              }`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                drawnYeast.rarity === 3
                  ? "bg-gradient-to-r from-[#FFD700] via-[#FF8C00] to-[#FFD700]"
                  : drawnYeast.rarity === 2
                  ? "bg-gradient-to-r from-[#D4A574] via-[#E8913A] to-[#D4A574]"
                  : "bg-gradient-to-r from-[#E8C9A0] via-[#D4A574] to-[#E8C9A0]"
              }`} />

              <motion.div
                className="flex justify-center mb-3"
                animate={{ scale: [1, 1.1, 1], y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FairySVG yeastId={drawnYeast.id} size={96} />
              </motion.div>
              <p className="text-lg font-bold text-[#D4A574]">{drawnYeast.name}</p>
              <div className="flex justify-center gap-0.5 mt-1">
                {[...Array(drawnYeast.rarity)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.15 }}
                    className="text-[#E8913A] text-sm"
                  >
                    ★
                  </motion.span>
                ))}
                {[...Array(3 - drawnYeast.rarity)].map((_, i) => (
                  <span key={i} className="text-gray-200 text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3">{drawnYeast.description}</p>

              {isDuplicate ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  <p className="text-xs text-[#D4A574] font-bold mb-2 flex items-center justify-center gap-1">
                    📖 被り！ストーリー解放
                  </p>
                  {duplicateStory && (
                    <div className="bg-[#FFF8F0] rounded-xl p-3">
                      <p className="text-sm text-gray-600 italic leading-relaxed">&ldquo;{duplicateStory}&rdquo;</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  <div className="bg-gradient-to-r from-[#F0FFF0] to-[#E8F5E9] rounded-xl py-2 px-3">
                    <p className="text-sm text-[#7CB342] font-bold flex items-center justify-center gap-1">
                      <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                        ✨
                      </motion.span>
                      NEW! 新しい妖精が仲間に！
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFinish}
              className="mt-6 w-full btn-cute btn-bake text-white font-bold py-4"
            >
              OK
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
