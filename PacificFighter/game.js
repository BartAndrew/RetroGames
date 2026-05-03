const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const keys = new Set();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rand = (min, max) => Math.random() * (max - min) + min;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

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
  boss: null,
  message: "Press Enter to Launch",
  highScore: 0
};

function createPlayer() {
  return {
    x: WIDTH / 2,
    y: HEIGHT - 110,
    w: 38,
    h: 52,
    speed: 260,
    fireRate: 0.17,
    fireCooldown: 0,
    hp: 100,
    maxHp: 100,
    shield: 0,
    shieldTimer: 0,
    weapon: "single",
    weaponTimer: 0,
    invulnerable: 2.2
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
  state.boss = null;
  state.message = "";
}

function addExplosion(x, y, color, size, count = 18) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: rand(-1, 1) * size * 0.9,
      vy: rand(-1.4, 1.1) * size * 0.9,
      life: rand(0.35, 0.9),
      maxLife: rand(0.35, 0.9),
      size: rand(2, 5),
      color
    });
  }
}

function spawnEnemy(kind = "fighter") {
  const x = rand(50, WIDTH - 50);
  if (kind === "fighter") {
    state.enemies.push({
      kind,
      x,
      y: -50,
      w: 28,
      h: 34,
      hp: 18 + state.wave * 2,
      speed: 120 + state.wave * 8,
      fireTimer: rand(0.5, 1.4),
      drift: rand(-1.2, 1.2),
      score: 120
    });
  } else {
    state.enemies.push({
      kind: "heavy",
      x,
      y: -60,
      w: 42,
      h: 46,
      hp: 46 + state.wave * 4,
      speed: 90 + state.wave * 5,
      fireTimer: rand(0.45, 0.95),
      drift: rand(-0.8, 0.8),
      score: 260
    });
  }
}

function spawnShip() {
  const lane = Math.random() > 0.5 ? 130 : WIDTH - 130;
  state.ships.push({
    x: lane,
    y: -120,
    w: 86,
    h: 150,
    hp: 120 + state.wave * 10,
    speed: 46 + state.wave * 1.5,
    fireTimer: 1.4,
    score: 500
  });
}

function spawnPowerUp() {
  const types = ["spread", "beam", "shield"];
  const type = types[Math.floor(Math.random() * types.length)];
  state.powerUps.push({
    type,
    x: rand(50, WIDTH - 50),
    y: -30,
    w: 20,
    h: 20,
    speed: 80
  });
}

function spawnBoss() {
  state.boss = {
    x: WIDTH / 2,
    y: -140,
    targetY: 120,
    w: 170,
    h: 110,
    hp: 900 + state.wave * 100,
    maxHp: 900 + state.wave * 100,
    fireTimer: 0.9,
    phase: 0,
    vx: 100,
    score: 6000
  };
  state.message = `Ace Squadron Incoming - Wave ${state.wave}`;
}

