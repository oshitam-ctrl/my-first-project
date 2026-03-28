"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game-state";
import { YEASTS } from "@/lib/game-data";
import { FairySVG } from "@/components/FairySVG";

type Phase = "bubble" | "sugar" | "temperature" | "result";

// --- バブルデータ ---
interface Bubble {
  id: number;
  x: number; // 0〜100 (%)
  y: number; // 0〜100 (%)
  size: "large" | "medium" | "small";
  createdAt: number;
  popped: boolean;
}

const BUBBLE_SIZES = {
  large: { px: 40, points: 1 },
  medium: { px: 28, points: 2 },
  small: { px: 18, points: 3 },
};

// --- スコア計算ヘルパー ---
function bubbleScoreToNormalized(points: number): number {
  if (points >= 26) return 95 + Math.min(5, (points - 26) * 0.5);
  if (points >= 16) return 70 + ((points - 16) / 10) * 25;
  if (points >= 6) return 30 + ((points - 6) / 10) * 40;
  return (points / 6) * 30;
}

function gaugePositionToScore(position: number): { score: number; rating: "perfect" | "great" | "ok" } {
  // position: 0〜100, center=50
  const distFromCenter = Math.abs(position - 50);
  if (distFromCenter <= 10) {
    // Perfect zone (40%〜60%)
    const score = 100 - (distFromCenter / 10) * 15;
    return { score, rating: "perfect" };
  }
  if (distFromCenter <= 25) {
    // Great zone
    const score = 84 - ((distFromCenter - 10) / 15) * 34;
    return { score, rating: "great" };
  }
  // OK zone
  const score = 49 - ((distFromCenter - 25) / 25) * 29;
  return { score: Math.max(20, score), rating: "ok" };
}

function qualityFromScore(score: number): number {
  if (score >= 90) return 3;
  if (score >= 60) return 2;
  return 1;
}

