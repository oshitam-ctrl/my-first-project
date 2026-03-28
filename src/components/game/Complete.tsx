"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { BREADS, YEASTS, TOPPINGS } from "@/lib/game-data";

/* かわいい丸パンSVG（完成版・王冠付き） */
function CompleteBreadSVG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 110" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 王冠 */}
      <path d="M40 22 L45 10 L52 18 L60 6 L68 18 L75 10 L80 22 Z" fill="#FFD700" stroke="#E8B200" strokeWidth="1" />
      <circle cx="45" cy="10" r="2.5" fill="#FF6B6B" />
      <circle cx="60" cy="6" r="2.5" fill="#4FC3F7" />
      <circle cx="75" cy="10" r="2.5" fill="#81C784" />
      {/* パン本体 */}
      <ellipse cx="60" cy="62" rx="48" ry="36" fill="url(#comp-bread-grad)" />
      {/* 割れ目 */}
      <path d="M32 50 C42 40, 55 37, 60 43 C65 37, 78 40, 88 50" stroke="rgba(139,105,20,0.15)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* ハイライト */}
      <ellipse cx="55" cy="48" rx="20" ry="9" fill="rgba(255,255,255,0.2)" />
      {/* ほっぺ */}
      <ellipse cx="40" cy="66" rx="7" ry="4.5" fill="rgba(255,180,150,0.3)" />
      <ellipse cx="80" cy="66" rx="7" ry="4.5" fill="rgba(255,180,150,0.3)" />
      {/* 目 */}
      <circle cx="47" cy="59" r="2.5" fill="#5a4a2a" />
      <circle cx="73" cy="59" r="2.5" fill="#5a4a2a" />
      <circle cx="48" cy="58" r="1" fill="white" />
      <circle cx="74" cy="58" r="1" fill="white" />
      {/* 嬉しい口 */}
      <path d="M52 68 Q60 76 68 68" stroke="#5a4a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <defs>
        <linearGradient id="comp-bread-grad" x1="12" y1="26" x2="108" y2="98">
          <stop offset="0%" stopColor="#F5D6A8" />
          <stop offset="40%" stopColor="#E8B87A" />
          <stop offset="100%" stopColor="#C09060" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ミニ紙吹雪 */
function MiniConfetti() {
  const colors = ["#F5C88A", "#D4A574", "#E8913A", "#FFD700", "#FFB6C1", "#87CEEB", "#98FB98"];
  const pieces = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 2,
      size: 5 + Math.random() * 6,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{ y: "100vh", rotate: 720, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "fixed",
            left: p.left,
            top: -10,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

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
      <MiniConfetti />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center w-full max-w-sm"
      >
        {/* パンSVGイラスト */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <CompleteBreadSVG className="w-32 h-28 mx-auto" />
          </motion.div>
          {/* キラキラ */}
          <motion.span
            className="absolute top-0 right-10 text-lg"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 180, 360] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.span>
          <motion.span
            className="absolute top-4 left-10 text-sm"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
          >
            ⭐
          </motion.span>
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
          transition={{ delay: 0.5, type: "spring" }}
          className="bg-white rounded-3xl p-6 shadow-dreamy w-full relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#E8913A] to-[#FFD700]" />

          <p className="text-lg font-bold text-[#D4A574]">{bread.name}</p>

          {yeast && (
            <div className="mt-2 bg-[#FFF8F0] rounded-xl py-1.5 px-3 inline-block">
              <p className="text-sm text-gray-500">
                {yeast.emoji} {yeast.name}
              </p>
            </div>
          )}

          {toppings.length > 0 && (
            <div className="flex justify-center gap-2 mt-3">
              {toppings.map((t) => (
                <motion.span
                  key={t!.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.7 }}
                  className="bg-gradient-to-r from-[#FFF8F0] to-[#FFF3E6] px-3 py-1.5 rounded-xl text-sm shadow-sm border border-[#E8C9A0]/15"
                >
                  {t!.emoji} {t!.name}
                </motion.span>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-3">{bread.tasteDescription}</p>
          <p className="text-xs text-gray-400 mt-2 bg-[#FFF8F0] rounded-lg py-1.5 px-3 inline-block">💡 {bread.recommendation}</p>

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
          className="mt-4 bg-gradient-to-r from-[#FFF8F0] to-[#FFF3E6] rounded-2xl p-3.5 shadow-sm border border-[#E8C9A0]/15"
        >
          <p className="text-sm text-[#8B6914] flex items-center justify-center gap-1.5">
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🍞
            </motion.span>
            パンくずを1個獲得！ガチャが回せます
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-6 space-y-3 w-full"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep("gacha")}
            className="w-full btn-cute btn-green font-bold py-4"
          >
            <span className="flex items-center justify-center gap-2">
              <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                🌱
              </motion.span>
              土に還してガチャを回す
            </span>
          </motion.button>
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
