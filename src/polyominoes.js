// src/polyominoes.js - Cyber Polyomino Shapes, Colors & Generation

export const SHAPES_DEF = [
  // 1-Block
  { id: 'dot', shape: [[1]], weight: 6, color: '#00f5ff' },

  // 2-Blocks (Dominoes)
  { id: 'i2_h', shape: [[1, 1]], weight: 7, color: '#38bdf8' },
  { id: 'i2_v', shape: [[1], [1]], weight: 7, color: '#38bdf8' },

  // 3-Blocks (Trominoes)
  { id: 'i3_h', shape: [[1, 1, 1]], weight: 8, color: '#06b6d4' },
  { id: 'i3_v', shape: [[1], [1], [1]], weight: 8, color: '#06b6d4' },
  { id: 'c3_tl', shape: [[1, 1], [1, 0]], weight: 8, color: '#ec4899' },
  { id: 'c3_tr', shape: [[1, 1], [0, 1]], weight: 8, color: '#ec4899' },
  { id: 'c3_bl', shape: [[1, 0], [1, 1]], weight: 8, color: '#ec4899' },
  { id: 'c3_br', shape: [[0, 1], [1, 1]], weight: 8, color: '#ec4899' },

  // 4-Blocks (Tetrominoes)
  { id: 'o4', shape: [[1, 1], [1, 1]], weight: 8, color: '#f59e0b' },
  { id: 'i4_h', shape: [[1, 1, 1, 1]], weight: 6, color: '#10b981' },
  { id: 'i4_v', shape: [[1], [1], [1], [1]], weight: 6, color: '#10b981' },

  // L / J 4-blocks
  { id: 'l4_1', shape: [[1, 0], [1, 0], [1, 1]], weight: 7, color: '#8b5cf6' },
  { id: 'l4_2', shape: [[0, 1], [0, 1], [1, 1]], weight: 7, color: '#8b5cf6' },
  { id: 'l4_3', shape: [[1, 1, 1], [1, 0, 0]], weight: 7, color: '#8b5cf6' },
  { id: 'l4_4', shape: [[1, 1, 1], [0, 0, 1]], weight: 7, color: '#8b5cf6' },

  // T 4-blocks
  { id: 't4_1', shape: [[1, 1, 1], [0, 1, 0]], weight: 6, color: '#d946ef' },
  { id: 't4_2', shape: [[0, 1, 0], [1, 1, 1]], weight: 6, color: '#d946ef' },
  { id: 't4_3', shape: [[1, 0], [1, 1], [1, 0]], weight: 6, color: '#d946ef' },
  { id: 't4_4', shape: [[0, 1], [1, 1], [0, 1]], weight: 6, color: '#d946ef' },

  // S / Z 4-blocks
  { id: 's4_h', shape: [[0, 1, 1], [1, 1, 0]], weight: 5, color: '#ef4444' },
  { id: 'z4_h', shape: [[1, 1, 0], [0, 1, 1]], weight: 5, color: '#ef4444' },

  // 5-Blocks (Pentaminoes)
  { id: 'i5_h', shape: [[1, 1, 1, 1, 1]], weight: 4, color: '#3b82f6' },
  { id: 'i5_v', shape: [[1], [1], [1], [1], [1]], weight: 4, color: '#3b82f6' },
  { id: 'plus5', shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], weight: 4, color: '#f97316' },
  { id: 'l5_corner', shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], weight: 4, color: '#f43f5e' },
  { id: 'l5_corner_r', shape: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], weight: 4, color: '#f43f5e' },

  // Big 3x3 square (rare, high reward)
  { id: 'sq9', shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], weight: 2, color: '#eab308' }
];

export function createPieceInstance(def, colorOverride = null) {
  const shape = def.shape;
  const rows = shape.length;
  const cols = shape[0].length;
  let blockCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shape[r][c]) blockCount++;
    }
  }

  return {
    id: def.id + '_' + Math.random().toString(36).substring(2, 7),
    defId: def.id,
    shape: shape,
    rows: rows,
    cols: cols,
    blockCount: blockCount,
    color: colorOverride || def.color,
    points: blockCount * 10
  };
}

export function generateRandomTrayPieces(count = 3, colorPalette = null) {
  const totalWeight = SHAPES_DEF.reduce((acc, d) => acc + d.weight, 0);
  const pieces = [];

  for (let i = 0; i < count; i++) {
    let rand = Math.random() * totalWeight;
    let selectedDef = SHAPES_DEF[0];

    for (const def of SHAPES_DEF) {
      rand -= def.weight;
      if (rand <= 0) {
        selectedDef = def;
        break;
      }
    }

    const color = (colorPalette && colorPalette.length > 0)
      ? colorPalette[Math.floor(Math.random() * colorPalette.length)]
      : selectedDef.color;

    pieces.push(createPieceInstance(selectedDef, color));
  }

  return pieces;
}

// Check if a piece shape can fit ANYWHERE on the 8x8 grid
export function canPieceFitOnGrid(grid, shape) {
  const pRows = shape.length;
  const pCols = shape[0].length;

  for (let r = 0; r <= 8 - pRows; r++) {
    for (let c = 0; c <= 8 - pCols; c++) {
      let canFitHere = true;
      for (let pr = 0; pr < pRows; pr++) {
        for (let pc = 0; pc < pCols; pc++) {
          if (shape[pr][pc] === 1 && grid[r + pr][c + pc] !== null) {
            canFitHere = false;
            break;
          }
        }
        if (!canFitHere) break;
      }
      if (canFitHere) return true;
    }
  }
  return false;
}
