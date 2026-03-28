"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PointsTab from "@/components/PointsTab";
import GameTab from "@/components/GameTab";

type Tab = "points" | "game";

/* パンのSVGアイコン */
function BreadIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="18" rx="18" ry="13" fill="#F5C88A" />
      <ellipse cx="20" cy="18" rx="18" ry="13" fill="url(#bread-grad)" />
      <path d="M8 12 C12 6, 28 6, 32 12" stroke="rgba(139,105,20,0.15)" strokeWidth="1.5" fill="none" />
      <ellipse cx="20" cy="12" rx="10" ry="4" fill="rgba(255,255,255,0.25)" />
      <defs>
        <linearGradient id="bread-grad" x1="2" y1="5" x2="38" y2="31">
          <stop offset="0%" stopColor="#F5D6A8" />
          <stop offset="60%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#C09060" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function WheatIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22V8" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 8C12 8 8 6 8 3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 8C12 8 16 6 16 3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 12C12 12 8 10 7 7" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 12C12 12 16 10 17 7" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 16C12 16 9 14 8 11" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 16C12 16 15 14 16 11" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/* 小さなキラキラSVG */
function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("game");

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto">
      {/* ヘッダー */}
      <header className="header-gradient text-white px-4 pt-3 pb-4 shadow-fluffy-lg relative">
        <div className="flex items-center justify-center gap-2.5 relative z-10">
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <BreadIcon className="w-9 h-8 drop-shadow-md" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-wide drop-shadow-sm">プチヘルメース</h1>
            <p className="text-[10px] opacity-70 tracking-widest">PETIT HERMES BAKERY</p>
          </div>
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <WheatIcon className="w-5 h-5 opacity-60" />
          </motion.div>
        </div>
        {/* ヘッダーのキラキラ */}
        <motion.div
          className="absolute top-1.5 right-4"
          animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <SparkleIcon className="w-2.5 h-2.5 text-white/50" />
        </motion.div>
        <motion.div
          className="absolute top-3 right-14"
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.7 }}
        >
          <SparkleIcon className="w-2 h-2 text-white/40" />
        </motion.div>
        <motion.div
          className="absolute bottom-3 left-6"
          animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.7, 1.1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.2 }}
        >
          <SparkleIcon className="w-2 h-2 text-white/30" />
        </motion.div>
        <motion.div
          className="absolute top-2 left-16"
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: 0.4 }}
        >
          <SparkleIcon className="w-1.5 h-1.5 text-white/35" />
        </motion.div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "points" ? <PointsTab /> : <GameTab />}
      </main>

      {/* タブバー */}
      <nav className="bg-white/95 backdrop-blur-sm border-t border-[#E8C9A0]/20 flex relative shadow-[0_-4px_15px_rgba(212,165,116,0.08)]">
        {/* アニメーションインジケーター */}
        <motion.div
          className="absolute bottom-0 h-[3px] rounded-t-full"
          style={{ background: "linear-gradient(90deg, #F5C88A, #D4A574, #E8913A)" }}
          animate={{
            left: activeTab === "points" ? "0%" : "50%",
            width: "50%",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        {/* アクティブタブの背景グロー */}
        <motion.div
          className="absolute top-0 h-full bg-gradient-to-b from-[#FFF8F0] to-transparent opacity-60"
          animate={{
            left: activeTab === "points" ? "0%" : "50%",
            width: "50%",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <button
          onClick={() => setActiveTab("points")}
          className={`flex-1 py-3 text-center text-sm font-medium transition-all duration-300 relative z-10 ${
            activeTab === "points"
              ? "text-[#D4A574]"
              : "text-gray-400"
          }`}
        >
          <motion.span
            className="block text-xl mb-0.5"
            animate={activeTab === "points" ? { scale: [1, 1.25, 1], y: [0, -2, 0] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            🎫
          </motion.span>
          <span className="text-xs">来店ポイント</span>
        </button>
        <button
          onClick={() => setActiveTab("game")}
          className={`flex-1 py-3 text-center text-sm font-medium transition-all duration-300 relative z-10 ${
            activeTab === "game"
              ? "text-[#D4A574]"
              : "text-gray-400"
          }`}
        >
          <motion.span
            className="block text-xl mb-0.5"
            animate={activeTab === "game" ? { scale: [1, 1.25, 1], rotate: [0, -10, 10, 0], y: [0, -2, 0] } : { scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            🍞
          </motion.span>
          <span className="text-xs">酵母のパン工房</span>
        </button>
      </nav>
    </div>
  );
}
