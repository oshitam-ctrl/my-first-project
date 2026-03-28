"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import QRScanner from "./QRScanner";
import PointsDisplay from "./PointsDisplay";
import CouponList from "./CouponList";

export default function PointsTab() {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="p-4 space-y-5">
      {/* ポイント表示 */}
      <PointsDisplay />

      {/* QRスキャンボタン */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowScanner(true)}
        className="w-full btn-cute btn-bake text-white font-bold py-4 px-6 text-lg relative overflow-hidden"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            📷
          </motion.span>
          QRコードをスキャン
        </span>
      </motion.button>

      {/* QRスキャナーモーダル */}
      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} />
      )}

      {/* クーポン一覧 */}
      <CouponList />

      {/* 説明 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl p-5 shadow-dreamy relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E8C9A0] via-[#D4A574] to-[#E8C9A0]" />
        <h3 className="font-bold text-[#8B6914] mb-3 flex items-center gap-2">
          <span>📋</span>
          ポイントの貯め方
        </h3>
        <ul className="text-sm text-gray-600 space-y-2.5">
          {[
            { emoji: "🏪", text: "お店のレジ横QRコードをスキャン → 1pt" },
            { emoji: "🎁", text: "5ポイントで クーポンA ゲット！" },
            { emoji: "🎁", text: "10ポイントで クーポンB ゲット！" },
            { emoji: "📅", text: "「パンの日」はダブルポイント！" },
          ].map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-2 bg-[#FFF8F0] rounded-xl py-2.5 px-3"
            >
              <span>{item.emoji}</span>
              <span>{item.text}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
