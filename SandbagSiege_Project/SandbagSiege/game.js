/*
  Sandbag Siege
  -------------
  This file is written as a teaching example.

  Big ideas for students:
  1. A game is just data that changes over time.
  2. We update the data many times each second.
  3. After each update, we draw the newest picture.
  4. Small helper functions make a large program easier to understand.
*/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const ui = {
  waveValue: document.getElementById("waveValue"),
  scoreValue: document.getElementById("scoreValue"),
  healthValue: document.getElementById("healthValue"),
  weaponName: document.getElementById("weaponName"),
  weaponAmmo: document.getElementById("weaponAmmo"),
  supportName: document.getElementById("supportName"),
  supportAmmo: document.getElementById("supportAmmo"),
  grenadeCount: document.getElementById("grenadeCount"),
  missionText: document.getElementById("missionText"),
};

const GAME = {
  width: canvas.width,
  height: canvas.height,
  horizonY: 280,
  midY: 460,
  groundY: 610,
  sandbagY: 592,
  centerX: canvas.width / 2,
  durationPerWave: 30,
};

const COLORS = {
  amber: "#ffbf57",
  red: "#ff6e52",
  green: "#77f0ad",
  blue: "#79c9ff",
  white: "#fff6dc",
  shadow: "#05070b",
};

const WEAPON_DEFS = {
  sniper: {
    label: "Sniper Rifle",
    fireDelay: 460,
    damage: 34,
    magazineSize: 8,
    reserveSize: 40,
    reloadTime: 1300,
    spread: 4,
    tracerColor: "#ffe8a6",
    impactRadius: 0,
    pickupAmmo: 8,
  },
  machineGun: {
    label: "Machine Gun",
    fireDelay: 85,
    damage: 8,
    magazineSize: 50,
    reserveSize: 240,
    reloadTime: 1550,
    spread: 16,
    tracerColor: "#ffd377",
    impactRadius: 0,
    pickupAmmo: 36,
  },
  flamethrower: {
    label: "Flamethrower",
    fireDelay: 70,
    damage: 4,
    magazineSize: 90,
    reserveSize: 180,
    reloadTime: 1200,
    spread: 36,
    tracerColor: "#ff8b47",
    impactRadius: 95,
    range: 260,
    pickupAmmo: 40,
  },
  missileLauncher: {
    label: "Missile Launcher",
    fireDelay: 780,
    damage: 56,
    magazineSize: 4,
    reserveSize: 16,
    reloadTime: 1800,
    spread: 6,
    tracerColor: "#ffc46b",
    impactRadius: 120,
    pickupAmmo: 2,
  },
  grenadeLauncher: {
    label: "Grenade Launcher",
    fireDelay: 620,
    damage: 36,
    magazineSize: 6,
    reserveSize: 18,
    reloadTime: 1700,
    spread: 10,
    tracerColor: "#ffad63",
    impactRadius: 95,
    pickupAmmo: 3,
  },
};

const SUPPORT_ROTATION = [
  "machineGun",
  "flamethrower",
  "missileLauncher",
  "grenadeLauncher",
];

