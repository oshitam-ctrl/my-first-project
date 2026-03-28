"use client";

import { useGameStore } from "@/lib/game-state";
import { YEASTS } from "@/lib/game-data";

export default function GameIdle() {
  const { setStep, fermentation, checkFermentation, ownedYeasts, ownedBreads, breadCrumbs } = useGameStore();
  const hasFermentation = fermentation !== null;
  const isReady = hasFermentation && checkFermentation();

  return (
    <div className="p-4 space-y-4">
      {/* ステータスカード */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-[#8B6914] mb-3">酵母のパン工房</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-[#FFF8F0] rounded-xl p-3">
            <p className="text-2xl font-bold text-[#D4A574]">{ownedYeasts.length}</p>
            <p className="text-xs text-gray-500">酵母</p>
          </div>
          <div className="bg-[#FFF8F0] rounded-xl p-3">
            <p className="text-2xl font-bold text-[#D4A574]">{ownedBreads.length}</p>
            <p className="text-xs text-gray-500">パン</p>
          </div>
          <div className="bg-[#FFF8F0] rounded-xl p-3">
            <p className="text-2xl font-bold text-[#D4A574]">{breadCrumbs}</p>
            <p className="text-xs text-gray-500">パンくず</p>
          </div>
        </div>
      </div>

      {/* 発酵中の表示 */}
      {hasFermentation && !isReady && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-center">
            <p className="text-4xl mb-2">🫧</p>
            <p className="font-bold text-[#8B6914]">発酵中...</p>
            <p className="text-sm text-gray-500 mt-1">
              もうしばらくお待ちください
            </p>
            <FermentationTimer completedAt={fermentation!.completedAt} />
          </div>
        </div>
      )}

      {/* 焼き上がり通知 */}
      {isReady && (
        <button
          onClick={() => setStep("bake-reveal")}
          className="w-full bg-gradient-to-r from-[#E8913A] to-[#D4A574] text-white font-bold py-5 px-6 rounded-2xl shadow-lg animate-pulse text-lg"
        >
          🍞 パンが焼き上がりました！タップして確認
        </button>
      )}

      {/* パンを焼くボタン */}
      {!hasFermentation && (
        <button
          onClick={() => setStep("select-material")}
          className="w-full bg-[#D4A574] hover:bg-[#C09060] text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-95 text-lg"
        >
          🌾 パンを焼く
        </button>
      )}

      {/* ガチャボタン */}
      {breadCrumbs > 0 && (
        <button
          onClick={() => setStep("gacha")}
          className="w-full bg-[#7CB342] hover:bg-[#6A9A38] text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-95"
        >
          🌱 ガチャを回す（パンくず: {breadCrumbs}）
        </button>
      )}

      {/* 図鑑リンク */}
      <button
        onClick={() => {
          // collection ページへのナビゲーション（タブ内で表示）
          window.location.href = "/collection";
        }}
        className="w-full bg-white text-[#8B6914] font-bold py-4 px-6 rounded-2xl shadow-sm border border-[#E8C9A0] transition-all active:scale-95"
      >
        📖 パン図鑑を見る
      </button>

      {/* 所持酵母一覧 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-[#8B6914] mb-3">仲間の妖精たち</h3>
        <div className="space-y-2">
          {ownedYeasts.map((oy) => {
            const yeast = YEASTS.find((y) => y.id === oy.yeastId);
            if (!yeast) return null;
            return (
              <div key={oy.yeastId} className="flex items-center justify-between bg-[#FFF8F0] rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{yeast.emoji}</span>
                  <div>
                    <p className="font-medium text-sm">{yeast.name}</p>
                    <p className="text-xs text-gray-400">{"★".repeat(yeast.rarity)}</p>
                  </div>
                </div>
                {oy.duplicateCount > 0 && (
                  <span className="text-xs bg-[#D4A574] text-white px-2 py-0.5 rounded-full">
                    x{oy.duplicateCount + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FermentationTimer({ completedAt }: { completedAt: number }) {
  const remaining = Math.max(0, completedAt - Date.now());
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  // 簡易タイマー（リアルタイム更新はuseEffectで追加可能）
  return (
    <p className="text-lg font-mono text-[#D4A574] mt-2">
      あと {hours}時間 {minutes}分
    </p>
  );
}
