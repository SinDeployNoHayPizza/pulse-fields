// Platanus Hack 25: Pulse Fields
// Arena circular con campos de energía expansivos y zonas seguras procedurales

const ARCADE_CONTROLS = {
  P1U: ["w"],
  P1D: ["s"],
  P1L: ["a"],
  P1R: ["d"],
  P1A: ["u"],
  P1B: ["i"],
  P1C: ["o"],
  P1X: ["j"],
  P1Y: ["k"],
  P1Z: ["l"],
  START1: ["1", "Enter"],
};

const KEYBOARD_TO_ARCADE = {};
for (const [arcadeCode, keyboardKeys] of Object.entries(ARCADE_CONTROLS)) {
  if (keyboardKeys) {
    const keys = Array.isArray(keyboardKeys) ? keyboardKeys : [keyboardKeys];
    keys.forEach((key) => {
      KEYBOARD_TO_ARCADE[key] = arcadeCode;
    });
  }
}

// Start Scene
class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: "StartScene" });
  }

  create() {
    const centerX = 400;
    const centerY = 300;

    // Título
    this.add
      .text(centerX, 150, "PULSE FIELDS", {
        fontSize: "64px",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#00ffff",
        stroke: "#0088ff",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Subtítulo
    this.add
      .text(centerX, 220, "Mantente en las zonas seguras", {
        fontSize: "24px",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Instrucciones
    this.add
      .text(centerX, 320, "Joystick: Mover", {
        fontSize: "20px",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 360, "Button A: Pausar", {
        fontSize: "20px",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    // Start button
    const startText = this.add
      .text(centerX, 450, "Presiona START para comenzar", {
        fontSize: "28px",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Parpadeo
    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Input
    this.input.keyboard.on("keydown", (event) => {
      const key = KEYBOARD_TO_ARCADE[event.key] || event.key;
      if (key === "START1" || key === "P1A") {
        this.scene.start("GameScene");
      }
    });

    // Música de fondo para pantalla de inicio
    this.startMenuMusic();
  }

  startMenuMusic() {
    this.musicPlaying = true;
    this.musicTimer = 0;
    this.musicNoteIndex = 0;
    // Melodía suave y calmada para el menú
    this.musicNotes = [330, 349, 392, 440, 392, 349, 330, 294];
  }

  update(time, delta) {
    if (!this.musicPlaying) return;

    this.musicTimer += delta;
    if (this.musicTimer >= 300) {
      this.musicTimer = 0;
      const note =
        this.musicNotes[this.musicNoteIndex % this.musicNotes.length];
      this.playTone(note, 250, 0.04, "sine");
      this.musicNoteIndex++;
    }
  }

  playTone(freq, dur, vol = 0.1, type = "sine") {
    const ctx = this.sound.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  }
}

// Game Scene
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    // Variables del juego
    this.arenaRadius = 250;
    this.arenaCenterX = 400;
    this.arenaCenterY = 300;
    this.player = { x: 400, y: 300, radius: 8 };
    this.playerSpeed = 200;
    this.keys = {};
    this.score = 0;
    this.lives = 3;
    this.gameTime = 0;
    this.paused = false;
    
    // Sistema de invencibilidad
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 1000; // 1 segundo de invencibilidad
    
    // Trail del jugador
    this.playerTrail = [];
    this.trailMaxLength = 15;
    this.trailTimer = 0;
    
    // Animación de entrada
    this.enteringGame = true;
    this.enterAnimationTime = 0;

    // Campos de energía
    this.energyFields = [];
    this.fieldSpawnTimer = 0;
    this.fieldSpawnDelay = 3000;

    // Zonas seguras
    this.safeZones = [];
    this.generateSafeZones();

    // Graphics
    this.graphics = this.add.graphics();
    
    // Iniciar animación de entrada - jugador viene desde fuera
    this.startEnterAnimation();

    // UI
    this.scoreText = this.add.text(16, 16, "Puntos: 0", {
      fontSize: "24px",
      fontFamily: "'Courier New', Courier, monospace",
      color: "#00ff00",
    });

    this.livesText = this.add.text(16, 50, "Vida: 3", {
      fontSize: "24px",
      fontFamily: "'Courier New', Courier, monospace",
      color: "#ff0000",
    });

    // Música de fondo
    this.startBackgroundMusic();

    // Input
    this.input.keyboard.on("keydown", (event) => {
      const key = KEYBOARD_TO_ARCADE[event.key] || event.key;
      if (key === "P1A") {
        this.scene.pause();
        this.scene.launch("PauseScene");
      }
    });

    // Cursor keys
    this.cursors = this.input.keyboard.createCursorKeys();
    // Teclas WASD
    this.wasd = {
      W: this.input.keyboard.addKey("W"),
      S: this.input.keyboard.addKey("S"),
      A: this.input.keyboard.addKey("A"),
      D: this.input.keyboard.addKey("D"),
    };
  }

  generateSafeZones() {
    this.safeZones = [];
    const numZones = 3 + Math.floor(this.gameTime / 10000);

    for (let i = 0; i < numZones; i++) {
      const angle = ((Math.PI * 2) / numZones) * i + Math.random() * 0.5;
      const dist = 50 + Math.random() * 150;
      const x = this.arenaCenterX + Math.cos(angle) * dist;
      const y = this.arenaCenterY + Math.sin(angle) * dist;
      const radius = 40 + Math.random() * 30;

      // Asegurar que está dentro de la arena
      const distFromCenter = Math.sqrt(
        Math.pow(x - this.arenaCenterX, 2) + Math.pow(y - this.arenaCenterY, 2)
      );
      if (distFromCenter + radius > this.arenaRadius - 20) {
        const newDist = this.arenaRadius - radius - 20;
        const newX = this.arenaCenterX + Math.cos(angle) * newDist;
        const newY = this.arenaCenterY + Math.sin(angle) * newDist;
        this.safeZones.push({ x: newX, y: newY, radius: radius });
      } else {
        this.safeZones.push({ x: x, y: y, radius: radius });
      }
    }
  }

  startEnterAnimation() {
    // Limpiar trail
    this.playerTrail = [];
    
    // Posición inicial fuera de la pantalla (arriba)
    this.player.x = 400;
    this.player.y = -50;
    
    // Animación de entrada hacia el centro
    this.tweens.add({
      targets: this.player,
      y: 300,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        this.enteringGame = false;
      }
    });
  }

  update(time, delta) {
    if (this.paused) return;

    this.gameTime += delta;
    this.updateBackgroundMusic(delta);
    
    // Actualizar invencibilidad
    if (this.invulnerable) {
      this.invulnerableTimer += delta;
      if (this.invulnerableTimer >= this.invulnerableDuration) {
        this.invulnerable = false;
        this.invulnerableTimer = 0;
      }
    }
    
    // Si está en animación de entrada, no permitir movimiento
    if (this.enteringGame) {
      this.updateTrail(delta);
      this.draw();
      return;
    }

    // Movimiento del jugador
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) dx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy = -1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy = 1;

    // Normalizar diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    this.player.x += dx * ((this.playerSpeed * delta) / 1000);
    this.player.y += dy * ((this.playerSpeed * delta) / 1000);

    // Limitar a la arena
    const distFromCenter = Math.sqrt(
      Math.pow(this.player.x - this.arenaCenterX, 2) +
        Math.pow(this.player.y - this.arenaCenterY, 2)
    );
    if (distFromCenter > this.arenaRadius - this.player.radius) {
      const angle = Math.atan2(
        this.player.y - this.arenaCenterY,
        this.player.x - this.arenaCenterX
      );
      this.player.x =
        this.arenaCenterX +
        Math.cos(angle) * (this.arenaRadius - this.player.radius);
      this.player.y =
        this.arenaCenterY +
        Math.sin(angle) * (this.arenaRadius - this.player.radius);
    }

    // Spawn de campos de energía
    this.fieldSpawnTimer += delta;
    if (this.fieldSpawnTimer >= this.fieldSpawnDelay) {
      this.fieldSpawnTimer = 0;
      this.spawnEnergyField();
      this.fieldSpawnDelay = Math.max(2000, 3000 - this.gameTime / 5000);
    }

    // Actualizar campos de energía
    for (let i = this.energyFields.length - 1; i >= 0; i--) {
      const field = this.energyFields[i];
      field.radius += (field.expansionSpeed * delta) / 1000;
      field.alpha = Math.max(0.3, 1 - field.radius / 300);

      // Remover si es muy grande
      if (field.radius > 300) {
        this.energyFields.splice(i, 1);
      }
    }

    // Verificar PRIMERO si está en zona segura (con margen de seguridad)
    let inSafeZone = false;
    for (let zone of this.safeZones) {
      const dist = Math.sqrt(
        Math.pow(this.player.x - zone.x, 2) +
          Math.pow(this.player.y - zone.y, 2)
      );
      // Verificar que el jugador esté completamente dentro de la zona segura
      // Agregar un pequeño margen para evitar problemas de precisión
      const margin = 2;
      if (dist < zone.radius - this.player.radius - margin) {
        inSafeZone = true;
        break;
      }
    }

    // Colisiones con campos de energía - SOLO si NO está en zona segura Y NO es invencible
    if (!inSafeZone && !this.invulnerable) {
      for (let field of this.energyFields) {
        const dist = Math.sqrt(
          Math.pow(this.player.x - field.x, 2) +
            Math.pow(this.player.y - field.y, 2)
        );
        // Verificar colisión con margen
        if (dist < field.radius + this.player.radius - 1) {
          this.takeDamage();
          break; // Solo un daño por frame
        }
      }
    }

    // Puntos por estar en zona segura
    if (inSafeZone) {
      this.score += delta / 10;
      this.scoreText.setText("Puntos: " + Math.floor(this.score));
    }

    // Regenerar zonas seguras periódicamente
    if (
      Math.floor(this.gameTime / 5000) !==
      Math.floor((this.gameTime - delta) / 5000)
    ) {
      this.generateSafeZones();
    }

    // Actualizar trail
    this.updateTrail(delta);

    // Dibujar
    this.draw();
  }
  
  updateTrail(delta) {
    this.trailTimer += delta;
    // Agregar posición al trail cada 30ms
    if (this.trailTimer >= 30) {
      this.trailTimer = 0;
      this.playerTrail.push({ x: this.player.x, y: this.player.y });
      
      // Limitar longitud del trail
      if (this.playerTrail.length > this.trailMaxLength) {
        this.playerTrail.shift();
      }
    }
  }

  spawnEnergyField() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * (this.arenaRadius - 100);
    const x = this.arenaCenterX + Math.cos(angle) * dist;
    const y = this.arenaCenterY + Math.sin(angle) * dist;

    // Colores vibrantes para los campos de energía
    const colors = [
      0xff0080, 0xff8000, 0xffff00, 0x80ff00, 0x00ffff, 0x0080ff, 0x8000ff,
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.energyFields.push({
      x: x,
      y: y,
      radius: 10,
      expansionSpeed: 50 + Math.random() * 30,
      alpha: 1,
      color: color,
    });
  }

  takeDamage() {
    // Evitar múltiples daños en el mismo frame
    if (this.invulnerable) return;
    
    this.lives--;
    this.livesText.setText("Vida: " + this.lives);

    // Activar invencibilidad temporal
    this.invulnerable = true;
    this.invulnerableTimer = 0;

    // Efecto visual
    this.cameras.main.flash(200, 255, 0, 0);
    this.playTone(220, 0.2, 0.1, "square");

    if (this.lives <= 0) {
      // Detener música del juego antes de cambiar de escena
      this.musicPlaying = false;
      this.scene.start("GameOverScene", { score: Math.floor(this.score) });
    }
  }

  draw() {
    this.graphics.clear();

    // Arena circular con glow (dibujar glow primero)
    this.drawGlowCircle(
      this.arenaCenterX,
      this.arenaCenterY,
      this.arenaRadius,
      0x00ffff,
      1
    );
    this.graphics.lineStyle(3, 0x00ffff, 1);
    this.graphics.strokeCircle(
      this.arenaCenterX,
      this.arenaCenterY,
      this.arenaRadius
    );

    // Zonas seguras con glow
    for (let zone of this.safeZones) {
      this.drawGlowCircle(zone.x, zone.y, zone.radius, 0x00ff00, 0.3);
      this.graphics.fillStyle(0x00ff00, 0.2);
      this.graphics.fillCircle(zone.x, zone.y, zone.radius);
      this.graphics.lineStyle(2, 0x00ff00, 0.6);
      this.graphics.strokeCircle(zone.x, zone.y, zone.radius);
    }

    // Campos de energía con glow
    for (let field of this.energyFields) {
      this.drawGlowCircle(
        field.x,
        field.y,
        field.radius,
        field.color,
        field.alpha * 0.5
      );
      this.graphics.fillStyle(field.color, field.alpha);
      this.graphics.fillCircle(field.x, field.y, field.radius);
      this.graphics.lineStyle(2, field.color, field.alpha * 0.8);
      this.graphics.strokeCircle(field.x, field.y, field.radius);
    }

    // Trail del jugador (estela dorada)
    for (let i = 0; i < this.playerTrail.length; i++) {
      const trailPoint = this.playerTrail[i];
      const alpha = (i + 1) / this.playerTrail.length * 0.6;
      const size = this.player.radius * (i + 1) / this.playerTrail.length;
      
      // Glow del trail
      this.graphics.fillStyle(0xffd700, alpha * 0.3);
      this.graphics.fillCircle(trailPoint.x, trailPoint.y, size + 2);
      
      // Círculo del trail
      this.graphics.fillStyle(0xffd700, alpha);
      this.graphics.fillCircle(trailPoint.x, trailPoint.y, size);
    }

    // Jugador con glow dorado (parpadea si es invencible)
    const playerAlpha = this.invulnerable && Math.floor(this.invulnerableTimer / 100) % 2 === 0 ? 0.3 : 1;
    const playerColor = this.invulnerable && Math.floor(this.invulnerableTimer / 100) % 2 === 0 ? 0xffffff : 0xffd700;
    
    this.drawGlowCircle(
      this.player.x,
      this.player.y,
      this.player.radius + 3,
      playerColor,
      0.8 * playerAlpha
    );
    this.graphics.fillStyle(playerColor, playerAlpha);
    this.graphics.fillCircle(this.player.x, this.player.y, this.player.radius);
    this.graphics.lineStyle(2, this.invulnerable ? 0xffffff : 0xffaa00, playerAlpha);
    this.graphics.strokeCircle(
      this.player.x,
      this.player.y,
      this.player.radius
    );
  }

  drawGlowCircle(x, y, radius, color, baseAlpha) {
    // Efecto glow con múltiples círculos concéntricos
    const glowLayers = 4;
    for (let i = glowLayers; i > 0; i--) {
      const glowRadius = radius + i * 4;
      const glowAlpha = (baseAlpha * 0.4) / (i + 1);
      this.graphics.fillStyle(color, glowAlpha);
      this.graphics.fillCircle(x, y, glowRadius);
    }
  }

  startBackgroundMusic() {
    if (!this.musicPlaying) {
      this.musicPlaying = true;
      this.musicTimer = 0;
      this.musicNoteIndex = 0;
      this.musicPattern = 0;
      this.musicBeatCount = 0;
      // Múltiples patrones musicales para variar
      this.musicPatterns = [
        [262, 330, 392, 440, 392, 330], // Patrón 1: ascendente-descendente
        [294, 349, 440, 523, 440, 349], // Patrón 2: más agudo
        [330, 392, 494, 523, 494, 392], // Patrón 3: aún más agudo
        [262, 294, 330, 349, 392, 440, 494, 523], // Patrón 4: escala completa
      ];
    }
  }

  updateBackgroundMusic(delta) {
    if (!this.musicPlaying) return;

    // Velocidad dinámica basada en el tiempo de juego y score
    const intensity = Math.min(1, this.gameTime / 30000 + this.score / 5000);
    const baseSpeed = 180 - intensity * 60; // Más rápido cuando hay más intensidad
    const speed = Math.max(120, baseSpeed);

    this.musicTimer += delta;
    if (this.musicTimer >= speed) {
      this.musicTimer = 0;
      this.musicBeatCount++;

      // Cambiar patrón cada 16 beats para evitar repetición
      if (this.musicBeatCount % 16 === 0) {
        this.musicPattern = (this.musicPattern + 1) % this.musicPatterns.length;
        this.musicNoteIndex = 0;
      }

      const currentPattern = this.musicPatterns[this.musicPattern];
      const note = currentPattern[this.musicNoteIndex % currentPattern.length];

      // Volumen dinámico basado en intensidad
      const volume = 0.04 + intensity * 0.03;

      // Duración más corta para ritmo más dinámico
      const duration = 120 - intensity * 30;

      this.playTone(note, duration, volume, "sine");
      this.musicNoteIndex++;
    }
  }

  playTone(freq, dur, vol = 0.1, type = "square") {
    const ctx = this.sound.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  }
}

// Pause Scene
class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: "PauseScene" });
  }

  create() {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 800, 600);

    this.add
      .text(400, 250, "PAUSA", {
        fontSize: "64px",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(400, 350, "Presiona Button A para continuar", {
        fontSize: "24px",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.input.keyboard.on("keydown", (event) => {
      const key = KEYBOARD_TO_ARCADE[event.key] || event.key;
      if (key === "P1A") {
        this.scene.resume("GameScene");
        this.scene.stop();
      }
    });
  }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, 800, 600);

    const gameOverText = this.add
      .text(400, 200, "GAME OVER", {
        fontSize: "72px",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#ff0000",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: gameOverText,
      scale: { from: 1, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(400, 320, "Puntos: " + this.finalScore, {
        fontSize: "36px",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#00ffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const restartText = this.add
      .text(400, 420, "Presiona START para reiniciar", {
        fontSize: "24px",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.on("keydown", (event) => {
      const key = KEYBOARD_TO_ARCADE[event.key] || event.key;
      if (key === "START1" || key === "P1A") {
        // Detener música de game over antes de reiniciar
        this.musicPlaying = false;
        this.scene.start("GameScene");
      }
    });

    // Música de fondo para game over
    this.startGameOverMusic();
  }

  startGameOverMusic() {
    this.musicPlaying = true;
    this.musicTimer = 0;
    this.musicNoteIndex = 0;
    // Melodía muy triste y lenta - escala descendente más dramática
    this.musicNotes = [523, 494, 440, 392, 349, 330, 294, 262, 247, 220, 196];
  }

  update(time, delta) {
    if (!this.musicPlaying) return;

    this.musicTimer += delta;
    // Muy lenta - 600ms entre notas para efecto más triste
    if (this.musicTimer >= 600) {
      this.musicTimer = 0;
      const note =
        this.musicNotes[this.musicNoteIndex % this.musicNotes.length];
      // Notas más largas y volumen más alto para que se note más
      this.playTone(note, 500, 0.08, "sine");
      this.musicNoteIndex++;

      // Reiniciar cuando termine la secuencia completa
      if (this.musicNoteIndex >= this.musicNotes.length) {
        this.musicNoteIndex = 0;
      }
    }
  }

  playTone(freq, dur, vol = 0.1, type = "sine") {
    const ctx = this.sound.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  }
}

// Inicializar el juego después de definir todas las escenas
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#0a0a1a",
  scene: [StartScene, GameScene, PauseScene, GameOverScene],
};

const game = new Phaser.Game(config);
