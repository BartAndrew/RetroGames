(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const menuOverlay = document.getElementById("menuOverlay");
  const characterGrid = document.getElementById("characterGrid");
  const selectedName = document.getElementById("selectedName");
  const selectedBio = document.getElementById("selectedBio");
  const selectedMoves = document.getElementById("selectedMoves");
  const cpuStartButton = document.getElementById("cpuStartButton");
  const duelStartButton = document.getElementById("duelStartButton");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const FLOOR_Y = 422;
  const GRAVITY = 0.62;
  const ROUND_TIME = 60;
  const FRAME_W = 64;
  const FRAME_H = 96;
  const SCALE = 2.35;

  const keys = Object.create(null);
  const justPressed = new Set();
  const particles = [];
  const hitPopups = [];

  const characterDefs = [
    {
      id: "cassette-jack",
      name: "Cassette Jack",
      style: "The thrift-store brawler",
      bio: "Vintage denim bruiser with a tote full of unsolicited opinions and a podcast nobody finished.",
      specialName: "Analog Rage",
      attacks: {
        punch: "Fair Trade Jab",
        kick: "Vinyl Roundhouse",
        special: "Analog Rage"
      },
      palette: { primary: "#ef476f", accent: "#ffd166", aura: "#ff8fab" },
      sprite: "./assets/sprites/cassette-jack.svg",
      spriteMeta: { columns: 16, previewFrame: 13 }
    },
    {
      id: "prairie-rose",
      name: "Prairie Rose",
      style: "The tradcore tornado",
      bio: "A prairie-dress powerhouse whose passive-aggressive smile lands harder than the spin kick.",
      specialName: "Homestead Hurricane",
      attacks: {
        punch: "Pearl Clutch",
        kick: "Porch Swing Kick",
        special: "Homestead Hurricane"
      },
      palette: { primary: "#ffd166", accent: "#ef476f", aura: "#f9c74f" },
      sprite: "./assets/sprites/prairie-rose.svg",
      spriteMeta: { columns: 16, previewFrame: 13 }
    },
    {
      id: "discourse-diego",
      name: "Discourse Diego",
      style: "The debate-night menace",
      bio: "He trained by arguing in comment sections until his delts and confidence became medically concerning.",
      specialName: "Debate Club Dropkick",
      attacks: {
        punch: "Thread Count",
        kick: "Ratio Boot",
        special: "Debate Club Dropkick"
      },
      palette: { primary: "#66c7ff", accent: "#ff8c42", aura: "#7bdff2" },
      sprite: "./assets/sprites/discourse-diego.svg",
      spriteMeta: { columns: 16, previewFrame: 13 }
    },
    {
      id: "manifesto-mona",
      name: "Manifesto Mona",
      style: "The activist uppercut",
      bio: "A zine-printing tornado who turns every combo into a teach-in and every comeback into a rally chant.",
      specialName: "Banner Drop",
      attacks: {
        punch: "Equal Time Elbow",
        kick: "March Step",
        special: "Banner Drop"
      },
      palette: { primary: "#9b5de5", accent: "#2fd0c9", aura: "#9afff8" },
      sprite: "./assets/sprites/manifesto-mona.svg",
      spriteMeta: { columns: 16, previewFrame: 13 }
    }
  ];

  const spriteImages = {};
  characterDefs.forEach((fighter) => {
    const image = new Image();
    image.src = fighter.sprite;
    spriteImages[fighter.id] = image;
  });

  const defaultFrameMap = {
    idleA: 0,
    idleB: 1,
    walkA: 0,
    walkB: 1,
    punch: 2,
    kick: 3,
    hurt: 4,
    ko: 4,
    jump: 5,
    special: 6,
    specialCharge: 6,
    specialRelease: 6,
    dash: 1,
    block: 0,
    taunt: 0,
    victory: 1,
    crouch: 0
  };

  const gameState = {
    mode: "menu",
    selectedIndex: 0,
    roundTimer: ROUND_TIME,
    roundFrame: 0,
    screenShake: 0,
    screenFlash: 0,
    message: "Press Start",
    winnerText: "",
    fighters: [],
    cpu: false
  };

  class Fighter {
    constructor(definition, x, facing, controls, isCpu) {
      this.definition = definition;
      this.x = x;
      this.y = FLOOR_Y;
      this.vx = 0;
      this.vy = 0;
      this.width = 76;
      this.height = 168;
      this.facing = facing;
      this.controls = controls;
      this.isCpu = isCpu;
      this.health = 100;
      this.maxHealth = 100;
      this.moveSpeed = 3.2;
      this.jumpStrength = 12.8;
      this.attackTimer = 0;
      this.hurtTimer = 0;
      this.state = "idle";
      this.currentAttack = null;
      this.attackConnected = false;
      this.aiTimer = 0;
      this.aiIntent = { move: 0, jump: false, attack: null };
      this.flashTint = 0;
      this.speech = "";
      this.speechTimer = 0;
    }

    get left() {
      return this.x - this.width / 2;
    }

    get right() {
      return this.x + this.width / 2;
    }

    get top() {
      return this.y - this.height;
    }

    get grounded() {
      return this.y >= FLOOR_Y - 0.5;
    }

    startAttack(type) {
      if (this.attackTimer > 0 || this.hurtTimer > 0 || this.health <= 0) {
        return;
      }

      const profiles = {
        punch: {
          duration: 18,
          activeStart: 6,
          activeEnd: 10,
          range: 56,
          damage: 8,
          knockback: 10,
          launch: -2.5
        },
        kick: {
          duration: 24,
          activeStart: 7,
          activeEnd: 13,
          range: 72,
          damage: 12,
          knockback: 13,
          launch: -3.5
        },
        special: {
          duration: 34,
          activeStart: 10,
          activeEnd: 18,
          range: 86,
          damage: 18,
          knockback: 19,
          launch: -6
        }
      };

      this.attackTimer = profiles[type].duration;
      this.currentAttack = { ...profiles[type], type };
      this.attackConnected = false;
      this.state = "attack";
      this.speech = this.definition.attacks[type];
      this.speechTimer = 28;
    }

    applyHit(attack, attacker) {
      if (this.hurtTimer > 0 || this.health <= 0) {
        return;
      }

      this.health = Math.max(0, this.health - attack.damage);
      this.hurtTimer = 16;
      this.attackTimer = 0;
      this.currentAttack = null;
      this.state = this.health <= 0 ? "ko" : "hurt";
      this.vx = attacker.facing * attack.knockback;
      this.vy = attack.launch;
      this.flashTint = 8;
      gameState.screenShake = Math.max(gameState.screenShake, attack.damage * 0.8);
      gameState.screenFlash = attack.type === "special" ? 8 : 3;

      hitPopups.push({
        x: this.x,
        y: this.top - 16,
        text: attack.type === "special" ? "SPICY TAKE" : "Ouch",
        life: 28,
        color: attacker.definition.palette.accent
      });

      for (let i = 0; i < 12; i += 1) {
        particles.push({
          x: this.x,
          y: this.top + 40,
          vx: (Math.random() - 0.5) * 5,
          vy: Math.random() * -4 - 1,
          life: 18 + Math.random() * 10,
          size: 3 + Math.random() * 5,
          color: attacker.definition.palette.accent
        });
      }
    }

    update(opponent) {
      this.flashTint = Math.max(0, this.flashTint - 1);
      this.speechTimer = Math.max(0, this.speechTimer - 1);
      if (this.speechTimer === 0) {
        this.speech = "";
      }

      if (this.health <= 0) {
        this.state = "ko";
      }

      if (this.isCpu && this.health > 0) {
        this.updateAI(opponent);
      }

      const moveAxis = this.isCpu ? this.aiIntent.move : this.getPlayerAxis();
      const wantsJump = this.isCpu ? this.aiIntent.jump : wasPressed(this.controls.jump);
      const wantsPunch = this.isCpu ? this.aiIntent.attack === "punch" : wasPressed(this.controls.punch);
      const wantsKick = this.isCpu ? this.aiIntent.attack === "kick" : wasPressed(this.controls.kick);
      const wantsSpecial = this.isCpu ? this.aiIntent.attack === "special" : wasPressed(this.controls.special);

      if (this.health > 0) {
        if (wantsPunch) {
          this.startAttack("punch");
        } else if (wantsKick) {
          this.startAttack("kick");
        } else if (wantsSpecial) {
          this.startAttack("special");
        }
      }

      if (this.health > 0 && wantsJump && this.grounded && this.attackTimer === 0 && this.hurtTimer === 0) {
        this.vy = -this.jumpStrength;
        this.state = "jump";
      }

      if (this.attackTimer === 0 && this.hurtTimer === 0 && this.health > 0) {
        this.vx = moveAxis * this.moveSpeed;
        if (Math.abs(this.vx) > 0.2 && this.grounded) {
          this.state = "walk";
        } else if (this.grounded) {
          this.state = "idle";
        }
      } else if (this.attackTimer > 0) {
        this.vx *= 0.88;
      } else if (this.hurtTimer > 0) {
        this.hurtTimer -= 1;
        this.vx *= 0.9;
      }

      if (this.attackTimer > 0 && this.currentAttack) {
        this.attackTimer -= 1;
        if (
          !this.attackConnected &&
          this.attackTimer <= this.currentAttack.duration - this.currentAttack.activeStart &&
          this.attackTimer >= this.currentAttack.duration - this.currentAttack.activeEnd
        ) {
          const attackEdge = this.facing > 0 ? this.right : this.left;
          const hurtEdge = this.facing > 0 ? opponent.left : opponent.right;
          const inRange = Math.abs(attackEdge - hurtEdge) < this.currentAttack.range;
          const verticalMatch = this.top < opponent.y && this.y > opponent.top + 20;

          if (inRange && verticalMatch) {
            opponent.applyHit(this.currentAttack, this);
            this.attackConnected = true;
          }
        }

        if (this.attackTimer === 0) {
          this.currentAttack = null;
          this.state = this.grounded ? "idle" : "jump";
        }
      }

      this.vy += GRAVITY;
      this.x += this.vx;
      this.y += this.vy;

      if (this.y >= FLOOR_Y) {
        this.y = FLOOR_Y;
        this.vy = 0;
        if (this.state === "jump") {
          this.state = Math.abs(this.vx) > 0.2 ? "walk" : "idle";
        }
      }

      const arenaPadding = 72;
      this.x = clamp(this.x, arenaPadding, WIDTH - arenaPadding);
      this.facing = this.x < opponent.x ? 1 : -1;
    }

    updateAI(opponent) {
      this.aiTimer -= 1;
      if (this.aiTimer <= 0) {
        const distance = opponent.x - this.x;
        const absDistance = Math.abs(distance);
        this.aiIntent.move = absDistance > 120 ? Math.sign(distance) : absDistance < 64 ? -Math.sign(distance) : 0;
        this.aiIntent.jump = Math.random() > 0.9 && this.grounded;
        this.aiIntent.attack = null;

        if (absDistance < 58 && Math.random() > 0.55) {
          this.aiIntent.attack = Math.random() > 0.55 ? "kick" : "punch";
        } else if (absDistance < 92 && Math.random() > 0.76) {
          this.aiIntent.attack = "special";
        }

        this.aiTimer = 10 + Math.random() * 16;
      } else {
        this.aiIntent.jump = false;
        if (this.aiIntent.attack) {
          this.aiIntent.attack = null;
        }
      }
    }

    getPlayerAxis() {
      let axis = 0;
      if (keys[this.controls.left]) {
        axis -= 1;
      }
      if (keys[this.controls.right]) {
        axis += 1;
      }
      return axis;
    }

    getFrameName() {
      if (this.health <= 0) {
        return "ko";
      }
      if (this.hurtTimer > 0) {
        return "hurt";
      }
      if (this.attackTimer > 0 && this.currentAttack) {
        if (this.currentAttack.type === "special") {
          return this.attackTimer > 22 ? "specialCharge" : "specialRelease";
        }
        return this.currentAttack.type;
      }
      if (!this.grounded) {
        return "jump";
      }
      if (this.state === "walk") {
        return Math.floor(gameState.roundFrame / 12) % 2 === 0 ? "walkA" : "walkB";
      }
      return Math.floor(gameState.roundFrame / 24) % 2 === 0 ? "idleA" : "idleB";
    }

    drawShadow() {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(this.x, FLOOR_Y + 3, 34, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    draw() {
      this.drawShadow();

      const image = spriteImages[this.definition.id];
      const frameName = this.getFrameName();
      const frameIndex = getFrameIndex(this.definition, frameName);
      const destW = FRAME_W * SCALE;
      const destH = FRAME_H * SCALE;
      const destX = this.x - destW / 2;
      const destY = this.y - destH;

      ctx.save();
      if (this.flashTint > 0) {
        ctx.globalAlpha = 0.94;
      }
      if (this.facing < 0) {
        ctx.translate(this.x, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(image, frameIndex * FRAME_W, 0, FRAME_W, FRAME_H, -destW / 2, destY, destW, destH);
      } else {
        ctx.drawImage(image, frameIndex * FRAME_W, 0, FRAME_W, FRAME_H, destX, destY, destW, destH);
      }

      if (this.flashTint > 0) {
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        if (this.facing < 0) {
          ctx.fillRect(-destW / 2, destY, destW, destH);
        } else {
          ctx.fillRect(destX, destY, destW, destH);
        }
      }
      ctx.restore();

      if (this.speech) {
        drawSpeechBubble(this.x + this.facing * 64, this.top - 44, this.speech, this.definition.palette.accent);
      }
    }
  }

  function buildMenu() {
    characterGrid.innerHTML = "";

    characterDefs.forEach((fighter, index) => {
      const button = document.createElement("button");
      button.className = "character-button";
      if (index === gameState.selectedIndex) {
        button.classList.add("selected");
      }

      const portrait = document.createElement("div");
      portrait.className = "character-portrait";
      portrait.setAttribute("aria-label", fighter.name);
      portrait.style.backgroundImage = `url(${fighter.sprite})`;
      portrait.style.backgroundSize = `${getSpriteColumns(fighter) * 100}% 100%`;
      portrait.style.backgroundPositionX = `${getPreviewPercent(fighter)}%`;

      const name = document.createElement("strong");
      name.textContent = fighter.name;

      const style = document.createElement("span");
      style.textContent = fighter.style;

      button.appendChild(portrait);
      button.appendChild(name);
      button.appendChild(style);
      button.addEventListener("click", () => selectCharacter(index));
      characterGrid.appendChild(button);
    });

    updateSelectedCard();
  }

  function selectCharacter(index) {
    gameState.selectedIndex = index;
    [...characterGrid.children].forEach((child, idx) => {
      child.classList.toggle("selected", idx === index);
    });
    updateSelectedCard();
  }

  function updateSelectedCard() {
    const fighter = characterDefs[gameState.selectedIndex];
    selectedName.textContent = fighter.name;
    selectedBio.textContent = fighter.bio;
    selectedMoves.innerHTML = "";

    Object.entries(fighter.attacks).forEach(([type, label]) => {
      const chip = document.createElement("div");
      chip.className = "move-chip";
      chip.innerHTML = `<strong>${label}</strong><span>${describeMove(type)}</span>`;
      selectedMoves.appendChild(chip);
    });
  }

  function describeMove(type) {
    if (type === "punch") {
      return "Quick poke for interrupting smug monologues.";
    }
    if (type === "kick") {
      return "Longer reach with a little more disrespect.";
    }
    return "Big flashy finisher for when the discourse needs a collapse.";
  }

  function getSpriteColumns(definition) {
    return definition.spriteMeta?.columns || 7;
  }

  function getFrameIndex(definition, frameName) {
    const map = definition.spriteMeta?.frames || defaultFrameMap;
    if (typeof map[frameName] === "number") {
      return map[frameName];
    }
    return defaultFrameMap[frameName] || 0;
  }

  function getPreviewPercent(definition) {
    const columns = getSpriteColumns(definition);
    const previewFrame = definition.spriteMeta?.previewFrame || 0;
    if (columns <= 1) {
      return 0;
    }
    return (previewFrame / (columns - 1)) * 100;
  }

  function startRound(mode) {
    const p1Def = characterDefs[gameState.selectedIndex];
    const p2Choices = characterDefs.filter((fighter) => fighter.id !== p1Def.id);
    const p2Def = mode === "cpu"
      ? p2Choices[Math.floor(Math.random() * p2Choices.length)]
      : p2Choices[(gameState.selectedIndex + 1) % p2Choices.length];

    gameState.fighters = [
      new Fighter(
        p1Def,
        250,
        1,
        { left: "a", right: "d", jump: "w", punch: "f", kick: "g", special: "h" },
        false
      ),
      new Fighter(
        p2Def,
        710,
        -1,
        { left: "ArrowLeft", right: "ArrowRight", jump: "ArrowUp", punch: "j", kick: "k", special: "l" },
        mode === "cpu"
      )
    ];

    gameState.mode = "fight";
    gameState.cpu = mode === "cpu";
    gameState.roundTimer = ROUND_TIME;
    gameState.roundFrame = 0;
    gameState.screenShake = 0;
    gameState.screenFlash = 0;
    gameState.message = mode === "cpu" ? "Beat the hot take machine." : "Local versus mode.";
    gameState.winnerText = "";
    menuOverlay.classList.add("hidden");
  }

  function endRound() {
    const [leftFighter, rightFighter] = gameState.fighters;
    let winner;

    if (leftFighter.health === rightFighter.health) {
      winner = "DRAW. Everyone logs off mad.";
    } else if (leftFighter.health > rightFighter.health) {
      winner = `${leftFighter.definition.name} wins the discourse.`;
    } else {
      winner = `${rightFighter.definition.name} wins the discourse.`;
    }

    gameState.mode = "result";
    gameState.winnerText = `${winner} Press Enter to return to select.`;
    menuOverlay.classList.remove("hidden");
    document.querySelector(".panel-copy h2").textContent = "Rematch or Recast the Culture War";
    document.querySelector(".panel-copy p").textContent =
      "You can jump straight back in, swap fighters, or keep refining the art later.";
  }

  function update() {
    gameState.roundFrame += 1;
    gameState.screenShake *= 0.82;
    gameState.screenFlash = Math.max(0, gameState.screenFlash - 1);

    if (gameState.mode === "fight") {
      if (gameState.roundFrame % 60 === 0) {
        gameState.roundTimer = Math.max(0, gameState.roundTimer - 1);
      }

      const [leftFighter, rightFighter] = gameState.fighters;
      leftFighter.update(rightFighter);
      rightFighter.update(leftFighter);

      const gap = 76;
      const delta = rightFighter.x - leftFighter.x;
      if (delta < gap) {
        const correction = (gap - delta) / 2;
        leftFighter.x -= correction;
        rightFighter.x += correction;
      }

      if (leftFighter.health <= 0 || rightFighter.health <= 0 || gameState.roundTimer <= 0) {
        endRound();
      }
    } else if (gameState.mode === "result" && wasPressed("Enter")) {
      gameState.mode = "menu";
      gameState.message = "Pick a fighter.";
      gameState.winnerText = "";
      menuOverlay.classList.remove("hidden");
      document.querySelector(".panel-copy h2").textContent = "Choose Your Walking Think Piece";
      document.querySelector(".panel-copy p").textContent =
        "Pick a fighter, then either brawl the CPU or drag a friend into the discourse.";
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.14;
      particle.life -= 1;
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }

    for (let i = hitPopups.length - 1; i >= 0; i -= 1) {
      const popup = hitPopups[i];
      popup.y -= 0.65;
      popup.life -= 1;
      if (popup.life <= 0) {
        hitPopups.splice(i, 1);
      }
    }

    justPressed.clear();
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.save();

    if (gameState.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * gameState.screenShake, (Math.random() - 0.5) * gameState.screenShake);
    }

    drawBackground();

    if (gameState.mode !== "menu") {
      gameState.fighters.forEach((fighter) => fighter.draw());
      drawParticles();
      drawHud();
    } else {
      drawAttractMode();
    }

    ctx.restore();

    if (gameState.screenFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${gameState.screenFlash / 28})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#23395d");
    sky.addColorStop(0.5, "#314d74");
    sky.addColorStop(1, "#e59a52");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "rgba(255, 217, 102, 0.2)";
    ctx.beginPath();
    ctx.arc(770, 98, 72, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a2236";
    drawSkyline(0, 290, 110, 180, 34);
    drawSkyline(35, 314, 84, 138, 26);

    const floorGrad = ctx.createLinearGradient(0, 360, 0, HEIGHT);
    floorGrad.addColorStop(0, "#493926");
    floorGrad.addColorStop(1, "#1a140f");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 360, WIDTH, HEIGHT - 360);

    ctx.fillStyle = "rgba(255,255,255,0.09)";
    for (let i = 0; i < WIDTH; i += 48) {
      ctx.fillRect(i, 366, 24, 2);
    }

    ctx.fillStyle = "#6d4f2f";
    ctx.fillRect(0, FLOOR_Y + 4, WIDTH, 10);
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    ctx.fillRect(0, FLOOR_Y + 14, WIDTH, 2);

    drawCrowd();
  }

  function drawSkyline(offset, baseY, widthStep, minHeight, variance) {
    for (let x = offset; x < WIDTH + widthStep; x += widthStep) {
      const height = minHeight + ((x / widthStep) % 3) * variance;
      ctx.fillRect(x, baseY - height, widthStep - 8, height);
      ctx.fillStyle = "rgba(255, 227, 145, 0.14)";
      ctx.fillRect(x + 10, baseY - height + 18, 6, 10);
      ctx.fillRect(x + 24, baseY - height + 36, 6, 10);
      ctx.fillStyle = "#1a2236";
    }
  }

  function drawCrowd() {
    const crowdY = 352;
    for (let i = 0; i < 18; i += 1) {
      const x = 40 + i * 52;
      const hue = i % 2 === 0 ? "#c96f5d" : "#6bb4a0";
      ctx.fillStyle = hue;
      ctx.fillRect(x, crowdY, 10, 22);
      ctx.fillStyle = "#f0c3a0";
      ctx.fillRect(x + 2, crowdY - 10, 6, 10);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x + 10, crowdY + 6, 8, 2);
    }
  }

  function drawAttractMode() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(72, 70, WIDTH - 144, HEIGHT - 140);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    ctx.strokeRect(72, 70, WIDTH - 144, HEIGHT - 140);

    ctx.fillStyle = "#fff1bf";
    ctx.font = '700 30px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.fillText("LEFT VS RIGHT", WIDTH / 2, 148);

    ctx.fillStyle = "rgba(246, 238, 213, 0.86)";
    ctx.font = '18px "Trebuchet MS", sans-serif';
    ctx.fillText("Pixel-politics parody fighter prototype", WIDTH / 2, 196);
    ctx.fillText("Select a character below and start swinging opinions.", WIDTH / 2, 222);

    ctx.textAlign = "left";
    ctx.font = '16px "Trebuchet MS", sans-serif';
    ctx.fillStyle = "#ffd166";
    ctx.fillText("Features in this build", 122, 286);

    const points = [
      "4 playable archetypes with custom move names",
      "Single-player CPU or local two-player duels",
      "Sprite-sheet placeholders ready to replace later",
      "Stage, HUD, hit effects, timer, and rematch flow"
    ];

    ctx.fillStyle = "rgba(246, 238, 213, 0.9)";
    points.forEach((point, index) => {
      ctx.fillText(`> ${point}`, 122, 324 + index * 34);
    });
  }

  function drawHud() {
    const [leftFighter, rightFighter] = gameState.fighters;
    ctx.fillStyle = "rgba(5, 9, 18, 0.72)";
    ctx.fillRect(0, 0, WIDTH, 88);

    drawHealthBar(34, 26, 320, leftFighter.health / leftFighter.maxHealth, leftFighter.definition, false);
    drawHealthBar(WIDTH - 354, 26, 320, rightFighter.health / rightFighter.maxHealth, rightFighter.definition, true);

    ctx.fillStyle = "#fff1bf";
    ctx.font = '700 16px "Courier New", monospace';
    ctx.textAlign = "left";
    ctx.fillText(leftFighter.definition.name.toUpperCase(), 34, 18);

    ctx.textAlign = "right";
    ctx.fillText(rightFighter.definition.name.toUpperCase(), WIDTH - 34, 18);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff1bf";
    ctx.fillRect(WIDTH / 2 - 44, 18, 88, 48);
    ctx.fillStyle = "#23181d";
    ctx.font = '700 26px "Courier New", monospace';
    ctx.fillText(String(gameState.roundTimer).padStart(2, "0"), WIDTH / 2, 52);

    ctx.font = '15px "Trebuchet MS", sans-serif';
    ctx.fillStyle = "rgba(246,238,213,0.9)";
    ctx.fillText(
      gameState.mode === "result" ? gameState.winnerText : gameState.message,
      WIDTH / 2,
      82
    );

    for (const popup of hitPopups) {
      ctx.fillStyle = popup.color;
      ctx.font = '700 14px "Courier New", monospace';
      ctx.textAlign = "center";
      ctx.globalAlpha = Math.max(0, popup.life / 28);
      ctx.fillText(popup.text, popup.x, popup.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawHealthBar(x, y, width, ratio, definition, reverse) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(x, y, width, 24);

    const grad = ctx.createLinearGradient(x, y, x + width, y);
    if (reverse) {
      grad.addColorStop(0, definition.palette.accent);
      grad.addColorStop(1, definition.palette.primary);
    } else {
      grad.addColorStop(0, definition.palette.primary);
      grad.addColorStop(1, definition.palette.accent);
    }

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, width * ratio, 24);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.strokeRect(x, y, width, 24);
  }

  function drawParticles() {
    particles.forEach((particle) => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = Math.max(0, particle.life / 24);
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      ctx.globalAlpha = 1;
    });
  }

  function drawSpeechBubble(x, y, text, color) {
    ctx.save();
    ctx.font = '700 12px "Courier New", monospace';
    const padding = 10;
    const width = ctx.measureText(text).width + padding * 2;
    const boxX = clamp(x - width / 2, 12, WIDTH - width - 12);
    const boxY = Math.max(94, y);

    ctx.fillStyle = "rgba(12, 16, 32, 0.92)";
    ctx.fillRect(boxX, boxY, width, 30);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, width, 30);
    ctx.fillStyle = "#f6eed5";
    ctx.textAlign = "center";
    ctx.fillText(text.toUpperCase(), boxX + width / 2, boxY + 20);
    ctx.restore();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function wasPressed(code) {
    return justPressed.has(code);
  }

  window.addEventListener("keydown", (event) => {
    if (!keys[event.key]) {
      justPressed.add(event.key);
    }
    keys[event.key] = true;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
  });

  cpuStartButton.addEventListener("click", () => startRound("cpu"));
  duelStartButton.addEventListener("click", () => startRound("duel"));

  buildMenu();
  selectCharacter(0);

  function frame() {
    update();
    draw();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
