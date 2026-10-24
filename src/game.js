// src/game.js - Core 8x8 Quantum Grid Logic, Polyomino Mechanics, Combos, and State Machine
import { sound } from './audio.js';
import { storage, THEMES } from './storage.js';
import { SECTORS } from './levels.js';
import { generateRandomTrayPieces, canPieceFitOnGrid } from './polyominoes.js';
import { CameraShaker, HitStopManager, ParticleSystem, FloatingTextManager } from './juice.js';

export class QuantumGridGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Juice singletons
    this.camera = new CameraShaker();
    this.hitStop = new HitStopManager();
    this.particles = new ParticleSystem();
    this.floatingTexts = new FloatingTextManager();

    // Game Mode & Anti-Softlock State
    this.mode = 'sectors'; // 'sectors' | 'endless'
    this.currentSector = SECTORS[0];
    this.isPaused = false;
    this.isRoundOver = false;
    this.isAdPaused = false;
    this.is1StarApproved = false;
    this.hasRevived = false;

    // Grid 8x8
    this.gridSize = 8;
    this.grid = this.createEmptyGrid();

    // Stats
    this.score = 0;
    this.highScore = storage.data.highScore || 0;
    this.combo = 0;
    this.totalLines = 0;
    this.coresStabilized = 0;
    this.starsEarned = 0;

    // Tray of 3 pieces
    this.trayPieces = [null, null, null];

    // Drag state
    this.draggedPiece = null;
    this.draggedIndex = -1;
    this.dragPos = { x: 0, y: 0 };
    this.touchOffset = 65; // Lift piece above touch point for clear mobile visibility
    this.isTouchDevice = false;
    this.hoverCoord = null;
    this.isValidHover = false;

    // Layout metrics (computed dynamically on resize)
    this.layout = {
      boardX: 0,
      boardY: 0,
      boardSize: 320,
      cellSize: 40,
      trayX: 0,
      trayY: 0,
      trayWidth: 320,
      trayHeight: 110,
      slotWidth: 100
    };

    // Callbacks
    this.onStateChange = null;
    this.onVictory = null;
    this.onGameOver = null;
    this.on1StarApproved = null;
  }

  createEmptyGrid() {
    const g = [];
    for (let r = 0; r < 8; r++) {
      g[r] = [];
      for (let c = 0; c < 8; c++) {
        g[r][c] = null;
      }
    }
    return g;
  }

  loadSector(sectorId = 1) {
    // Inconditional state reset (Anti-Softlock Rule)
    this.isRoundOver = false;
    this.isPaused = false;
    this.isAdPaused = false;
    this.is1StarApproved = false;
    this.hasRevived = false;
    this.mode = 'sectors';
    sound.setAdMuted(false);

    const sec = SECTORS.find(s => s.id === sectorId) || SECTORS[0];
    this.currentSector = sec;
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.combo = 0;
    this.totalLines = 0;
    this.coresStabilized = 0;
    this.starsEarned = 0;
    this.draggedPiece = null;
    this.draggedIndex = -1;

    // Populate pre-placed blocks / quantum cores
    if (sec.preplaced && sec.preplaced.length > 0) {
      for (const p of sec.preplaced) {
        if (p.r >= 0 && p.r < 8 && p.c >= 0 && p.c < 8) {
          this.grid[p.r][p.c] = {
            color: p.color,
            isCore: !!p.isCore,
            glow: p.isCore ? '#f59e0b' : p.color,
            id: 'pre_' + p.r + '_' + p.c
          };
        }
      }
    }

    const theme = THEMES[storage.data.selectedTheme] || THEMES.cyan;
    this.trayPieces = generateRandomTrayPieces(3, theme.palettes);

    if (this.onStateChange) this.onStateChange();
  }

  loadEndless() {
    // Inconditional state reset
    this.isRoundOver = false;
    this.isPaused = false;
    this.isAdPaused = false;
    this.is1StarApproved = false;
    this.hasRevived = false;
    this.mode = 'endless';
    sound.setAdMuted(false);

    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.combo = 0;
    this.totalLines = 0;
    this.coresStabilized = 0;
    this.starsEarned = 0;
    this.draggedPiece = null;
    this.draggedIndex = -1;

    const theme = THEMES[storage.data.selectedTheme] || THEMES.cyan;
    this.trayPieces = generateRandomTrayPieces(3, theme.palettes);

    if (this.onStateChange) this.onStateChange();
  }

  restart() {
    if (this.mode === 'sectors') {
      this.loadSector(this.currentSector.id);
    } else {
      this.loadEndless();
    }
  }

  // --- Drag & Drop Flow ---
  startDrag(slotIndex, clientX, clientY, isTouch = false) {
    if (this.isPaused || this.isRoundOver || this.isAdPaused) return false;
    if (slotIndex < 0 || slotIndex >= 3 || !this.trayPieces[slotIndex]) return false;

    this.isTouchDevice = isTouch;
    this.draggedIndex = slotIndex;
    this.draggedPiece = this.trayPieces[slotIndex];
    this.updateDrag(clientX, clientY);

    sound.playPiecePickup();
    return true;
  }

  updateDrag(clientX, clientY) {
    if (!this.draggedPiece) return;

    // Mobile touch offset: lift piece by touchOffset px above finger so it is completely visible
    const offsetY = this.isTouchDevice ? this.touchOffset : 0;
    this.dragPos = {
      x: clientX,
      y: clientY - offsetY
    };

    // Calculate grid hovering coordinates
    this.hoverCoord = this.screenToGridCoord(this.dragPos.x, this.dragPos.y, this.draggedPiece);
    if (this.hoverCoord) {
      this.isValidHover = this.canPlacePieceAt(this.draggedPiece, this.hoverCoord.r, this.hoverCoord.c);
    } else {
      this.isValidHover = false;
    }
  }

  endDrag() {
    if (!this.draggedPiece) return;

    if (this.hoverCoord && this.isValidHover) {
      this.placePiece(this.draggedPiece, this.hoverCoord.r, this.hoverCoord.c, this.draggedIndex);
    } else {
      sound.playInvalid();
    }

    this.draggedPiece = null;
    this.draggedIndex = -1;
    this.hoverCoord = null;
    this.isValidHover = false;

    if (this.onStateChange) this.onStateChange();
  }

  // Coordinate mapping from Screen (Pixels) to 8x8 Grid
  screenToGridCoord(screenX, screenY, piece) {
    const { boardX, boardY, cellSize } = this.layout;
    if (!cellSize || cellSize <= 0) return null;

    // Center piece on touch cursor
    const pW = piece.cols * cellSize;
    const pH = piece.rows * cellSize;
    const pieceOriginX = screenX - pW / 2;
    const pieceOriginY = screenY - pH / 2;

    const col = Math.round((pieceOriginX - boardX) / cellSize);
    const row = Math.round((pieceOriginY - boardY) / cellSize);

    if (row >= 0 && row + piece.rows <= 8 && col >= 0 && col + piece.cols <= 8) {
      return { r: row, c: col };
    }
    return null;
  }

  canPlacePieceAt(piece, row, col) {
    if (row < 0 || row + piece.rows > 8 || col < 0 || col + piece.cols > 8) {
      return false;
    }
    for (let pr = 0; pr < piece.rows; pr++) {
      for (let pc = 0; pc < piece.cols; pc++) {
        if (piece.shape[pr][pc] === 1) {
          if (this.grid[row + pr][col + pc] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // Place piece into 8x8 grid and resolve collapses
  placePiece(piece, row, col, slotIndex) {
    // 1. Commit piece blocks
    for (let pr = 0; pr < piece.rows; pr++) {
      for (let pc = 0; pc < piece.cols; pc++) {
        if (piece.shape[pr][pc] === 1) {
          this.grid[row + pr][col + pc] = {
            color: piece.color,
            isCore: false,
            glow: piece.color,
            id: 'b_' + (row + pr) + '_' + (col + pc)
          };
        }
      }
    }

    // Clear tray slot
    this.trayPieces[slotIndex] = null;
    sound.playPieceDrop();
    this.camera.addTrauma(0.12);

    // Placement score
    const placePts = piece.blockCount * 10;
    this.score += placePts;
    storage.updateQuestProgress('d_score', placePts);

    const cellPixelX = this.layout.boardX + (col + piece.cols / 2) * this.layout.cellSize;
    const cellPixelY = this.layout.boardY + (row + piece.rows / 2) * this.layout.cellSize;
    this.floatingTexts.spawn(`+${placePts}`, cellPixelX, cellPixelY, '#38bdf8', 16);

    // 2. Check full rows & columns
    const fullRows = [];
    for (let r = 0; r < 8; r++) {
      let isFull = true;
      for (let c = 0; c < 8; c++) {
        if (this.grid[r][c] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullRows.push(r);
    }

    const fullCols = [];
    for (let c = 0; c < 8; c++) {
      let isFull = true;
      for (let r = 0; r < 8; r++) {
        if (this.grid[r][c] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullCols.push(c);
    }

    const totalLinesCleared = fullRows.length + fullCols.length;

    // 3. Resolve Collapses
    if (totalLinesCleared > 0) {
      this.combo++;
      this.totalLines += totalLinesCleared;

      // Collect all cells to explode
      const cellsToExplode = new Set();
      for (const r of fullRows) {
        for (let c = 0; c < 8; c++) cellsToExplode.add(`${r},${c}`);
      }
      for (const c of fullCols) {
        for (let r = 0; r < 8; r++) cellsToExplode.add(`${r},${c}`);
      }

      let coresClearedThisTurn = 0;

      // Explode cells
      for (const coordStr of cellsToExplode) {
        const [r, c] = coordStr.split(',').map(Number);
        const cell = this.grid[r][c];
        if (cell) {
          if (cell.isCore) {
            coresClearedThisTurn++;
          }
          const px = this.layout.boardX + (c + 0.5) * this.layout.cellSize;
          const py = this.layout.boardY + (r + 0.5) * this.layout.cellSize;
          this.particles.spawnBurst(px, py, 12, cell.color, 240);
          this.grid[r][c] = null;
        }
      }

      this.coresStabilized += coresClearedThisTurn;

      // Calculate collapse score
      // Base: 100 pts per line with combo scaling
      const collapsePts = Math.floor(
        totalLinesCleared * 120 * (1 + (totalLinesCleared - 1) * 0.5) * Math.max(1, this.combo)
      );
      this.score += collapsePts;

      // Audio & Juice
      sound.playLineClear(totalLinesCleared, this.combo);
      this.camera.addTrauma(0.25 + 0.12 * totalLinesCleared);
      this.hitStop.trigger(45 + totalLinesCleared * 15);

      // Popup text
      const midX = this.layout.boardX + this.layout.boardSize / 2;
      const midY = this.layout.boardY + this.layout.boardSize / 2;
      if (this.combo > 1) {
        this.floatingTexts.spawn(`COMBO x${this.combo}!`, midX, midY - 25, '#f59e0b', 24, true);
      }
      this.floatingTexts.spawn(`+${collapsePts}`, midX, midY + 15, '#00f5ff', 20);

      // Quests
      storage.updateQuestProgress('d_lines', totalLinesCleared);
      storage.updateQuestProgress('w_lines', totalLinesCleared);
      if (this.combo >= 2) {
        storage.updateQuestProgress('d_combo', 1);
      }
    } else {
      this.combo = 0;
    }

    // 4. Update High Score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      storage.setHighScore(this.score);
    }

    // 5. Evaluate Objectives & Stars (In Sector Mode)
    if (this.mode === 'sectors') {
      this.evaluateSectorObjectives();
    }

    // 6. Refresh tray if all 3 pieces used
    if (this.trayPieces.every(p => p === null)) {
      const theme = THEMES[storage.data.selectedTheme] || THEMES.cyan;
      this.trayPieces = generateRandomTrayPieces(3, theme.palettes);
    }

    // 7. Check Game Over (Can any remaining piece fit on the grid?)
    this.checkGameOverCondition();
  }

  evaluateSectorObjectives() {
    const sec = this.currentSector;
    let currentVal = 0;

    if (sec.type === 'score') {
      currentVal = this.score;
    } else if (sec.type === 'lines') {
      currentVal = this.totalLines;
    } else if (sec.type === 'cores') {
      currentVal = this.coresStabilized;
    }

    // Star 1
    if (currentVal >= sec.star1 && this.starsEarned < 1) {
      this.starsEarned = 1;
      this.is1StarApproved = true;
      sound.playStarUnlocked();
      this.floatingTexts.spawn('★ 1 ESTRELA DESBLOQUEADA!', this.layout.boardX + this.layout.boardSize / 2, this.layout.boardY - 20, '#facc15', 20, true);
      if (this.on1StarApproved) this.on1StarApproved();
    }

    // Star 2
    if (currentVal >= sec.star2 && this.starsEarned < 2) {
      this.starsEarned = 2;
      sound.playStarUnlocked();
      this.floatingTexts.spawn('★★ 2 ESTRELAS!', this.layout.boardX + this.layout.boardSize / 2, this.layout.boardY - 20, '#facc15', 22, true);
    }

    // Star 3 (Automatic Maximum Victory)
    if (currentVal >= sec.star3 && this.starsEarned < 3) {
      this.starsEarned = 3;
      sound.playVictory();
      this.completeSectorWithVictory();
    }
  }

  completeSectorWithVictory() {
    if (this.isRoundOver) return;
    this.isRoundOver = true;
    const finalStars = Math.max(1, this.starsEarned);
    storage.completeSector(this.currentSector.id, finalStars, this.score);
    storage.addCoins(this.currentSector.coinsReward);

    if (this.onVictory) {
      this.onVictory(this.currentSector, finalStars, this.score, this.currentSector.coinsReward);
    }
  }

  checkGameOverCondition() {
    if (this.isRoundOver) return;

    const remainingPieces = this.trayPieces.filter(p => p !== null);
    if (remainingPieces.length === 0) return;

    let anyCanFit = false;
    for (const piece of remainingPieces) {
      if (canPieceFitOnGrid(this.grid, piece.shape)) {
        anyCanFit = true;
        break;
      }
    }

    if (!anyCanFit) {
      // Grid has collapsed!
      this.isRoundOver = true;
      sound.playGameOver();
      this.camera.addTrauma(0.5);

      if (this.onGameOver) {
        this.onGameOver(this.score, this.highScore, this.hasRevived);
      }
    }
  }

  // --- Rewarded Ad Revive / EMP Stabilization ---
  reviveWithQuantumEMP() {
    this.isRoundOver = false;
    this.isPaused = false;
    this.hasRevived = true;

    // Clear 3x3 region in center or clear 10 random blocks
    let clearedCount = 0;
    for (let r = 2; r <= 5; r++) {
      for (let c = 2; c <= 5; c++) {
        if (this.grid[r][c] !== null) {
          const px = this.layout.boardX + (c + 0.5) * this.layout.cellSize;
          const py = this.layout.boardY + (r + 0.5) * this.layout.cellSize;
          this.particles.spawnBurst(px, py, 16, '#00f5ff', 260);
          this.grid[r][c] = null;
          clearedCount++;
        }
      }
    }

    // Reroll tray pieces to ensure they fit
    const theme = THEMES[storage.data.selectedTheme] || THEMES.cyan;
    this.trayPieces = generateRandomTrayPieces(3, theme.palettes);

    sound.playPowerUp();
    this.camera.addTrauma(0.3);
    this.floatingTexts.spawn('⚡ NÚCLEO ESTABILIZADO!', this.layout.boardX + this.layout.boardSize / 2, this.layout.boardY + this.layout.boardSize / 2, '#00f5ff', 22, true);

    if (this.onStateChange) this.onStateChange();
  }

  // --- Power-ups (Quantum Swap, EMP Blast, Row Laser) ---
  useQuantumSwap() {
    if (!storage.usePowerup('quantumSwap')) return false;
    const theme = THEMES[storage.data.selectedTheme] || THEMES.cyan;
    this.trayPieces = generateRandomTrayPieces(3, theme.palettes);
    sound.playPowerUp();
    this.floatingTexts.spawn('🔄 PEÇAS RECONFIGURADAS!', this.layout.boardX + this.layout.boardSize / 2, this.layout.trayY, '#38bdf8', 18);
    if (this.onStateChange) this.onStateChange();
    return true;
  }

  useEmpBlast() {
    if (!storage.usePowerup('empBlast')) return false;

    // Clear center 4x4
    for (let r = 2; r <= 5; r++) {
      for (let c = 2; c <= 5; c++) {
        if (this.grid[r][c] !== null) {
          const px = this.layout.boardX + (c + 0.5) * this.layout.cellSize;
          const py = this.layout.boardY + (r + 0.5) * this.layout.cellSize;
          this.particles.spawnBurst(px, py, 14, '#f59e0b', 240);
          this.grid[r][c] = null;
        }
      }
    }

    sound.playPowerUp();
    this.camera.addTrauma(0.35);
    this.floatingTexts.spawn('💥 PULSO EMP ATIVADO!', this.layout.boardX + this.layout.boardSize / 2, this.layout.boardY + this.layout.boardSize / 2, '#f59e0b', 22, true);
    if (this.onStateChange) this.onStateChange();
    return true;
  }

  useRowLaser() {
    if (!storage.usePowerup('rowLaser')) return false;

    // Find row with most blocks
    let bestRow = -1;
    let maxBlocks = -1;
    for (let r = 0; r < 8; r++) {
      let count = 0;
      for (let c = 0; c < 8; c++) {
        if (this.grid[r][c] !== null) count++;
      }
      if (count > maxBlocks) {
        maxBlocks = count;
        bestRow = r;
      }
    }

    if (bestRow !== -1) {
      for (let c = 0; c < 8; c++) {
        if (this.grid[bestRow][c] !== null) {
          const px = this.layout.boardX + (c + 0.5) * this.layout.cellSize;
          const py = this.layout.boardY + (bestRow + 0.5) * this.layout.cellSize;
          this.particles.spawnBurst(px, py, 14, '#10b981', 220);
          this.grid[bestRow][c] = null;
        }
      }
    }

    sound.playPowerUp();
    this.camera.addTrauma(0.25);
    this.floatingTexts.spawn('⚡ LASER DE LINHA DISPARADO!', this.layout.boardX + this.layout.boardSize / 2, this.layout.boardY + this.layout.boardSize / 2, '#10b981', 20, true);
    if (this.onStateChange) this.onStateChange();
    return true;
  }

  update(dt) {
    if (this.isPaused || this.isAdPaused) return;

    // Check hit stop
    if (this.hitStop.update(dt)) {
      return; // Frame frozen for tactile impact
    }

    this.camera.update(dt);
    this.particles.update(dt);
    this.floatingTexts.update(dt);
  }
}