// =============================================
// Phase 1: バブルキャッチ
// =============================================
function BubbleCatchPhase({ onComplete }: { onComplete: (score: number) => void }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [points, setPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100); // 0〜100のゲージ
  const [popEffects, setPopEffects] = useState<{ id: number; x: number; y: number }[]>([]);
  const bubbleIdRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const DURATION = 5000; // 5秒

  // タイマー＆バブル生成
  useEffect(() => {
    const start = Date.now();
    startTimeRef.current = start;

    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setTimeLeft(remaining);
      if (elapsed >= DURATION) {
        clearInterval(timerInterval);
      }
    }, 50);

    // バブル生成
    const spawnInterval = setInterval(() => {
      if (Date.now() - start >= DURATION) {
        clearInterval(spawnInterval);
        return;
      }
      const count = Math.random() > 0.6 ? 2 : 1;
      const newBubbles: Bubble[] = [];
      for (let i = 0; i < count; i++) {
        const sizes: Bubble["size"][] = ["large", "medium", "small"];
        const sizeWeights = [0.4, 0.4, 0.2];
        const rand = Math.random();
        const size = rand < sizeWeights[0] ? sizes[0] : rand < sizeWeights[0] + sizeWeights[1] ? sizes[1] : sizes[2];
        newBubbles.push({
          id: ++bubbleIdRef.current,
          x: 10 + Math.random() * 80,
          y: 10 + Math.random() * 80,
          size,
          createdAt: Date.now(),
          popped: false,
        });
      }
      setBubbles((prev) => [...prev, ...newBubbles]);
    }, 300);

    // バブル消滅（1.2秒後）
    const cleanupInterval = setInterval(() => {
      setBubbles((prev) => prev.filter((b) => !b.popped && Date.now() - b.createdAt < 1200));
    }, 200);

    return () => {
      clearInterval(timerInterval);
      clearInterval(spawnInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  // 時間切れ判定
  useEffect(() => {
    if (timeLeft <= 0) {
      const timer = setTimeout(() => {
        onComplete(bubbleScoreToNormalized(points));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, points, onComplete]);

  function handlePop(bubble: Bubble) {
    setBubbles((prev) => prev.map((b) => (b.id === bubble.id ? { ...b, popped: true } : b)));
    setPoints((p) => p + BUBBLE_SIZES[bubble.size].points);
    setPopEffects((prev) => [...prev, { id: bubble.id, x: bubble.x, y: bubble.y }]);
    setTimeout(() => {
      setPopEffects((prev) => prev.filter((e) => e.id !== bubble.id));
    }, 400);
  }

  const liquidLevel = Math.min(85, (points / 20) * 85);

  return (
    <motion.div
      key="bubble"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-3xl p-5 shadow-dreamy relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E8C9A0] via-[#D4A574] to-[#E8C9A0]" />

      <p className="font-bold text-[#8B6914] mb-1 text-center">泡をキャッチ！</p>
      <p className="text-xs text-gray-400 text-center mb-3">瓶の中の泡をタップしよう</p>

      {/* タイムゲージ */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-[#D4A574] to-[#E8913A] rounded-full"
          style={{ width: `${timeLeft}%` }}
        />
      </div>

      {/* 瓶エリア */}
      <div className="relative mx-auto" style={{ width: 200, height: 240 }}>
        {/* 瓶の蓋 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gradient-to-b from-[#8B7355] to-[#6B5A45] rounded-t-lg z-10" />
        {/* 瓶の本体 */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[160px] h-[220px] bg-gradient-to-b from-white/80 to-white/40 border-2 border-[#D4C5B0]/40 rounded-b-3xl overflow-hidden">
          {/* 液体 */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F5D6A8] to-[#FFF0D6] transition-all duration-300"
            style={{ height: `${liquidLevel}%` }}
          />

          {/* バブル表示エリア */}
          {bubbles.filter((b) => !b.popped).map((bubble) => {
            const sizePx = BUBBLE_SIZES[bubble.size].px;
            const age = Date.now() - bubble.createdAt;
            const opacity = Math.max(0, 1 - age / 1200);
            return (
              <motion.button
                key={bubble.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1, opacity }}
                className="absolute rounded-full bg-gradient-to-br from-white/80 to-[#D4E8FF]/60 border border-white/60 shadow-sm active:scale-75 transition-transform"
                style={{
                  width: sizePx,
                  height: sizePx,
                  left: `${bubble.x}%`,
                  top: `${bubble.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onClick={() => handlePop(bubble)}
              >
                <div className="absolute top-[20%] left-[25%] w-[30%] h-[20%] bg-white/70 rounded-full" />
              </motion.button>
            );
          })}

          {/* ポップエフェクト */}
          {popEffects.map((e) => (
            <motion.div
              key={e.id}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute pointer-events-none"
              style={{ left: `${e.x}%`, top: `${e.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <span className="text-lg">💫</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* スコア表示 */}
      <div className="text-center mt-3">
        <span className="text-2xl font-bold text-[#D4A574]">{points}</span>
        <span className="text-sm text-gray-400 ml-1">ポイント</span>
      </div>
    </motion.div>
  );
}

// =============================================
// Phase 2 & 3: ゲージストップ
// =============================================
function GaugeStopPhase({
  type,
  onComplete,
}: {
  type: "sugar" | "temperature";
  onComplete: (score: number) => void;
}) {
  const [position, setPosition] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [result, setResult] = useState<{ score: number; rating: "perfect" | "great" | "ok" } | null>(null);
  const animRef = useRef<number>(0);
  const startRef = useRef(Date.now());

  const isSugar = type === "sugar";
  const speed = isSugar ? 1200 : 1000; // ms per full cycle

  useEffect(() => {
    if (stopped) return;
    startRef.current = Date.now();

    function animate() {
      const elapsed = Date.now() - startRef.current;
      // Sine wave: 0→100→0→100... smoothly
      const cycle = (elapsed % speed) / speed;
      const pos = 50 + 50 * Math.sin(cycle * Math.PI * 2);
      setPosition(pos);
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [stopped, speed]);

  function handleStop() {
    if (stopped) return;
    setStopped(true);
    cancelAnimationFrame(animRef.current);
    const res = gaugePositionToScore(position);
    setResult(res);
    setTimeout(() => onComplete(res.score), 1200);
  }

  const ratingText = result?.rating === "perfect" ? "ぴったり！✨" : result?.rating === "great" ? "おしい！" : "ドンマイ！";
  const ratingColor = result?.rating === "perfect" ? "text-green-500" : result?.rating === "great" ? "text-yellow-500" : "text-gray-400";

  if (isSugar) {
    // 横ゲージ
    return (
      <motion.div
        key="sugar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-3xl p-6 shadow-dreamy text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F5E6D0] via-[#D4A574] to-[#F5E6D0]" />

        <motion.p
          className="text-5xl mb-2"
          animate={stopped ? {} : { rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🍬
        </motion.p>
        <p className="font-bold text-[#8B6914] mb-1">砂糖を入れよう</p>
        <p className="text-xs text-gray-400 mb-5">緑のゾーンでストップ！</p>

        {/* ゲージバー */}
        <div className="relative h-12 bg-gray-100 rounded-full overflow-hidden mx-4 mb-4">
          {/* OKゾーン（全体） */}
          <div className="absolute inset-0 bg-gray-200 rounded-full" />
          {/* Greatゾーン */}
          <div className="absolute top-0 bottom-0 bg-yellow-200 rounded-full" style={{ left: "25%", width: "50%" }} />
          {/* Perfectゾーン */}
          <div className="absolute top-0 bottom-0 bg-green-300 rounded-full" style={{ left: "40%", width: "20%" }} />

          {/* カーソル */}
          <motion.div
            className="absolute top-1 bottom-1 w-3 bg-white rounded-full shadow-lg border-2 border-[#E8913A] z-10"
            style={{ left: `calc(${position}% - 6px)` }}
            animate={stopped && result?.rating === "perfect" ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3, repeat: 2 }}
          />
        </div>

        {/* ラベル */}
        <div className="flex justify-between text-[10px] text-gray-300 mx-4 mb-4">
          <span>ひかえめ</span>
          <span className="text-green-400 font-bold">ちょうどいい</span>
          <span>あまーい</span>
        </div>

        {/* 結果表示 or ストップボタン */}
        <AnimatePresence mode="wait">
          {!stopped ? (
            <motion.button
              key="btn"
              whileTap={{ scale: 0.88 }}
              onClick={handleStop}
              className="btn-cute btn-bake text-white font-bold py-4 px-12 text-lg"
            >
              ストップ！
            </motion.button>
          ) : (
            <motion.div
              key="result"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <p className={`text-2xl font-bold ${ratingColor}`}>{ratingText}</p>
              <p className="text-sm text-gray-400 mt-1">スコア: {Math.round(result!.score)}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // 温度ゲージ（縦方向）
  return (
    <motion.div
      key="temperature"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-3xl p-6 shadow-dreamy text-center relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#87CEEB] via-[#E8913A] to-[#FF6347]" />

      <motion.p
        className="text-5xl mb-2"
        animate={stopped ? {} : { scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        🌡️
      </motion.p>
      <p className="font-bold text-[#8B6914] mb-1">温度を合わせよう</p>
      <p className="text-xs text-gray-400 mb-4">適温ゾーンでストップ！</p>

      {/* 縦ゲージ */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="relative w-14 h-52 bg-gradient-to-t from-blue-100 via-green-100 to-red-100 rounded-full overflow-hidden border-2 border-gray-200">
          {/* Greatゾーン */}
          <div className="absolute left-0 right-0 bg-yellow-200/60" style={{ bottom: "25%", height: "50%" }} />
          {/* Perfectゾーン */}
          <div className="absolute left-0 right-0 bg-green-300/70" style={{ bottom: "40%", height: "20%" }} />

          {/* カーソル */}
          <motion.div
            className="absolute left-1 right-1 h-3 bg-white rounded-full shadow-lg border-2 border-[#E8913A] z-10"
            style={{ bottom: `calc(${position}% - 6px)` }}
            animate={stopped && result?.rating === "perfect" ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3, repeat: 2 }}
          />
        </div>

        {/* 温度ラベル */}
        <div className="flex flex-col justify-between h-52 text-[10px] text-gray-300">
          <span>40°C 🔥</span>
          <span className="text-green-400 font-bold">26°C 🌿</span>
          <span>15°C ❄️</span>
        </div>
      </div>

      {/* 結果表示 or ストップボタン */}
      <AnimatePresence mode="wait">
        {!stopped ? (
          <motion.button
            key="btn"
            whileTap={{ scale: 0.88 }}
            onClick={handleStop}
            className="btn-cute btn-bake text-white font-bold py-4 px-12 text-lg"
          >
            ストップ！
          </motion.button>
        ) : (
          <motion.div
            key="result"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <p className={`text-2xl font-bold ${ratingColor}`}>{ratingText}</p>
            <p className="text-sm text-gray-400 mt-1">スコア: {Math.round(result!.score)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================
// Phase 4: リザルト画面
// =============================================
function ResultPhase({
  scores,
  onStart,
}: {
  scores: { bubble: number; sugar: number; temperature: number };
  onStart: () => void;
}) {
  const avg = Math.round((scores.bubble + scores.sugar + scores.temperature) / 3);
  const quality = qualityFromScore(avg);
  const [showStars, setShowStars] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowStars(1), 600),
      setTimeout(() => setShowStars(quality >= 2 ? 2 : 1), 1000),
      setTimeout(() => setShowStars(quality >= 3 ? 3 : quality), 1400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [quality]);

  const qualityText = quality === 3 ? "最高傑作！" : quality === 2 ? "おいしい！" : "まずまず！";
  const qualityColor = quality === 3 ? "text-[#FFD700]" : quality === 2 ? "text-[#E8913A]" : "text-[#D4A574]";

  const scoreItems = [
    { label: "バブルキャッチ", score: scores.bubble, emoji: "🫧" },
    { label: "砂糖ゲージ", score: scores.sugar, emoji: "🍬" },
    { label: "温度ゲージ", score: scores.temperature, emoji: "🌡️" },
  ];

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl p-6 shadow-dreamy text-center relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F5C88A] via-[#E8913A] to-[#F5C88A]" />

      <p className="font-bold text-[#8B6914] text-lg mb-4">育成結果</p>

      {/* スコアバー */}
      <div className="space-y-3 mb-5">
        {scoreItems.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-lg w-8">{item.emoji}</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-bold text-[#D4A574]">{Math.round(item.score)}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: item.score >= 85 ? "linear-gradient(to right, #7CB342, #8BC34A)" :
                      item.score >= 50 ? "linear-gradient(to right, #F5C88A, #E8913A)" :
                        "linear-gradient(to right, #D4C5B0, #B8A990)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 0.8, delay: i * 0.2, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 星表示 */}
      <div className="flex justify-center gap-2 mb-2">
        {[1, 2, 3].map((star) => (
          <motion.span
            key={star}
            initial={{ scale: 0, rotate: -180 }}
            animate={
              showStars >= star
                ? { scale: 1, rotate: 0, opacity: 1 }
                : { scale: 0.5, rotate: 0, opacity: 0.2 }
            }
            transition={{ type: "spring", stiffness: 300, delay: star * 0.15 }}
            className="text-3xl"
          >
            {showStars >= star ? "⭐" : "☆"}
          </motion.span>
        ))}
      </div>

      <motion.p
        className={`text-xl font-bold ${qualityColor}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
      >
        {qualityText}
      </motion.p>

      {quality === 3 && (
        <motion.p
          className="text-xs text-[#FFD700] mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          ボーナス！パンくず2倍！
        </motion.p>
      )}

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="mt-5 btn-cute btn-bake text-white font-bold py-4 px-10 text-lg animate-pulse-glow"
      >
        <span className="flex items-center justify-center gap-2">
          <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity }}>
            🫧
          </motion.span>
          発酵開始！
        </span>
      </motion.button>
    </motion.div>
  );
}

// =============================================
// メインコンポーネント
// =============================================
export default function Nurture() {
  const { selectedYeastId, setStep, startFermentation, setNurtureScore, setNurtureQuality } = useGameStore();
  const yeast = YEASTS.find((y) => y.id === selectedYeastId);

  const [currentPhase, setCurrentPhase] = useState<Phase>("bubble");
  const [scores, setScores] = useState({ bubble: 0, sugar: 0, temperature: 0 });

  const handleBubbleComplete = useCallback((score: number) => {
    setScores((prev) => ({ ...prev, bubble: score }));
    setTimeout(() => setCurrentPhase("sugar"), 500);
  }, []);

  const handleSugarComplete = useCallback((score: number) => {
    setScores((prev) => ({ ...prev, sugar: score }));
    setTimeout(() => setCurrentPhase("temperature"), 500);
  }, []);

  const handleTempComplete = useCallback((score: number) => {
    setScores((prev) => ({ ...prev, temperature: score }));
    setTimeout(() => setCurrentPhase("result"), 500);
  }, []);

  function handleStartFermentation() {
    const avg = Math.round((scores.bubble + scores.sugar + scores.temperature) / 3);
    const quality = qualityFromScore(avg);
    setNurtureScore(avg);
    setNurtureQuality(quality);
    startFermentation(selectedYeastId!, quality >= 2);
    setStep("fermenting");
  }

  if (!yeast) return null;

  const phases: Phase[] = ["bubble", "sugar", "temperature", "result"];
  const phaseIndex = phases.indexOf(currentPhase);

  return (
    <div className="p-4 space-y-6">
      {/* ヘッダー：妖精 + フェーズインジケーター */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          className="inline-block"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <FairySVG yeastId={yeast.id} size={56} />
        </motion.div>
        <h2 className="text-lg font-bold text-[#8B6914] mt-2">{yeast.name}を育てよう</h2>

        {/* フェーズインジケーター */}
        <div className="flex justify-center gap-2 mt-3">
          {["🫧", "🍬", "🌡️", "⭐"].map((emoji, i) => (
            <div key={i} className="flex items-center gap-2">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  phaseIndex === i
                    ? "bg-gradient-to-r from-[#D4A574] to-[#E8913A] text-white shadow-md"
                    : phaseIndex > i
                    ? "bg-[#D4A574] text-white"
                    : "bg-[#F5F0EB] text-gray-300"
                }`}
                animate={phaseIndex === i ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {emoji}
              </motion.div>
              {i < 3 && (
                <div className={`w-6 h-0.5 ${phaseIndex > i ? "bg-[#D4A574]" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ミニゲームエリア */}
      <AnimatePresence mode="wait">
        {currentPhase === "bubble" && (
          <BubbleCatchPhase onComplete={handleBubbleComplete} />
        )}
        {currentPhase === "sugar" && (
          <GaugeStopPhase type="sugar" onComplete={handleSugarComplete} />
        )}
        {currentPhase === "temperature" && (
          <GaugeStopPhase type="temperature" onComplete={handleTempComplete} />
        )}
        {currentPhase === "result" && (
          <ResultPhase scores={scores} onStart={handleStartFermentation} />
        )}
      </AnimatePresence>
    </div>
  );
}
