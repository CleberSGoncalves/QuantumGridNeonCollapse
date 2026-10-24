// src/crazygames.js - CrazyGames SDK v3 Full Shielding (Watchdog 2.5s, Finally, AdBlock Safe)
import { sound } from './audio.js';

class CrazyGamesManager {
  constructor() {
    this.sdk = null;
    this.isInitialized = false;
    this.isAdActive = false;
    this.lastMidgameTime = 0;
    this.midgameIntervalMs = 180000; // 3 minutes
  }

  async init() {
    if (this.isInitialized) return;
    try {
      if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
        this.sdk = window.CrazyGames.SDK;
        if (typeof this.sdk.init === 'function') {
          await this.sdk.init();
        }
        this.isInitialized = true;
        console.log('[CrazyGames] SDK v3 initialized successfully. Environment:', this.sdk.environment);
      } else {
        console.log('[CrazyGames] SDK script not available or disabled; running in standalone mode.');
      }
    } catch (e) {
      console.warn('[CrazyGames] Error during SDK initialization:', e);
    }
  }

  _canRequestLiveAds() {
    if (!this.sdk) return false;
    if (this.sdk.environment === 'disabled') return false;
    if (typeof window === 'undefined') return false;

    const hostname = window.location.hostname || '';
    const isCrazyHost = hostname.includes('crazygames') || hostname.includes('1001juegos');
    const isDev = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';

    if (isDev) return false;
    return isCrazyHost || this.sdk.environment === 'live';
  }

  gameplayStart() {
    try {
      if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStart === 'function') {
        this.sdk.game.gameplayStart();
      }
    } catch (e) {}
  }

  gameplayStop() {
    try {
      if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStop === 'function') {
        this.sdk.game.gameplayStop();
      }
    } catch (e) {}
  }

  // Midgame Ad with 2.5s Watchdog & Guaranteed Finally
  requestMidgameAd(onComplete) {
    const now = Date.now();
    if (now - this.lastMidgameTime < this.midgameIntervalMs || !this._canRequestLiveAds()) {
      if (onComplete) onComplete();
      return;
    }

    let hasFinished = false;
    this.isAdActive = true;
    sound.setAdMuted(true);

    const finish = () => {
      if (!hasFinished) {
        hasFinished = true;
        clearTimeout(watchdogTimer);
        this.isAdActive = false;
        this.lastMidgameTime = Date.now();
        sound.setAdMuted(false);
        if (onComplete) onComplete();
      }
    };

    const watchdogTimer = setTimeout(() => {
      console.warn('[CrazyGames] Midgame Ad watchdog triggered (timeout > 2.5s)');
      finish();
    }, 2500);

    try {
      this.sdk.ad.requestAd('midgame', {
        adStarted: () => {
          sound.setAdMuted(true);
        },
        adFinished: () => finish(),
        adError: (err) => {
          console.warn('[CrazyGames] Midgame ad error:', err);
          finish();
        }
      });
    } catch (err) {
      console.warn('[CrazyGames] Exception in requestAd:', err);
      finish();
    }
  }

  // Rewarded Ad with 2.5s Watchdog & Strict Reward Verification
  requestRewardedAd(onReward, onDismiss) {
    if (!this._canRequestLiveAds()) {
      // In dev or localhost without ads: allow immediate reward simulation for testing
      const sim = window.confirm ? window.confirm('[DEV MODE] Simular recompensa de anúncio?') : true;
      if (sim) {
        if (onReward) onReward();
      } else {
        if (onDismiss) onDismiss();
      }
      return;
    }

    let hasFinished = false;
    let earnedReward = false;
    this.isAdActive = true;
    sound.setAdMuted(true);

    const finish = () => {
      if (!hasFinished) {
        hasFinished = true;
        clearTimeout(watchdogTimer);
        this.isAdActive = false;
        sound.setAdMuted(false);
        if (earnedReward) {
          if (onReward) onReward();
        } else {
          if (onDismiss) onDismiss();
        }
      }
    };

    const watchdogTimer = setTimeout(() => {
      console.warn('[CrazyGames] Rewarded Ad watchdog triggered (timeout > 2.5s)');
      finish();
    }, 2500);

    try {
      this.sdk.ad.requestAd('rewarded', {
        adStarted: () => {
          sound.setAdMuted(true);
        },
        adFinished: () => {
          earnedReward = true;
          finish();
        },
        adError: (err) => {
          console.warn('[CrazyGames] Rewarded ad error (AdBlock or unavailable):', err);
          earnedReward = false;
          finish();
        }
      });
    } catch (err) {
      console.warn('[CrazyGames] Exception requesting rewarded ad:', err);
      finish();
    }
  }
}

export const crazygames = new CrazyGamesManager();
