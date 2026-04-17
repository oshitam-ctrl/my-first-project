// Canvas レンダラ。
// Fx と協調して、演出（フラッシュ・崩壊・重力落下・スクイーズ・パーティクル・シェイク）を描く。

import { CONFIG } from '../config';
import type { Game } from '../engine/game';
import { pieceCells } from '../engine/piece';
import type { PieceKind, Rotation } from '../engine/types';
import { Fx, easeOutQuad } from './fx';

interface Layout {
  cell: number;
  boardX: number;
  boardY: number;
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
  fx: Fx;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.fx = new Fx();
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
    const topUiH = Math.max(90, Math.floor(h * 0.14));
    const padX = 12;
    const padBottom = 12;
    const availableW = w - padX * 2;
    const availableH = h - topUiH - padBottom;
    let cell = Math.floor(Math.min(availableW / CONFIG.COLS, availableH / CONFIG.ROWS));
    cell = Math.max(10, cell);
    const boardW = cell * CONFIG.COLS;
    const boardH = cell * CONFIG.ROWS;
    const boardX = Math.floor((w - boardW) / 2);
    const boardY = topUiH;

    const miniCell = Math.max(10, Math.floor(cell * 0.55));
    const holdX = padX;
    const holdY = 32;
    const nextX = w - padX - miniCell * 4;
    const nextY = 32;

    const scoreX = Math.floor(w / 2);
    const scoreY = 16;

