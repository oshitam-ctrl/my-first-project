"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { YEASTS } from "@/lib/game-data";

/* 小さなパンSVG */
function SmallBreadSVG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 28" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="16" rx="14" ry="11" fill="url(#sb-grad)" />
      <ellipse cx="16" cy="12" rx="8" ry="3.5" fill="rgba(255,255,255,0.2)" />
      <path d="M6 11 C10 6, 22 6, 26 11" stroke="rgba(139,105,20,0.12)" strokeWidth="1" fill="none" />
      <defs>
        <linearGradient id="sb-grad" x1="2" y1="5" x2="30" y2="27">
          <stop offset="0%" stopColor="#F5D6A8" />
          <stop offset="50%" stopColor="#E8B87A" />
          <stop offset="100%" stopColor="#C09060" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function GameIdle() {
  const { setStep, fermentation, checkFermentation, ownedYeasts, ownedBreads, breadCrumbs } = useGameStore();
  const hasFermentation = fermentation !== null;
  const isReady = hasFermentation && checkFermentation();

  return (
    <div className="p-4 space-y-4">
      {/* ステータスカード */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-5 shadow-dreamy relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F5C88A] via-[#D4A574] to-[#E8913A] rounded-t-3xl" />
        <div className="flex items-center gap-2 mb-4">
          <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <SmallBreadSVG className="w-7 h-6" />
          </motion.div>
          <h2 className="text-lg font-bold text-[#8B6914]">酵母のパン工房</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { value: ownedYeasts.length, label: "酵母", emoji: "🌱", delay: 0 },
            { value: ownedBreads.length, label: "パン", emoji: "🍞", delay: 0.1 },
            { value: breadCrumbs, label: "パンくず", emoji: "✨", delay: 0.2 },
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: item.delay, type: "spring", stiffness: 300 }}
              className="status-item"
            >
              <span className="text-sm block mb-1">{item.emoji}</span>
              <p className="text-2xl font-bold text-[#D4A574]">{item.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 発酵中の表示 */}
      {hasFermentation && !isReady && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 shadow-dreamy relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E8C9A0] via-[#D4A574] to-[#E8C9A0]" />
          <div className="text-center">
            <motion.p
              className="text-4xl mb-2"
              animate={{ scale: [1, 1.1, 1], y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🫧
            </motion.p>
            <p className="font-bold text-[#8B6914]">発酵中...</p>
            <p className="text-sm text-gray-500 mt-1">
              もうしばらくお待ちください
            </p>
            <FermentationTimer completedAt={fermentation!.completedAt} />
            <button
              onClick={() => {
                useGameStore.setState({ fermentation: null, selectedYeastId: null });
                setStep("idle");
              }}
              className="mt-3 text-xs text-gray-400 underline"
            >
              リセットしてやり直す
            </button>
          </div>
        </motion.div>
      )}

      {/* 焼き上がり通知 */}
      {isReady && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setStep("bake-reveal")}
          className="w-full relative overflow-hidden bg-gradient-to-r from-[#E8913A] via-[#D4A574] to-[#E8913A] text-white font-bold py-5 px-6 rounded-3xl shadow-lg text-lg animate-pulse-glow"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <motion.span
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🍞
            </motion.span>
            パンが焼き上がりました！
          </span>
          <div className="absolute inset-0 animate-shimmer" />
        </motion.button>
      )}

      {/* パンを焼くボタン */}
      {!hasFermentation && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep("select-material")}
          className="w-full btn-cute btn-bake text-white font-bold py-5 px-6 text-lg relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🌾
            </motion.span>
            パンを焼く
          </span>
        </motion.button>
      )}

      {/* ガチャボタン */}
      {breadCrumbs > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep("gacha")}
          className="w-full btn-cute btn-green font-bold py-4 px-6 relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🌱
            </motion.span>
            ガチャを回す（パンくず: {breadCrumbs}）
          </span>
        </motion.button>
      )}

      {/* 図鑑リンク */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          window.location.href = "/collection";
        }}
        className="w-full bg-white text-[#8B6914] font-bold py-4 px-6 rounded-3xl shadow-dreamy border border-[#E8C9A0]/30 transition-all"
      >
        <span className="flex items-center justify-center gap-2">
          📖 パン図鑑を見る
        </span>
      </motion.button>

      {/* 所持酵母一覧 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-3xl p-5 shadow-dreamy relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7CB342] via-[#8BC34A] to-[#7CB342] rounded-t-3xl" />
        <h3 className="font-bold text-[#8B6914] mb-3 flex items-center gap-2">
          <span>🌱</span>
          仲間の妖精たち
        </h3>
        <div className="space-y-2.5">
          {ownedYeasts.map((oy, i) => {
            const yeast = YEASTS.find((y) => y.id === oy.yeastId);
            if (!yeast) return null;
            return (
              <motion.div
                key={oy.yeastId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-center justify-between bg-gradient-to-r from-[#FFF8F0] to-[#FFF5EB] rounded-2xl p-3.5 border border-[#E8C9A0]/15 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    className="text-2xl"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {yeast.emoji}
                  </motion.span>
                  <div>
                    <p className="font-semibold text-sm text-[#5a4a2a]">{yeast.name}</p>
                    <p className="text-xs mt-0.5">
                      {[...Array(yeast.rarity)].map((_, si) => (
                        <span key={si} className="text-[#E8913A]">★</span>
                      ))}
                      {[...Array(3 - yeast.rarity)].map((_, si) => (
                        <span key={si} className="text-gray-200">★</span>
                      ))}
                    </p>
                  </div>
                </div>
                {oy.duplicateCount > 0 && (
                  <span className="text-xs bg-gradient-to-r from-[#D4A574] to-[#E8913A] text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                    x{oy.duplicateCount + 1}
                  </span>
                )}
              </motion.div>
            );
          })}
          {ownedYeasts.length === 0 && (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">🌿</p>
              <p className="text-sm text-gray-400">まだ酵母がいません</p>
              <p className="text-xs text-gray-300 mt-1">パンを焼いてガチャを回そう！</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function FermentationTimer({ completedAt }: { completedAt: number }) {
  const remaining = Math.max(0, completedAt - Date.now());
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="mt-3 bg-[#FFF8F0] rounded-2xl py-2.5 px-4 inline-block">
      <p className="text-lg font-mono text-[#D4A574] font-bold">
        あと {hours}時間 {minutes}分
      </p>
    </div>
  );
}
