"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { YEASTS, BREADS } from "@/lib/game-data";
import BreadSVG from "@/components/BreadSVG";

/* 紙吹雪コンポーネント */
function Confetti({ quality = 1 }: { quality?: number }) {
  const colors = quality >= 3
    ? ["#FFD700", "#FFC107", "#FFB300", "#FFCA28", "#F5C88A", "#E8913A", "#FF8C00"]
    : ["#F5C88A", "#D4A574", "#E8913A", "#FFD700", "#FF8C00", "#7CB342", "#FFB6C1"];
  const count = quality >= 3 ? 30 : quality >= 2 ? 20 : 12;
  const pieces = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      shape: Math.random() > 0.5 ? "circle" : "square",
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: "100vh",
            x: [0, Math.random() * 60 - 30, Math.random() * 40 - 20],
            rotate: p.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "fixed",
            left: p.left,
            top: -10,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

export default function BakeReveal() {
  const { selectedYeastId, setSelectedBread, setStep, fermentation, nurtureQuality } = useGameStore();
  const yeast = YEASTS.find((y) => y.id === selectedYeastId || y.id === fermentation?.yeastId);

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
    <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] relative">
      <Confetti quality={nurtureQuality} />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
        className="text-center w-full max-w-sm"
      >
        {/* オーブンから登場 */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
          className="relative"
        >
          {/* 湯気エフェクト */}
          <div className="flex justify-center gap-4 mb-2">
            {[0, 0.4, 0.8].map((delay, i) => (
              <motion.span
                key={i}
                className="text-2xl opacity-40"
                animate={{ y: [0, -15, -30], opacity: [0.4, 0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay }}
              >
                ~
              </motion.span>
            ))}
          </div>

          {/* パンのSVG */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <BreadSVG className="w-36 h-36 mx-auto" showFace={true} />
          </motion.div>

          {/* キラキラ */}
          <motion.span
            className="absolute top-2 right-8 text-lg"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 180, 360] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.span>
          <motion.span
            className="absolute top-6 left-8 text-sm"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            ⭐
          </motion.span>
          <motion.span
            className="absolute bottom-4 right-4 text-sm"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          >
            ✨
          </motion.span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-xl font-bold text-[#8B6914] mb-1 mt-3"
        >
          {nurtureQuality >= 3 ? "最高傑作！" : nurtureQuality >= 2 ? "おいしく焼けました！" : "焼き上がりました！"}
        </motion.h2>

        {/* 品質★ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: "spring" }}
          className="flex justify-center gap-1 mb-2"
        >
          {[1, 2, 3].map((star) => (
            <span key={star} className={`text-lg ${nurtureQuality >= star ? "text-[#FFD700]" : "text-gray-200"}`}>
              ★
            </span>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-sm text-gray-400 mb-3"
        >
          🎉 おめでとうございます
        </motion.p>

        {bread && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.2, type: "spring" }}
            className="bg-white rounded-3xl p-5 shadow-dreamy relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F5C88A] via-[#E8913A] to-[#F5C88A]" />
            <p className="text-lg font-bold text-[#D4A574]">{bread.name}</p>
            <p className="text-sm text-gray-500 mt-2">{bread.description}</p>
            {yeast && (
              <div className="mt-2 bg-[#FFF8F0] rounded-xl py-1.5 px-3 inline-block">
                <p className="text-xs text-gray-400">
                  {yeast.emoji} {yeast.name}で焼きました
                </p>
              </div>
            )}
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleContinue}
          className="mt-6 btn-cute btn-bake text-white font-bold py-4 px-10 text-lg"
        >
          <span className="flex items-center gap-2">
            🎨 トッピングする
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}
