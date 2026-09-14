import { drawSprite } from './sprites-v66.js';

export const CONTROL = [
  { left: 'KeyA', right: 'KeyD', jump: 'KeyW', down: 'KeyS', block: 'KeyE', punch: 'KeyF', kick: 'KeyG', special: 'KeyH' },
  { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', down: 'ArrowDown', block: 'KeyI', punch: 'KeyJ', kick: 'KeyK', special: 'KeyL' }
];

const FLOOR = 446;
const GRAVITY = 0.65;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const MOVES = {
  punch: { length: 22, start: 7, end: 11, range: 96, damage: 8, push: 7 },
  kick: { length: 30, start: 12, end: 18, range: 128, damage: 12, push: 10 },
  special: { length: 44, start: 14, end: 25, range: 182, damage: 18, push: 13 }
};

export const STAGE_DEFS = [
  { id: 'neon-laneway-beatdown', name: 'Neon Laneway Beatdown', src: './assets/backgrounds/game/neon-laneway-beatdown.webp' },
  { id: 'backyard-bbq-bash', name: 'Backyard BBQ Bash', src: './assets/backgrounds/game/backyard-bbq-bash.webp' },
  { id: 'construction-yard-throwdown', name: 'Construction Yard Throwdown', src: './assets/backgrounds/game/construction-yard-throwdown.webp' },
  { id: 'arcade-food-court-frenzy', name: 'Arcade Food Court Frenzy', src: './assets/backgrounds/game/arcade-food-court-frenzy.webp' },
  { id: 'docklands-container-clash', name: 'Docklands Container Clash', src: './assets/backgrounds/game/docklands-container-clash.webp' },
  { id: 'outback-servo-showdown', name: 'Outback Servo Showdown', src: './assets/backgrounds/game/outback-servo-showdown.webp' }
];

export const resolveStageUrl = src => new URL(src, import.meta.url).href;
const STAGES = STAGE_DEFS.map(def => {
  const image = new Image();
  const stage = { ...def, image, url: resolveStageUrl(def.src), ready: false, failed: false };
  image.decoding = 'async';
  image.onload = () => { stage.ready = !!image.naturalWidth; stage.failed = !stage.ready; };
  image.onerror = () => { stage.ready = false; stage.failed = true; };
  image.src = stage.url;
  return stage;
});

class Fighter {
  constructor(asset, side) {
    this.asset = asset;
    this.side = side;
    this.x = side ? 700 : 260;
    this.y = FLOOR;
    this.vx = 0;
    this.vy = 0;
    this.face = side ? -1 : 1;
    this.hp = 100;
    this.meter = 35;
    this.state = 'idle';
    this.tick = 0;
    this.action = null;
    this.stun = 0;
    this.buffer = null;
    this.think = 0;
    this.plan = { axis: 0 };
  }
  get grounded() { return this.y >= FLOOR - 0.1; }
  setState(name, game) {
    if (this.state !== name) {
      this.state = name;
      this.tick = 0;
      if (game) game.onFighterState(this, name);
    }
  }
  input(game, other) {
    if (game.mode === 'cpu' && this.side === 1) {
      if (--this.think <= 0) {
        const d = Math.abs(other.x - this.x);
        const sign = Math.sign(other.x - this.x);
        const level = game.difficulty;
        this.think = level === 'easy' ? 26 : level === 'hard' ? 9 : 16;
        this.plan = {
          axis: d > 120 ? sign : d < 72 ? -sign : 0,
          block: !!other.action && d < 170 && Math.random() < (level === 'hard' ? 0.8 : 0.4)
        };
        if (d < 142 && Math.random() < 0.8) this.buffer = { type: d < 106 && Math.random() < 0.6 ? 'punch' : 'kick', ttl: 9 };
        if (this.meter >= 35 && d < 235 && Math.random() < 0.24) this.buffer = { type: 'special', ttl: 9 };
        this.plan.jump = d > 150 && Math.random() < 0.06;
      } else {
        this.plan.jump = false;
      }
      return this.plan;
    }
    const c = CONTROL[this.side], k = game.keys, p = game.pressed;
    for (const type of ['punch', 'kick', 'special']) if (p.has(c[type])) this.buffer = { type, ttl: 9 };
    return { axis: Number(k.has(c.right)) - Number(k.has(c.left)), jump: p.has(c.jump), down: k.has(c.down), block: k.has(c.block) };
  }
  update(game, other) {
    this.tick++;
    if (this.buffer && --this.buffer.ttl < 0) this.buffer = null;
    if (this.hp <= 0) {
      this.setState('fall', game);
      this.vx *= 0.83;
      this.physics();
      return;
    }
    const input = this.input(game, other);
    if (this.stun > 0) {
      this.stun--;
      this.vx *= 0.82;
      this.physics();
      if (!this.stun) {
        if (this.state === 'fall') { this.setState('getup', game); this.stun = 22; }
        else this.setState('idle', game);
      }
      return;
    }
    if (this.action) {
      const a = this.action;
      this.vx *= 0.75;
      if (this.tick >= a.start && this.tick <= a.end && !a.hit) {
        const dx = (other.x - this.x) * this.face;
        const dy = Math.abs(other.y - this.y);
        if (dx > 0 && dx < a.range && dy < (other.state === 'crouch' ? 60 : 108)) {
          a.hit = true;
          other.hit(a, this, game);
        }
      }
      if (this.tick >= a.length) {
        this.action = null;
        this.setState(this.grounded ? 'idle' : 'jump', game);
      }
    } else {
      this.face = this.x < other.x ? 1 : -1;
      if (input.jump && this.grounded && !input.block) {
        this.vy = -12.6;
        this.setState('jump', game);
      }
      if (this.buffer && !input.block && (!input.down || this.grounded)) {
        const type = this.buffer.type;
        if (type !== 'special' || this.meter >= 35) {
          this.buffer = null;
          this.action = { ...MOVES[type], type, hit: false };
          this.setState(type, game);
          this.tick = 0;
          if (type === 'special') {
            this.meter = clamp(this.meter - 35, 0, 100);
            game.burst(this.x + this.face * 35, this.y - 110, this.asset.def.accent, 22);
          }
          game.onAction(this, type);
        }
      }
      if (!this.action) {
        this.vx = (input.block || input.down) ? 0 : input.axis * 3.35 * (this.asset.def.speed || 1);
        const nextState = !this.grounded || this.vy < 0 ? 'jump' : input.block ? 'block' : input.down ? 'crouch' : input.axis ? 'walk' : 'idle';
        this.setState(nextState, game);
      }
    }
    const wasAir = !this.grounded;
    this.physics();
    if (wasAir && this.grounded && this.state === 'jump' && !this.action) {
      this.setState('idle', game);
      this.stun = 4;
    }
    if (game.mode === 'training') this.meter = 100;
  }
  physics() {
    this.vy += GRAVITY;
    this.x = clamp(this.x + this.vx, 55, 905);
    this.y += this.vy;
    if (this.y >= FLOOR) { this.y = FLOOR; this.vy = 0; }
  }
  hit(a, attacker, game) {
    if (this.hp <= 0 || this.state === 'getup' || this.state === 'fall') return;
    const blocked = this.state === 'block' && this.face === -attacker.face;
    const damage = Math.max(1, Math.round(a.damage / (this.asset.def.defense || 1) * (blocked ? 0.2 : 1)));
    this.hp = Math.max(0, this.hp - damage);
    this.action = null;
    this.buffer = null;
    this.setState(blocked ? 'block' : a.type === 'special' ? 'fall' : 'hurt', game);
    this.tick = 0;
    this.stun = blocked ? 9 : a.type === 'special' ? 42 : 17;
    this.vx = attacker.face * a.push * (blocked ? 0.4 : 1);
    this.vy = blocked ? 0 : a.type === 'special' ? -6 : -2;
    attacker.meter = clamp(attacker.meter + 10, 0, 100);
    this.meter = clamp(this.meter + 7, 0, 100);
    game.freeze = blocked ? 3 : 5;
    game.shake = blocked ? 1 : 5;
    game.burst(this.x, this.y - 100, blocked ? '#d7eeff' : attacker.asset.def.accent, 12);
    game.onAction(this, blocked ? 'block' : 'hurt');
  }
  draw(ctx) {
    const state = this.hp <= 0 ? 'fall' : this.state;
    const duration = this.action?.length || ({ hurt: 17, fall: 42, getup: 22 }[state] || 0);
    ctx.fillStyle = 'rgba(0,0,0,.34)';
    ctx.beginPath();
    ctx.ellipse(this.x, FLOOR + 3, 43, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    drawSprite(ctx, this.asset, state, this.tick, this.x, this.y, 1.95, this.face, duration, this.vy);
    if (this.action?.type === 'special' && this.tick >= 10 && this.tick < 30) {
      const t = (this.tick - 10) / 20;
      const orbX = this.x + this.face * (55 + 90 * t);
      const orbY = this.y - 105;
      ctx.strokeStyle = this.asset.def.accent;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1 - t;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 14 + 25 * t, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

export class Arena {
  constructor(canvas, onChange, soundSystem) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onChange = onChange;
    this.soundSystem = soundSystem;
    this.keys = new Set();
    this.pressed = new Set();
    this.phase = 'off';
    this.paused = false;
    this.tick = 0;
    this.fx = [];
    this.freeze = 0;
    this.shake = 0;
    this.reduced = false;
    this.stageId = STAGE_DEFS[0].id;
    this.venue = STAGES[0];
  }
  async start(mode, assets, difficulty = 'normal', stageId = STAGE_DEFS[0].id) {
    this.mode = mode;
    this.assets = assets;
    this.difficulty = difficulty;
    this.stageId = stageId;
    this.venue = STAGES.find(s => s.id === stageId) || STAGES[0];
    this.wins = [0, 0];
    this.round = 1;
    this.paused = false;
    this.keys.clear();
    this.pressed.clear();
    this.reset();
    await this.soundSystem?.resume();
    await this.soundSystem?.playStageMusic(this.venue.id);
  }
  reset() {
    this.people = this.assets.map((a, i) => new Fighter(a, i));
    this.remaining = 3600;
    this.phase = this.mode === 'training' ? 'fight' : 'intro';
    this.phaseTick = 0;
    this.fx = [];
    this.freeze = 0;
    this.shake = 0;
    if (this.mode === 'training') this.people.forEach(f => f.meter = 100);
    this.onChange(this);
  }
  stop() {
    this.phase = 'off';
    this.paused = false;
    this.keys.clear();
    this.pressed.clear();
    this.soundSystem?.stopStageMusic();
  }
  pause(value = !this.paused) {
    if (this.phase === 'off' || this.phase === 'matchover') return;
    this.paused = value;
    this.keys.clear();
    this.pressed.clear();
    this.onChange(this);
  }
  key(code, down) {
    if (down) {
      if (!this.keys.has(code)) this.pressed.add(code);
      this.keys.add(code);
    } else this.keys.delete(code);
  }
  burst(x, y, color, n) {
    if (this.reduced) n = 4;
    for (let i = 0; i < n; i++) this.fx.push({ x, y, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.6) * 9, life: 22, color });
  }
  onAction(fighter, action) {
    this.soundSystem?.playAction(fighter.asset.def.id, action);
  }
  onFighterState(fighter, state) {
    if (state === 'jump' || state === 'victory') this.soundSystem?.playAction(fighter.asset.def.id, state);
  }
  update() {
    if (this.phase === 'off' || this.paused) { this.pressed.clear(); return; }
    this.tick++;
    this.phaseTick++;
    if (this.phase === 'intro') {
      this.people.forEach(f => f.tick++);
      if (this.phaseTick >= 90) { this.phase = 'fight'; this.phaseTick = 0; }
    } else if (this.phase === 'fight') {
      if (this.freeze > 0) this.freeze--;
      else {
        const [a, b] = this.people;
        a.update(this, b);
        b.update(this, a);
        const gap = b.x - a.x;
        if (Math.abs(a.y - b.y) < 80 && Math.abs(gap) < 65) {
          const push = (65 - Math.abs(gap)) / 2;
          const sign = gap >= 0 ? 1 : -1;
          a.x = clamp(a.x - sign * push, 55, 905);
          b.x = clamp(b.x + sign * push, 55, 905);
        }
        if (this.mode !== 'training') this.remaining = Math.max(0, this.remaining - 1);
        if (a.hp <= 0 || b.hp <= 0 || this.remaining <= 0) {
          this.winner = a.hp === b.hp ? -1 : a.hp > b.hp ? 0 : 1;
          if (this.mode === 'training') {
            this.phase = 'training-reset'; this.phaseTick = 0;
          } else {
            if (this.winner >= 0) this.wins[this.winner]++;
            this.phase = 'roundover'; this.phaseTick = 0;
            this.people.forEach((p, i) => { p.action = null; p.buffer = null; p.stun = 0; p.setState(i === this.winner ? 'victory' : p.hp <= 0 ? 'fall' : 'idle', this); });
          }
          this.onChange(this);
        }
      }
    } else if (this.phase === 'roundover' || this.phase === 'training-reset') {
      this.people.forEach(p => { p.tick++; p.vx *= 0.8; p.physics(); });
      if (this.phaseTick >= 130) {
        if (this.mode === 'training') this.reset();
        else if (this.wins.some(w => w >= 2)) { this.phase = 'matchover'; this.onChange(this); }
        else { this.round++; this.reset(); }
      }
    } else if (this.phase === 'matchover') {
      this.people.forEach(f => f.tick++);
    }
    this.fx = this.fx.filter(p => --p.life > 0);
    this.fx.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.12; });
    this.shake *= 0.8;
    this.pressed.clear();
    if (this.tick % 6 === 0) this.onChange(this);
  }
  draw() {
    const c = this.ctx;
    c.save();
    if (!this.reduced && this.shake > 0.3) c.translate(Math.random() * this.shake - this.shake / 2, 0);
    this.drawStage(c);
    if (this.phase !== 'off') {
      this.people.forEach(p => p.draw(c));
      for (const p of this.fx) {
        c.globalAlpha = p.life / 22;
        c.fillStyle = p.color;
        c.fillRect(p.x, p.y, 4, 4);
      }
      c.globalAlpha = 1;
    }
    c.restore();
    let banner = '';
    if (this.phase === 'intro') banner = this.phaseTick < 57 ? 'ROUND ' + this.round : 'FIGHT';
    if (this.phase === 'roundover') banner = this.winner < 0 ? 'DRAW' : this.people[this.winner].asset.def.name.toUpperCase() + ' WINS';
    if (banner) {
      c.fillStyle = 'rgba(7,10,18,.7)';
      c.fillRect(0, 203, 960, 78);
      c.fillStyle = '#ffe09a';
      c.textAlign = 'center';
      c.font = 'bold 34px system-ui';
      c.fillText(banner, 480, 253, 880);
    }
  }
  drawStage(c) {
    const image = this.venue?.image;
    if (this.venue?.ready && image?.complete && image.naturalWidth && !this.venue.failed) {
      c.drawImage(image, 0, 0, 960, 540);
      c.fillStyle = 'rgba(4,8,16,.06)';
      c.fillRect(0, 0, 960, 540);
      return;
    }
    const g = c.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, '#0c1225'); g.addColorStop(.65, '#31364b'); g.addColorStop(1, '#161a25');
    c.fillStyle = g; c.fillRect(0, 0, 960, 540);
    c.fillStyle = '#242332'; c.fillRect(0, 280, 960, 163);
    c.fillStyle = '#444150'; c.fillRect(0, 441, 960, 8);
    c.fillStyle = '#222734'; c.fillRect(0, 449, 960, 91);
  }
  snapshot() {
    return {
      phase: this.phase,
      paused: this.paused,
      round: this.round,
      wins: [...(this.wins || [])],
      remaining: this.remaining,
      venue: this.venue?.id,
      people: (this.people || []).map(f => ({ id: f.asset.def.id, hp: f.hp, meter: f.meter, x: f.x, y: f.y, state: f.state }))
    };
  }
}