    return { cell, boardX, boardY, boardW, boardH, holdX, holdY, miniCell, nextX, nextY, scoreX, scoreY, w, h };
  }

  // ----- メイン描画 -----
  drawFrame(game: Game, dtMs: number) {
    // FX は描画前に進める
    this.fx.update(dtMs);

    const ctx = this.ctx;
    const L = this.layout;

    // コンボ背景彩度：ほんのり色被せ
    const boostAlpha = this.fx.comboBoost * 0.12;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, L.w, L.h);
    if (boostAlpha > 0) {
      ctx.fillStyle = `rgba(160, 80, 200, ${boostAlpha})`;
      ctx.fillRect(0, 0, L.w, L.h);
    }

    // スクリーンシェイク
    const [sx, sy] = this.fx.getShakeOffset();
    ctx.save();
    ctx.translate(sx, sy);

    this.drawTopUi(game);
    this.drawBoardFrame();
    this.drawBoardContent(game);
    this.drawGhost(game);
    this.drawActive(game);
    this.drawLineClearOverlay(game);
    this.drawParticles();

    // 白フラッシュ（画面全体）— Tetris 瞬間だけほんの少し入れる
    const ca = game.getClearAnim();
    if (ca && ca.sub === 'flash' && ca.rows.length === 4 && ca.subProgress < 0.3) {
      ctx.fillStyle = `rgba(255,255,255,${(1 - ca.subProgress / 0.3) * 0.15})`;
      ctx.fillRect(0, 0, L.w, L.h);
    }

    ctx.restore();
  }

  // ----- 上部 UI -----
  private drawTopUi(game: Game) {
    const ctx = this.ctx;
    const L = this.layout;
    const s = game.getSnapshot();

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

    ctx.textAlign = 'left';
    ctx.fillStyle = '#666';
    ctx.font = '10px -apple-system, system-ui, sans-serif';
    ctx.fillText('HOLD', L.holdX, L.holdY - 6);
    this.drawMiniPiece(s.hold, L.holdX, L.holdY, L.miniCell, s.holdUsed);

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
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(x, y, cell * 4, cell * 2);
    if (!kind) return;
    const cells = pieceCells(kind, 0);
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

  // ----- ボード枠 -----
  private drawBoardFrame() {
    const ctx = this.ctx;
    const L = this.layout;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(L.boardX, L.boardY, L.boardW, L.boardH);

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

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(L.boardX - 0.5, L.boardY - 0.5, L.boardW + 1, L.boardH + 1);
  }

  // ----- 固定セル（重力落下アニメ含む） -----
  private drawBoardContent(game: Game) {
    const L = this.layout;
    const grid = game.boardGrid();
    const visibleStart = grid.length - CONFIG.ROWS;
    const ca = game.getClearAnim();

    // 重力落下中の行シフト（pre→post マッピング）。
    // collapse 後、各新行 y_new = cleared.length + j（j: 非消去の順序）、旧 y_old はその j 番目の非消去 old index。
    // shiftPerRow[y_new] = y_new - y_old ≧ 0。表示 y = 実 y - shift * (1-ease) で上から降りてくる演出。
    const totalRows = grid.length;
    const shiftPerRow: number[] = new Array(totalRows).fill(0);
    let easedK = 0;
    if (ca && ca.sub === 'gravity') {
      const clearedSet = new Set(ca.rows);
      let j = 0;
      for (let yOld = 0; yOld < totalRows; yOld++) {
        if (clearedSet.has(yOld)) continue;
        const yNew = ca.rows.length + j;
        if (yNew < totalRows) shiftPerRow[yNew] = yNew - yOld;
        j++;
      }
      easedK = 1 - easeOutQuad(ca.subProgress);
    }

    for (let y = 0; y < CONFIG.ROWS; y++) {
      for (let x = 0; x < CONFIG.COLS; x++) {
        const absY = visibleStart + y;
        const v = grid[absY][x];
        if (!v) continue;
        let px = L.boardX + x * L.cell;
        let py = L.boardY + y * L.cell;
        // 重力中オフセット
        if (ca && ca.sub === 'gravity') {
          const shift = shiftPerRow[absY];
          py -= shift * L.cell * easedK;
        }
        // squash（ロック直後の瞬間、ピース最下セルだけ縦に潰す）
        const squashed = this.isCellSquashed(x, absY);
        if (squashed) {
          const sy = this.squashScaleY();
          this.drawBlock(px, py, L.cell, CONFIG.COLORS[v], 1, sy);
        } else {
          this.drawBlock(px, py, L.cell, CONFIG.COLORS[v], 1);
        }
      }
    }
  }

  private isCellSquashed(x: number, absY: number): boolean {
    const sq = this.fx.squash;
    if (!sq) return false;
    for (const [cx, cy] of sq.cells) {
      if (cx === x && cy === absY) return true;
    }
    return false;
  }
  private squashScaleY(): number {
    const sq = this.fx.squash;
    if (!sq) return 1;
    const t = sq.t / sq.duration;
    // 0→0.5 で 1→0.8、0.5→1 で 0.8→1
    return t < 0.5
      ? 1 - 0.2 * (t / 0.5)
      : 0.8 + 0.2 * ((t - 0.5) / 0.5);
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

  // ----- ライン消去オーバーレイ -----
  // flash 段階：cleared rows がフラッシュ＋左右から吸い込まれる描画を行う。
  // gravity 段階ではここは何もしない（drawBoardContent が上ブロックの落下を表現）。
  private drawLineClearOverlay(game: Game) {
    const ca = game.getClearAnim();
    if (!ca || ca.sub !== 'flash') return;
    const L = this.layout;
    const ctx = this.ctx;
    const visibleStart = game.boardGrid().length - CONFIG.ROWS;
    const flashMs = CONFIG.LINE_FLASH_MS;
    const collapseMs = CONFIG.LINE_COLLAPSE_MS;
    const subTotal = flashMs + collapseMs;
    const elapsed = subTotal - (ca.subProgress <= 0 ? subTotal : subTotal * (1 - ca.subProgress));
    // simpler: subProgress 0→1 over subTotal
    const p = ca.subProgress;
    const flashRatio = flashMs / subTotal; // 0..flashRatio はフラッシュ段階
    void elapsed;

    for (let i = 0; i < ca.rows.length; i++) {
      const absY = ca.rows[i];
      const visY = absY - visibleStart;
      if (visY < 0 || visY >= CONFIG.ROWS) continue;
      const rowColors = ca.colors[i];
      const py = L.boardY + visY * L.cell;
      if (p < flashRatio) {
        // フラッシュ段階：白塗り
        const a = 1 - p / flashRatio;
        ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * a})`;
        ctx.fillRect(L.boardX, py, L.boardW, L.cell);
      } else {
        // 崩壊段階：左右から内側に吸い込む（中央 5 列が残って 0 列に）
        const q = (p - flashRatio) / (1 - flashRatio);
        const collapseK = easeOutQuad(q);
        const visibleCols = Math.max(0, CONFIG.COLS * (1 - collapseK));
        const leftEdge = (CONFIG.COLS - visibleCols) / 2;
        for (let x = 0; x < CONFIG.COLS; x++) {
          const c = rowColors[x];
          if (!c) continue;
          // 中央からの距離で可視性を決める
          const distFromCenter = Math.abs(x - (CONFIG.COLS - 1) / 2);
          const maxDist = (CONFIG.COLS - 1) / 2;
          if (distFromCenter >= maxDist * (1 - collapseK)) continue;
          const px = L.boardX + x * L.cell;
          this.drawBlock(px, py, L.cell, CONFIG.COLORS[c], 1);
        }
        void leftEdge;

        // パーティクル発生（1フレームあたり少量）
        if (q < 1) {
          for (let x = 0; x < CONFIG.COLS; x++) {
            if (Math.random() < 0.1) {
              const c = rowColors[x];
              if (!c) continue;
              this.fx.spawnParticlesAtPixel(
                L.boardX + x * L.cell + L.cell / 2,
                py + L.cell / 2,
                CONFIG.COLORS[c],
                2,
              );
            }
          }
        }
      }
    }
  }

  // ----- パーティクル -----
  private drawParticles() {
    const ctx = this.ctx;
    for (const p of this.fx.particles) {
      const a = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // ----- ブロック描画 -----
  private drawBlock(x: number, y: number, size: number, color: string, alpha: number, scaleY = 1) {
    const ctx = this.ctx;
    const inset = Math.max(1, Math.floor(size * 0.06));
    const r = Math.max(2, Math.floor(size * 0.15));
    ctx.save();
    ctx.globalAlpha = alpha;
    if (scaleY !== 1) {
      // 下辺基準のスクイーズ
      ctx.translate(x + size / 2, y + size);
      ctx.scale(1, scaleY);
      ctx.translate(-(x + size / 2), -(y + size));
    }

    const grad = ctx.createLinearGradient(x, y, x, y + size);
    grad.addColorStop(0, this.shade(color, 0.18));
    grad.addColorStop(1, this.shade(color, -0.12));
    ctx.fillStyle = grad;
    this.roundRect(x + inset, y + inset, size - inset * 2, size - inset * 2, r);
    ctx.fill();

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