const SPRITES = {
  units: {
    src: "assets/units.svg",
    cellW: 32,
    cellH: 32,
    frames: {
      soldier: [
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
      player: [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
      ],
      ammoPickup: [[0, 3]],
      healthPickup: [[1, 3]],
      powerPickup: [[2, 3]],
      supportPickup: [[3, 3]],
    },
  },
  vehicles: {
    src: "assets/vehicles.svg",
    cellW: 64,
    cellH: 48,
    frames: {
      jeep: [
        [0, 0],
        [1, 0],
      ],
      truck: [
        [2, 0],
        [3, 0],
      ],
      tank: [
        [0, 1],
        [1, 1],
      ],
      helicopter: [
        [2, 1],
        [3, 1],
      ],
      gunship: [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
      ],
    },
  },
  effects: {
    src: "assets/effects.svg",
    cellW: 32,
    cellH: 32,
    frames: {
      muzzle: [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      spark: [
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      blast: [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
      ],
      flame: [
        [0, 3],
        [1, 3],
        [2, 3],
        [3, 3],
      ],
    },
  },
};

const state = {
  lastTime: 0,
  elapsed: 0,
  paused: false,
  score: 0,
  wave: 1,
  stageTimer: 0,
  bossSpawned: false,
  gameOver: false,
  victory: false,
  mouseDown: false,
  cursor: { x: GAME.width * 0.6, y: GAME.height * 0.45 },
  dustOffset: 0,
  messageFlash: 0,
  message: "Hold the ridge.",
  spawnClock: 0,
  pickups: [],
  enemies: [],
  projectiles: [],
  tracers: [],
  effects: [],
  particles: [],
  backgroundFlash: 0,
  player: {
    health: 100,
    maxHealth: 100,
    hiddenAmount: 1,
    targetHiddenAmount: 1,
    activeSlot: "sniper",
    supportKey: "machineGun",
    grenades: 5,
    unlockedSupport: new Set(["machineGun"]),
    reloadText: "",
    fireBoostTimer: 0,
    damageBoostTimer: 0,
    weapons: {},
  },
  assets: {},
};

const infantrySpots = [140, 250, 360, 490, 620, 760, 900, 1040, 1160];

function createWeaponState(key) {
  const def = WEAPON_DEFS[key];
  return {
    key,
    clip: def.magazineSize,
    reserve: def.reserveSize,
    reloadTimer: 0,
    lastShotAt: -9999,
  };
}

function resetGame() {
  state.lastTime = 0;
  state.elapsed = 0;
  state.score = 0;
  state.wave = 1;
  state.stageTimer = 0;
  state.bossSpawned = false;
  state.gameOver = false;
  state.victory = false;
  state.spawnClock = 0;
  state.pickups = [];
  state.enemies = [];
  state.projectiles = [];
  state.tracers = [];
  state.effects = [];
  state.particles = [];
  state.message = "Hold the ridge.";
  state.messageFlash = 0;
  state.backgroundFlash = 0;

  state.player.health = 100;
  state.player.hiddenAmount = 1;
  state.player.targetHiddenAmount = 1;
  state.player.activeSlot = "sniper";
  state.player.supportKey = "machineGun";
  state.player.grenades = 5;
  state.player.unlockedSupport = new Set(["machineGun"]);
  state.player.fireBoostTimer = 0;
  state.player.damageBoostTimer = 0;
  state.player.weapons = {};

  Object.keys(WEAPON_DEFS).forEach((key) => {
    state.player.weapons[key] = createWeaponState(key);
  });

  // Locked weapons start with zero reserve until the player earns the crate.
  state.player.weapons.flamethrower.clip = 0;
  state.player.weapons.flamethrower.reserve = 0;
  state.player.weapons.missileLauncher.clip = 0;
  state.player.weapons.missileLauncher.reserve = 0;
  state.player.weapons.grenadeLauncher.clip = 0;
  state.player.weapons.grenadeLauncher.reserve = 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function distance(aX, aY, bX, bY) {
  return Math.hypot(aX - bX, aY - bY);
}

function currentWeaponKey() {
  return state.player.activeSlot === "sniper" ? "sniper" : state.player.supportKey;
}

function currentWeaponState() {
  return state.player.weapons[currentWeaponKey()];
}

function currentWeaponDef() {
  return WEAPON_DEFS[currentWeaponKey()];
}

function supportWeaponState() {
  return state.player.weapons[state.player.supportKey];
}

function setMissionText(text) {
  state.message = text;
  state.messageFlash = 1;
  ui.missionText.textContent = text;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function addTracer(x1, y1, x2, y2, color, width, ttl = 0.12) {
  state.tracers.push({ x1, y1, x2, y2, color, width, ttl, maxTtl: ttl });
}

function addEffect(kind, x, y, size, life, options = {}) {
  state.effects.push({
    kind,
    x,
    y,
    size,
    life,
    maxLife: life,
    frameOffset: options.frameOffset || 0,
  });
}

function addParticle(x, y, color, speedX, speedY, life, size) {
  state.particles.push({ x, y, color, speedX, speedY, life, maxLife: life, size });
}

function spawnPickup(type, x, y) {
  state.pickups.push({
    type,
    x,
    y,
    age: 0,
    bobSeed: rand(0, Math.PI * 2),
  });
}

function makeInfantry(type) {
  const x = pick(infantrySpots) + rand(-18, 18);
  const baseY = rand(315, 405);
  const hp = type === "soldier" ? 30 : 24;

  return {
    id: `enemy-${Math.random().toString(36).slice(2)}`,
    group: "infantry",
    type,
    x,
    y: baseY + 28,
    baseY,
    width: 78,
    height: 78,
    hp,
    maxHp: hp,
    damage: type === "sniper" ? 18 : 8,
    speed: 0,
    exposedAmount: 0,
    frameClock: rand(0, 0.4),
    attackCooldown: rand(0.8, 1.8),
    lifeClock: rand(0, 1.8),
    telegraph: 0,
    scoreValue: type === "sniper" ? 160 : 100,
  };
}

function makeVehicle(type) {
  const fromLeft = Math.random() > 0.5;
  const startX = fromLeft ? -120 : GAME.width + 120;
  const speed = fromLeft ? rand(90, 135) : -rand(90, 135);
  const y = rand(430, 515);
  const config = {
    jeep: { hp: 55, damage: 10, score: 160 },
    truck: { hp: 80, damage: 12, score: 220 },
    tank: { hp: 180, damage: 20, score: 350 },
    helicopter: { hp: 110, damage: 15, score: 260 },
  }[type];

  return {
    id: `enemy-${Math.random().toString(36).slice(2)}`,
    group: type === "helicopter" ? "air" : "vehicle",
    type,
    x: startX,
    y,
    width: type === "helicopter" ? 132 : 148,
    height: type === "helicopter" ? 88 : 82,
    hp: config.hp,
    maxHp: config.hp,
    damage: config.damage,
    speed,
    exposedAmount: 1,
    frameClock: rand(0, 0.5),
    attackCooldown: rand(0.4, 1.5),
    lifeClock: 0,
    telegraph: 0,
    scoreValue: config.score,
  };
}

function makeBoss() {
  return {
    id: "boss-gunship",
    group: "boss",
    type: "gunship",
    x: GAME.width / 2,
    y: 180,
    width: 280,
    height: 160,
    hp: 760,
    maxHp: 760,
    damage: 16,
    speed: 65,
    exposedAmount: 1,
    frameClock: 0,
    attackCooldown: 0.8,
    lifeClock: 0,
    telegraph: 0,
    scoreValue: 1500,
    driftAngle: 0,
  };
}

function maybeSpawnEnemy(dt) {
  if (state.bossSpawned || state.gameOver || state.victory) {
    return;
  }

  state.spawnClock -= dt;
  if (state.spawnClock > 0) {
    return;
  }

  const wave = state.wave;
  const choices = [];

  choices.push("soldier", "soldier", "soldier");
  if (wave >= 2) choices.push("sniper", "jeep");
  if (wave >= 3) choices.push("truck", "helicopter");
  if (wave >= 4) choices.push("tank", "sniper");

  const pickType = pick(choices);
  if (pickType === "soldier" || pickType === "sniper") {
    state.enemies.push(makeInfantry(pickType));
  } else {
    state.enemies.push(makeVehicle(pickType));
  }

  const minimumGap = Math.max(0.35, 1.2 - wave * 0.12);
  state.spawnClock = rand(minimumGap, minimumGap + 0.65);
}

function updateWaveFlow(dt) {
  if (state.gameOver || state.victory) {
    return;
  }

  state.stageTimer += dt;
  const timeLeft = GAME.durationPerWave - state.stageTimer;

  if (state.wave <= 4) {
    if (timeLeft < 10 && timeLeft > 9.4) {
      setMissionText(`Wave ${state.wave}: ${Math.ceil(timeLeft)} seconds until the next push.`);
    }
  }

  if (state.wave <= 4 && state.stageTimer >= GAME.durationPerWave) {
    state.stageTimer = 0;

    if (state.wave < 4) {
      state.wave += 1;
      setMissionText(`Wave ${state.wave} incoming. More armour is rolling in.`);
    } else if (!state.bossSpawned) {
      state.bossSpawned = true;
      state.enemies.push(makeBoss());
      setMissionText("Boss incoming: Iron Vulture gunship. Stay mobile and break its attack rhythm.");
    }
  }
}

function cycleSupportWeapon() {
  const unlocked = SUPPORT_ROTATION.filter((key) => state.player.unlockedSupport.has(key));
  const currentIndex = unlocked.indexOf(state.player.supportKey);
  if (unlocked.length <= 1) {
    return;
  }

  const nextIndex = (currentIndex + 1) % unlocked.length;
  state.player.supportKey = unlocked[nextIndex];
  if (state.player.activeSlot !== "sniper") {
    setMissionText(`Support slot changed to ${WEAPON_DEFS[state.player.supportKey].label}.`);
  }
}

function toggleCover() {
  state.player.targetHiddenAmount = state.player.targetHiddenAmount > 0.5 ? 0 : 1;
}

function startReload(weaponKey) {
  const weapon = state.player.weapons[weaponKey];
  const def = WEAPON_DEFS[weaponKey];

  if (weapon.reloadTimer > 0) return;
  if (weapon.reserve <= 0) return;
  if (weapon.clip >= def.magazineSize) return;

  weapon.reloadTimer = def.reloadTime / 1000;
  state.player.reloadText = `Reloading ${def.label}`;
}

function finishReload(weaponKey) {
  const weapon = state.player.weapons[weaponKey];
  const def = WEAPON_DEFS[weaponKey];
  const needed = def.magazineSize - weapon.clip;
  const amount = Math.min(needed, weapon.reserve);
  weapon.clip += amount;
  weapon.reserve -= amount;
  state.player.reloadText = "";
}

function awardSupportWeapon(key) {
  state.player.unlockedSupport.add(key);
  const weapon = state.player.weapons[key];
  const def = WEAPON_DEFS[key];
  weapon.reserve += def.pickupAmmo * 2;
  if (weapon.clip === 0) {
    const grant = Math.min(def.magazineSize, weapon.reserve);
    weapon.clip += grant;
    weapon.reserve -= grant;
  }
  setMissionText(`${def.label} unlocked for the support slot. Press Q to cycle weapons.`);
}

function collectPickup(pickup) {
  if (pickup.type === "ammo") {
    state.player.weapons.sniper.reserve += 6;
    state.player.weapons.machineGun.reserve += 20;
    supportWeaponState().reserve += 10;
    setMissionText("Ammo recovered. Stay exposed for a moment to collect battlefield supplies.");
  }

  if (pickup.type === "health") {
    state.player.health = clamp(state.player.health + 18, 0, state.player.maxHealth);
    setMissionText("Medical pack collected.");
  }

  if (pickup.type === "power") {
    const effectType = Math.random() > 0.5 ? "damage" : "fire";
    if (effectType === "damage") {
      state.player.damageBoostTimer = 12;
      setMissionText("Damage boost active. Your shots hit harder for 12 seconds.");
    } else {
      state.player.fireBoostTimer = 12;
      setMissionText("Rapid fire active. Your weapon cycles faster for 12 seconds.");
    }
  }

  if (pickup.type === "support") {
    const locked = SUPPORT_ROTATION.filter((key) => !state.player.unlockedSupport.has(key));
    if (locked.length) {
      awardSupportWeapon(pick(locked));
    } else {
      state.player.grenades = clamp(state.player.grenades + 2, 0, 9);
      setMissionText("Extra grenade bundle collected.");
    }
  }

  addEffect("spark", pickup.x, pickup.y, 42, 0.25);
}

function splashDamage(x, y, radius, damage) {
  state.enemies.forEach((enemy) => {
    const d = distance(enemy.x, enemy.y, x, y);
    if (d < radius) {
      const scale = 1 - d / radius;
      damageEnemy(enemy, damage * scale, x, y);
    }
  });
}

function damageEnemy(enemy, amount, impactX, impactY) {
  const boostedDamage = state.player.damageBoostTimer > 0 ? amount * 1.35 : amount;
  enemy.hp -= boostedDamage;
  addEffect("spark", impactX, impactY, enemy.group === "boss" ? 54 : 30, 0.18);
  addParticle(impactX, impactY, "#ffeec8", rand(-50, 50), rand(-80, -10), 0.25, rand(2, 4));

  if (enemy.hp <= 0) {
    killEnemy(enemy);
  }
}

function killEnemy(enemy) {
  state.score += enemy.scoreValue;
  addEffect("blast", enemy.x, enemy.y, enemy.group === "boss" ? 160 : 78, enemy.group === "boss" ? 0.8 : 0.42);
  for (let i = 0; i < 10; i += 1) {
    addParticle(
      enemy.x,
      enemy.y,
      i % 2 === 0 ? "#ff9d56" : "#ffd46f",
      rand(-180, 180),
      rand(-220, -30),
      rand(0.2, 0.7),
      rand(2, 6),
    );
  }

  if (enemy.group === "boss") {
    state.victory = true;
    setMissionText("Boss destroyed. The ridge holds. Press Enter to play again.");
  } else if (Math.random() < 0.34) {
    const pickupTable = ["ammo", "ammo", "health", "power", "support"];
    spawnPickup(pick(pickupTable), enemy.x, enemy.y);
  }
}

function getMuzzlePosition() {
  const hidden = state.player.hiddenAmount;
  const rise = (1 - hidden) * 94;
  return {
    x: GAME.centerX + 18,
    y: GAME.sandbagY - 24 - rise,
  };
}

function fireHitscan(weaponKey, muzzle) {
  const def = WEAPON_DEFS[weaponKey];
  const spread = rand(-def.spread, def.spread);
  const targetX = state.cursor.x + spread;
  const targetY = state.cursor.y + spread * 0.25;
  addTracer(muzzle.x, muzzle.y, targetX, targetY, def.tracerColor, weaponKey === "sniper" ? 4 : 2);

  const candidates = state.enemies
    .filter((enemy) => pointInsideEnemy(targetX, targetY, enemy))
    .sort((a, b) => a.y - b.y);

  if (weaponKey === "flamethrower") {
    addEffect("flame", lerp(muzzle.x, targetX, 0.45), lerp(muzzle.y, targetY, 0.45), 66, 0.18);
    state.enemies.forEach((enemy) => {
      const d = distance(enemy.x, enemy.y, targetX, targetY);
      if (d < def.range * 0.38) {
        damageEnemy(enemy, def.damage, enemy.x, enemy.y);
      }
    });
    return;
  }

  if (weaponKey === "sniper") {
    candidates.slice(0, 2).forEach((enemy) => damageEnemy(enemy, def.damage, targetX, targetY));
    return;
  }

  if (candidates[0]) {
    damageEnemy(candidates[0], def.damage, targetX, targetY);
  } else if (weaponKey === "machineGun" && Math.random() < 0.18) {
    // Machine guns feel better when a miss still kicks up dust.
    addEffect("spark", targetX, targetY, 18, 0.12);
  }
}

function fireArcProjectile(weaponKey, muzzle) {
  const def = WEAPON_DEFS[weaponKey];
  const targetX = state.cursor.x + rand(-def.spread, def.spread);
  const targetY = state.cursor.y + rand(-def.spread, def.spread);
  const timeToTarget = weaponKey === "missileLauncher" ? 0.45 : 0.6;

  state.projectiles.push({
    owner: "player",
    weaponKey,
    x: muzzle.x,
    y: muzzle.y,
    startX: muzzle.x,
    startY: muzzle.y,
    targetX,
    targetY,
    progress: 0,
    timeToTarget,
    blastRadius: def.impactRadius,
    damage: def.damage,
  });
}

function tryShoot() {
  if (state.gameOver || state.victory || state.paused) return;
  if (state.player.hiddenAmount > 0.55) return;

  const weaponKey = currentWeaponKey();
  const weapon = state.player.weapons[weaponKey];
  const def = WEAPON_DEFS[weaponKey];
  const fireDelay = def.fireDelay / 1000 / (state.player.fireBoostTimer > 0 ? 1.45 : 1);

  if (weapon.reloadTimer > 0) return;
  if (state.elapsed - weapon.lastShotAt < fireDelay) return;

  if (weapon.clip <= 0) {
    startReload(weaponKey);
    return;
  }

  weapon.lastShotAt = state.elapsed;
  weapon.clip -= 1;
  const muzzle = getMuzzlePosition();
  addEffect("muzzle", muzzle.x + 10, muzzle.y, 34, 0.1);

  if (weaponKey === "missileLauncher" || weaponKey === "grenadeLauncher") {
    fireArcProjectile(weaponKey, muzzle);
  } else {
    fireHitscan(weaponKey, muzzle);
  }

  if (weapon.clip <= 0) {
    startReload(weaponKey);
  }
}

function throwGrenade() {
  if (state.gameOver || state.victory || state.paused) return;
  if (state.player.hiddenAmount > 0.6) return;
  if (state.player.grenades <= 0) return;

  state.player.grenades -= 1;
  const muzzle = getMuzzlePosition();

  state.projectiles.push({
    owner: "player",
    weaponKey: "grenade",
    x: muzzle.x,
    y: muzzle.y,
    startX: muzzle.x,
    startY: muzzle.y,
    targetX: state.cursor.x,
    targetY: state.cursor.y,
    progress: 0,
    timeToTarget: 0.72,
    blastRadius: 110,
    damage: 48,
  });
}

function pointInsideEnemy(x, y, enemy) {
  const halfW = enemy.width * 0.38;
  const halfH = enemy.height * 0.42;
  return (
    x > enemy.x - halfW &&
    x < enemy.x + halfW &&
    y > enemy.y - halfH &&
    y < enemy.y + halfH
  );
}

function makeEnemyShot(enemy, options = {}) {
  const targetX = GAME.centerX + rand(-70, 70);
  const exposedPenalty = state.player.hiddenAmount > 0.6 ? 0.22 : 1;
  const damage = enemy.damage * exposedPenalty;

  state.projectiles.push({
    owner: "enemy",
    x: enemy.x,
    y: enemy.y - 6,
    targetX,
    targetY: GAME.sandbagY - 30,
    speedX: (targetX - enemy.x) / rand(0.28, 0.55),
    speedY: (GAME.sandbagY - 30 - enemy.y) / rand(0.28, 0.55),
    damage,
    life: 1.1,
    tint: options.tint || "#ff7b68",
    blastRadius: options.blastRadius || 0,
  });
}

function updatePlayer(dt) {
  state.player.hiddenAmount = lerp(
    state.player.hiddenAmount,
    state.player.targetHiddenAmount,
    clamp(dt * 9, 0, 1),
  );

  state.player.fireBoostTimer = Math.max(0, state.player.fireBoostTimer - dt);
  state.player.damageBoostTimer = Math.max(0, state.player.damageBoostTimer - dt);

  Object.keys(state.player.weapons).forEach((key) => {
    const weapon = state.player.weapons[key];
    if (weapon.reloadTimer > 0) {
      weapon.reloadTimer = Math.max(0, weapon.reloadTimer - dt);
      if (weapon.reloadTimer === 0) {
        finishReload(key);
      }
    }
  });

  if (state.mouseDown) {
    tryShoot();
  }
}

function updateInfantry(enemy, dt) {
  enemy.lifeClock += dt;
  enemy.frameClock += dt;
  enemy.exposedAmount = 0.5 + Math.sin(enemy.lifeClock * 2.2) * 0.5;
  enemy.y = enemy.baseY + (1 - enemy.exposedAmount) * 28;
  enemy.attackCooldown -= dt;

  if (enemy.type === "sniper") {
    if (enemy.attackCooldown < 0.6 && enemy.attackCooldown > 0.05) {
      enemy.telegraph = 1;
    } else {
      enemy.telegraph = 0;
    }
  }

  if (enemy.attackCooldown <= 0) {
    makeEnemyShot(enemy, { tint: enemy.type === "sniper" ? "#ff4560" : "#ff9570" });
    enemy.attackCooldown = enemy.type === "sniper" ? rand(2.1, 3.4) : rand(1.2, 2.4);
  }
}

function updateVehicle(enemy, dt) {
  enemy.lifeClock += dt;
  enemy.frameClock += dt;
  enemy.x += enemy.speed * dt;

  if (enemy.type === "helicopter") {
    enemy.y += Math.sin(enemy.lifeClock * 3) * 18 * dt;
  }

  if (
    enemy.x < -260 ||
    enemy.x > GAME.width + 260
  ) {
    enemy.hp = -1;
    return;
  }

  enemy.attackCooldown -= dt;
  if (enemy.attackCooldown <= 0) {
    const isHeavy = enemy.type === "tank" || enemy.type === "helicopter";
    makeEnemyShot(enemy, {
      tint: isHeavy ? "#ffbf57" : "#ff7b68",
      blastRadius: enemy.type === "tank" ? 48 : 0,
    });
    enemy.attackCooldown =
      enemy.type === "tank"
        ? rand(1.8, 2.8)
        : enemy.type === "helicopter"
          ? rand(0.9, 1.6)
          : rand(1.1, 2);
  }
}

function updateBoss(enemy, dt) {
  enemy.lifeClock += dt;
  enemy.frameClock += dt;
  enemy.driftAngle += dt;
  enemy.x = GAME.centerX + Math.sin(enemy.driftAngle * 0.7) * 240;
  enemy.y = 180 + Math.sin(enemy.driftAngle * 1.4) * 26;
  enemy.attackCooldown -= dt;

  if (enemy.attackCooldown <= 0) {
    for (let i = -1; i <= 1; i += 1) {
      makeEnemyShot(
        { ...enemy, x: enemy.x + i * 70, y: enemy.y + 14, damage: enemy.damage },
        { tint: "#ffb066", blastRadius: i === 0 ? 28 : 0 },
      );
    }
    enemy.attackCooldown = rand(0.65, 1.15);
  }
}

function updateEnemies(dt) {
  state.enemies.forEach((enemy) => {
    if (enemy.group === "infantry") updateInfantry(enemy, dt);
    if (enemy.group === "vehicle" || enemy.group === "air") updateVehicle(enemy, dt);
    if (enemy.group === "boss") updateBoss(enemy, dt);
  });

  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
}

function updateProjectiles(dt) {
  const remaining = [];

  state.projectiles.forEach((projectile) => {
    if (projectile.owner === "player") {
      projectile.progress += dt / projectile.timeToTarget;
      const arcHeight = projectile.weaponKey === "missileLauncher" ? 18 : 80;
      projectile.x = lerp(projectile.startX, projectile.targetX, projectile.progress);
      projectile.y =
        lerp(projectile.startY, projectile.targetY, projectile.progress) -
        Math.sin(Math.min(1, projectile.progress) * Math.PI) * arcHeight;

      if (projectile.progress >= 1) {
        addEffect("blast", projectile.targetX, projectile.targetY, projectile.blastRadius, 0.36);
        splashDamage(projectile.targetX, projectile.targetY, projectile.blastRadius, projectile.damage);
        state.backgroundFlash = 0.18;
      } else {
        remaining.push(projectile);
      }
      return;
    }

    projectile.x += projectile.speedX * dt;
    projectile.y += projectile.speedY * dt;
    projectile.life -= dt;
    addTracer(
      projectile.x,
      projectile.y,
      projectile.x - projectile.speedX * dt * 0.2,
      projectile.y - projectile.speedY * dt * 0.2,
      projectile.tint,
      projectile.blastRadius > 0 ? 3 : 2,
      0.05,
    );

    if (projectile.life <= 0 || projectile.y >= GAME.sandbagY - 10) {
      const directHit = state.player.hiddenAmount < 0.45 ? projectile.damage : projectile.damage * 0.35;
      state.player.health = clamp(
        state.player.health - directHit - (projectile.blastRadius > 0 ? 5 : 0),
        0,
        state.player.maxHealth,
      );
      addEffect("blast", projectile.x, projectile.y, projectile.blastRadius > 0 ? 68 : 36, 0.28);
      state.backgroundFlash = 0.12;
    } else {
      remaining.push(projectile);
    }
  });

  state.projectiles = remaining;
}

function updatePickups(dt) {
  state.pickups.forEach((pickup) => {
    pickup.age += dt;

    if (state.player.hiddenAmount < 0.45) {
      pickup.x = lerp(pickup.x, GAME.centerX, clamp(dt * 1.9, 0, 1));
      pickup.y = lerp(pickup.y, GAME.sandbagY - 48, clamp(dt * 1.9, 0, 1));
    }
  });

  const survivors = [];
  state.pickups.forEach((pickup) => {
    if (pickup.age > 12) {
      return;
    }

    const closeEnough = distance(pickup.x, pickup.y, GAME.centerX, GAME.sandbagY - 48) < 24;
    if (closeEnough && state.player.hiddenAmount < 0.45) {
      collectPickup(pickup);
    } else {
      survivors.push(pickup);
    }
  });
  state.pickups = survivors;
}

function updateEffects(dt) {
  state.effects.forEach((effect) => {
    effect.life -= dt;
  });
  state.effects = state.effects.filter((effect) => effect.life > 0);

  state.tracers.forEach((tracer) => {
    tracer.ttl -= dt;
  });
  state.tracers = state.tracers.filter((tracer) => tracer.ttl > 0);

  state.particles.forEach((particle) => {
    particle.x += particle.speedX * dt;
    particle.y += particle.speedY * dt;
    particle.speedY += 220 * dt;
    particle.life -= dt;
  });
  state.particles = state.particles.filter((particle) => particle.life > 0);

  state.backgroundFlash = Math.max(0, state.backgroundFlash - dt);
  state.messageFlash = Math.max(0, state.messageFlash - dt * 0.6);
}

function checkGameState() {
  if (state.player.health <= 0 && !state.gameOver) {
    state.gameOver = true;
    setMissionText("The ridge was overrun. Press Enter to try again.");
  }
}

function updateUI() {
  ui.waveValue.textContent = state.bossSpawned && !state.victory ? "Boss" : state.wave;
  ui.scoreValue.textContent = Math.floor(state.score);
  ui.healthValue.textContent = Math.ceil(state.player.health);

  const activeKey = currentWeaponKey();
  const activeState = state.player.weapons[activeKey];
  ui.weaponName.textContent = WEAPON_DEFS[activeKey].label;
  ui.weaponAmmo.textContent = `${activeState.clip} / ${activeState.reserve}`;

  const supportState = supportWeaponState();
  ui.supportName.textContent = WEAPON_DEFS[state.player.supportKey].label;
  ui.supportAmmo.textContent = `${supportState.clip} / ${supportState.reserve}`;

  ui.grenadeCount.textContent = state.player.grenades;
}

function update(dt) {
  if (state.paused) return;
  if (state.gameOver || state.victory) {
    updateEffects(dt);
    updateUI();
    return;
  }

  state.elapsed += dt;
  state.dustOffset += dt * 30;
  updateWaveFlow(dt);
  maybeSpawnEnemy(dt);
  updatePlayer(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updatePickups(dt);
  updateEffects(dt);
  checkGameState();
  updateUI();
}

function drawSprite(sheetKey, frameListKey, frameIndex, x, y, width, height, options = {}) {
  const sheet = SPRITES[sheetKey];
  const image = state.assets[sheetKey];
  if (!image) return;

  const frames = sheet.frames[frameListKey];
  const frame = frames[frameIndex % frames.length];
  const sx = frame[0] * sheet.cellW;
  const sy = frame[1] * sheet.cellH;
  ctx.save();
  if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
  if (options.flipX) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    x = 0;
  }
  ctx.drawImage(
    image,
    sx,
    sy,
    sheet.cellW,
    sheet.cellH,
    x - width / 2,
    y - height / 2,
    width,
    height,
  );
  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME.height);
  gradient.addColorStop(0, "#11274e");
  gradient.addColorStop(0.5, "#c86b38");
  gradient.addColorStop(1, "#6c4022");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME.width, GAME.height);

  ctx.fillStyle = "#6a3e28";
  ctx.beginPath();
  ctx.moveTo(0, GAME.horizonY + 70);
  ctx.lineTo(100, GAME.horizonY + 25);
  ctx.lineTo(260, GAME.horizonY + 90);
  ctx.lineTo(470, GAME.horizonY + 35);
  ctx.lineTo(630, GAME.horizonY + 115);
  ctx.lineTo(860, GAME.horizonY + 40);
  ctx.lineTo(1030, GAME.horizonY + 98);
  ctx.lineTo(1180, GAME.horizonY + 48);
  ctx.lineTo(GAME.width, GAME.horizonY + 88);
  ctx.lineTo(GAME.width, GAME.height);
  ctx.lineTo(0, GAME.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#9a6438";
  ctx.fillRect(0, GAME.midY, GAME.width, GAME.height - GAME.midY);

  for (let i = 0; i < 8; i += 1) {
    const x = ((i * 180 - state.dustOffset * 0.7) % (GAME.width + 120)) - 60;
    ctx.fillStyle = "rgba(255, 232, 177, 0.08)";
    ctx.beginPath();
    ctx.arc(x, GAME.midY + 90 + (i % 2) * 35, 42 + (i % 3) * 12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#564633";
  ctx.fillRect(0, GAME.sandbagY + 10, GAME.width, GAME.height - GAME.sandbagY);
}

function drawSandbags() {
  const bagY = GAME.sandbagY;
  for (let row = 0; row < 2; row += 1) {
    for (let i = 0; i < 13; i += 1) {
      const x = GAME.centerX - 240 + i * 38 + (row % 2) * 16;
      const y = bagY - row * 22;
      ctx.fillStyle = row === 0 ? "#d7a56a" : "#bf8957";
      ctx.fillRect(x, y, 32, 18);
      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      ctx.fillRect(x, y + 12, 32, 6);
    }
  }
}

function drawPlayer() {
  const hidden = state.player.hiddenAmount;
  const rise = (1 - hidden) * 94;
  const playerFrame = Math.min(3, Math.floor((1 - hidden) * 3.99));
  drawSprite("units", "player", playerFrame, GAME.centerX, GAME.sandbagY - 18 - rise, 128, 128);

  if (state.player.reloadText) {
    drawLabel(GAME.centerX, GAME.sandbagY - 150 - rise, state.player.reloadText, "#ffe19b");
  }
}

function drawEnemy(enemy) {
  const isFacingLeft = enemy.speed > 0;
  if (enemy.group === "infantry") {
    const frameKey = enemy.type === "sniper" ? "sniper" : "soldier";
    const frameIndex = Math.floor(enemy.frameClock * 8) % 4;
    drawSprite("units", frameKey, frameIndex, enemy.x, enemy.y, enemy.width, enemy.height, {
      flipX: enemy.x > GAME.centerX,
    });

    if (enemy.telegraph > 0) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = "#ff4560";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - 6);
      ctx.lineTo(GAME.centerX, GAME.sandbagY - 30);
      ctx.stroke();
      ctx.restore();
    }
  } else {
    const frameKey = enemy.type === "gunship" ? "gunship" : enemy.type;
    const frames = SPRITES.vehicles.frames[frameKey].length;
    const frameIndex = Math.floor(enemy.frameClock * (enemy.type === "helicopter" ? 10 : 4)) % frames;
    drawSprite("vehicles", frameKey, frameIndex, enemy.x, enemy.y, enemy.width, enemy.height, {
      flipX: enemy.type === "helicopter" ? enemy.x > GAME.centerX : isFacingLeft,
    });
  }

  if (enemy.group === "boss" || enemy.group === "vehicle" || enemy.group === "air") {
    drawHealthBar(enemy.x, enemy.y - enemy.height * 0.55, 90, enemy.hp / enemy.maxHp, enemy.group === "boss");
  }
}

function drawHealthBar(x, y, width, ratio, isBoss = false) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(x - width / 2, y, width, isBoss ? 10 : 7);
  ctx.fillStyle = isBoss ? "#ff6e52" : "#77f0ad";
  ctx.fillRect(x - width / 2 + 1, y + 1, (width - 2) * clamp(ratio, 0, 1), (isBoss ? 10 : 7) - 2);
}

function drawPickups() {
  state.pickups.forEach((pickup) => {
    const bob = Math.sin(pickup.age * 4 + pickup.bobSeed) * 6;
    const frameMap = {
      ammo: "ammoPickup",
      health: "healthPickup",
      power: "powerPickup",
      support: "supportPickup",
    };
    drawSprite("units", frameMap[pickup.type], 0, pickup.x, pickup.y + bob, 58, 58);
  });
}

function drawProjectiles() {
  state.projectiles.forEach((projectile) => {
    if (projectile.owner === "player") {
      ctx.fillStyle = projectile.weaponKey === "missileLauncher" ? "#ffcf72" : "#f9d28f";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.weaponKey === "grenade" ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawEffects() {
  state.tracers.forEach((tracer) => {
    ctx.save();
    ctx.globalAlpha = clamp(tracer.ttl / tracer.maxTtl, 0, 1);
    ctx.strokeStyle = tracer.color;
    ctx.lineWidth = tracer.width;
    ctx.beginPath();
    ctx.moveTo(tracer.x1, tracer.y1);
    ctx.lineTo(tracer.x2, tracer.y2);
    ctx.stroke();
    ctx.restore();
  });

  state.effects.forEach((effect) => {
    const alpha = clamp(effect.life / effect.maxLife, 0, 1);
    const frameIndex = Math.floor((1 - alpha) * 3.99) + effect.frameOffset;
    drawSprite(
      "effects",
      effect.kind,
      frameIndex,
      effect.x,
      effect.y,
      effect.size,
      effect.size,
      { alpha },
    );
  });

  state.particles.forEach((particle) => {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    ctx.globalAlpha = 1;
  });
}

function drawCrosshair() {
  const pulse = 8 + Math.sin(state.elapsed * 6) * 2;
  ctx.strokeStyle = state.player.hiddenAmount > 0.55 ? "rgba(255,255,255,0.25)" : COLORS.white;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(state.cursor.x, state.cursor.y, pulse, 0, Math.PI * 2);
  ctx.moveTo(state.cursor.x - 16, state.cursor.y);
  ctx.lineTo(state.cursor.x - 5, state.cursor.y);
  ctx.moveTo(state.cursor.x + 5, state.cursor.y);
  ctx.lineTo(state.cursor.x + 16, state.cursor.y);
  ctx.moveTo(state.cursor.x, state.cursor.y - 16);
  ctx.lineTo(state.cursor.x, state.cursor.y - 5);
  ctx.moveTo(state.cursor.x, state.cursor.y + 5);
  ctx.lineTo(state.cursor.x, state.cursor.y + 16);
  ctx.stroke();
}

function drawLabel(x, y, text, color) {
  ctx.font = "16px Trebuchet MS";
  const width = ctx.measureText(text).width + 16;
  ctx.fillStyle = "rgba(5, 7, 11, 0.74)";
  ctx.fillRect(x - width / 2, y - 14, width, 24);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.strokeRect(x - width / 2, y - 14, width, 24);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y + 3);
}

function drawOverlays() {
  if (state.backgroundFlash > 0) {
    ctx.fillStyle = `rgba(255, 230, 164, ${state.backgroundFlash * 0.35})`;
    ctx.fillRect(0, 0, GAME.width, GAME.height);
  }

  drawLabel(GAME.centerX, 36, state.message, state.messageFlash > 0 ? "#fff5cf" : "#f1d9aa");

  if (state.bossSpawned && !state.victory) {
    const boss = state.enemies.find((enemy) => enemy.group === "boss");
    if (boss) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(240, 60, 800, 18);
      ctx.fillStyle = "#ff6e52";
      ctx.fillRect(243, 63, 794 * clamp(boss.hp / boss.maxHp, 0, 1), 12);
      drawLabel(GAME.centerX, 54, "Iron Vulture Gunship", "#ffd5c6");
    }
  }

  if (state.paused) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, GAME.width, GAME.height);
    drawLabel(GAME.centerX, GAME.height / 2, "Paused", "#fff5cf");
  }

  if (state.gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    ctx.fillRect(0, 0, GAME.width, GAME.height);
    drawLabel(GAME.centerX, GAME.height / 2 - 24, "Mission Failed", "#ffb8a6");
    drawLabel(GAME.centerX, GAME.height / 2 + 12, "Press Enter to restart", "#fff5cf");
  }

  if (state.victory) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
    ctx.fillRect(0, 0, GAME.width, GAME.height);
    drawLabel(GAME.centerX, GAME.height / 2 - 24, "Victory", "#bfffcf");
    drawLabel(GAME.centerX, GAME.height / 2 + 12, "Press Enter to defend the ridge again", "#fff5cf");
  }
}

function render() {
  drawBackground();
  drawPickups();

  const sortedEnemies = [...state.enemies].sort((a, b) => a.y - b.y);
  sortedEnemies.forEach(drawEnemy);

  drawProjectiles();
  drawSandbags();
  drawPlayer();
  drawEffects();
  drawCrosshair();
  drawOverlays();
}

function loop(timeStamp) {
  if (!state.lastTime) {
    state.lastTime = timeStamp;
  }

  const dt = clamp((timeStamp - state.lastTime) / 1000, 0, 0.033);
  state.lastTime = timeStamp;

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
  tryShoot();
});

window.addEventListener("mouseup", () => {
  state.mouseDown = false;
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    toggleCover();
  }

  if (event.key === "1") {
    state.player.activeSlot = "sniper";
    setMissionText("Sniper rifle ready.");
  }

  if (event.key === "2") {
    state.player.activeSlot = "support";
    setMissionText(`${WEAPON_DEFS[state.player.supportKey].label} ready.`);
  }

  if (event.key.toLowerCase() === "q") {
    cycleSupportWeapon();
  }

  if (event.key.toLowerCase() === "r") {
    startReload(currentWeaponKey());
  }

  if (event.key.toLowerCase() === "g") {
    throwGrenade();
  }

  if (event.key.toLowerCase() === "p") {
    state.paused = !state.paused;
    if (!state.paused) {
      state.lastTime = performance.now();
    }
  }

  if (event.key === "Enter" && (state.gameOver || state.victory)) {
    resetGame();
  }
});

async function boot() {
  resetGame();

  const [units, vehicles, effects] = await Promise.all([
    loadImage(SPRITES.units.src),
    loadImage(SPRITES.vehicles.src),
    loadImage(SPRITES.effects.src),
  ]);

  state.assets.units = units;
  state.assets.vehicles = vehicles;
  state.assets.effects = effects;

  updateUI();
  setMissionText("Hold the ridge. Pop up, shoot, duck, and scavenge the battlefield.");
  requestAnimationFrame(loop);
}

boot().catch((error) => {
  console.error("Failed to load game assets:", error);
  setMissionText("Asset loading failed. Check the sprite files in the assets folder.");
});
