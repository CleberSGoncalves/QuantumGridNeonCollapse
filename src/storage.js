// src/storage.js - Versioned Persistence, Economy, 7-Day Rewards, Quests, Roulette & Meta-Shop

const STORAGE_KEY = 'QUANTUM_GRID_NEON_V1';

const DEFAULT_STATE = {
  version: 1,
  soundMuted: false,
  highScore: 0,
  coins: 200,
  matrixFragments: 0,
  selectedTheme: 'cyan',
  unlockedThemes: ['cyan'],
  powerups: {
    quantumSwap: 2,
    empBlast: 1,
    rowLaser: 1
  },
  // 15 Sectors progression: array of { stars: 0, score: 0, unlocked: false }
  sectors: Array.from({ length: 15 }, (_, i) => ({
    sector: i + 1,
    stars: 0,
    score: 0,
    unlocked: i === 0 // Sector 1 unlocked by default
  })),
  dailyLogin: {
    lastClaimTimestamp: 0,
    currentDay: 1 // 1 through 7
  },
  luckySpin: {
    lastFreeSpinTimestamp: 0
  },
  quests: {
    daily: [
      { id: 'd_lines', textEN: 'Clear 10 Lines in any mode', textPT: 'Elimine 10 Linhas em qualquer modo', target: 10, current: 0, reward: 150, claimed: false },
      { id: 'd_combo', textEN: 'Trigger 3 Multi-Collapses (Combos)', textPT: 'Ative 3 Multi-Colapsos (Combos)', target: 3, current: 0, reward: 200, claimed: false },
      { id: 'd_score', textEN: 'Reach 2,500 Score in a single round', textPT: 'Alcance 2.500 Pontos em uma partida', target: 2500, current: 0, reward: 250, claimed: false }
    ],
    weekly: [
      { id: 'w_sectors', textEN: 'Stabilize 5 Sectors with 3 Stars', textPT: 'Estabilize 5 Setores com 3 Estrelas', target: 5, current: 0, reward: 600, claimed: false },
      { id: 'w_lines', textEN: 'Clear 60 Total Lines', textPT: 'Elimine 60 Linhas no Total', target: 60, current: 0, reward: 800, claimed: false }
    ],
    lastResetDay: new Date().toDateString()
  }
};

export const DAILY_REWARDS = [
  { day: 1, coins: 150, powerup: null, label: '150 Moedas' },
  { day: 2, coins: 200, powerup: 'quantumSwap', label: '200 Moedas + 1 Swap' },
  { day: 3, coins: 300, powerup: 'empBlast', label: '300 Moedas + 1 EMP' },
  { day: 4, coins: 450, powerup: 'quantumSwap', label: '450 Moedas + 1 Swap' },
  { day: 5, coins: 600, powerup: 'empBlast', label: '600 Moedas + 1 EMP' },
  { day: 6, coins: 800, powerup: 'rowLaser', label: '800 Moedas + 1 Laser' },
  { day: 7, coins: 1500, powerup: 'theme_amber', label: '1500 Moedas + Tema Solar Amber!' }
];

export const THEMES = {
  cyan: {
    name: 'Cyber Cyan',
    price: 0,
    accent: '#00f5ff',
    glow: '#00f5ff',
    boardBg: '#090e1f',
    gridLine: 'rgba(0, 245, 255, 0.15)',
    palettes: ['#00f5ff', '#38bdf8', '#0284c7', '#06b6d4', '#67e8f9']
  },
  synthwave: {
    name: 'Synthwave Neon',
    price: 400,
    accent: '#f43f5e',
    glow: '#d946ef',
    boardBg: '#13091f',
    gridLine: 'rgba(217, 70, 239, 0.18)',
    palettes: ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6']
  },
  emerald: {
    name: 'Matrix Emerald',
    price: 600,
    accent: '#10b981',
    glow: '#34d399',
    boardBg: '#061711',
    gridLine: 'rgba(52, 211, 153, 0.18)',
    palettes: ['#10b981', '#34d399', '#059669', '#6ee7b7', '#a7f3d0']
  },
  amber: {
    name: 'Solar Amber',
    price: 800,
    accent: '#f59e0b',
    glow: '#fbbf24',
    boardBg: '#191106',
    gridLine: 'rgba(251, 191, 36, 0.20)',
    palettes: ['#f59e0b', '#fbbf24', '#f97316', '#ea580c', '#fde047']
  },
  platinum: {
    name: 'Quantum Platinum',
    price: 1200,
    accent: '#e2e8f0',
    glow: '#38bdf8',
    boardBg: '#0c111d',
    gridLine: 'rgba(226, 232, 240, 0.22)',
    palettes: ['#f8fafc', '#e2e8f0', '#94a3b8', '#64748b', '#38bdf8']
  }
};

