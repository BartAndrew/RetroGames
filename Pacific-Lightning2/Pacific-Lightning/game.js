const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const keys = new Set();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rand = (min, max) => Math.random() * (max - min) + min;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const spriteManifest = {
  player: { src: "assets/pacific-lightning-player-sprites.png", columns: 6 },
  enemy: { src: "assets/pacific-lightning-enemy-sprites.png", columns: 8 },
  boss: { src: "assets/pacific-lightning-boss-sprites.png", columns: 5 },
  ship: { src: "assets/pacific-lightning-ship-sprites.png", columns: 4 },
  projectiles: { src: "assets/pacific-lightning-projectiles-powerups.png", columns: 10 },
  explosions: { src: "assets/pacific-lightning-explosions.png", columns: 8 },
  hud: { src: "assets/pacific-lightning-hud-icons.png", columns: 6 }
};

const sprites = Object.fromEntries(
  Object.entries(spriteManifest).map(([key, data]) => {
    const image = new Image();
    image.src = data.src;
    return [key, { ...data, image, ready: false }];
  })
);

Object.values(sprites).forEach((sheet) => {
  sheet.image.addEventListener("load", () => {
    sheet.ready = true;
  });
});

let elapsed = 0;
let enemySpawnTimer = 0;
let shipSpawnTimer = 0;
let powerUpTimer = 7;
let bossCooldown = 0;
let oceanOffset = 0;
let flashTimer = 0;

const state = {
  mode: "title",
  score: 0,
  wave: 1,
  kills: 0,
  bombs: 3,
  lives: 3,
  player: null,
  bullets: [],
  enemyBullets: [],
  enemies: [],
  ships: [],
  powerUps: [],
  particles: [],
  explosions: [],
  boss: null,
  message: "Press Enter to Launch",
  highScore: 0
};

function createPlayer() {
  return {
    x: WIDTH / 2,
    y: HEIGHT - 110,
    w: 54,
    h: 74,
    speed: 260,
    fireRate: 0.17,
    fireCooldown: 0,
    hp: 100,
    maxHp: 100,
    shield: 0,
    shieldTimer: 0,
    weapon: "single",
    weaponTimer: 0,
    invulnerable: 2.2,
    bank: 0
  };
}

function resetGame() {
  elapsed = 0;
  enemySpawnTimer = 0.5;
  shipSpawnTimer = 4.5;
  powerUpTimer = 6;
  bossCooldown = 24;
  oceanOffset = 0;
  flashTimer = 0;
  state.mode = "playing";
  state.score = 0;
  state.wave = 1;
  state.kills = 0;
  state.bombs = 3;
  state.lives = 3;
  state.player = createPlayer();
  state.bullets = [];
  state.enemyBullets = [];
  state.enemies = [];
  state.ships = [];
  state.powerUps = [];
  state.particles = [];
  state.explosions = [];
  state.boss = null;
  state.message = "";
}

function addExplosion(x, y, color = "#ffb347", size = 18, count = 18) {
  state.explosions.push({
    x,
    y,
    age: 0,
    duration: clamp(0.34 + size * 0.006, 0.28, 0.72),
    size: clamp(size * 2.3, 24, 128)
  });

  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: rand(-1, 1) * size * 0.9,
      vy: rand(-1.4, 1.1) * size * 0.9,
      life: rand(0.28, 0.8),
      maxLife: rand(0.28, 0.8),
      size: rand(2, 5),
      color
    });
  }
}

