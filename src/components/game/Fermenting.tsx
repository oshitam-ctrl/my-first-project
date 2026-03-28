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
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 1, -1, 0],
          }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-7xl mb-4"
        >
          🫧
        </motion.div>

        <h2 className="text-lg font-bold text-[#8B6914]">
          {yeast?.name || "酵母"}を発酵中...
        </h2>

        {/* プログレスバー */}
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden my-4">
          <motion.div
            className="h-full bg-gradient-to-r from-[#D4A574] to-[#E8913A] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-2xl font-mono text-[#D4A574] font-bold">{timeLeft}</p>

        <p className="text-sm text-gray-500 mt-4">
          アプリを閉じても大丈夫。
          <br />
          発酵が完了したら確認できます。
        </p>

        {isReady && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setStep("bake-reveal")}
            className="mt-6 bg-gradient-to-r from-[#E8913A] to-[#D4A574] text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-lg"
          >
            🍞 焼き上がりを確認！
          </motion.button>
        )}
      </div>

      <button
        onClick={() => setStep("idle")}
        className="w-full py-3 text-gray-400 text-sm"
      >
        ホームに戻る（発酵は続きます）
      </button>
    </div>
  );
}
