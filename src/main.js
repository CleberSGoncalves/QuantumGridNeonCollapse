// src/main.js - Application Bootstrapper, Modal Controller, Input Handlers & Localization
import { sound } from './audio.js';
import { crazygames } from './crazygames.js';
import { storage, THEMES, DAILY_REWARDS } from './storage.js';
import { SECTORS } from './levels.js';
import { QuantumGridGame } from './game.js';
import { QuantumRenderer } from './renderer.js';

// Safe DOM Helper
export function safeSetText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(val);
}

export function safeSetHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// Modal State Controller (Prevents Softlocks & "Trava e Não Volta")
class ModalController {
  constructor(game) {
    this.game = game;
    this.modalStack = [];
    this.previousModalBeforeAux = null;
  }

  open(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;

    // Track previous modal if game was over
    if (this.game.isRoundOver && (modalId === 'modal-sectors' || modalId === 'modal-shop' || modalId === 'modal-quests')) {
      if (this.modalStack.length > 0) {
        this.previousModalBeforeAux = this.modalStack[this.modalStack.length - 1];
      }
    }

    this.closeAll();
    el.classList.remove('hidden');
    this.modalStack.push(modalId);
    this.game.isPaused = true;
    crazygames.gameplayStop();
  }

  close(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('hidden');
    this.modalStack = this.modalStack.filter(m => m !== modalId);

    // ANTI-SOFTLOCK RULE: If round is over and user closes an auxiliary modal via 'X',
    // restore the victory or defeat modal so the player never gets stuck with a frozen grid!
    if (this.game.isRoundOver) {
      if (this.previousModalBeforeAux) {
        const prev = this.previousModalBeforeAux;
        this.previousModalBeforeAux = null;
        this.open(prev);
        return;
      } else {
        // Fallback: reopen sectors modal
        this.open('modal-sectors');
        return;
      }
    }

    if (this.modalStack.length === 0) {
      this.game.isPaused = false;
      crazygames.gameplayStart();
    }
  }

  closeAll() {
    const modals = document.querySelectorAll('.game-modal');
    modals.forEach(m => m.classList.add('hidden'));
    this.modalStack = [];
  }
}

// Localization (Default English with PT-BR detection)
const userLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
export let isPT = userLang.startsWith('pt');

export function t(en, pt) {
  return isPT ? pt : en;
}