function spawnEnemy(kind = "fighter") {
  const x = rand(50, WIDTH - 50);
  if (kind === "fighter") {
    const special = Math.random() > 0.86;
    state.enemies.push({
      kind,
      variant: special ? "kamikaze" : "standard",
      x,
      y: -50,
      w: 34,
      h: 42,
      hp: special ? 14 + state.wave : 18 + state.wave * 2,
      speed: special ? 168 + state.wave * 10 : 120 + state.wave * 8,
      fireTimer: rand(0.5, 1.4),
      drift: rand(-1.2, 1.2),
      score: special ? 170 : 120
    });
  } else {
    const special = Math.random() > 0.72;
    state.enemies.push({
      kind: "heavy",
      variant: special ? "elite" : "standard",
      x,
      y: -60,
      w: 48,
      h: 52,
      hp: special ? 62 + state.wave * 5 : 46 + state.wave * 4,
      speed: special ? 108 + state.wave * 6 : 90 + state.wave * 5,
      fireTimer: rand(0.45, 0.95),
      drift: rand(-0.8, 0.8),
      score: special ? 360 : 260
    });
  }
}

function spawnShip() {
  const lane = Math.random() > 0.5 ? 130 : WIDTH - 130;
  const variants = [0, 1, 3];
  state.ships.push({
    x: lane,
    y: -120,
    w: 112,
    h: 150,
    hp: 120 + state.wave * 10,
    speed: 46 + state.wave * 1.5,
    fireTimer: 1.4,
    score: 500,
    variant: variants[Math.floor(Math.random() * variants.length)]
  });
}

function spawnPowerUp() {
  const types = ["spread", "beam", "shield"];
  const type = types[Math.floor(Math.random() * types.length)];
  state.powerUps.push({
    type,
    x: rand(50, WIDTH - 50),
    y: -30,
    w: 24,
    h: 24,
    speed: 80,
    spin: rand(0, Math.PI * 2)
  });
}

function spawnBoss() {
  state.boss = {
    x: WIDTH / 2,
    y: -140,
    targetY: 120,
    w: 230,
    h: 154,
    hp: 900 + state.wave * 100,
    maxHp: 900 + state.wave * 100,
    fireTimer: 0.9,
    vx: 100,
    score: 6000
  };
  state.message = `Ace Squadron Incoming - Wave ${state.wave}`;
}

function makeBullet(x, y, vx, vy, damage, spriteFrame, size, color) {
  return { x, y, vx, vy, damage, spriteFrame, size, color };
}

function firePlayerWeapon() {
  const player = state.player;
  if (!player || player.fireCooldown > 0) {
    return;
  }

  if (player.weapon === "spread") {
    state.bullets.push(makeBullet(player.x, player.y - 30, 0, -450, 12, 1, 20, "#ffcf5a"));
    state.bullets.push(makeBullet(player.x - 12, player.y - 28, -120, -420, 10, 1, 20, "#ff8a3d"));
    state.bullets.push(makeBullet(player.x + 12, player.y - 28, 120, -420, 10, 1, 20, "#ff8a3d"));
  } else if (player.weapon === "beam") {
    state.bullets.push(makeBullet(player.x, player.y - 34, 0, -620, 22, 2, 24, "#73e0ff"));
    state.bullets.push(makeBullet(player.x - 16, player.y - 16, 0, -520, 10, 2, 18, "#73e0ff"));
    state.bullets.push(makeBullet(player.x + 16, player.y - 16, 0, -520, 10, 2, 18, "#73e0ff"));
  } else {
    state.bullets.push(makeBullet(player.x, player.y - 30, 0, -470, 12, 0, 18, "#fff3a1"));
    state.bullets.push(makeBullet(player.x - 16, player.y - 16, 0, -430, 7, 1, 16, "#ffd166"));
    state.bullets.push(makeBullet(player.x + 16, player.y - 16, 0, -430, 7, 1, 16, "#ffd166"));
  }

  player.fireCooldown = player.weapon === "beam" ? 0.12 : player.fireRate;
}

function fireBomb() {
  if (state.mode !== "playing" || state.bombs <= 0) {
    return;
  }
  state.bombs -= 1;
  flashTimer = 0.22;
  addExplosion(WIDTH / 2, HEIGHT / 2, "#ffd166", 55, 36);
  state.enemies.forEach((enemy) => { enemy.hp -= 999; });
  state.ships.forEach((ship) => { ship.hp -= 70; });
  if (state.boss) {
    state.boss.hp -= 180;
  }
  state.enemyBullets = [];
}

