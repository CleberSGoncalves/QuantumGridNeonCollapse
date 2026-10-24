// src/juice.js - Game Juice: Trauma² Screen Shake, Hit-Stop, Squash & Stretch, Particles & Floating Text

export class CameraShaker {
  constructor() {
    this.trauma = 0;
    this.decay = 1.6; // decay per second
    this.maxAngle = 0.06; // radians
    this.maxOffset = 18; // pixels
    this.offsetX = 0;
    this.offsetY = 0;
    this.angle = 0;
  }

  addTrauma(amount) {
    if (!Number.isFinite(amount)) return;
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  update(dt) {
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.decay * dt);
      const shake = this.trauma * this.trauma; // quadratic trauma
      this.offsetX = (Math.random() * 2 - 1) * this.maxOffset * shake;
      this.offsetY = (Math.random() * 2 - 1) * this.maxOffset * shake;
      this.angle = (Math.random() * 2 - 1) * this.maxAngle * shake;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
      this.angle = 0;
    }
  }

  apply(ctx, centerX, centerY) {
    if (this.trauma <= 0) return;
    ctx.translate(centerX, centerY);
    ctx.rotate(this.angle);
    ctx.translate(-centerX + this.offsetX, -centerY + this.offsetY);
  }
}

export class HitStopManager {
  constructor() {
    this.isFrozen = false;
    this.freezeTimer = 0;
  }

  trigger(durationMs = 50) {
    this.isFrozen = true;
    this.freezeTimer = durationMs / 1000;
  }

  update(dt) {
    if (this.isFrozen) {
      this.freezeTimer -= dt;
      if (this.freezeTimer <= 0) {
        this.isFrozen = false;
        this.freezeTimer = 0;
      }
      return true; // Game should skip physics / logic this frame
    }
    return false;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnBurst(x, y, count = 16, color = '#00f5ff', speed = 260) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      const life = 0.35 + Math.random() * 0.45;
      const size = 3 + Math.random() * 4.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size,
        life,
        maxLife: life,
        gravity: 180 + Math.random() * 120,
        drag: 0.94
      });
    }
  }

  spawnLaserSweep(startX, startY, endX, endY, color = '#38bdf8') {
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = startX + (endX - startX) * t;
      const py = startY + (endY - startY) * t;
      this.spawnBurst(px, py, 4, color, 120);
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
    }
  }

  render(ctx) {
    if (this.particles.length === 0) return;
    ctx.save();
    for (const p of this.particles) {
      const t = Math.max(0, p.life / p.maxLife);
      const alpha = t * t; // quadratic fade
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * t), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}

export class FloatingTextManager {
  constructor() {
    this.texts = [];
  }

  spawn(text, x, y, color = '#ffffff', fontSize = 20, isBig = false) {
    this.texts.push({
      text,
      x,
      y,
      vy: -70,
      color,
      fontSize,
      life: isBig ? 1.4 : 0.9,
      maxLife: isBig ? 1.4 : 0.9,
      scale: isBig ? 1.4 : 1.0
    });
  }

  update(dt) {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const item = this.texts[i];
      item.life -= dt;
      if (item.life <= 0) {
        this.texts.splice(i, 1);
        continue;
      }
      item.y += item.vy * dt;
      item.vy *= 0.96; // decelerate upward
    }
  }

  render(ctx) {
    if (this.texts.length === 0) return;
    ctx.save();
    for (const item of this.texts) {
      const t = Math.max(0, item.life / item.maxLife);
      const alpha = Math.min(1.0, t * 1.5);
      const scale = item.scale * (1.15 - 0.15 * t);

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${item.fontSize}px 'Segoe UI', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outer glow & stroke
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#050814';
      ctx.lineWidth = 4;
      ctx.strokeText(item.text, 0, 0);

      ctx.fillStyle = item.color;
      ctx.fillText(item.text, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  clear() {
    this.texts = [];
  }
}