window.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('game-container');
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  // Initialize CrazyGames SDK
  await crazygames.init();

  // Instantiate Game and Renderer
  const game = new QuantumGridGame(canvas);
  const renderer = new QuantumRenderer(canvas, game);
  const modalController = new ModalController(game);

  // Resize handling with devicePixelRatio
  const handleResize = () => {
    const w = container ? container.clientWidth : window.innerWidth;
    const h = container ? container.clientHeight : window.innerHeight;
    renderer.resize(w, h);
  };
  window.addEventListener('resize', handleResize);
  handleResize();

  // Intro completion handler (transitions to dynamic Lore presentation)
  renderer.onIntroComplete = () => {
    sound.playButtonClick();
    modalController.open('modal-lore');
  };

  // Start sound on first gesture
  const startAudioOnGesture = () => {
    sound.ensureContext();
    window.removeEventListener('pointerdown', startAudioOnGesture);
    window.removeEventListener('keydown', startAudioOnGesture);
  };
  window.addEventListener('pointerdown', startAudioOnGesture);
  window.addEventListener('keydown', startAudioOnGesture);

  // Trigger FluidCleb sound during splash
  setTimeout(() => {
    sound.playFluidClebIntro();
  }, 100);

  // --- HUD Updates ---
  const updateHUD = () => {
    safeSetText('hud-score-val', game.score);
    safeSetText('hud-high-val', game.highScore);
    safeSetText('hud-coins-val', storage.data.coins);

    // Powerup badges
    safeSetText('btn-power-swap-count', storage.data.powerups.quantumSwap || 0);
    safeSetText('btn-power-emp-count', storage.data.powerups.empBlast || 0);
    safeSetText('btn-power-laser-count', storage.data.powerups.rowLaser || 0);

    // Sector Title & 3-Star Bar
    if (game.mode === 'sectors') {
      const sec = game.currentSector;
      safeSetText('hud-level-title', isPT ? `SETOR ${sec.id}` : `SECTOR ${sec.id}`);

      // Calculate progress percentage and star highlights
      let curVal = 0;
      if (sec.type === 'score') curVal = game.score;
      else if (sec.type === 'lines') curVal = game.totalLines;
      else if (sec.type === 'cores') curVal = game.coresStabilized;

      const p1 = Math.min(100, Math.floor((curVal / sec.star1) * 100));
      const p3 = Math.min(100, Math.floor((curVal / sec.star3) * 100));

      const barFill = document.getElementById('hud-progress-fill');
      if (barFill) barFill.style.width = `${p3}%`;

      const star1El = document.getElementById('star-mark-1');
      const star2El = document.getElementById('star-mark-2');
      const star3El = document.getElementById('star-mark-3');

      if (star1El) star1El.classList.toggle('active', curVal >= sec.star1);
      if (star2El) star2El.classList.toggle('active', curVal >= sec.star2);
      if (star3El) star3El.classList.toggle('active', curVal >= sec.star3);

      // Objective hint in HUD
      safeSetText('hud-target-hint', isPT ? sec.descriptionPT : sec.descriptionEN);

      // Show/Hide "Concluir Fase (★)" Button
      const btnApprove = document.getElementById('btn-approve-level');
      if (btnApprove) {
        if (game.is1StarApproved && !game.isRoundOver) {
          btnApprove.classList.remove('hidden');
        } else {
          btnApprove.classList.add('hidden');
        }
      }
    } else {
      safeSetText('hud-level-title', isPT ? 'MATRIX INFINITA' : 'ENDLESS MATRIX');
      safeSetText('hud-target-hint', isPT ? 'Colapse linhas e quebre seu recorde!' : 'Collapse lines and beat your record!');
      const barFill = document.getElementById('hud-progress-fill');
      if (barFill) barFill.style.width = '100%';
      const btnApprove = document.getElementById('btn-approve-level');
      if (btnApprove) btnApprove.classList.add('hidden');
    }
  };

  game.onStateChange = updateHUD;

  // --- Game Event Callbacks ---
  game.on1StarApproved = () => {
    updateHUD();
  };

  game.onVictory = (sector, stars, score, coins) => {
    updateHUD();
    safeSetText('victory-sector-name', isPT ? sector.namePT : sector.nameEN);
    safeSetText('victory-score', score);
    safeSetText('victory-coins', `+${coins}`);

    // Render stars on victory modal
    const starsContainer = document.getElementById('victory-stars-display');
    if (starsContainer) {
      let html = '';
      for (let i = 1; i <= 3; i++) {
        html += `<span class="star-icon ${i <= stars ? 'active' : ''}">★</span>`;
      }
      starsContainer.innerHTML = html;
    }

    modalController.open('modal-victory');
    // Request midgame ad on victory if throttled interval passed
    crazygames.requestMidgameAd();
  };

  game.onGameOver = (score, high, hasRevived) => {
    updateHUD();
    safeSetText('over-score', score);
    safeSetText('over-high', high);

    // Rewarded Ad Revive button visibility
    const btnRevive = document.getElementById('btn-revive-ad');
    if (btnRevive) {
      btnRevive.classList.toggle('hidden', hasRevived);
    }

    modalController.open('modal-game-over');
    // Request midgame ad on game over screen if interval passed
    crazygames.requestMidgameAd();
  };

  // --- Input Handling: Drag & Drop (Touch & Mouse) ---
  let isDragging = false;

  const getCanvasPos = (evt) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.clientX || (evt.touches && evt.touches[0] ? evt.touches[0].clientX : 0);
    const clientY = evt.clientY || (evt.touches && evt.touches[0] ? evt.touches[0].clientY : 0);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      isTouch: !!evt.touches
    };
  };

  const onPointerDown = (evt) => {
    if (game.isPaused || game.isRoundOver || game.isAdPaused) return;
    const { x, y, isTouch } = getCanvasPos(evt);

    // Check if clicked inside tray
    const { trayX, trayY, trayWidth, trayHeight, slotWidth } = game.layout;
    if (x >= trayX && x <= trayX + trayWidth && y >= trayY && y <= trayY + trayHeight) {
      const slot = Math.floor((x - trayX) / slotWidth);
      if (slot >= 0 && slot < 3 && game.trayPieces[slot]) {
        evt.preventDefault();
        isDragging = true;
        game.startDrag(slot, x, y, isTouch);
      }
    }
  };

  const onPointerMove = (evt) => {
    if (!isDragging) return;
    evt.preventDefault();
    const { x, y } = getCanvasPos(evt);
    game.updateDrag(x, y);
  };

  const onPointerUp = (evt) => {
    if (!isDragging) return;
    evt.preventDefault();
    isDragging = false;
    game.endDrag();
  };

  // Touch and pointer event listeners
  canvas.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp, { passive: false });

  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  // --- Power-up In-Game Buttons ---
  const btnSwap = document.getElementById('btn-power-swap');
  if (btnSwap) {
    btnSwap.addEventListener('click', () => {
      if (storage.data.powerups.quantumSwap > 0) {
        game.useQuantumSwap();
      } else {
        modalController.open('modal-shop');
      }
      updateHUD();
    });
  }

  const btnEmp = document.getElementById('btn-power-emp');
  if (btnEmp) {
    btnEmp.addEventListener('click', () => {
      if (storage.data.powerups.empBlast > 0) {
        game.useEmpBlast();
      } else {
        modalController.open('modal-shop');
      }
      updateHUD();
    });
  }

  const btnLaser = document.getElementById('btn-power-laser');
  if (btnLaser) {
    btnLaser.addEventListener('click', () => {
      if (storage.data.powerups.rowLaser > 0) {
        game.useRowLaser();
      } else {
        modalController.open('modal-shop');
      }
      updateHUD();
    });
  }

  // Early Approval Button ("✅ CONCLUIR FASE (★) ➔")
  const btnApprove = document.getElementById('btn-approve-level');
  if (btnApprove) {
    btnApprove.addEventListener('click', () => {
      sound.playVictory();
      game.completeSectorWithVictory();
    });
  }

  // --- Top HUD Buttons ---
  const btnPause = document.getElementById('btn-pause-toggle');
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      sound.playButtonClick();
      modalController.open('modal-pause');
    });
  }

  const btnSound = document.getElementById('btn-sound-toggle');
  if (btnSound) {
    btnSound.textContent = sound.isMuted ? '🔇' : '🔊';
    btnSound.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      btnSound.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  const btnLang = document.getElementById('btn-lang-toggle');
  if (btnLang) {
    btnLang.textContent = isPT ? '🇧🇷 PT' : '🇺🇸 EN';
    btnLang.addEventListener('click', () => {
      isPT = !isPT;
      btnLang.textContent = isPT ? '🇧🇷 PT' : '🇺🇸 EN';
      sound.playButtonClick();
      renderAllTexts();
      updateHUD();
    });
  }

  // Secondary Top Buttons
  const btnOpenSectors = document.getElementById('btn-open-sectors');
  if (btnOpenSectors) {
    btnOpenSectors.addEventListener('click', () => {
      sound.playButtonClick();
      renderSectorsGrid();
      modalController.open('modal-sectors');
    });
  }

  const btnOpenQuests = document.getElementById('btn-open-quests');
  if (btnOpenQuests) {
    btnOpenQuests.addEventListener('click', () => {
      sound.playButtonClick();
      renderQuestsList();
      modalController.open('modal-quests');
    });
  }

  const btnOpenShop = document.getElementById('btn-open-shop');
  if (btnOpenShop) {
    btnOpenShop.addEventListener('click', () => {
      sound.playButtonClick();
      renderShopList();
      modalController.open('modal-shop');
    });
  }

  const btnOpenSpin = document.getElementById('btn-open-spin');
  if (btnOpenSpin) {
    btnOpenSpin.addEventListener('click', () => {
      sound.playButtonClick();
      modalController.open('modal-spin');
    });
  }

  const btnOpenDaily = document.getElementById('btn-open-daily');
  if (btnOpenDaily) {
    btnOpenDaily.addEventListener('click', () => {
      sound.playButtonClick();
      renderDailyCalendar();
      modalController.open('modal-daily');
    });
  }

  // --- Modal Close Buttons (with Anti-Softlock guard) ---
  document.querySelectorAll('.btn-modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      sound.playButtonClick();
      const modal = e.target.closest('.game-modal');
      if (modal) {
        modalController.close(modal.id);
      }
    });
  });

  // Pause Modal Actions
  const btnResume = document.getElementById('btn-resume');
  if (btnResume) {
    btnResume.addEventListener('click', () => {
      sound.playButtonClick();
      modalController.close('modal-pause');
    });
  }

  const btnRestartPause = document.getElementById('btn-restart-game');
  if (btnRestartPause) {
    btnRestartPause.addEventListener('click', () => {
      sound.playButtonClick();
      modalController.closeAll();
      game.restart();
    });
  }

  // Victory Modal Actions (Fast Next Level <50ms)
  const btnNextSector = document.getElementById('btn-next-sector');
  if (btnNextSector) {
    btnNextSector.addEventListener('click', () => {
      sound.playButtonClick();
      modalController.closeAll();
      const nextId = game.currentSector.id + 1;
      if (nextId <= SECTORS.length) {
        game.loadSector(nextId);
      } else {
        game.loadEndless();
      }
    });
  }

  const btnDoubleVictory = document.getElementById('btn-double-victory-ad');
  if (btnDoubleVictory) {
    btnDoubleVictory.addEventListener('click', () => {
      crazygames.requestRewardedAd(
        () => {
          const reward = game.currentSector.coinsReward;
          storage.addCoins(reward);
          sound.playStarUnlocked();
          safeSetText('victory-coins', `+${reward * 2} (DOBRADO!)`);
          btnDoubleVictory.classList.add('hidden');
          updateHUD();
        },
        () => {
          sound.playInvalid();
        }
      );
    });
  }

  // Game Over Actions (Fast Retry <50ms & Revive Ad)
  const btnRestartOver = document.getElementById('btn-restart-over');
  if (btnRestartOver) {
    btnRestartOver.addEventListener('click', () => {
      sound.playButtonClick();
      modalController.closeAll();
      game.restart();
    });
  }

  const btnReviveAd = document.getElementById('btn-revive-ad');
  if (btnReviveAd) {
    btnReviveAd.addEventListener('click', () => {
      crazygames.requestRewardedAd(
        () => {
          modalController.closeAll();
          game.reviveWithQuantumEMP();
        },
        () => {
          sound.playInvalid();
        }
      );
    });
  }

  // Lore Modal Continue / Skip Action (CrazyGames Land-in-Gameplay <= 1 click)
  const btnSkipLore = document.getElementById('btn-skip-lore');
  if (btnSkipLore) {
    btnSkipLore.addEventListener('click', () => {
      sound.playButtonClick();
      modalController.closeAll();
      game.loadSector(1);
      crazygames.gameplayStart();
    });
  }

  // --- Dynamic Sector Selection Modal Rendering ---
  function renderSectorsGrid() {
    const list = document.getElementById('sectors-grid-list');
    if (!list) return;

    list.innerHTML = '';
    SECTORS.forEach(sec => {
      const data = storage.data.sectors[sec.id - 1] || { stars: 0, unlocked: false };
      const card = document.createElement('div');
      card.className = `sector-card ${data.unlocked ? '' : 'locked'}`;

      let starIcons = '';
      for (let s = 1; s <= 3; s++) {
        starIcons += `<span class="star ${s <= data.stars ? 'active' : ''}">★</span>`;
      }

      card.innerHTML = `
        <div class="sector-num">${sec.id}</div>
        <div class="sector-info">
          <h4>${isPT ? sec.namePT : sec.nameEN}</h4>
          <p>${isPT ? sec.descriptionPT : sec.descriptionEN}</p>
        </div>
        <div class="sector-stars">${starIcons}</div>
      `;

      if (data.unlocked) {
        card.addEventListener('click', () => {
          sound.playButtonClick();
          modalController.closeAll();
          game.loadSector(sec.id);
        });
      }
      list.appendChild(card);
    });
  }

  // Endless Mode Selector Button
  const btnPlayEndless = document.getElementById('btn-play-endless');
  if (btnPlayEndless) {
    btnPlayEndless.addEventListener('click', () => {
      sound.playButtonClick();
      modalController.closeAll();
      game.loadEndless();
    });
  }

  // --- Quests List Rendering ---
  function renderQuestsList() {
    const dailyCont = document.getElementById('quests-daily-list');
    const weeklyCont = document.getElementById('quests-weekly-list');

    const renderItems = (items, targetEl) => {
      if (!targetEl) return;
      targetEl.innerHTML = '';
      items.forEach(q => {
        const isComplete = q.current >= q.target;
        const div = document.createElement('div');
        div.className = 'quest-card';
        div.innerHTML = `
          <div class="quest-desc">
            <span class="quest-text">${isPT ? q.textPT : q.textEN}</span>
            <div class="quest-progress-bar">
              <div class="fill" style="width: ${Math.min(100, (q.current / q.target) * 100)}%"></div>
            </div>
            <span class="quest-count">${q.current} / ${q.target}</span>
          </div>
          <div class="quest-actions">
            ${
              q.claimed
                ? '<button class="btn-claimed" disabled>✅ COLETADO</button>'
                : isComplete
                ? `<button class="btn-claim-quest" data-id="${q.id}">COLETAR (+${q.reward})</button>
                   <button class="btn-claim-double" data-id="${q.id}">2X COM VÍDEO 🎬</button>`
                : `<span class="badge-locked">+${q.reward} 🪙</span>`
            }
          </div>
        `;
        targetEl.appendChild(div);
      });
    };

    renderItems(storage.data.quests.daily, dailyCont);
    renderItems(storage.data.quests.weekly, weeklyCont);

    // Bind quest claim buttons
    document.querySelectorAll('.btn-claim-quest').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        storage.claimQuest(id, false);
        sound.playStarUnlocked();
        renderQuestsList();
        updateHUD();
      });
    });

    document.querySelectorAll('.btn-claim-double').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        crazygames.requestRewardedAd(
          () => {
            storage.claimQuest(id, true);
            sound.playStarUnlocked();
            renderQuestsList();
            updateHUD();
          },
          () => sound.playInvalid()
        );
      });
    });
  }

  // --- Meta-Shop List Rendering ---
  function renderShopList() {
    const themesCont = document.getElementById('shop-themes-list');
    const powerupsCont = document.getElementById('shop-powerups-list');

    if (themesCont) {
      themesCont.innerHTML = '';
      Object.entries(THEMES).forEach(([id, theme]) => {
        const isUnlocked = storage.data.unlockedThemes.includes(id);
        const isSelected = storage.data.selectedTheme === id;
        const card = document.createElement('div');
        card.className = `shop-item ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
          <div class="shop-preview" style="background: ${theme.boardBg}; border-color: ${theme.accent};">
            <div style="width: 24px; height: 24px; background: ${theme.accent}; border-radius: 4px; box-shadow: 0 0 8px ${theme.glow};"></div>
          </div>
          <span class="shop-name">${theme.name}</span>
          ${
            isSelected
              ? '<button class="btn-shop-selected" disabled>EM USO</button>'
              : isUnlocked
              ? `<button class="btn-shop-select" data-id="${id}">EQUIPAR</button>`
              : `<button class="btn-shop-buy" data-id="${id}">${theme.price} 🪙</button>`
          }
        `;
        themesCont.appendChild(card);
      });
    }

    // Bind theme buttons
    document.querySelectorAll('.btn-shop-select').forEach(b => {
      b.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        storage.selectTheme(id);
        sound.playButtonClick();
        renderShopList();
      });
    });

    document.querySelectorAll('.btn-shop-buy').forEach(b => {
      b.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        if (storage.buyTheme(id)) {
          sound.playStarUnlocked();
          renderShopList();
          updateHUD();
        } else {
          sound.playInvalid();
        }
      });
    });

    // Powerup buy buttons
    const bindPowerupBuy = (btnId, type, price) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.onclick = () => {
          if (storage.buyPowerup(type, price)) {
            sound.playStarUnlocked();
            updateHUD();
          } else {
            sound.playInvalid();
          }
        };
      }
    };
    bindPowerupBuy('btn-buy-swap', 'quantumSwap', 150);
    bindPowerupBuy('btn-buy-emp', 'empBlast', 250);
    bindPowerupBuy('btn-buy-laser', 'rowLaser', 300);
  }

  // --- Lucky Spin (Roleta da Sorte) ---
  const spinRewards = [
    { label: '100 🪙', coins: 100 },
    { label: '1x Swap', powerup: 'quantumSwap' },
    { label: '250 🪙', coins: 250 },
    { label: '1x EMP', powerup: 'empBlast' },
    { label: '500 🪙', coins: 500 },
    { label: '1x Laser', powerup: 'rowLaser' }
  ];

  const btnSpinWheel = document.getElementById('btn-spin-wheel');
  const btnSpinAd = document.getElementById('btn-spin-wheel-ad');
  let isSpinning = false;

  const triggerSpin = (onDone) => {
    if (isSpinning) return;
    isSpinning = true;

    const wheel = document.getElementById('lucky-wheel-disc');
    const winningIdx = Math.floor(Math.random() * spinRewards.length);
    const degrees = 1800 + winningIdx * 60 + 30; // 5 full spins + slice offset

    sound.playSpin();
    if (wheel) {
      wheel.style.transition = 'transform 3.5s cubic-bezier(0.15, 0.9, 0.25, 1)';
      wheel.style.transform = `rotate(${degrees}deg)`;
    }

    setTimeout(() => {
      isSpinning = false;
      const prize = spinRewards[winningIdx];
      storage.applySpinReward(prize);
      sound.playVictory();
      safeSetText('spin-result-text', `🎉 VOCÊ GANHOU: ${prize.label}!`);
      updateHUD();
      if (onDone) onDone();
    }, 3600);
  };

  if (btnSpinWheel) {
    btnSpinWheel.addEventListener('click', () => {
      if (!storage.canFreeSpin()) return;
      storage.recordFreeSpin();
      btnSpinWheel.disabled = true;
      triggerSpin();
    });
  }

  if (btnSpinAd) {
    btnSpinAd.addEventListener('click', () => {
      crazygames.requestRewardedAd(
        () => triggerSpin(),
        () => sound.playInvalid()
      );
    });
  }

  // --- Daily 7-Day Rewards Calendar ---
  function renderDailyCalendar() {
    const calendar = document.getElementById('daily-calendar-grid');
    if (!calendar) return;

    calendar.innerHTML = '';
    const currentStreak = storage.data.dailyLogin.currentDay;
    const canClaim = storage.canClaimDailyReward();

    DAILY_REWARDS.forEach(r => {
      const isPast = r.day < currentStreak;
      const isCurrent = r.day === currentStreak;
      const dayCard = document.createElement('div');
      dayCard.className = `daily-day-card ${isCurrent ? 'active' : ''} ${isPast ? 'claimed' : ''}`;
      dayCard.innerHTML = `
        <span class="day-label">DIA ${r.day}</span>
        <span class="day-icon">${r.powerup ? '🎁' : '🪙'}</span>
        <span class="day-reward">${r.label}</span>
        ${isPast ? '<span class="status-claimed">✅</span>' : ''}
      `;
      calendar.appendChild(dayCard);
    });

    const btnClaimDaily = document.getElementById('btn-claim-daily-reward');
    if (btnClaimDaily) {
      btnClaimDaily.disabled = !canClaim;
      btnClaimDaily.textContent = canClaim
        ? (isPT ? 'RESGATAR RECOMPENSA' : 'CLAIM REWARD')
        : (isPT ? 'VOLTE AMANHÃ' : 'COME BACK TOMORROW');
      btnClaimDaily.onclick = () => {
        const reward = storage.claimDailyReward();
        if (reward) {
          sound.playStarUnlocked();
          renderDailyCalendar();
          updateHUD();
        }
      };
    }
  }

  // Translate all UI text elements
  function renderAllTexts() {
    safeSetText('label-points', isPT ? 'PONTOS' : 'SCORE');
    safeSetText('label-record', isPT ? 'RECORDE' : 'HIGH');
    safeSetText('label-coins', isPT ? 'MOEDAS' : 'COINS');
    safeSetText('btn-approve-level', isPT ? '✅ CONCLUIR FASE (★) ➔' : '✅ COMPLETE STAGE (★) ➔');
  }

  renderAllTexts();
  updateHUD();

  // --- Main Animation Frame Loop with Fixed Delta Time (60Hz, 144Hz, 165Hz) ---
  let lastFrameTime = performance.now();

  function gameLoop(now) {
    const dt = Math.min((now - lastFrameTime) / 1000, 0.1); // Guard against giant delta
    lastFrameTime = now;

    game.update(dt);
    renderer.render(now);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
