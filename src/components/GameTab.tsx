"use client";

import { useGameStore } from "@/lib/game-state";
import MaterialSelect from "./game/MaterialSelect";
import Nurture from "./game/Nurture";
import Fermenting from "./game/Fermenting";
import BakeReveal from "./game/BakeReveal";
import ToppingSelect from "./game/ToppingSelect";
import Complete from "./game/Complete";
import Gacha from "./game/Gacha";
import GameIdle from "./game/GameIdle";

export default function GameTab() {
  const step = useGameStore((s) => s.step);

  switch (step) {
    case "select-material":
      return <MaterialSelect />;
    case "nurture":
      return <Nurture />;
    case "fermenting":
      return <Fermenting />;
    case "bake-reveal":
      return <BakeReveal />;
    case "topping":
      return <ToppingSelect />;
    case "complete":
      return <Complete />;
    case "gacha":
      return <Gacha />;
    default:
      return <GameIdle />;
  }
}
