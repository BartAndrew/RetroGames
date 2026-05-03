/*
  Sandbag Siege V2
  ----------------
  This version keeps the project classroom-friendly, but changes the game
  from a fixed shooting gallery into a simple first-person arcade shooter.

  The big teaching idea in this file:
  We create the illusion of 3D by storing objects in a world with x and z
  positions, then projecting those positions onto the 2D canvas.
*/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;

const ui = {
  waveValue: document.getElementById("waveValue"),
  scoreValue: document.getElementById("scoreValue"),
  healthValue: document.getElementById("healthValue"),
  weaponName: document.getElementById("weaponName"),
  weaponAmmo: document.getElementById("weaponAmmo"),
  backupName: document.getElementById("backupName"),
  backupAmmo: document.getElementById("backupAmmo"),
  medkitValue: document.getElementById("medkitValue"),
  grenadeValue: document.getElementById("grenadeValue"),
  missionText: document.getElementById("missionText"),
};

const GAME = {
  width: canvas.width,
  height: canvas.height,
  horizonY: 230,
  floorY: 620,
  focalLength: 420,
  minDepth: 70,
  maxDepth: 1950,
  leftBound: -320,
  rightBound: 320,
  waveLength: 24,
};

const WEAPONS = {
  rifle: {
    label: "Ranger Rifle",
    fireDelay: 0.46,
    damage: 42,
    spread: 8,
    clipSize: 10,
    reserveSize: 60,
    reloadTime: 1.25,
    tracer: "#d8f2ff",
  },
  auto: {
    label: "Auto Rifle",
    fireDelay: 0.1,
    damage: 12,
    spread: 18,
    clipSize: 36,
    reserveSize: 180,
    reloadTime: 1.6,
    tracer: "#7ae0ff",
  },
};

const ENEMY_DEFS = {
  raider: {
    health: 44,
    speed: 66,
    score: 120,
    damage: 9,
    fireRate: [1.2, 2.2],
    sprite: "raider",
  },
  sniper: {
    health: 34,
    speed: 42,
    score: 170,
    damage: 18,
    fireRate: [1.8, 3.1],
    sprite: "sniper",
  },
  heavy: {
    health: 92,
    speed: 30,
    score: 240,
    damage: 14,
    fireRate: [1.4, 2.4],
    sprite: "heavy",
  },
  gunship: {
    health: 620,
    speed: 0,
    score: 1400,
    damage: 15,
    fireRate: [0.7, 1.15],
    sprite: "gunship",
  },
};

const SPRITES = {
  units: {
    src: "assets/modern_units.svg",
    cellW: 96,
    cellH: 96,
    frames: {
      raider: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ],
      sniper: [
        [0, 1],
        [1, 1],
        [2, 1],
        [3, 1],
      ],
      heavy: [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
      ],
      ammo: [[0, 3]],
      medkit: [[1, 3]],
      power: [[2, 3]],
      grenade: [[3, 3]],
    },
  },
  vehicles: {
    src: "assets/modern_vehicles.svg",
    cellW: 160,
    cellH: 96,
    frames: {
      gunship: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ],
    },
  },
  fx: {
    src: "assets/modern_fx.svg",
    cellW: 96,
    cellH: 96,
    frames: {
      muzzle: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ],
      spark: [
        [0, 1],
        [1, 1],
        [2, 1],
        [3, 1],
      ],
      blast: [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
      ],
    },
  },
  weapon: {
    src: "assets/modern_weapon.svg",
    cellW: 320,
    cellH: 180,
    frames: {
      rifle: [[0, 0]],
      auto: [[1, 0]],
    },
  },
};

