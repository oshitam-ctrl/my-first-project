"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { YEASTS, BREADS } from "@/lib/game-data";

/* かわいい丸パンSVG */
function CuteBreadSVG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* パン本体 */}
      <ellipse cx="60" cy="58" rx="50" ry="38" fill="url(#bake-bread-grad)" />
      {/* 割れ目 */}
      <path d="M30 45 C40 35, 55 32, 60 38 C65 32, 80 35, 90 45" stroke="rgba(139,105,20,0.15)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* ハイライト */}
      <ellipse cx="55" cy="42" rx="22" ry="10" fill="rgba(255,255,255,0.2)" />
      {/* ほっぺ（かわいい） */}
      <ellipse cx="38" cy="62" rx="8" ry="5" fill="rgba(255,180,150,0.25)" />
      <ellipse cx="82" cy="62" rx="8" ry="5" fill="rgba(255,180,150,0.25)" />
      {/* 目 */}
      <circle cx="45" cy="55" r="2.5" fill="#5a4a2a" />
      <circle cx="75" cy="55" r="2.5" fill="#5a4a2a" />
      {/* 目のハイライト */}
      <circle cx="46" cy="54" r="1" fill="white" />
      <circle cx="76" cy="54" r="1" fill="white" />
      {/* 口（にっこり） */}
      <path d="M52 64 Q60 70 68 64" stroke="#5a4a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <defs>
        <linearGradient id="bake-bread-grad" x1="10" y1="20" x2="110" y2="96">
          <stop offset="0%" stopColor="#F5D6A8" />
          <stop offset="40%" stopColor="#E8B87A" />
          <stop offset="100%" stopColor="#C09060" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* 紙吹雪コンポーネント */
function Confetti() {
  const colors = ["#F5C88A", "#D4A574", "#E8913A", "#FFD700", "#FF8C00", "#7CB342", "#FFB6C1"];
  const pieces = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
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
  , []);

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
  const { selectedYeastId, setSelectedBread, setStep, fermentation } = useGameStore();
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
      <Confetti />

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
            <CuteBreadSVG className="w-36 h-28 mx-auto" />
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
          焼き上がりました！
        </motion.h2>

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