function enemyFire(x, y, pattern = "straight") {
  if (pattern === "spread") {
    state.enemyBullets.push(makeBullet(x, y, -100, 240, 14, 4, 22, "#ff746c"));
    state.enemyBullets.push(makeBullet(x, y, 0, 270, 14, 4, 22, "#ff746c"));
    state.enemyBullets.push(makeBullet(x, y, 100, 240, 14, 4, 22, "#ff746c"));
    return;
  }
  const player = state.player;
  const aimX = player ? clamp((player.x - x) * 0.7, -110, 110) : 0;
  state.enemyBullets.push(makeBullet(x, y, aimX, 260, 11, 3, 18, "#ff5d73"));
}

function damagePlayer(amount) {
  const player = state.player;
  if (!player || player.invulnerable > 0) {
    return;
  }

  if (player.shield > 0) {
    player.shield = Math.max(0, player.shield - amount * 1.4);
    player.shieldTimer = 0.2;
  } else {
    player.hp -= amount;
  }

  player.invulnerable = 0.8;
  flashTimer = 0.1;
  addExplosion(player.x, player.y, "#ffffff", 18, 10);

  if (player.hp <= 0) {
    state.lives -= 1;
    addExplosion(player.x, player.y, "#ff8a3d", 28, 30);
    if (state.lives <= 0) {
      state.highScore = Math.max(state.highScore, state.score);
      state.mode = "gameover";
      state.message = "Mission Lost";
      return;
    }
    state.player = createPlayer();
    state.player.weapon = "single";
  }
}

function updatePlayer(dt) {
  const player = state.player;
  if (!player) {
    return;
  }

  const horizontal = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
  const vertical = (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);
  const magnitude = Math.hypot(horizontal, vertical) || 1;

  player.x += (horizontal / magnitude) * player.speed * dt;
  player.y += (vertical / magnitude) * player.speed * dt;
  player.x = clamp(player.x, 30, WIDTH - 30);
  player.y = clamp(player.y, 70, HEIGHT - 40);
  player.bank = horizontal;

  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.shieldTimer = Math.max(0, player.shieldTimer - dt);

  if (player.weapon !== "single") {
    player.weaponTimer -= dt;
    if (player.weaponTimer <= 0) {
      player.weapon = "single";
      state.message = "Weapon Power Faded";
    }
  }

  if (keys.has(" ") || keys.has("Space")) {
    firePlayerWeapon();
  }
}