function firePlayerWeapon() {
  const player = state.player;
  if (!player || player.fireCooldown > 0) {
    return;
  }

  const bullets = [];
  if (player.weapon === "spread") {
    bullets.push({ x: player.x, y: player.y - 30, vx: 0, vy: -450, r: 4, damage: 12, color: "#ffcf5a" });
    bullets.push({ x: player.x - 12, y: player.y - 28, vx: -120, vy: -420, r: 4, damage: 10, color: "#ff8a3d" });
    bullets.push({ x: player.x + 12, y: player.y - 28, vx: 120, vy: -420, r: 4, damage: 10, color: "#ff8a3d" });
  } else if (player.weapon === "beam") {
    bullets.push({ x: player.x, y: player.y - 34, vx: 0, vy: -620, r: 5, damage: 22, color: "#73e0ff" });
    bullets.push({ x: player.x - 16, y: player.y - 16, vx: 0, vy: -520, r: 3, damage: 10, color: "#73e0ff" });
    bullets.push({ x: player.x + 16, y: player.y - 16, vx: 0, vy: -520, r: 3, damage: 10, color: "#73e0ff" });
  } else {
    bullets.push({ x: player.x, y: player.y - 30, vx: 0, vy: -470, r: 4, damage: 12, color: "#fff3a1" });
    bullets.push({ x: player.x - 16, y: player.y - 16, vx: 0, vy: -430, r: 3, damage: 7, color: "#ffd166" });
    bullets.push({ x: player.x + 16, y: player.y - 16, vx: 0, vy: -430, r: 3, damage: 7, color: "#ffd166" });
  }

  state.bullets.push(...bullets);
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
    state.enemyBullets.push({ x, y, vx: -100, vy: 240, r: 5, damage: 14, color: "#ff746c" });
    state.enemyBullets.push({ x, y, vx: 0, vy: 270, r: 5, damage: 14, color: "#ff746c" });
    state.enemyBullets.push({ x, y, vx: 100, vy: 240, r: 5, damage: 14, color: "#ff746c" });
    return;
  }
  const player = state.player;
  const aimX = player ? clamp((player.x - x) * 0.7, -110, 110) : 0;
  state.enemyBullets.push({ x, y, vx: aimX, vy: 260, r: 4, damage: 11, color: "#ff5d73" });
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

  ctx.save();
  ctx.translate(player.x, player.y);

  if (player.shield > 0) {
    ctx.strokeStyle = `rgba(115, 224, 255, ${0.25 + player.shield / 170})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 28 + Math.sin(elapsed * 10) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "#ced8e0";
  ctx.fillRect(-4, -26, 8, 52);
  ctx.fillRect(-19, -10, 14, 26);
  ctx.fillRect(5, -10, 14, 26);
  ctx.fillRect(-26, -4, 52, 8);

  ctx.fillStyle = "#ff8a3d";
  ctx.fillRect(-6, 8, 4, 18);
  ctx.fillRect(2, 8, 4, 18);

  ctx.fillStyle = "#21354b";
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(12, -10);
  ctx.lineTo(0, -16);
  ctx.lineTo(-12, -10);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.fillStyle = enemy.kind === "heavy" ? "#7c1f32" : "#91283a";
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(18, -14);
  ctx.lineTo(0, -8);
  ctx.lineTo(-18, -14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d4dde5";
  ctx.fillRect(-enemy.w / 2, -4, enemy.w, 8);
  ctx.fillRect(-6, -enemy.h / 2 + 6, 12, enemy.h - 10);
  ctx.restore();
}

function drawShip(ship) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.fillStyle = "#596c7c";
  ctx.fillRect(-20, -70, 40, 140);
  ctx.fillStyle = "#3a4754";
  ctx.fillRect(-43, -54, 86, 108);
  ctx.fillStyle = "#9fb2bf";
  ctx.fillRect(-14, -18, 28, 36);
  ctx.fillStyle = "#ff8a3d";
  ctx.fillRect(-24, -26, 8, 10);
  ctx.fillRect(16, -26, 8, 10);
  ctx.restore();
}

function drawBoss(boss) {
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.fillStyle = "#7b2024";
  ctx.beginPath();
  ctx.moveTo(0, -55);
  ctx.lineTo(88, -8);
  ctx.lineTo(70, 30);
  ctx.lineTo(0, 54);
  ctx.lineTo(-70, 30);
  ctx.lineTo(-88, -8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d8e0e5";
  ctx.fillRect(-80, -10, 160, 14);
  ctx.fillRect(-18, -48, 36, 88);
  ctx.fillRect(-110, 2, 28, 10);
  ctx.fillRect(82, 2, 28, 10);
  ctx.restore();
}

function drawBullets(collection) {
  for (const bullet of collection) {
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPowerUps() {
  for (const item of state.powerUps) {
    const colors = {
      spread: "#ff595e",
      beam: "#00bbf9",
      shield: "#ffd166"
    };
    ctx.fillStyle = colors[item.type];
    ctx.fillRect(item.x - 10, item.y - 10, 20, 20);
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.strokeRect(item.x - 10, item.y - 10, 20, 20);
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    const alpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color.replace(")", `, ${alpha})`).replace("rgb", "rgba");
    if (!ctx.fillStyle.includes("rgba")) {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = alpha;
    }
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    ctx.globalAlpha = 1;
  }
}

function drawHud() {
  const player = state.player;
  ctx.fillStyle = "rgba(6, 15, 24, 0.68)";
  ctx.fillRect(12, 12, WIDTH - 24, 84);
  ctx.strokeStyle = "rgba(103, 217, 232, 0.28)";
  ctx.strokeRect(12, 12, WIDTH - 24, 84);

  ctx.fillStyle = "#dff5ff";
  ctx.font = "700 22px Orbitron";
  ctx.fillText(`SCORE ${String(state.score).padStart(6, "0")}`, 24, 42);
  ctx.fillText(`WAVE ${state.wave}`, WIDTH - 150, 42);

  ctx.font = "700 17px Rajdhani";
  ctx.fillStyle = "#ffd166";
  ctx.fillText(`BOMBS ${state.bombs}`, 24, 66);
  ctx.fillText(`LIVES ${state.lives}`, 130, 66);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(player ? `WEAPON ${player.weapon.toUpperCase()}` : "WEAPON OFF", WIDTH - 172, 66);

  ctx.fillStyle = "#1a2430";
  ctx.fillRect(24, 76, 150, 10);
  ctx.fillStyle = "#ff595e";
  ctx.fillRect(24, 76, (player ? player.hp / player.maxHp : 0) * 150, 10);

  ctx.fillStyle = "#1a2430";
  ctx.fillRect(188, 76, 110, 10);
  ctx.fillStyle = "#73e0ff";
  ctx.fillRect(188, 76, (player ? player.shield / 100 : 0) * 110, 10);

  if (state.boss) {
    ctx.fillStyle = "rgba(6, 15, 24, 0.76)";
    ctx.fillRect(78, 102, WIDTH - 156, 22);
    ctx.strokeStyle = "rgba(255, 138, 61, 0.45)";
    ctx.strokeRect(78, 102, WIDTH - 156, 22);
    ctx.fillStyle = "#ff8a3d";
    ctx.fillRect(82, 106, ((state.boss.hp / state.boss.maxHp) * (WIDTH - 164)), 14);
    ctx.fillStyle = "#fff1d2";
    ctx.font = "700 15px Orbitron";
    ctx.fillText("ACE SQUADRON", WIDTH / 2 - 72, 118);
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
