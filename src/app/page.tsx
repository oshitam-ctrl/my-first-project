"use client";

import { useState } from "react";
import PointsTab from "@/components/PointsTab";
import GameTab from "@/components/GameTab";

type Tab = "points" | "game";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("game");

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto">
      {/* ヘッダー */}
      <header className="bg-[#D4A574] text-white px-4 py-3 text-center shadow-md">
        <h1 className="text-lg font-bold tracking-wide">プチヘルメース</h1>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "points" ? <PointsTab /> : <GameTab />}
      </main>

      {/* タブバー */}
      <nav className="bg-white border-t border-gray-200 flex">
        <button
          onClick={() => setActiveTab("points")}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === "points"
              ? "text-[#D4A574] border-t-2 border-[#D4A574]"
              : "text-gray-400"
          }`}
        >
          <span className="block text-xl mb-0.5">🎫</span>
          来店ポイント
        </button>
        <button
          onClick={() => setActiveTab("game")}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === "game"
              ? "text-[#D4A574] border-t-2 border-[#D4A574]"
              : "text-gray-400"
          }`}
        >
          <span className="block text-xl mb-0.5">🍞</span>
          酵母のパン工房
        </button>
      </nav>
    </div>
  );
}