function updateBullets(collection, dt) {
  for (let i = collection.length - 1; i >= 0; i -= 1) {
    const bullet = collection[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    if (bullet.y < -40 || bullet.y > HEIGHT + 40 || bullet.x < -40 || bullet.x > WIDTH + 40) {
      collection.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    enemy.y += enemy.speed * dt;
    enemy.x += Math.sin((elapsed + i) * 2.4) * enemy.drift;
    enemy.fireTimer -= dt;

    if (enemy.fireTimer <= 0) {
      enemyFire(enemy.x, enemy.y + enemy.h / 2, enemy.kind === "heavy" ? "spread" : "straight");
      enemy.fireTimer = enemy.kind === "heavy" ? rand(0.75, 1.1) : rand(0.95, 1.6);
    }

    if (enemy.y > HEIGHT + 50) {
      state.enemies.splice(i, 1);
      continue;
    }

    if (state.player && dist(enemy, state.player) < 28) {
      damagePlayer(enemy.kind === "heavy" ? 28 : 16);
      enemy.hp = 0;
    }

    if (enemy.hp <= 0) {
      state.score += enemy.score;
      state.kills += 1;
      addExplosion(enemy.x, enemy.y, enemy.kind === "heavy" ? "#ff8a3d" : "#ffd166", enemy.kind === "heavy" ? 24 : 16);
      state.enemies.splice(i, 1);
    }
  }
}

function updateShips(dt) {
  for (let i = state.ships.length - 1; i >= 0; i -= 1) {
    const ship = state.ships[i];
    ship.y += ship.speed * dt;
    ship.fireTimer -= dt;

    if (ship.fireTimer <= 0) {
      enemyFire(ship.x - 18, ship.y + 10, "straight");
      enemyFire(ship.x + 18, ship.y + 10, "straight");
      ship.fireTimer = 1.25;
    }

    if (state.player && Math.abs(ship.y - state.player.y) < 56 && Math.abs(ship.x - state.player.x) < 48) {
      damagePlayer(24);
    }

    if (ship.y > HEIGHT + 120) {
      state.ships.splice(i, 1);
      continue;
    }

    if (ship.hp <= 0) {
      state.score += ship.score;
      addExplosion(ship.x, ship.y, "#ff8a3d", 32, 28);
      state.ships.splice(i, 1);
    }
  }
}

function updateBoss(dt) {
  const boss = state.boss;
  if (!boss) {
    return;
  }

  if (boss.y < boss.targetY) {
    boss.y += 40 * dt;
  } else {
    boss.x += boss.vx * dt;
    if (boss.x < 110 || boss.x > WIDTH - 110) {
      boss.vx *= -1;
    }
    boss.fireTimer -= dt;
    if (boss.fireTimer <= 0) {
      enemyFire(boss.x - 40, boss.y + 20, "spread");
      enemyFire(boss.x, boss.y + 35, "spread");
      enemyFire(boss.x + 40, boss.y + 20, "spread");
      boss.fireTimer = boss.hp < boss.maxHp * 0.45 ? 0.48 : 0.78;
    }
  }

  if (state.player && dist(state.player, boss) < 72) {
    damagePlayer(34);
  }

  if (boss.hp <= 0) {
    state.score += boss.score;
    addExplosion(boss.x, boss.y, "#ffd166", 46, 60);
    state.wave += 1;
    state.boss = null;
    bossCooldown = Math.max(18, 25 - state.wave * 1.1);
    state.message = `Wave ${state.wave} Cleared`;
    state.bombs = Math.min(5, state.bombs + 1);
  }
}

function handleBulletHits() {
  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.bullets[i];
    let hit = false;

    for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
      const enemy = state.enemies[j];
      if (Math.abs(bullet.x - enemy.x) < enemy.w / 2 && Math.abs(bullet.y - enemy.y) < enemy.h / 2) {
        enemy.hp -= bullet.damage;
        hit = true;
        break;
      }
    }

    if (!hit) {
      for (let j = state.ships.length - 1; j >= 0; j -= 1) {
        const ship = state.ships[j];
        if (Math.abs(bullet.x - ship.x) < ship.w / 2 && Math.abs(bullet.y - ship.y) < ship.h / 2) {
          ship.hp -= bullet.damage;
          hit = true;
          break;
        }
      }
    }

    if (!hit && state.boss) {
      const boss = state.boss;
      if (Math.abs(bullet.x - boss.x) < boss.w / 2 && Math.abs(bullet.y - boss.y) < boss.h / 2) {
        boss.hp -= bullet.damage;
        hit = true;
      }
    }

    if (hit) {
      addExplosion(bullet.x, bullet.y, bullet.color, 8, 4);
      state.bullets.splice(i, 1);
    }
  }

  for (let i = state.enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.enemyBullets[i];
    if (state.player && Math.abs(bullet.x - state.player.x) < 18 && Math.abs(bullet.y - state.player.y) < 24) {
      damagePlayer(bullet.damage);
      state.enemyBullets.splice(i, 1);
    }
  }
}

