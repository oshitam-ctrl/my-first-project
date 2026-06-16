// SRS（Super Rotation System）の公式キックテーブル。
// 回転に伴って試す平行移動候補のリスト。
// y は画面座標系（下向き正）なので、公式テーブルの y を反転させて格納している。

import { PieceKind, Rotation } from './types';

export type Kick = readonly [number, number];

// JLSTZ 用キック。キー = "from>to"。
const JLSTZ_KICKS: Record<string, Kick[]> = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

// I 専用キック
const I_KICKS: Record<string, Kick[]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

export function getKicks(kind: PieceKind, from: Rotation, to: Rotation): Kick[] {
  if (kind === 'O') return [[0, 0]];
  const key = `${from}>${to}`;
  const table = kind === 'I' ? I_KICKS : JLSTZ_KICKS;
  return table[key] ?? [[0, 0]];
}

export function rotateCW(r: Rotation): Rotation {
  return ((r + 1) & 3) as Rotation;
}

export function rotateCCW(r: Rotation): Rotation {
  return ((r + 3) & 3) as Rotation;
}
