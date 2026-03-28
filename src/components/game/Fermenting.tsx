"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { YEASTS } from "@/lib/game-data";

export default function Fermenting() {
  const { fermentation, checkFermentation, setStep, selectedYeastId } = useGameStore();
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(0);
  const yeast = YEASTS.find((y) => y.id === selectedYeastId);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!fermentation) return;

      const now = Date.now();
      const total = fermentation.completedAt - fermentation.startedAt;
      const elapsed = now - fermentation.startedAt;
      const remaining = Math.max(0, fermentation.completedAt - now);

      setProgress(Math.min(100, (elapsed / total) * 100));

      if (remaining <= 0) {
        setTimeLeft("完了！");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [fermentation]);

  const isReady = checkFermentation();

  return (
    <div className="p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-dreamy text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E8C9A0] via-[#D4A574] to-[#E8C9A0]" />

        {/* 瓶のアニメーション */}
        <div className="relative inline-block">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 1, -1, 0],
            }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <div className="relative">
              <div className="jar-lid w-14 mx-auto" />
              <div className="jar-body w-20 h-24 mx-auto">
                <motion.div
                  className="jar-liquid"
                  style={{ height: `${Math.min(progress, 85)}%` }}
                  animate={{ height: `${Math.min(progress, 85)}%` }}
                />
                {/* バブル */}
                <div className="bubble" style={{ left: "25%", bottom: "20%", animationDelay: "0s" }} />
                <div className="bubble" style={{ left: "55%", bottom: "15%", animationDelay: "0.7s", width: "6px", height: "6px" }} />
                <div className="bubble" style={{ left: "40%", bottom: "30%", animationDelay: "1.4s", width: "5px", height: "5px" }} />
              </div>
            </div>
          </motion.div>

          {/* 湯気 */}
          <motion.span
            className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg opacity-30"
            animate={{ y: [0, -10, -20], opacity: [0.3, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ~
          </motion.span>
        </div>

        <h2 className="text-lg font-bold text-[#8B6914] mt-3">
          {yeast?.name || "酵母"}を発酵中...
        </h2>

        {/* プログレスバー */}
        <div className="relative h-5 bg-[#F5F0EB] rounded-full overflow-hidden my-4 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-[#D4A574] via-[#E8913A] to-[#D4A574] rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 animate-shimmer rounded-full" />
          </motion.div>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#8B6914]/60">
            {Math.round(progress)}%
          </span>
        </div>

        <motion.div
          className="bg-[#FFF8F0] rounded-2xl py-3 px-5 inline-block"
          animate={timeLeft === "完了！" ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <p className="text-2xl font-mono text-[#D4A574] font-bold">{timeLeft}</p>
        </motion.div>

        <p className="text-sm text-gray-400 mt-4">
          アプリを閉じても大丈夫。
          <br />
          発酵が完了したら確認できます。
        </p>

        {isReady && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep("bake-reveal")}
            className="mt-6 btn-cute btn-bake text-white font-bold py-4 px-8 text-lg animate-pulse-glow"
          >
            <span className="flex items-center gap-2">
              <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                🍞
              </motion.span>
              焼き上がりを確認！
            </span>
          </motion.button>
        )}
      </motion.div>

      <button
        onClick={() => setStep("idle")}
        className="w-full py-3 text-gray-400 text-sm"
      >
        ← ホームに戻る（発酵は続きます）
      </button>
    </div>
  );
}