function updatePowerUps(dt) {
  for (let i = state.powerUps.length - 1; i >= 0; i -= 1) {
    const item = state.powerUps[i];
    item.y += item.speed * dt;
    item.spin += dt * 4;

    if (item.y > HEIGHT + 30) {
      state.powerUps.splice(i, 1);
      continue;
    }

    if (state.player && Math.abs(item.x - state.player.x) < 22 && Math.abs(item.y - state.player.y) < 24) {
      if (item.type === "shield") {
        state.player.shield = Math.min(100, state.player.shield + 65);
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 25);
        state.message = "Shield Restored";
      } else {
        state.player.weapon = item.type;
        state.player.weaponTimer = 12;
        state.message = item.type === "spread" ? "Twin V Spread Online" : "Beam Cannon Engaged";
      }
      addExplosion(item.x, item.y, item.type === "shield" ? "#ffd166" : "#73e0ff", 12, 12);
      state.powerUps.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const particle = state.particles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
    particle.vx *= 0.98;
    particle.vy *= 0.98;
    if (particle.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function updateExplosions(dt) {
  for (let i = state.explosions.length - 1; i >= 0; i -= 1) {
    const blast = state.explosions[i];
    blast.age += dt;
    if (blast.age >= blast.duration) {
      state.explosions.splice(i, 1);
    }
  }
}

function step(dt) {
  if (state.mode !== "playing") {
    return;
  }

  elapsed += dt;
  oceanOffset = (oceanOffset + 90 * dt) % HEIGHT;
  flashTimer = Math.max(0, flashTimer - dt);

  if (!state.boss) {
    enemySpawnTimer -= dt;
    shipSpawnTimer -= dt;
    powerUpTimer -= dt;
    bossCooldown -= dt;

    if (enemySpawnTimer <= 0) {
      spawnEnemy(Math.random() > 0.78 ? "heavy" : "fighter");
      enemySpawnTimer = Math.max(0.35, 1.05 - state.wave * 0.05);
    }

    if (shipSpawnTimer <= 0 && elapsed > 8) {
      spawnShip();
      shipSpawnTimer = rand(8.5, 13);
    }

    if (powerUpTimer <= 0) {
      spawnPowerUp();
      powerUpTimer = rand(11, 16);
    }

    if (bossCooldown <= 0) {
      spawnBoss();
    }
  }

  updatePlayer(dt);
  updateBullets(state.bullets, dt);
  updateBullets(state.enemyBullets, dt);
  updateEnemies(dt);
  updateShips(dt);
  updateBoss(dt);
  handleBulletHits();
  updatePowerUps(dt);
  updateParticles(dt);
  updateExplosions(dt);
}

function getFrame(sheet, index) {
  const width = sheet.image.width / sheet.columns;
  const height = sheet.image.height;
  return {
    sx: Math.floor(index * width),
    sy: 0,
    sw: Math.floor(width),
    sh: height
  };
}

function drawFrame(sheetName, frameIndex, x, y, width, height, options = {}) {
  const sheet = sprites[sheetName];
  if (!sheet || !sheet.ready) {
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
    return;
  }

  const { sx, sy, sw, sh } = getFrame(sheet, frameIndex);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.drawImage(sheet.image, sx, sy, sw, sh, -width / 2, -height / 2, width, height);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawHudIcon(frame, x, y, size = 20) {
  drawFrame("hud", frame, x, y, size, size);
}

function drawOcean() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#1f5371");
  sky.addColorStop(0.25, "#184661");
  sky.addColorStop(1, "#0c2131");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 18; i += 1) {
    const y = (i * 48 + oceanOffset) % (HEIGHT + 48) - 48;
    ctx.fillRect(0, y, WIDTH, 3);
  }

  ctx.fillStyle = "rgba(103, 217, 232, 0.12)";
  for (let i = 0; i < 6; i += 1) {
    const x = 30 + i * 86 + Math.sin(elapsed + i) * 8;
    const y = (i * 128 + oceanOffset * 0.6) % (HEIGHT + 80) - 80;
    ctx.beginPath();
    ctx.ellipse(x, y, 46, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(player) {
  const flicker = player.invulnerable > 0 && Math.floor(player.invulnerable * 18) % 2 === 0;
  if (flicker) {
    return;
  }

  let frame = 0;
  if (player.bank < -0.66) {
    frame = 2;
  } else if (player.bank < -0.1) {
    frame = 1;
  } else if (player.bank > 0.66) {
    frame = 4;
  } else if (player.bank > 0.1) {
    frame = 3;
  }
  if (player.weapon !== "single" && Math.sin(elapsed * 12) > 0.35) {
    frame = 5;
  }

  drawFrame("player", frame, player.x, player.y, player.w, player.h);

  if (player.shield > 0) {
    ctx.strokeStyle = `rgba(115, 224, 255, ${0.25 + player.shield / 170})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 28 + Math.sin(elapsed * 10) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemy(enemy) {
  let frame = enemy.kind === "heavy" ? 3 : 0;

  if (enemy.variant === "kamikaze") {
    frame = 6;
  } else if (enemy.variant === "elite") {
    frame = 7;
  } else if (enemy.drift < -0.25) {
    frame = enemy.kind === "heavy" ? 4 : 1;
  } else if (enemy.drift > 0.25) {
    frame = enemy.kind === "heavy" ? 5 : 2;
  }

  drawFrame("enemy", frame, enemy.x, enemy.y, enemy.w, enemy.h);
}

function drawShip(ship) {
  const damaged = ship.hp < 55;
  const frame = damaged ? 2 : ship.variant;
  drawFrame("ship", frame, ship.x, ship.y, ship.w, ship.h);
}

function drawBoss(boss) {
  let frame = 0;
  if (boss.hp < boss.maxHp * 0.22 && Math.sin(elapsed * 10) > 0) {
    frame = 4;
  } else if (boss.hp < boss.maxHp * 0.45) {
    frame = 3;
  } else if (boss.vx < -6) {
    frame = 1;
  } else if (boss.vx > 6) {
    frame = 2;
  }

  drawFrame("boss", frame, boss.x, boss.y, boss.w, boss.h);
}

function drawBullets(collection) {
  for (const bullet of collection) {
    const rotation = Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2;
    drawFrame("projectiles", bullet.spriteFrame, bullet.x, bullet.y, bullet.size, bullet.size, { rotation });
  }
}

function drawPowerUps() {
  const frameMap = {
    spread: 6,
    beam: 7,
    shield: 8
  };

  for (const item of state.powerUps) {
    const bob = Math.sin(elapsed * 6 + item.spin) * 2;
    drawFrame("projectiles", frameMap[item.type], item.x, item.y + bob, 28, 28);
  }
}

function drawExplosions() {
  for (const blast of state.explosions) {
    const progress = clamp(blast.age / blast.duration, 0, 0.999);
    const frame = Math.floor(progress * 8);
    drawFrame("explosions", frame, blast.x, blast.y, blast.size, blast.size);
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.save();
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    ctx.restore();
  }
}

function drawHud() {
  const player = state.player;
  ctx.fillStyle = "rgba(6, 15, 24, 0.68)";
  ctx.fillRect(12, 12, WIDTH - 24, 96);
  ctx.strokeStyle = "rgba(103, 217, 232, 0.28)";
  ctx.strokeRect(12, 12, WIDTH - 24, 96);

  drawHudIcon(3, 34, 32, 20);
  ctx.fillStyle = "#dff5ff";
  ctx.font = "700 22px Orbitron";
  ctx.fillText(`${String(state.score).padStart(6, "0")}`, 52, 39);
  ctx.fillText(`WAVE ${state.wave}`, WIDTH - 150, 39);

  drawHudIcon(1, 34, 62, 18);
  ctx.font = "700 17px Rajdhani";
  ctx.fillStyle = "#ffd166";
  ctx.fillText(`x${state.bombs}`, 48, 67);

  drawHudIcon(0, 102, 62, 18);
  ctx.fillText(`x${state.lives}`, 116, 67);

  drawHudIcon(5, 175, 62, 18);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(player ? player.weapon.toUpperCase() : "OFF", 191, 67);

  drawHudIcon(4, WIDTH - 128, 61, 18);
  ctx.fillStyle = "#fff1d2";
  ctx.fillText(`KILLS ${state.kills}`, WIDTH - 112, 67);

  drawHudIcon(0, 24, 86, 18);
  ctx.fillStyle = "#1a2430";
  ctx.fillRect(40, 80, 132, 10);
  ctx.fillStyle = "#ff595e";
  ctx.fillRect(40, 80, (player ? player.hp / player.maxHp : 0) * 132, 10);

  drawHudIcon(2, 186, 86, 18);
  ctx.fillStyle = "#1a2430";
  ctx.fillRect(202, 80, 118, 10);
  ctx.fillStyle = "#73e0ff";
  ctx.fillRect(202, 80, (player ? player.shield / 100 : 0) * 118, 10);

  if (state.boss) {
    ctx.fillStyle = "rgba(6, 15, 24, 0.76)";
    ctx.fillRect(78, 114, WIDTH - 156, 22);
    ctx.strokeStyle = "rgba(255, 138, 61, 0.45)";
    ctx.strokeRect(78, 114, WIDTH - 156, 22);
    ctx.fillStyle = "#ff8a3d";
    ctx.fillRect(82, 118, (state.boss.hp / state.boss.maxHp) * (WIDTH - 164), 14);
    ctx.fillStyle = "#fff1d2";
    ctx.font = "700 15px Orbitron";
    ctx.fillText("ACE SQUADRON", WIDTH / 2 - 72, 130);
  }

  if (state.message) {
    ctx.font = "700 20px Rajdhani";
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.fillText(state.message, 24, HEIGHT - 20);
  }
}

function drawOverlay(title, subtitle) {
  ctx.fillStyle = "rgba(2, 8, 14, 0.7)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = "rgba(103, 217, 232, 0.26)";
  ctx.strokeRect(40, 110, WIDTH - 80, HEIGHT - 220);

  ctx.fillStyle = "#ff8a3d";
  ctx.font = "900 48px Orbitron";
  ctx.textAlign = "center";
  ctx.fillText("PACIFIC", WIDTH / 2, 250);
  ctx.fillStyle = "#dff5ff";
  ctx.fillText("LIGHTNING", WIDTH / 2, 304);

  ctx.fillStyle = "white";
  ctx.font = "700 24px Rajdhani";
  ctx.fillText(title, WIDTH / 2, 380);
  ctx.font = "700 18px Rajdhani";
  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.fillText(subtitle, WIDTH / 2, 418);
  ctx.fillText(`High Score ${String(state.highScore).padStart(6, "0")}`, WIDTH / 2, 454);
  ctx.textAlign = "start";
}

function render() {
  ctx.imageSmoothingEnabled = false;
  drawOcean();
  drawPowerUps();
  drawBullets(state.bullets);
  drawBullets(state.enemyBullets);
  state.enemies.forEach(drawEnemy);
  state.ships.forEach(drawShip);
  if (state.boss) {
    drawBoss(state.boss);
  }
  if (state.player) {
    drawPlayer(state.player);
  }
  drawExplosions();
  drawParticles();
  drawHud();

  if (flashTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flashTimer * 1.7})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  if (state.mode === "title") {
    drawOverlay("Press Enter to Scramble", "World War II inspired arcade action with a fictionalized theater and stylized combat.");
  } else if (state.mode === "gameover") {
    drawOverlay("Mission Lost", "Press Enter to launch again.");
  }
}

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  step(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    if (state.mode !== "playing") {
      resetGame();
    }
  }
  if (event.key === "Shift" || event.key.toLowerCase() === "x") {
    fireBomb();
  }
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

resetGame();
state.mode = "title";
state.message = "Press Enter to Launch";
requestAnimationFrame(frame);
