"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { YEASTS } from "@/lib/game-data";
import { SpeechBubble } from "@/components/SpeechBubble";

export default function Nurture() {
  const { selectedYeastId, setStep, startFermentation } = useGameStore();
  const yeast = YEASTS.find((y) => y.id === selectedYeastId);

  const [shakeCount, setShakeCount] = useState(0);
  const [sugarLevel, setSugarLevel] = useState(50);
  const [temperature, setTemperature] = useState(25);
  const [currentPhase, setCurrentPhase] = useState<"shake" | "sugar" | "temperature" | "done">("shake");
  const [isShaking, setIsShaking] = useState(false);

  // セリフをランダムに選ぶ
  const pickRandomQuote = useCallback(() => {
    if (!yeast) return "";
    const quotes = yeast.quotes.nurture;
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, [yeast]);

  const [currentQuote, setCurrentQuote] = useState(() => pickRandomQuote());

  // フェーズが変わるたびにセリフを更新
  useEffect(() => {
    setCurrentQuote(pickRandomQuote());
  }, [currentPhase, pickRandomQuote]);

  // シェイクするたびにセリフを更新
  useEffect(() => {
    if (shakeCount > 0) {
      setCurrentQuote(pickRandomQuote());
    }
  }, [shakeCount, pickRandomQuote]);

  const optimalTemp = { min: 24, max: 28 };
  const isOptimalTemp = temperature >= optimalTemp.min && temperature <= optimalTemp.max;

  function handleShake() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    setShakeCount((c) => {
      const newCount = c + 1;
      if (newCount >= 5) {
        setTimeout(() => setCurrentPhase("sugar"), 500);
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
      {/* 酵母のヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.span
          className="text-5xl inline-block"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {yeast.emoji}
        </motion.span>
        {currentQuote && (
          <div className="mt-2 mb-1">
            <SpeechBubble text={currentQuote} />
          </div>
        )}
        <h2 className="text-lg font-bold text-[#8B6914] mt-2">{yeast.name}を育てよう</h2>
        {/* フェーズインジケーター */}
        <div className="flex justify-center gap-2 mt-3">
          {(["shake", "sugar", "temperature", "done"] as const).map((phase, i) => (
            <div key={phase} className="flex items-center gap-2">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentPhase === phase
                    ? "bg-gradient-to-r from-[#D4A574] to-[#E8913A] text-white shadow-md"
                    : (["shake", "sugar", "temperature", "done"].indexOf(currentPhase) > i)
                    ? "bg-[#D4A574] text-white"
                    : "bg-[#F5F0EB] text-gray-300"
                }`}
                animate={currentPhase === phase ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {i + 1}
              </motion.div>
              {i < 3 && (
                <div className={`w-6 h-0.5 ${
                  (["shake", "sugar", "temperature", "done"].indexOf(currentPhase) > i)
                    ? "bg-[#D4A574]"
                    : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Phase 1: シェイク */}
        {currentPhase === "shake" && (
          <motion.div
            key="shake"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl p-6 shadow-dreamy text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E8C9A0] via-[#D4A574] to-[#E8C9A0]" />

            {/* 瓶のイラスト */}
            <motion.div
              className={`inline-block ${isShaking ? "animate-shake-jar" : ""}`}
              animate={!isShaking ? { rotate: [0, -2, 2, 0] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="relative inline-block">
                <div className="jar-lid w-16 mx-auto" />
                <div className="jar-body w-20 h-24 mx-auto">
                  <div className="jar-liquid" style={{ height: `${Math.min(100, shakeCount * 20)}%` }} />
                  {/* バブル */}
                  {shakeCount > 0 && (
                    <>
                      <div className="bubble" style={{ left: "20%", bottom: "20%", animationDelay: "0s" }} />
                      <div className="bubble" style={{ left: "50%", bottom: "10%", animationDelay: "0.5s", width: "6px", height: "6px" }} />
                      <div className="bubble" style={{ left: "70%", bottom: "30%", animationDelay: "1s", width: "5px", height: "5px" }} />
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            <p className="font-bold text-[#8B6914] mb-2 mt-4">瓶を振ろう！</p>
            <p className="text-sm text-gray-500 mb-4">タップして瓶を振ってください</p>

            {/* プログレスドット */}
            <div className="flex justify-center gap-2 mb-5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-10 h-3 rounded-full ${
                    i < shakeCount
                      ? "bg-gradient-to-r from-[#D4A574] to-[#E8913A]"
                      : "bg-gray-100"
                  }`}
                  animate={i === shakeCount - 1 ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.88, rotate: [-5, 5, -5, 0] }}
              onClick={handleShake}
              className="btn-cute btn-bake text-white font-bold py-4 px-10 text-lg"
            >
              🫧 フリフリ！
            </motion.button>
          </motion.div>
        )}

        {/* Phase 2: 砂糖 */}
        {currentPhase === "sugar" && (
          <motion.div
            key="sugar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl p-6 shadow-dreamy text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F5E6D0] via-[#D4A574] to-[#F5E6D0]" />

            <motion.p
              className="text-6xl mb-3"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🍬
            </motion.p>
            <p className="font-bold text-[#8B6914] mb-2">砂糖を入れよう</p>
            <p className="text-sm text-gray-500 mb-5">スライダーで甘さを調整</p>

            {/* 砂糖レベル表示 */}
            <div className="bg-[#FFF8F0] rounded-2xl p-4 mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>ひかえめ</span>
                <span>ちょうどいい</span>
                <span>あまーい</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sugarLevel}
                onChange={(e) => setSugarLevel(Number(e.target.value))}
                className="w-full"
              />
              <motion.p
                className="text-2xl font-bold text-[#D4A574] mt-3"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5 }}
                key={sugarLevel}
              >
                {sugarLevel}%
                <span className="text-sm ml-1">
                  {sugarLevel < 30 ? "🤏" : sugarLevel < 70 ? "👌" : "🍯"}
                </span>
              </motion.p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSugarDone}
              className="btn-cute btn-bake text-white font-bold py-3.5 px-10"
            >
              OK！
            </motion.button>
          </motion.div>
        )}

        {/* Phase 3: 温度管理 */}
        {currentPhase === "temperature" && (
          <motion.div
            key="temperature"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl p-6 shadow-dreamy text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#87CEEB] via-[#E8913A] to-[#FF6347]" />

            <motion.p
              className="text-6xl mb-3"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🌡️
            </motion.p>
            <p className="font-bold text-[#8B6914] mb-2">温度を合わせよう</p>
            <p className="text-sm text-gray-500 mb-4">
              適温ゾーン（{optimalTemp.min}〜{optimalTemp.max}°C）に合わせてください
            </p>

            <div className="bg-[#FFF8F0] rounded-2xl p-4 mb-4">
              <div className="relative mb-2">
                <input
                  type="range"
                  min={15}
                  max={40}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full relative z-10"
                />
                {/* 適温ゾーンの表示 */}
                <div
                  className="absolute top-0 h-3 bg-green-200/50 rounded-lg pointer-events-none"
                  style={{
                    left: `${((optimalTemp.min - 15) / 25) * 100}%`,
                    width: `${((optimalTemp.max - optimalTemp.min) / 25) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                <span>15°C ❄️</span>
                <span>25°C 🌿</span>
                <span>40°C 🔥</span>
              </div>

              <motion.div
                className={`mt-3 text-2xl font-bold rounded-xl py-2 ${
                  isOptimalTemp
                    ? "text-[#7CB342] bg-green-50"
                    : "text-gray-400 bg-gray-50"
                }`}
                animate={isOptimalTemp ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: isOptimalTemp ? Infinity : 0 }}
              >
                {temperature}°C {isOptimalTemp && "🎯 ぴったり！"}
              </motion.div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleTemperatureDone}
              className="btn-cute btn-bake text-white font-bold py-3.5 px-10"
            >
              発酵スタート！
            </motion.button>
          </motion.div>
        )}

        {/* Phase 4: 発酵開始確認 */}
        {currentPhase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 shadow-dreamy text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F5C88A] via-[#E8913A] to-[#F5C88A]" />

            {/* キラキラエフェクト */}
            <div className="relative inline-block">
              <motion.p
                className="text-6xl"
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨
              </motion.p>
              <motion.span
                className="absolute -top-1 -right-1 text-xl"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              >
                ⭐
              </motion.span>
              <motion.span
                className="absolute -top-1 -left-2 text-lg"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
              >
                ⭐
              </motion.span>
            </div>

            <p className="font-bold text-[#8B6914] text-lg mb-2 mt-3">準備完了！</p>
            <motion.p
              className="text-sm text-gray-500 mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isOptimalTemp
                ? "温度ぴったり！発酵が少し早くなります 🎉"
                : "酵母を発酵させましょう"}
            </motion.p>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStartFermentation}
              className="btn-cute btn-bake text-white font-bold py-4 px-10 text-lg animate-pulse-glow"
            >
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                  🫧
                </motion.span>
                発酵開始！
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
