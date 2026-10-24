// src/renderer.js - Edge-to-Edge Canvas Renderer, FluidCleb Intro, Neon Grid & Ghost Snapping
import { THEMES, storage } from './storage.js';

export class QuantumRenderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;

    // Intro state
    this.isIntroActive = true;
    this.introStartTime = performance.now();
    this.introDuration = 2800; // 2.8 seconds
    this.introOrbs = [];
    this.initIntroOrbs();

    // Dpr and sizing
    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;

    // Ambient circuit pulse time
    this.animTime = 0;
  }

  initIntroOrbs() {
    this.introOrbs = [];
    for (let i = 0; i < 28; i++) {
      this.introOrbs.push({
        x: (Math.random() - 0.5) * 300,
        y: 150 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 40,
        vy: -80 - Math.random() * 120,
        size: 2.5 + Math.random() * 4,
        color: ['#00f5ff', '#38bdf8', '#0284c7', '#67e8f9'][Math.floor(Math.random() * 4)],
        alpha: 0.3 + Math.random() * 0.7
      });
    }
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance

    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    // Recalculate Game Layout adhering to Mobile Anti-Overlapping Law
    const isPortrait = h >= w * 1.05;

    let hudH, trayH, availH, boardSize, cellSize, boardX, boardY, trayX, trayY, trayWidth, slotWidth;

    if (isPortrait) {
      hudH = 65; // Safe top HUD height
      trayH = 125; // Safe bottom piece tray dock height
      availH = Math.max(180, h - hudH - trayH);

      boardSize = Math.min(w * 0.94, availH * 0.94);
      cellSize = Math.floor(boardSize / 8);
      boardSize = cellSize * 8; // strict 8x8 multiple

      boardX = Math.floor((w - boardSize) / 2);
      boardY = Math.floor(hudH + (availH - boardSize) / 2);

      trayWidth = boardSize;
      trayX = boardX;
      trayY = Math.floor(h - trayH + 5);
      slotWidth = Math.floor(trayWidth / 3);
    } else {
      // Landscape / Desktop
      hudH = 60;
      const bottomMargin = 20;
      availH = h - hudH - bottomMargin;

      // In landscape, we place the board slightly higher or side-by-side
      const maxBoardH = availH * 0.72;
      boardSize = Math.min(w * 0.55, maxBoardH);
      cellSize = Math.floor(boardSize / 8);
      boardSize = cellSize * 8;

      boardX = Math.floor((w - boardSize) / 2);
      boardY = Math.floor(hudH + 10);

      trayH = 110;
      trayWidth = Math.min(boardSize * 1.15, w * 0.8);
      trayX = Math.floor((w - trayWidth) / 2);
      trayY = Math.floor(boardY + boardSize + 15);
      slotWidth = Math.floor(trayWidth / 3);
    }

    this.game.layout = {
      boardX,
      boardY,
      boardSize,
      cellSize,
      trayX,
      trayY,
      trayWidth,
      trayHeight: trayH,
      slotWidth
    };
  }

  render(timestamp) {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // Clear background
    const theme = THEMES[storage.data.selectedTheme] || THEMES.cyan;
    ctx.fillStyle = theme.boardBg;
    ctx.fillRect(0, 0, this.width, this.height);

    const now = performance.now();
    const elapsed = now - this.introStartTime;

    // 1. FluidCleb Interactive Splash (0.0s to 2.8s)
    if (this.isIntroActive) {
      if (elapsed < this.introDuration) {
        this.renderFluidClebSplash(elapsed);
        ctx.restore();
        return;
      } else {
        this.isIntroActive = false;
        if (this.onIntroComplete) this.onIntroComplete();
      }
    }

    this.animTime += 0.016;

    // 2. Camera Trauma Shake
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    this.game.camera.apply(ctx, centerX, centerY);

    // 3. Ambient Grid Background & Circuit Traces
    this.renderCyberGrid(theme);

    // 4. Render Placement Ghost (Preview when dragging)
    this.renderPlacementGhost();

    // 5. Render Occupied 8x8 Blocks
    this.renderGridBlocks(theme);

    // 6. Render Tray & Pieces Dock
    this.renderTray(theme);

    // 7. Render Particles & Floating Texts
    this.game.particles.render(ctx);
    this.game.floatingTexts.render(ctx);

    // 8. Render Dragged Piece (drawn last so it floats above everything)
    this.renderDraggedPiece();

    ctx.restore();
  }

  // --- Intro FluidCleb Interactive Splash Screen ---
  renderFluidClebSplash(elapsed) {
    const ctx = this.ctx;
    const progress = Math.min(1.0, elapsed / this.introDuration);
    const cx = this.width / 2;
    const cy = this.height / 2;

    // Ambient radial glow
    const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 320);
    grad.addColorStop(0, 'rgba(0, 245, 255, 0.16)');
    grad.addColorStop(0.5, 'rgba(2, 132, 199, 0.08)');
    grad.addColorStop(1, 'rgba(5, 8, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Animate rising cosmic orbs
    ctx.save();
    for (const orb of this.introOrbs) {
      orb.y += orb.vy * 0.016;
      orb.x += orb.vx * 0.016;

      // Attract toward center in mid phase (1.2s to 2.0s)
      if (progress > 0.35 && progress < 0.75) {
        orb.x += (0 - orb.x) * 0.06;
        orb.y += (0 - orb.y) * 0.06;
      }

      const orbAlpha = orb.alpha * (progress < 0.85 ? 1 : (1 - progress) / 0.15);
      ctx.globalAlpha = Math.max(0, orbAlpha);
      ctx.fillStyle = orb.color;
      ctx.shadowColor = orb.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx + orb.x, cy + orb.y, orb.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Metallic Water Drop Emblem (appearing around 1.4s)
    if (progress > 0.25) {
      const dropAlpha = Math.min(1.0, (progress - 0.25) / 0.3);
      ctx.save();
      ctx.globalAlpha = dropAlpha;
      ctx.translate(cx, cy - 36);

      // Outer glow circle
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 24;

      // Water droplet shape
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.bezierCurveTo(22, -10, 28, 12, 18, 26);
      ctx.bezierCurveTo(8, 38, -8, 38, -18, 26);
      ctx.bezierCurveTo(-28, 12, -22, -10, 0, -32);
      ctx.closePath();

      // Droplet gradient
      const dropGrad = ctx.createLinearGradient(0, -30, 0, 36);
      dropGrad.addColorStop(0, '#94a3b8');
      dropGrad.addColorStop(0.4, '#38bdf8');
      dropGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = dropGrad;
      ctx.fill();

      // Specular highlight
      ctx.beginPath();
      ctx.ellipse(-6, 2, 4, 12, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fill();
      ctx.restore();
    }

    // Logo Text "FLUIDCLEB" and "INTERACTIVE"
    if (progress > 0.4) {
      const textAlpha = Math.min(1.0, (progress - 0.4) / 0.3);
      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Neon Cyan FLUIDCLEB
      ctx.font = "900 36px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = '#00f5ff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 18;
      ctx.fillText('FLUIDCLEB', cx, cy + 34);

      // Subtitle INTERACTIVE
      ctx.font = "700 12px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = '#94a3b8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.letterSpacing = '6px';
      ctx.fillText('I N T E R A C T I V E', cx, cy + 62);
      ctx.restore();
    }

    // Progress bar at bottom
    ctx.save();
    const barW = Math.min(240, this.width * 0.6);
    const barH = 4;
    const barX = (this.width - barW) / 2;
    const barY = cy + 96;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(barX, barY, barW * progress, barH);
    ctx.restore();
  }

  // --- Cyber 8x8 Grid & Background ---
  renderCyberGrid(theme) {
    const ctx = this.ctx;
    const { boardX, boardY, boardSize, cellSize } = this.game.layout;

    // Board container outer frame
    ctx.save();
    ctx.fillStyle = 'rgba(5, 10, 24, 0.75)';
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 2;

    this.roundRect(ctx, boardX - 6, boardY - 6, boardSize + 12, boardSize + 12, 12);
    ctx.fill();
    ctx.stroke();

    // 8x8 Grid Cells
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x = boardX + c * cellSize;
        const y = boardY + r * cellSize;

        // Subtle checkerboard & circuit lines
        const isAlt = (r + c) % 2 === 0;
        ctx.fillStyle = isAlt ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

        ctx.strokeStyle = theme.gridLine;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, 4);
        ctx.stroke();

        // High-tech corner dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(x + 3, y + 3, 2, 2);
      }
    }
    ctx.restore();
  }

  // --- Render Ghost Silhouette (Where piece will land) ---
  renderPlacementGhost() {
    if (!this.game.draggedPiece || !this.game.hoverCoord) return;
    const ctx = this.ctx;
    const { boardX, boardY, cellSize } = this.game.layout;
    const { r, c } = this.game.hoverCoord;
    const piece = this.game.draggedPiece;
    const isValid = this.game.isValidHover;

    ctx.save();
    ctx.globalAlpha = isValid ? 0.45 : 0.25;
    ctx.fillStyle = isValid ? piece.color : '#ef4444';
    ctx.shadowColor = isValid ? piece.color : '#ef4444';
    ctx.shadowBlur = 12;

    for (let pr = 0; pr < piece.rows; pr++) {
      for (let pc = 0; pc < piece.cols; pc++) {
        if (piece.shape[pr][pc] === 1) {
          const gx = boardX + (c + pc) * cellSize;
          const gy = boardY + (r + pr) * cellSize;
          this.roundRect(ctx, gx + 2, gy + 2, cellSize - 4, cellSize - 4, 6);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  // --- Render Placed 8x8 Blocks ---
  renderGridBlocks(theme) {
    const ctx = this.ctx;
    const { boardX, boardY, cellSize } = this.game.layout;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = this.game.grid[r][c];
        if (!cell) continue;

        const x = boardX + c * cellSize + 2;
        const y = boardY + r * cellSize + 2;
        const size = cellSize - 4;

        this.drawBlock(ctx, x, y, size, cell.color, cell.isCore);
      }
    }
  }

  // Draw single beveled neon block
  drawBlock(ctx, x, y, size, color, isCore = false) {
    ctx.save();
    // Block base
    ctx.fillStyle = color;
    ctx.shadowColor = isCore ? '#f59e0b' : color;
    ctx.shadowBlur = isCore ? 14 : 8;

    this.roundRect(ctx, x, y, size, size, 6);
    ctx.fill();

    // Specular inner bevel
    const bevelGrad = ctx.createLinearGradient(x, y, x, y + size);
    bevelGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    bevelGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
    bevelGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = bevelGrad;
    this.roundRect(ctx, x + 2, y + 2, size - 4, size - 4, 4);
    ctx.fill();

    // Inner high-tech core accent
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + size * 0.28, y + size * 0.28, size * 0.44, size * 0.44);

    // If Quantum Core: draw glowing energy ring & diamond icon
    if (isCore) {
      const pulse = 0.8 + 0.2 * Math.sin(this.animTime * 6);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12 * pulse;
      ctx.beginPath();
      const mid = x + size / 2;
      const midY = y + size / 2;
      const r = size * 0.22 * pulse;
      ctx.moveTo(mid, midY - r);
      ctx.lineTo(mid + r, midY);
      ctx.lineTo(mid, midY + r);
      ctx.lineTo(mid - r, midY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Render Tray & 3 Dock Slots ---
  renderTray(theme) {
    const ctx = this.ctx;
    const { trayX, trayY, trayWidth, trayHeight, slotWidth } = this.game.layout;

    // Tray dock background container
    ctx.save();
    ctx.fillStyle = 'rgba(7, 12, 28, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, trayX, trayY, trayWidth, trayHeight, 14);
    ctx.fill();
    ctx.stroke();

    // Render each of the 3 slots
    for (let i = 0; i < 3; i++) {
      const slotX = trayX + i * slotWidth;
      const slotY = trayY;
      const piece = this.game.trayPieces[i];

      // Draw slot placeholder circle/glow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      this.roundRect(ctx, slotX + 6, slotY + 6, slotWidth - 12, trayHeight - 12, 10);
      ctx.fill();

      // If slot is being dragged, draw faded placeholder
      if (this.game.draggedIndex === i) {
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.3)';
        ctx.setLineDash([4, 4]);
        this.roundRect(ctx, slotX + 8, slotY + 8, slotWidth - 16, trayHeight - 16, 8);
        ctx.stroke();
        ctx.setLineDash([]);
        continue;
      }

      // Draw piece scaled to fit nicely in slot
      if (piece) {
        this.drawPieceInSlot(ctx, piece, slotX, slotY, slotWidth, trayHeight);
      }
    }
    ctx.restore();
  }

  drawPieceInSlot(ctx, piece, slotX, slotY, slotW, slotH) {
    const maxDimension = Math.max(piece.rows, piece.cols, 2.5);
    const miniCellSize = Math.floor(Math.min(slotW * 0.75, slotH * 0.75) / maxDimension);

    const pieceW = piece.cols * miniCellSize;
    const pieceH = piece.rows * miniCellSize;
    const startX = slotX + Math.floor((slotW - pieceW) / 2);
    const startY = slotY + Math.floor((slotH - pieceH) / 2);

    for (let r = 0; r < piece.rows; r++) {
      for (let c = 0; c < piece.cols; c++) {
        if (piece.shape[r][c] === 1) {
          const x = startX + c * miniCellSize;
          const y = startY + r * miniCellSize;
          this.drawBlock(ctx, x, y, miniCellSize - 2, piece.color, false);
        }
      }
    }
  }

  // --- Render Dragged Piece Floating Under/Above Finger ---
  renderDraggedPiece() {
    if (!this.game.draggedPiece) return;
    const ctx = this.ctx;
    const piece = this.game.draggedPiece;
    const { cellSize } = this.game.layout;
    const { x, y } = this.game.dragPos;

    const pieceW = piece.cols * cellSize;
    const pieceH = piece.rows * cellSize;
    const startX = x - pieceW / 2;
    const startY = y - pieceH / 2;

    ctx.save();
    // High shadow for floating feel
    ctx.shadowColor = piece.color;
    ctx.shadowBlur = 18;

    for (let r = 0; r < piece.rows; r++) {
      for (let c = 0; c < piece.cols; c++) {
        if (piece.shape[r][c] === 1) {
          const bx = startX + c * cellSize + 2;
          const by = startY + r * cellSize + 2;
          this.drawBlock(ctx, bx, by, cellSize - 4, piece.color, false);
        }
      }
    }
    ctx.restore();
  }

  // Helper for rounded rectangles
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