const state = {
  lastTime: 0,
  elapsed: 0,
  paused: false,
  gameOver: false,
  victory: false,
  wave: 1,
  score: 0,
  bossSpawned: false,
  waveTimer: 0,
  spawnTimer: 0,
  message: "Advance through the canyon.",
  messagePulse: 0,
  flash: 0,
  cursor: { x: GAME.width / 2, y: GAME.height / 2 },
  mouseDown: false,
  keys: new Set(),
  enemies: [],
  tracers: [],
  effects: [],
  pickups: [],
  particles: [],
  player: {
    x: 0,
    z: 0,
    bob: 0,
    health: 100,
    maxHealth: 100,
    medkits: 3,
    grenades: 4,
    activeWeapon: "rifle",
    powerBoost: 0,
    movementBoost: 0,
    weapons: {},
  },
  assets: {},
};

function createWeaponState(key) {
  const def = WEAPONS[key];
  return {
    key,
    clip: def.clipSize,
    reserve: def.reserveSize,
    reloadTimer: 0,
    lastShotAt: -100,
  };
}

function resetGame() {
  state.lastTime = 0;
  state.elapsed = 0;
  state.paused = false;
  state.gameOver = false;
  state.victory = false;
  state.wave = 1;
  state.score = 0;
  state.bossSpawned = false;
  state.waveTimer = 0;
  state.spawnTimer = 0.8;
  state.message = "Advance through the canyon.";
  state.messagePulse = 1;
  state.flash = 0;
  state.enemies = [];
  state.tracers = [];
  state.effects = [];
  state.pickups = [];
  state.particles = [];
  state.player = {
    x: 0,
    z: 0,
    bob: 0,
    health: 100,
    maxHealth: 100,
    medkits: 3,
    grenades: 4,
    activeWeapon: "rifle",
    powerBoost: 0,
    movementBoost: 0,
    weapons: {
      rifle: createWeaponState("rifle"),
      auto: createWeaponState("auto"),
    },
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function choose(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function distance2d(aX, aZ, bX, bZ) {
  return Math.hypot(aX - bX, aZ - bZ);
}

function setMessage(text) {
  state.message = text;
  state.messagePulse = 1;
  ui.missionText.textContent = text;
}

function currentWeaponState() {
  return state.player.weapons[state.player.activeWeapon];
}

function backupWeaponKey() {
  return state.player.activeWeapon === "rifle" ? "auto" : "rifle";
}

function worldToScreen(worldX, worldY, worldZ) {
  const relativeZ = worldZ - state.player.z;
  if (relativeZ <= GAME.minDepth) {
    return null;
  }

  const scale = GAME.focalLength / relativeZ;
  return {
    depth: relativeZ,
    scale,
    x: GAME.width / 2 + (worldX - state.player.x) * scale,
    y: GAME.floorY - worldY * scale,
  };
}

function drawSprite(sheetKey, frameName, frameIndex, x, y, width, height, alpha = 1) {
  const sheet = SPRITES[sheetKey];
  const image = state.assets[sheetKey];
  if (!image) return;

  const frames = sheet.frames[frameName];
  const frame = frames[frameIndex % frames.length];
  const sx = frame[0] * sheet.cellW;
  const sy = frame[1] * sheet.cellH;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(
    image,
    sx,
    sy,
    sheet.cellW,
    sheet.cellH,
    x - width / 2,
    y - height,
    width,
    height,
  );
  ctx.restore();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function makeEnemy(type) {
  const def = ENEMY_DEFS[type];
  return {
    id: `${type}-${Math.random().toString(36).slice(2)}`,
    type,
    x: rand(GAME.leftBound, GAME.rightBound),
    z: state.player.z + rand(860, 1700),
    y: type === "gunship" ? 210 : 0,
    width: type === "gunship" ? 360 : type === "heavy" ? 116 : 94,
    height: type === "gunship" ? 210 : type === "heavy" ? 150 : 138,
    health: def.health,
    maxHealth: def.health,
    speed: def.speed,
    damage: def.damage,
    score: def.score,
    fireCooldown: rand(def.fireRate[0], def.fireRate[1]),
    animationTime: rand(0, 4),
    sway: rand(0, Math.PI * 2),
  };
}

function maybeSpawnEnemy(dt) {
  if (state.bossSpawned || state.gameOver || state.victory) {
    return;
  }

  state.spawnTimer -= dt;
  if (state.spawnTimer > 0) return;

  const table = ["raider", "raider", "raider"];
  if (state.wave >= 2) table.push("sniper");
  if (state.wave >= 3) table.push("heavy");
  if (state.wave >= 4) table.push("sniper", "heavy");

  state.enemies.push(makeEnemy(choose(table)));
  state.spawnTimer = rand(Math.max(0.4, 1.1 - state.wave * 0.12), 1.5);
}

function updateWaveFlow(dt) {
  if (state.gameOver || state.victory) return;

  state.waveTimer += dt;
  if (!state.bossSpawned && state.waveTimer >= GAME.waveLength) {
    state.waveTimer = 0;
    if (state.wave < 4) {
      state.wave += 1;
      setMessage(`Wave ${state.wave} incoming. Enemy pressure is building.`);
    } else {
      state.bossSpawned = true;
      state.enemies.push(makeEnemy("gunship"));
      setMessage("Boss wave. Gunship on approach.");
    }
  }
}

function startReload(key) {
  const weapon = state.player.weapons[key];
  const def = WEAPONS[key];
  if (weapon.reloadTimer > 0) return;
  if (weapon.clip >= def.clipSize) return;
  if (weapon.reserve <= 0) return;
  weapon.reloadTimer = def.reloadTime;
}

function finishReload(key) {
  const weapon = state.player.weapons[key];
  const def = WEAPONS[key];
  const needed = def.clipSize - weapon.clip;
  const moved = Math.min(needed, weapon.reserve);
  weapon.clip += moved;
  weapon.reserve -= moved;
}

function applyMovement(dt) {
  const keys = state.keys;
  let moveX = 0;
  let moveZ = 0;

  if (keys.has("KeyA")) moveX -= 1;
  if (keys.has("KeyD")) moveX += 1;
  if (keys.has("KeyW")) moveZ += 1;
  if (keys.has("KeyS")) moveZ -= 1;

  if (moveX === 0 && moveZ === 0) return;

  const length = Math.hypot(moveX, moveZ) || 1;
  const speed = 210 * (state.player.movementBoost > 0 ? 1.18 : 1);
  state.player.x = clamp(
    state.player.x + (moveX / length) * speed * dt,
    GAME.leftBound,
    GAME.rightBound,
  );
  state.player.z = clamp(state.player.z + (moveZ / length) * speed * dt, 0, 2500);
  state.player.bob += dt * 10;
}

function useMedkit() {
  if (state.player.medkits <= 0 || state.player.health >= state.player.maxHealth) return;
  state.player.medkits -= 1;
  state.player.health = clamp(state.player.health + 38, 0, state.player.maxHealth);
  setMessage("Medkit used. Keep moving.");
}

function useGrenade() {
  if (state.player.grenades <= 0 || state.gameOver || state.victory) return;
  state.player.grenades -= 1;

  const targetDepth = 500 + (1 - state.cursor.y / GAME.height) * 900;
  const targetZ = state.player.z + targetDepth;
  const offsetScale = targetDepth / GAME.focalLength;
  const targetX = state.player.x + (state.cursor.x - GAME.width / 2) * offsetScale;

  state.effects.push({
    kind: "blast",
    x: targetX,
    y: 0,
    z: targetZ,
    time: 0,
    ttl: 0.55,
    size: 260,
  });

  state.enemies.forEach((enemy) => {
    const distance = distance2d(enemy.x, enemy.z, targetX, targetZ);
    if (distance < 170) {
      damageEnemy(enemy, 90 * (1 - distance / 170), targetX, targetZ);
    }
  });

  state.flash = 0.16;
  setMessage("Grenade out.");
}

function pointHitsEnemy(x, y, enemy) {
  const projected = worldToScreen(enemy.x, enemy.y, enemy.z);
  if (!projected) return false;

  const width = enemy.width * projected.scale;
  const height = enemy.height * projected.scale;
  return (
    x >= projected.x - width / 2 &&
    x <= projected.x + width / 2 &&
    y >= projected.y - height &&
    y <= projected.y
  );
}

function addTracer(x1, y1, x2, y2, color, width, ttl = 0.08) {
  state.tracers.push({ x1, y1, x2, y2, color, width, ttl, maxTtl: ttl });
}

function fireWeapon() {
  if (state.gameOver || state.victory || state.paused) return;

  const weapon = currentWeaponState();
  const def = WEAPONS[state.player.activeWeapon];
  if (weapon.reloadTimer > 0) return;

  const fireDelay = def.fireDelay / (state.player.powerBoost > 0 ? 1.25 : 1);
  if (state.elapsed - weapon.lastShotAt < fireDelay) return;
  if (weapon.clip <= 0) {
    startReload(state.player.activeWeapon);
    return;
  }

  weapon.lastShotAt = state.elapsed;
  weapon.clip -= 1;

  const muzzleX = GAME.width * 0.58;
  const muzzleY = GAME.height * 0.85;
  const aimX = state.cursor.x + rand(-def.spread, def.spread);
  const aimY = state.cursor.y + rand(-def.spread, def.spread);

  addTracer(muzzleX, muzzleY, aimX, aimY, def.tracer, state.player.activeWeapon === "rifle" ? 3 : 2);
  state.effects.push({
    kind: "muzzle",
    x: state.player.x,
    y: 0,
    z: state.player.z + 90,
    screenX: muzzleX,
    screenY: muzzleY,
    time: 0,
    ttl: 0.12,
    size: 70,
  });

  const hitEnemy = state.enemies
    .filter((enemy) => pointHitsEnemy(aimX, aimY, enemy))
    .sort((a, b) => a.z - b.z)[0];

  if (hitEnemy) {
    damageEnemy(hitEnemy, def.damage, hitEnemy.x, hitEnemy.z);
  }

  if (weapon.clip <= 0) {
    startReload(state.player.activeWeapon);
  }
}

function damageEnemy(enemy, amount, sparkX, sparkZ) {
  const finalDamage = amount * (state.player.powerBoost > 0 ? 1.35 : 1);
  enemy.health -= finalDamage;

  state.effects.push({
    kind: "spark",
    x: sparkX,
    y: enemy.type === "gunship" ? enemy.y : 80,
    z: sparkZ,
    time: 0,
    ttl: 0.18,
    size: 100,
  });

  if (enemy.health <= 0) {
    killEnemy(enemy);
  }
}

function spawnPickup(type, x, z) {
  state.pickups.push({
    type,
    x,
    y: 0,
    z,
    life: 18,
    bob: rand(0, Math.PI * 2),
  });
}

function killEnemy(enemy) {
  state.score += enemy.score;
  state.effects.push({
    kind: "blast",
    x: enemy.x,
    y: enemy.type === "gunship" ? enemy.y : 80,
    z: enemy.z,
    time: 0,
    ttl: enemy.type === "gunship" ? 0.9 : 0.4,
    size: enemy.type === "gunship" ? 320 : 140,
  });

  if (enemy.type === "gunship") {
    state.victory = true;
    setMessage("Gunship destroyed. Sector secure. Press Enter to replay.");
    return;
  }

  const dropTable = ["ammo", "ammo", "medkit", "power", "grenade"];
  if (Math.random() < 0.36) {
    spawnPickup(choose(dropTable), enemy.x, enemy.z);
  }
}

function updateEnemy(enemy, dt) {
  enemy.animationTime += dt;

  if (enemy.type === "gunship") {
    enemy.sway += dt;
    enemy.x = Math.sin(enemy.sway * 0.75) * 210;
    enemy.z = state.player.z + 1180 + Math.sin(enemy.sway * 1.4) * 80;
    enemy.y = 210 + Math.sin(enemy.sway * 1.7) * 25;
  } else {
    const drift = Math.sin(enemy.animationTime * 1.6 + enemy.sway) * 18;
    enemy.x += drift * dt;
    enemy.z -= enemy.speed * dt;
  }

  enemy.fireCooldown -= dt;
  if (enemy.fireCooldown <= 0) {
    enemy.fireCooldown = rand(...ENEMY_DEFS[enemy.type].fireRate);
    enemyShoot(enemy);
  }

  if (enemy.type !== "gunship" && enemy.z < state.player.z + 80) {
    state.player.health = clamp(state.player.health - 20 * dt, 0, state.player.maxHealth);
  }
}

function enemyShoot(enemy) {
  const projection = worldToScreen(enemy.x, enemy.y, enemy.z);
  if (!projection) return;

  const aimX = GAME.width / 2 + rand(-34, 34);
  const aimY = GAME.height * 0.72 + rand(-28, 24);
  addTracer(projection.x, projection.y - projection.scale * enemy.height * 0.7, aimX, aimY, "#ff8a63", 2, 0.12);

  const dodgeFactor = clamp(Math.abs(state.player.x - enemy.x) / 280, 0, 0.45);
  const missChance = 0.18 + dodgeFactor + (state.keys.size > 0 ? 0.08 : 0);
  if (Math.random() > missChance) {
    state.player.health = clamp(state.player.health - enemy.damage, 0, state.player.maxHealth);
    state.flash = 0.14;
  }
}

function updateEnemies(dt) {
  state.enemies.forEach((enemy) => updateEnemy(enemy, dt));
  state.enemies = state.enemies.filter((enemy) => enemy.health > 0 && enemy.z < state.player.z + 2600);
}

function updatePickups(dt) {
  const survivors = [];

  state.pickups.forEach((pickup) => {
    pickup.life -= dt;
    pickup.bob += dt * 3;
    if (pickup.life <= 0) return;

    const d = distance2d(pickup.x, pickup.z, state.player.x, state.player.z + 80);
    if (d < 80) {
      if (pickup.type === "ammo") {
        state.player.weapons.rifle.reserve += 8;
        state.player.weapons.auto.reserve += 20;
        setMessage("Ammo recovered.");
      }
      if (pickup.type === "medkit") {
        state.player.medkits = clamp(state.player.medkits + 1, 0, 6);
        setMessage("Medkit collected.");
      }
      if (pickup.type === "power") {
        state.player.powerBoost = 10;
        state.player.movementBoost = 10;
        setMessage("Power core active. Faster movement and stronger shots.");
      }
      if (pickup.type === "grenade") {
        state.player.grenades = clamp(state.player.grenades + 2, 0, 8);
        setMessage("Grenades restocked.");
      }
    } else {
      survivors.push(pickup);
    }
  });

  state.pickups = survivors;
}

function updateWeaponReloads(dt) {
  Object.keys(state.player.weapons).forEach((key) => {
    const weapon = state.player.weapons[key];
    if (weapon.reloadTimer > 0) {
      weapon.reloadTimer = Math.max(0, weapon.reloadTimer - dt);
      if (weapon.reloadTimer === 0) {
        finishReload(key);
      }
    }
  });
}

function updateVisualEffects(dt) {
  state.tracers.forEach((tracer) => {
    tracer.ttl -= dt;
  });
  state.tracers = state.tracers.filter((tracer) => tracer.ttl > 0);

  state.effects.forEach((effect) => {
    effect.time += dt;
  });
  state.effects = state.effects.filter((effect) => effect.time < effect.ttl);

  state.messagePulse = Math.max(0, state.messagePulse - dt * 0.5);
  state.flash = Math.max(0, state.flash - dt);
}

function updateTimers(dt) {
  state.player.powerBoost = Math.max(0, state.player.powerBoost - dt);
  state.player.movementBoost = Math.max(0, state.player.movementBoost - dt);
}

function updateGameState() {
  if (state.player.health <= 0 && !state.gameOver) {
    state.gameOver = true;
    setMessage("Mission failed. Press Enter to restart.");
  }
}

function updateUI() {
  ui.waveValue.textContent = state.bossSpawned && !state.victory ? "Boss" : state.wave;
  ui.scoreValue.textContent = Math.floor(state.score);
  ui.healthValue.textContent = Math.ceil(state.player.health);

  const active = currentWeaponState();
  const backup = state.player.weapons[backupWeaponKey()];
  ui.weaponName.textContent = WEAPONS[state.player.activeWeapon].label;
  ui.weaponAmmo.textContent = `${active.clip} / ${active.reserve}`;
  ui.backupName.textContent = WEAPONS[backupWeaponKey()].label;
  ui.backupAmmo.textContent = `${backup.clip} / ${backup.reserve}`;
  ui.medkitValue.textContent = state.player.medkits;
  ui.grenadeValue.textContent = state.player.grenades;
}

function update(dt) {
  if (state.paused) {
    updateVisualEffects(dt);
    return;
  }

  state.elapsed += dt;

  if (!state.gameOver && !state.victory) {
    applyMovement(dt);
    updateWaveFlow(dt);
    maybeSpawnEnemy(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateWeaponReloads(dt);
    updateTimers(dt);

    if (state.mouseDown) {
      fireWeapon();
    }
  }

  updateVisualEffects(dt);
  updateGameState();
  updateUI();
}

function drawSkyAndGround() {
  const sky = ctx.createLinearGradient(0, 0, 0, GAME.floorY);
  sky.addColorStop(0, "#102339");
  sky.addColorStop(0.52, "#47637b");
  sky.addColorStop(0.53, "#b36a51");
  sky.addColorStop(1, "#513521");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME.width, GAME.height);

  ctx.fillStyle = "#27374b";
  ctx.beginPath();
  ctx.moveTo(0, GAME.horizonY + 20);
  ctx.lineTo(180, GAME.horizonY - 25);
  ctx.lineTo(360, GAME.horizonY + 16);
  ctx.lineTo(560, GAME.horizonY - 18);
  ctx.lineTo(740, GAME.horizonY + 10);
  ctx.lineTo(920, GAME.horizonY - 28);
  ctx.lineTo(1100, GAME.horizonY + 20);
  ctx.lineTo(1280, GAME.horizonY - 6);
  ctx.lineTo(1280, GAME.height);
  ctx.lineTo(0, GAME.height);
  ctx.closePath();
  ctx.fill();

  const roadGradient = ctx.createLinearGradient(0, GAME.horizonY, 0, GAME.height);
  roadGradient.addColorStop(0, "#7a4e34");
  roadGradient.addColorStop(1, "#332518");
  ctx.fillStyle = roadGradient;
  ctx.fillRect(0, GAME.horizonY, GAME.width, GAME.height - GAME.horizonY);

  // Perspective guide lines help sell the first-person effect.
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let i = -5; i <= 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(GAME.width / 2 + i * 50, GAME.horizonY);
    ctx.lineTo(GAME.width / 2 + i * 170 + (state.player.x * -0.45), GAME.height);
    ctx.stroke();
  }

  for (let band = 0; band < 8; band += 1) {
    const t = band / 8;
    const y = lerp(GAME.horizonY + 24, GAME.height, t * t);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME.width, y);
    ctx.stroke();
  }
}

function drawPickups() {
  state.pickups.forEach((pickup) => {
    const projected = worldToScreen(pickup.x, 18 + Math.sin(pickup.bob) * 5, pickup.z);
    if (!projected) return;

    const size = clamp(60 * projected.scale, 20, 72);
    const frameName = pickup.type === "medkit" ? "medkit" : pickup.type;
    drawSprite("units", frameName, 0, projected.x, projected.y, size, size);
  });
}

function drawEnemy(enemy) {
  const projected = worldToScreen(enemy.x, enemy.y, enemy.z);
  if (!projected) return;

  const width = enemy.width * projected.scale;
  const height = enemy.height * projected.scale;
  const frameIndex = Math.floor(enemy.animationTime * (enemy.type === "gunship" ? 8 : 6)) % 4;

  if (enemy.type === "gunship") {
    drawSprite("vehicles", "gunship", frameIndex, projected.x, projected.y, width, height);
  } else {
    drawSprite("units", ENEMY_DEFS[enemy.type].sprite, frameIndex, projected.x, projected.y, width, height);
  }

  drawHealthBar(projected.x, projected.y - height - 10, clamp(width * 0.55, 40, 160), enemy.health / enemy.maxHealth);
}

function drawHealthBar(x, y, width, ratio) {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x - width / 2, y, width, 8);
  ctx.fillStyle = "#72e6b2";
  ctx.fillRect(x - width / 2 + 1, y + 1, (width - 2) * clamp(ratio, 0, 1), 6);
}

function drawEnemies() {
  const sorted = [...state.enemies].sort((a, b) => b.z - a.z);
  sorted.forEach(drawEnemy);
}

function drawWorldEffects() {
  state.effects.forEach((effect) => {
    const alpha = 1 - effect.time / effect.ttl;

    if (effect.screenX !== undefined) {
      drawSprite("fx", effect.kind, Math.floor((effect.time / effect.ttl) * 3.9), effect.screenX, effect.screenY, effect.size, effect.size, alpha);
      return;
    }

    const projected = worldToScreen(effect.x, effect.y, effect.z);
    if (!projected) return;
    const size = clamp(effect.size * projected.scale, 28, effect.size);
    drawSprite("fx", effect.kind, Math.floor((effect.time / effect.ttl) * 3.9), projected.x, projected.y, size, size, alpha);
  });

  state.tracers.forEach((tracer) => {
    ctx.save();
    ctx.globalAlpha = tracer.ttl / tracer.maxTtl;
    ctx.strokeStyle = tracer.color;
    ctx.lineWidth = tracer.width;
    ctx.beginPath();
    ctx.moveTo(tracer.x1, tracer.y1);
    ctx.lineTo(tracer.x2, tracer.y2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawWeaponOverlay() {
  const swayX = Math.sin(state.player.bob) * 14;
  const swayY = Math.abs(Math.cos(state.player.bob * 0.5)) * 8;
  const frameName = state.player.activeWeapon === "rifle" ? "rifle" : "auto";
  drawSprite("weapon", frameName, 0, GAME.width * 0.74 + swayX, GAME.height + 30 + swayY, 620, 350);
}

function drawHudOverlay() {
  const crossPulse = 12 + Math.sin(state.elapsed * 7) * 1.5;
  ctx.strokeStyle = "#eaf7ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(state.cursor.x, state.cursor.y, crossPulse, 0, Math.PI * 2);
  ctx.moveTo(state.cursor.x - 20, state.cursor.y);
  ctx.lineTo(state.cursor.x - 7, state.cursor.y);
  ctx.moveTo(state.cursor.x + 7, state.cursor.y);
  ctx.lineTo(state.cursor.x + 20, state.cursor.y);
  ctx.moveTo(state.cursor.x, state.cursor.y - 20);
  ctx.lineTo(state.cursor.x, state.cursor.y - 7);
  ctx.moveTo(state.cursor.x, state.cursor.y + 7);
  ctx.lineTo(state.cursor.x, state.cursor.y + 20);
  ctx.stroke();

  drawLabel(GAME.width / 2, 34, state.message, state.messagePulse > 0 ? "#ffffff" : "#d7eaff");

  if (currentWeaponState().reloadTimer > 0) {
    drawLabel(GAME.width / 2, GAME.height - 46, "Reloading", "#ffe1c9");
  }

  if (state.player.powerBoost > 0) {
    drawLabel(142, 72, `Power ${Math.ceil(state.player.powerBoost)}s`, "#c8ffe6");
  }

  if (state.bossSpawned && !state.victory) {
    const boss = state.enemies.find((enemy) => enemy.type === "gunship");
    if (boss) {
      ctx.fillStyle = "rgba(0,0,0,0.52)";
      ctx.fillRect(220, 58, 840, 18);
      ctx.fillStyle = "#ff8b5d";
      ctx.fillRect(223, 61, 834 * clamp(boss.health / boss.maxHealth, 0, 1), 12);
    }
  }

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 96, 76, ${state.flash * 0.45})`;
    ctx.fillRect(0, 0, GAME.width, GAME.height);
  }

  if (state.paused) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, GAME.width, GAME.height);
    drawLabel(GAME.width / 2, GAME.height / 2, "Paused", "#ffffff");
  }

  if (state.gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.56)";
    ctx.fillRect(0, 0, GAME.width, GAME.height);
    drawLabel(GAME.width / 2, GAME.height / 2 - 24, "Mission Failed", "#ffc3b1");
    drawLabel(GAME.width / 2, GAME.height / 2 + 14, "Press Enter to restart", "#ffffff");
  }

  if (state.victory) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
    ctx.fillRect(0, 0, GAME.width, GAME.height);
    drawLabel(GAME.width / 2, GAME.height / 2 - 24, "Victory", "#caffde");
    drawLabel(GAME.width / 2, GAME.height / 2 + 14, "Press Enter to play again", "#ffffff");
  }
}

function drawLabel(x, y, text, color) {
  ctx.font = "16px Segoe UI";
  const width = ctx.measureText(text).width + 18;
  ctx.fillStyle = "rgba(8, 15, 24, 0.72)";
  ctx.fillRect(x - width / 2, y - 14, width, 26);
  ctx.strokeStyle = "rgba(111, 208, 255, 0.22)";
  ctx.strokeRect(x - width / 2, y - 14, width, 26);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y + 4);
}

function render() {
  drawSkyAndGround();
  drawPickups();
  drawEnemies();
  drawWorldEffects();
  drawWeaponOverlay();
  drawHudOverlay();
}

function loop(time) {
  if (!state.lastTime) state.lastTime = time;
  const dt = clamp((time - state.lastTime) / 1000, 0, 0.033);
  state.lastTime = time;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = GAME.width / rect.width;
  const scaleY = GAME.height / rect.height;
  state.cursor.x = clamp((event.clientX - rect.left) * scaleX, 0, GAME.width);
  state.cursor.y = clamp((event.clientY - rect.top) * scaleY, 0, GAME.height);
});

canvas.addEventListener("mousedown", () => {
  state.mouseDown = true;
  fireWeapon();
});

window.addEventListener("mouseup", () => {
  state.mouseDown = false;
});

window.addEventListener("keydown", (event) => {
  if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
    state.keys.add(event.code);
  }

  if (event.code === "KeyQ") useMedkit();
  if (event.code === "KeyE") useGrenade();

  if (event.key === "1") {
    state.player.activeWeapon = "rifle";
    setMessage("Ranger rifle selected.");
  }

  if (event.key === "2") {
    state.player.activeWeapon = "auto";
    setMessage("Auto rifle selected.");
  }

  if (event.code === "KeyR") {
    startReload(state.player.activeWeapon);
  }

  if (event.code === "KeyP") {
    state.paused = !state.paused;
    if (!state.paused) {
      state.lastTime = performance.now();
    }
  }

  if (event.code === "Enter" && (state.gameOver || state.victory)) {
    resetGame();
  }
});

window.addEventListener("keyup", (event) => {
  state.keys.delete(event.code);
});

async function boot() {
  resetGame();
  const [units, vehicles, fx, weapon] = await Promise.all([
    loadImage(SPRITES.units.src),
    loadImage(SPRITES.vehicles.src),
    loadImage(SPRITES.fx.src),
    loadImage(SPRITES.weapon.src),
  ]);

  state.assets.units = units;
  state.assets.vehicles = vehicles;
  state.assets.fx = fx;
  state.assets.weapon = weapon;
  updateUI();
  requestAnimationFrame(loop);
}

boot().catch((error) => {
  console.error("Asset load failed", error);
  setMessage("The sprite files could not be loaded.");
});