class StorageManager {
  constructor() {
    this.data = this.load();
    this.checkDailyReset();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      const parsed = JSON.parse(raw);

      // Deep merge with defaults to prevent missing properties
      return {
        ...DEFAULT_STATE,
        ...parsed,
        powerups: { ...DEFAULT_STATE.powerups, ...(parsed.powerups || {}) },
        dailyLogin: { ...DEFAULT_STATE.dailyLogin, ...(parsed.dailyLogin || {}) },
        luckySpin: { ...DEFAULT_STATE.luckySpin, ...(parsed.luckySpin || {}) },
        sectors: DEFAULT_STATE.sectors.map((sec, idx) => {
          const pSec = parsed.sectors && parsed.sectors[idx];
          return pSec ? { ...sec, ...pSec } : sec;
        }),
        quests: {
          ...DEFAULT_STATE.quests,
          ...(parsed.quests || {}),
          daily: DEFAULT_STATE.quests.daily.map((q, idx) => {
            const pQ = parsed.quests && parsed.quests.daily && parsed.quests.daily[idx];
            return pQ ? { ...q, ...pQ } : q;
          }),
          weekly: DEFAULT_STATE.quests.weekly.map((q, idx) => {
            const pQ = parsed.quests && parsed.quests.weekly && parsed.quests.weekly[idx];
            return pQ ? { ...q, ...pQ } : q;
          })
        }
      };
    } catch (e) {
      console.warn('[Storage] Failed to read storage, initializing defaults:', e);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('[Storage] Error saving game state:', e);
    }
  }

  checkDailyReset() {
    const today = new Date().toDateString();
    if (this.data.quests.lastResetDay !== today) {
      this.data.quests.lastResetDay = today;
      // Reset daily quests
      this.data.quests.daily.forEach(q => {
        q.current = 0;
        q.claimed = false;
      });
      this.save();
    }
  }

  // --- Economy & High Score ---
  addCoins(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.data.coins += Math.floor(amount);
    this.save();
  }

  spendCoins(amount) {
    if (this.data.coins >= amount) {
      this.data.coins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  setHighScore(newScore) {
    if (newScore > this.data.highScore) {
      this.data.highScore = newScore;
      this.save();
      return true;
    }
    return false;
  }

  // --- Sector Progression ---
  completeSector(sectorNum, starsAchieved, score) {
    const idx = sectorNum - 1;
    if (idx < 0 || idx >= this.data.sectors.length) return;

    const sector = this.data.sectors[idx];
    sector.stars = Math.max(sector.stars, starsAchieved);
    sector.score = Math.max(sector.score, score);

    // Unlock next sector
    if (idx + 1 < this.data.sectors.length) {
      this.data.sectors[idx + 1].unlocked = true;
    }

    // Progress quests
    this.updateQuestProgress('w_sectors', starsAchieved === 3 ? 1 : 0);

    this.save();
  }

  getTotalStars() {
    return this.data.sectors.reduce((acc, s) => acc + s.stars, 0);
  }

  // --- Daily Login Reward ---
  canClaimDailyReward() {
    const now = Date.now();
    const lastClaim = this.data.dailyLogin.lastClaimTimestamp;
    const oneDayMs = 24 * 60 * 60 * 1000;
    return now - lastClaim >= oneDayMs;
  }

  claimDailyReward() {
    if (!this.canClaimDailyReward()) return null;

    let day = this.data.dailyLogin.currentDay;
    const now = Date.now();
    const twoDaysMs = 48 * 60 * 60 * 1000;

    // If more than 48 hours passed, streak resets to day 1
    if (this.data.dailyLogin.lastClaimTimestamp > 0 && now - this.data.dailyLogin.lastClaimTimestamp > twoDaysMs) {
      day = 1;
    }

    const reward = DAILY_REWARDS[day - 1];
    this.addCoins(reward.coins);

    if (reward.powerup) {
      if (reward.powerup.startsWith('theme_')) {
        const themeId = reward.powerup.replace('theme_', '');
        if (!this.data.unlockedThemes.includes(themeId)) {
          this.data.unlockedThemes.push(themeId);
        }
      } else if (this.data.powerups[reward.powerup] !== undefined) {
        this.data.powerups[reward.powerup]++;
      }
    }

    this.data.dailyLogin.lastClaimTimestamp = now;
    this.data.dailyLogin.currentDay = day >= 7 ? 1 : day + 1;
    this.save();

    return reward;
  }

  // --- Lucky Spin (Roleta da Sorte) ---
  canFreeSpin() {
    const now = Date.now();
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    return now - this.data.luckySpin.lastFreeSpinTimestamp >= twelveHoursMs;
  }

  recordFreeSpin() {
    this.data.luckySpin.lastFreeSpinTimestamp = Date.now();
    this.save();
  }

  applySpinReward(rewardItem) {
    if (!rewardItem) return;
    if (rewardItem.coins) {
      this.addCoins(rewardItem.coins);
    }
    if (rewardItem.powerup && this.data.powerups[rewardItem.powerup] !== undefined) {
      this.data.powerups[rewardItem.powerup]++;
    }
    this.save();
  }

  // --- Quests System ---
  updateQuestProgress(questId, amount = 1) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    let found = false;

    // Check daily
    for (const q of this.data.quests.daily) {
      if (q.id === questId && !q.claimed) {
        q.current = Math.min(q.target, q.current + amount);
        found = true;
      }
    }

    // Check weekly
    for (const q of this.data.quests.weekly) {
      if (q.id === questId && !q.claimed) {
        q.current = Math.min(q.target, q.current + amount);
        found = true;
      }
    }

    if (found) {
      this.save();
    }
  }

  claimQuest(questId, doubleWithAd = false) {
    const all = [...this.data.quests.daily, ...this.data.quests.weekly];
    const quest = all.find(q => q.id === questId);
    if (!quest || quest.claimed || quest.current < quest.target) return 0;

    let reward = quest.reward;
    if (doubleWithAd) reward *= 2;

    quest.claimed = true;
    this.addCoins(reward);
    this.save();
    return reward;
  }

  // --- Meta-Shop & Inventory ---
  buyTheme(themeId) {
    const theme = THEMES[themeId];
    if (!theme) return false;
    if (this.data.unlockedThemes.includes(themeId)) {
      this.data.selectedTheme = themeId;
      this.save();
      return true;
    }
    if (this.spendCoins(theme.price)) {
      this.data.unlockedThemes.push(themeId);
      this.data.selectedTheme = themeId;
      this.save();
      return true;
    }
    return false;
  }

  selectTheme(themeId) {
    if (this.data.unlockedThemes.includes(themeId)) {
      this.data.selectedTheme = themeId;
      this.save();
      return true;
    }
    return false;
  }

  buyPowerup(type, price = 150) {
    if (this.data.powerups[type] === undefined) return false;
    if (this.spendCoins(price)) {
      this.data.powerups[type]++;
      this.save();
      return true;
    }
    return false;
  }

  usePowerup(type) {
    if (this.data.powerups[type] && this.data.powerups[type] > 0) {
      this.data.powerups[type]--;
      this.save();
      return true;
    }
    return false;
  }
}

export const storage = new StorageManager();
