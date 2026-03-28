"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { YEASTS } from "@/lib/game-data";

export default function Nurture() {
  const { selectedYeastId, setStep, startFermentation } = useGameStore();
  const yeast = YEASTS.find((y) => y.id === selectedYeastId);

  const [shakeCount, setShakeCount] = useState(0);
  const [sugarLevel, setSugarLevel] = useState(50);
  const [temperature, setTemperature] = useState(25);
  const [currentPhase, setCurrentPhase] = useState<"shake" | "sugar" | "temperature" | "done">("shake");

  const optimalTemp = { min: 24, max: 28 };
  const isOptimalTemp = temperature >= optimalTemp.min && temperature <= optimalTemp.max;

  function handleShake() {
    setShakeCount((c) => {
      const newCount = c + 1;
      if (newCount >= 5) {
        setTimeout(() => setCurrentPhase("sugar"), 300);
      }
      return newCount;
    });
  }

  function handleSugarDone() {
    setCurrentPhase("temperature");
  }

  function handleTemperatureDone() {
    setCurrentPhase("done");
  }

  function handleStartFermentation() {
    startFermentation(selectedYeastId!, isOptimalTemp);
    setStep("fermenting");
  }

  if (!yeast) return null;

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <span className="text-5xl">{yeast.emoji}</span>
        <h2 className="text-lg font-bold text-[#8B6914] mt-2">{yeast.name}を育てよう</h2>
      </div>

      {/* Phase 1: シェイク */}
      {currentPhase === "shake" && (
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-sm text-center"
          animate={{ rotate: shakeCount > 0 ? [0, -5, 5, -5, 0] : 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-6xl mb-4">🫙</p>
          <p className="font-bold text-[#8B6914] mb-2">瓶を振ろう！</p>
          <p className="text-sm text-gray-500 mb-4">タップして瓶を振ってください（{shakeCount}/5）</p>
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-8 h-2 rounded-full ${
                  i < shakeCount ? "bg-[#D4A574]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleShake}
            className="bg-[#D4A574] text-white font-bold py-4 px-8 rounded-2xl text-lg active:scale-90 transition-transform"
          >
            🫧 フリフリ！
          </button>
        </motion.div>
      )}

      {/* Phase 2: 砂糖 */}
      {currentPhase === "sugar" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm text-center"
        >
          <p className="text-6xl mb-4">🍬</p>
          <p className="font-bold text-[#8B6914] mb-2">砂糖を入れよう</p>
          <p className="text-sm text-gray-500 mb-4">スライダーで量を調整</p>
          <input
            type="range"
            min={0}
            max={100}
            value={sugarLevel}
            onChange={(e) => setSugarLevel(Number(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#D4A574]"
          />
          <p className="text-sm text-gray-400 mt-2">砂糖の量: {sugarLevel}%</p>
          <button
            onClick={handleSugarDone}
            className="mt-4 bg-[#D4A574] text-white font-bold py-3 px-8 rounded-2xl active:scale-95 transition-transform"
          >
            OK！
          </button>
        </motion.div>
      )}

      {/* Phase 3: 温度管理 */}
      {currentPhase === "temperature" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm text-center"
        >
          <p className="text-6xl mb-4">🌡️</p>
          <p className="font-bold text-[#8B6914] mb-2">温度を合わせよう</p>
          <p className="text-sm text-gray-500 mb-4">
            適温ゾーン（{optimalTemp.min}〜{optimalTemp.max}℃）に合わせてください
          </p>
          <div className="relative mb-4">
            <input
              type="range"
              min={15}
              max={40}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#D4A574]"
            />
            {/* 適温ゾーンの表示 */}
            <div
              className="absolute top-0 h-3 bg-green-200 rounded-lg pointer-events-none"
              style={{
                left: `${((optimalTemp.min - 15) / 25) * 100}%`,
                width: `${((optimalTemp.max - optimalTemp.min) / 25) * 100}%`,
              }}
            />
          </div>
          <p className={`text-lg font-bold ${isOptimalTemp ? "text-[#7CB342]" : "text-gray-400"}`}>
            {temperature}℃ {isOptimalTemp && "🎯 ぴったり！"}
          </p>
          <button
            onClick={handleTemperatureDone}
            className="mt-4 bg-[#D4A574] text-white font-bold py-3 px-8 rounded-2xl active:scale-95 transition-transform"
          >
            発酵スタート！
          </button>
        </motion.div>
      )}

      {/* Phase 4: 発酵開始確認 */}
      {currentPhase === "done" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-6 shadow-sm text-center"
        >
          <p className="text-6xl mb-4">✨</p>
          <p className="font-bold text-[#8B6914] text-lg mb-2">準備完了！</p>
          <p className="text-sm text-gray-500 mb-4">
            {isOptimalTemp
              ? "温度ぴったり！発酵が少し早くなります 🎉"
              : "酵母を発酵させましょう"}
          </p>
          <button
            onClick={handleStartFermentation}
            className="bg-gradient-to-r from-[#E8913A] to-[#D4A574] text-white font-bold py-4 px-8 rounded-2xl text-lg active:scale-95 transition-transform shadow-lg"
          >
            🫧 発酵開始！
          </button>
        </motion.div>
      )}
    </div>
  );
}
