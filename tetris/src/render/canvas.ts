// Canvas レンダラ。
// レイアウト：縦持き前提、ボードは画面中央下、上部にスコア・ホールド・ネクストを配置。
// セルサイズは画面から逆算する。
// Phase 3 では静的描画のみ（アニメは Phase 6）。

import { CONFIG } from '../config';
import type { Game } from '../engine/game';
import { pieceCells } from '../engine/piece';
import type { PieceKind, Rotation } from '../engine/types';

interface Layout {
  cell: number;          // セル1辺のpx
  boardX: number;        // ボード左上x
  boardY: number;        // ボード左上y
  boardW: number;
  boardH: number;
  holdX: number; holdY: number; miniCell: number;
  nextX: number; nextY: number;
  scoreX: number; scoreY: number;
  w: number; h: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private layout!: Layout;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  getLayout(): Layout { return this.layout; }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.layout = this.computeLayout(w, h);
  }

  private computeLayout(w: number, h: number): Layout {
    // 上部 UI に 12% を割く想定。残り 88% でボードを収める。
    const topUiH = Math.max(90, Math.floor(h * 0.14));
    const padX = 12;
    const padBottom = 12;
    const availableW = w - padX * 2;
    const availableH = h - topUiH - padBottom;
    // 10 : 20 比。セルサイズは幅・高さの小さい方に合わせる
    let cell = Math.floor(Math.min(availableW / CONFIG.COLS, availableH / CONFIG.ROWS));
    // 偶数セルサイズにすると見やすい
    cell = Math.max(10, cell);
    const boardW = cell * CONFIG.COLS;
    const boardH = cell * CONFIG.ROWS;
    const boardX = Math.floor((w - boardW) / 2);
    const boardY = topUiH;

    // ホールドは左上、ネクストは右上
    const miniCell = Math.max(10, Math.floor(cell * 0.55));
    const holdX = padX;
    const holdY = 32;
    const nextX = w - padX - miniCell * 4;
    const nextY = 32;

    const scoreX = Math.floor(w / 2);
    const scoreY = 16;

    return { cell, boardX, boardY, boardW, boardH, holdX, holdY, miniCell, nextX, nextY, scoreX, scoreY, w, h };
  }

  drawFrame(game: Game) {
    const ctx = this.ctx;
    const L = this.layout;

    // 背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, L.w, L.h);

    this.drawTopUi(game);
    this.drawBoardFrame();
    this.drawStackedCells(game);
    this.drawGhost(game);
    this.drawActive(game);
  }

  // ---------- 上部 UI ----------
  private drawTopUi(game: Game) {
    const ctx = this.ctx;
    const L = this.layout;
    const s = game.getSnapshot();

    // スコア（中央）
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.font = '10px -apple-system, system-ui, sans-serif';
    ctx.fillText('SCORE', L.scoreX, L.scoreY);
    ctx.fillStyle = '#fff';
    ctx.font = '700 22px -apple-system, system-ui, sans-serif';
    ctx.fillText(String(s.score), L.scoreX, L.scoreY + 24);
    ctx.fillStyle = '#888';
    ctx.font = '10px -apple-system, system-ui, sans-serif';
    ctx.fillText(`LV ${s.level}   LINES ${s.lines}`, L.scoreX, L.scoreY + 42);

    // ホールド（左）
    ctx.textAlign = 'left';
    ctx.fillStyle = '#666';
    ctx.font = '10px -apple-system, system-ui, sans-serif';
    ctx.fillText('HOLD', L.holdX, L.holdY - 6);
    this.drawMiniPiece(s.hold, L.holdX, L.holdY, L.miniCell, s.holdUsed);

    // ネクスト（右、5個縦並べ）
    ctx.textAlign = 'right';
    ctx.fillStyle = '#666';
    ctx.font = '10px -apple-system, system-ui, sans-serif';
    ctx.fillText('NEXT', L.nextX + L.miniCell * 4, L.nextY - 6);
    for (let i = 0; i < 5; i++) {
      const kind = s.next[i];
      const yy = L.nextY + i * (L.miniCell * 2 + 4);
      this.drawMiniPiece(kind, L.nextX, yy, L.miniCell, false);
    }
  }

  private drawMiniPiece(kind: PieceKind | null, x: number, y: number, cell: number, dim: boolean) {
    const ctx = this.ctx;
    // 背景枠
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(x, y, cell * 4, cell * 2);
    if (!kind) return;
    const cells = pieceCells(kind, 0);
    // ピースが中央に見えるようオフセット
    const dxs = cells.map((c) => c[0]);
    const dys = cells.map((c) => c[1]);
    const minX = Math.min(...dxs);
    const maxX = Math.max(...dxs);
    const minY = Math.min(...dys);
    const maxY = Math.max(...dys);
    const pW = (maxX - minX + 1) * cell;
    const pH = (maxY - minY + 1) * cell;
    const ox = x + (cell * 4 - pW) / 2 - minX * cell;
    const oy = y + (cell * 2 - pH) / 2 - minY * cell;
    const color = CONFIG.COLORS[kind];
    for (const [cx, cy] of cells) {
      this.drawBlock(ox + cx * cell, oy + cy * cell, cell, color, dim ? 0.35 : 1);
    }
  }

  // ---------- ボード ----------
  private drawBoardFrame() {
    const ctx = this.ctx;
    const L = this.layout;
    // 背景パネル
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(L.boardX, L.boardY, L.boardW, L.boardH);

    // グリッド線
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < CONFIG.COLS; i++) {
      ctx.moveTo(L.boardX + i * L.cell + 0.5, L.boardY);
      ctx.lineTo(L.boardX + i * L.cell + 0.5, L.boardY + L.boardH);
    }
    for (let i = 1; i < CONFIG.ROWS; i++) {
      ctx.moveTo(L.boardX, L.boardY + i * L.cell + 0.5);
      ctx.lineTo(L.boardX + L.boardW, L.boardY + i * L.cell + 0.5);
    }
    ctx.stroke();

    // 外枠
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(L.boardX - 0.5, L.boardY - 0.5, L.boardW + 1, L.boardH + 1);
  }

  private drawStackedCells(game: Game) {
    const L = this.layout;
    const grid = game.boardGrid();
    const visibleStart = grid.length - CONFIG.ROWS;
    for (let y = 0; y < CONFIG.ROWS; y++) {
      for (let x = 0; x < CONFIG.COLS; x++) {
        const v = grid[visibleStart + y][x];
        if (!v) continue;
        const px = L.boardX + x * L.cell;
        const py = L.boardY + y * L.cell;
        this.drawBlock(px, py, L.cell, CONFIG.COLORS[v], 1);
      }
    }
  }

  private drawGhost(game: Game) {
    const L = this.layout;
    const s = game.getSnapshot();
    if (!s.active) return;
    const gy = game.ghostY();
    if (gy === null) return;
    const visibleStart = game.boardGrid().length - CONFIG.ROWS;
    const color = CONFIG.COLORS[s.active.kind];
    for (const [cx, cy] of pieceCells(s.active.kind, s.active.rot as Rotation)) {
      const gxAbs = s.active.x + cx;
      const gyAbs = gy + cy;
      const visY = gyAbs - visibleStart;
      if (visY < 0) continue;
      const px = L.boardX + gxAbs * L.cell;
      const py = L.boardY + visY * L.cell;
      this.drawBlock(px, py, L.cell, color, CONFIG.GHOST_ALPHA);
    }
  }

  private drawActive(game: Game) {
    const L = this.layout;
    const s = game.getSnapshot();
    if (!s.active) return;
    const visibleStart = game.boardGrid().length - CONFIG.ROWS;
    const color = CONFIG.COLORS[s.active.kind];
    for (const [cx, cy] of pieceCells(s.active.kind, s.active.rot as Rotation)) {
      const gx = s.active.x + cx;
      const gy = s.active.y + cy;
      const visY = gy - visibleStart;
      if (visY < 0) continue;
      const px = L.boardX + gx * L.cell;
      const py = L.boardY + visY * L.cell;
      this.drawBlock(px, py, L.cell, color, 1);
    }
  }

  // ---------- ブロック描画（現代的な見た目） ----------
  private drawBlock(x: number, y: number, size: number, color: string, alpha: number) {
    const ctx = this.ctx;
    const inset = Math.max(1, Math.floor(size * 0.06));
    const r = Math.max(2, Math.floor(size * 0.15));
    ctx.save();
    ctx.globalAlpha = alpha;

    // 本体（グラデーション）
    const grad = ctx.createLinearGradient(x, y, x, y + size);
    grad.addColorStop(0, this.shade(color, 0.18));
    grad.addColorStop(1, this.shade(color, -0.12));
    ctx.fillStyle = grad;
    this.roundRect(x + inset, y + inset, size - inset * 2, size - inset * 2, r);
    ctx.fill();

    // サブトルな発光ハイライト（上辺）
    ctx.fillStyle = this.shade(color, 0.45);
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillRect(x + inset + 2, y + inset + 2, size - inset * 2 - 4, Math.max(1, Math.floor(size * 0.08)));

    ctx.restore();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  // 色を明暗調整（amount: -1..1）
  private shade(hex: string, amount: number): string {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const mix = (v: number) => {
      if (amount >= 0) return Math.round(v + (255 - v) * amount);
      return Math.round(v + v * amount);
    };
    const toHex = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
    return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
  }
}
