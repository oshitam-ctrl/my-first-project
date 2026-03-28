"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAvailableYeasts, GACHA_RATES } from "./game-data";

export type GameStep =
  | "idle"
  | "select-material"
  | "nurture"
  | "fermenting"
  | "bake-reveal"
  | "topping"
  | "complete"
  | "gacha";

interface OwnedYeast {
  yeastId: string;
  duplicateCount: number;
}

interface OwnedBread {
  breadId: string;
  customToppings: string[];
  createdAt: string;
}

interface Fermentation {
  yeastId: string;
  startedAt: number;
  completedAt: number;
  temperatureBonus: boolean;
}

interface GameState {
  // ゲームステップ
  step: GameStep;
  setStep: (step: GameStep) => void;

  // 所持酵母
  ownedYeasts: OwnedYeast[];
  addYeast: (yeastId: string) => void;

  // 所持パン
  ownedBreads: OwnedBread[];
  addBread: (breadId: string, customToppings: string[]) => void;

  // 発酵中データ
  fermentation: Fermentation | null;
  startFermentation: (yeastId: string, temperatureBonus: boolean) => void;
  checkFermentation: () => boolean;

  // 現在選択中のデータ
  selectedYeastId: string | null;
  selectedBreadId: string | null;
  selectedToppings: string[];
  setSelectedYeast: (id: string) => void;
  setSelectedBread: (id: string) => void;
  setSelectedToppings: (toppings: string[]) => void;

  // ガチャ（パッケージガチャ）
  gachaPool: string[];
  initGachaPool: () => void;
  drawGacha: () => string | null;

  // ポイント
  totalPoints: number;
  addPoint: (amount: number) => void;

  // クーポン
  coupons: { type: string; redeemed: boolean; issuedAt: string }[];

  // チュートリアル
  tutorialCompleted: boolean;
  completeTutorial: () => void;

  // パンくず（ガチャ通貨）
  breadCrumbs: number;
  addBreadCrumb: () => void;
  useBreadCrumb: () => boolean;
}

const BASE_FERMENT_HOURS = 3;
const BONUS_REDUCTION = 0.5;

function buildGachaPool(): string[] {
  const pool: string[] = [];
  const available = getAvailableYeasts();
  for (const yeast of available) {
    const rate = GACHA_RATES[yeast.rarity];
    const count = Math.max(1, Math.round(rate / 5));
    for (let i = 0; i < count; i++) {
      pool.push(yeast.id);
    }
  }
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      step: "idle",
      setStep: (step) => set({ step }),

      ownedYeasts: [{ yeastId: "yeast-yuzu", duplicateCount: 0 }],
      addYeast: (yeastId) => {
        const current = get().ownedYeasts;
        const existing = current.find((y) => y.yeastId === yeastId);
        if (existing) {
          set({
            ownedYeasts: current.map((y) =>
              y.yeastId === yeastId ? { ...y, duplicateCount: y.duplicateCount + 1 } : y
            ),
          });
        } else {
          set({ ownedYeasts: [...current, { yeastId, duplicateCount: 0 }] });
        }
      },

      ownedBreads: [],
      addBread: (breadId, customToppings) => {
        set({
          ownedBreads: [
            ...get().ownedBreads,
            { breadId, customToppings, createdAt: new Date().toISOString() },
          ],
        });
      },

      fermentation: null,
      startFermentation: (yeastId, temperatureBonus) => {
        const hours = temperatureBonus ? BASE_FERMENT_HOURS - BONUS_REDUCTION : BASE_FERMENT_HOURS;
        const now = Date.now();
        set({
          fermentation: {
            yeastId,
            startedAt: now,
            completedAt: now + hours * 60 * 60 * 1000,
            temperatureBonus,
          },
        });
      },
      checkFermentation: () => {
        const f = get().fermentation;
        if (!f) return false;
        return Date.now() >= f.completedAt;
      },

      selectedYeastId: null,
      selectedBreadId: null,
      selectedToppings: [],
      setSelectedYeast: (id) => set({ selectedYeastId: id }),
      setSelectedBread: (id) => set({ selectedBreadId: id }),
      setSelectedToppings: (toppings) => set({ selectedToppings: toppings }),

      gachaPool: [],
      initGachaPool: () => {
        set({ gachaPool: buildGachaPool() });
      },
      drawGacha: () => {
        const pool = get().gachaPool;
        if (pool.length === 0) {
          // プールが空の場合は再生成
          const newPool = buildGachaPool();
          const drawn = newPool.pop()!;
          set({ gachaPool: newPool });
          get().addYeast(drawn);
          return drawn;
        }
        const newPool = [...pool];
        const drawn = newPool.pop()!;
        set({ gachaPool: newPool });
        get().addYeast(drawn);
        return drawn;
      },

      totalPoints: 1, // エンダウド・プログレス効果：初回1pt付与
      addPoint: (amount) => {
        const newTotal = get().totalPoints + amount;
        const coupons = [...get().coupons];
        // 5pt達成でクーポンA
        if (newTotal >= 5 && !coupons.some((c) => c.type === "A")) {
          coupons.push({ type: "A", redeemed: false, issuedAt: new Date().toISOString() });
        }
        // 10pt達成でクーポンB
        if (newTotal >= 10 && !coupons.some((c) => c.type === "B")) {
          coupons.push({ type: "B", redeemed: false, issuedAt: new Date().toISOString() });
        }
        set({ totalPoints: newTotal, coupons });
      },

      coupons: [],

      tutorialCompleted: false,
      completeTutorial: () => set({ tutorialCompleted: true }),

      breadCrumbs: 0,
      addBreadCrumb: () => set({ breadCrumbs: get().breadCrumbs + 1 }),
      useBreadCrumb: () => {
        if (get().breadCrumbs <= 0) return false;
        set({ breadCrumbs: get().breadCrumbs - 1 });
        return true;
      },
    }),
    {
      name: "petit-hermes-game",
    }
  )
);
