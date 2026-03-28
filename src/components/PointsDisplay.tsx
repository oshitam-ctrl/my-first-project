"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";

export default function PointsDisplay() {
  const totalPoints = useGameStore((s) => s.totalPoints);
  const nextCouponAt = totalPoints < 5 ? 5 : totalPoints < 10 ? 10 : null;
  const maxStamps = nextCouponAt || 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="stamp-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-2xl"
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🎫
          </motion.span>
          <h2 className="text-lg font-bold text-[#8B6914]">スタンプカード</h2>
        </div>
        <div className="bg-white/80 rounded-2xl py-1.5 px-3 shadow-sm">
          <span className="text-2xl font-bold text-[#D4A574]">{totalPoints}</span>
          <span className="text-xs text-gray-400 ml-1">pt</span>
        </div>
      </div>

      {/* スタンプグリッド */}
      <div className="bg-white/60 rounded-2xl p-4 mb-3">
        <div className="grid grid-cols-5 gap-3 justify-items-center">
          {[...Array(maxStamps)].map((_, i) => (
            <motion.div
              key={i}
              initial={i < totalPoints ? { scale: 0 } : {}}
              animate={i < totalPoints ? { scale: 1 } : {}}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
              className={`stamp-dot ${
                i < totalPoints ? "stamp-dot-filled" : "stamp-dot-empty"
              }`}
            >
              {i < totalPoints ? (
                <motion.span
                  className="text-sm"
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                >
                  🍞
                </motion.span>
              ) : (
                <span className="text-[10px]">{i + 1}</span>
              )}
            </motion.div>
          ))}
        </div>

        {/* マイルストーン表示 */}
        <div className="flex justify-between mt-3 text-[10px] text-gray-400">
          <span>START</span>
          <span className="text-[#D4A574] font-bold">5pt 🎁</span>
          <span className="text-[#E8913A] font-bold">10pt 🎁</span>
        </div>
      </div>

      {nextCouponAt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-sm text-[#A0522D] font-medium flex items-center justify-center gap-1.5">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ✨
            </motion.span>
            あと {nextCouponAt - totalPoints} ポイントでクーポン獲得！
          </p>
        </motion.div>
      )}

      {!nextCouponAt && totalPoints >= 10 && (
        <div className="text-center">
          <p className="text-sm text-[#7CB342] font-bold">🎉 全クーポンコンプリート！</p>
        </div>
      )}
    </motion.div>
  );
}
