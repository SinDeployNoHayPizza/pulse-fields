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
    this.bassTimer = 0;
    this.noteIndex = 0;
    
    // Arpegio suave en Do mayor (C, E, G)
    this.arpeggio = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
    this.bassLine = [130.81, 146.83, 164.81, 130.81]; // C3, D3, E3, C3
    this.bassIndex = 0;
  }

  update(time, delta) {
    if (!this.musicPlaying) return;

    this.musicTimer += delta;
    this.bassTimer += delta;

    // Tocar nota del arpegio
    if (this.musicTimer >= 200) { // Ritmo más rápido
      this.musicTimer = 0;
      const note = this.arpeggio[this.noteIndex % this.arpeggio.length];
      this.playTone(note, 0.15, 0.08, "triangle"); // Onda triangular, más suave que sine
      this.noteIndex++;
    }
    
    // Tocar nota del bajo
    if (this.bassTimer >= 1600) { // El bajo es más lento
      this.bassTimer = 0;
      const bassNote = this.bassLine[this.bassIndex % this.bassLine.length];
      this.playTone(bassNote, 0.6, 0.1, "sine");
      this.bassIndex++;
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
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
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
    // Colores disponibles: azul, rojo, verde
    const zoneColors = [0x0088ff, 0xff0000, 0x00ff00];

    for (let i = 0; i < numZones; i++) {
      const angle = ((Math.PI * 2) / numZones) * i + Math.random() * 0.5;
      const dist = 50 + Math.random() * 150;
      const x = this.arenaCenterX + Math.cos(angle) * dist;
      const y = this.arenaCenterY + Math.sin(angle) * dist;
      const radius = 40 + Math.random() * 30;
      // Asignar color aleatorio
      const color = zoneColors[Math.floor(Math.random() * zoneColors.length)];

      // Asegurar que está dentro de la arena
      const distFromCenter = Math.sqrt(
        Math.pow(x - this.arenaCenterX, 2) + Math.pow(y - this.arenaCenterY, 2)
      );
      if (distFromCenter + radius > this.arenaRadius - 20) {
        const newDist = this.arenaRadius - radius - 20;
        const newX = this.arenaCenterX + Math.cos(angle) * newDist;
        const newY = this.arenaCenterY + Math.sin(angle) * newDist;
        this.safeZones.push({ x: newX, y: newY, radius: radius, color: color });
      } else {
        this.safeZones.push({ x: x, y: y, radius: radius, color: color });
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

    // Círculos concéntricos decorativos (órbitas internas) con glow fluyente
    const orbit1Radius = this.arenaRadius * 0.4;
    const orbit2Radius = this.arenaRadius * 0.65;
    
    // Órbita interna 1 con glow fluyente
    this.drawFlowingGlowCircle(
      this.arenaCenterX,
      this.arenaCenterY,
      orbit1Radius,
      0xffff00,
      3
    );
    
    // Órbita interna 2 con glow fluyente
    this.drawFlowingGlowCircle(
      this.arenaCenterX,
      this.arenaCenterY,
      orbit2Radius,
      0xffaa00,
      3
    );

    // Arena circular con glow fluyente (solo borde, sin relleno)
    this.drawFlowingGlowCircle(
      this.arenaCenterX,
      this.arenaCenterY,
      this.arenaRadius,
      0x00ffff,
      4
    );

    // Zonas seguras con glow y colores aleatorios
    for (let zone of this.safeZones) {
      const zoneColor = zone.color || 0x00ff00; // Color por defecto si no tiene
      
      // Glow del borde de la zona segura
      this.drawGlowCircle(zone.x, zone.y, zone.radius, zoneColor, 0.5);
      
      // Relleno de la zona segura
      this.graphics.fillStyle(zoneColor, 0.2);
      this.graphics.fillCircle(zone.x, zone.y, zone.radius);
      
      // Borde con glow
      this.graphics.lineStyle(3, zoneColor, 0.8);
      this.graphics.strokeCircle(zone.x, zone.y, zone.radius);
      
      // Borde adicional para más glow
      this.graphics.lineStyle(1, zoneColor, 0.4);
      this.graphics.strokeCircle(zone.x, zone.y, zone.radius + 2);
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

  drawFlowingGlowCircle(x, y, radius, color, lineWidth) {
    // Efecto de glow fluyente alrededor del círculo
    const flowSpeed = 0.001; // Velocidad del flujo
    const flowOffset = (this.gameTime * flowSpeed) % (Math.PI * 2);
    const segments = 80; // Número de segmentos para suavidad
    const glowIntensity = 0.9; // Intensidad máxima del glow
    
    // Dibujar múltiples capas de glow para efecto acentuado
    for (let layer = 0; layer < 4; layer++) {
      const layerRadius = radius + layer * 1.5;
      const layerAlpha = (glowIntensity * 0.5) / (layer + 1);
      
      // Dibujar el círculo con brillo variable usando líneas
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const nextAngle = ((i + 1) / segments) * Math.PI * 2;
        
        // Calcular brillo basado en la posición del flujo
        const angleForFlow = (angle + flowOffset) % (Math.PI * 2);
        const flowValue = (Math.sin(angleForFlow) + 1) / 2; // 0 a 1
        const segmentAlpha = layerAlpha * (0.4 + flowValue * 0.6);
        const segmentWidth = lineWidth * (0.6 + flowValue * 0.4);
        
        // Calcular puntos del segmento
        const x1 = x + Math.cos(angle) * layerRadius;
        const y1 = y + Math.sin(angle) * layerRadius;
        const x2 = x + Math.cos(nextAngle) * layerRadius;
        const y2 = y + Math.sin(nextAngle) * layerRadius;
        
        // Dibujar línea del segmento
        this.graphics.lineStyle(segmentWidth, color, segmentAlpha);
        this.graphics.moveTo(x1, y1);
        this.graphics.lineTo(x2, y2);
      }
    }
    
    // Borde principal más brillante y continuo
    this.graphics.lineStyle(lineWidth, color, glowIntensity);
    this.graphics.strokeCircle(x, y, radius);
  }

  startBackgroundMusic() {
    this.musicPlaying = true;
    this.musicTimer = 0;
    this.beatCount = 0;
    this.arpeggioIndex = 0;
    this.patternIndex = 0;

    // Patrones de arpegios (en Do menor para un ambiente más intenso)
    this.arpeggioPatterns = [
      [261.63, 311.13, 392.00, 523.25], // Cm, Eb, G, C
      [293.66, 349.23, 440.00, 587.33], // Dm, F, A, D
      [311.13, 369.99, 466.16, 622.25]  // Eb, G, Bb, Eb
    ];
    this.bassLine = [130.81, 146.83, 155.56]; // C3, D3, Eb3
  }

  updateBackgroundMusic(delta) {
    if (!this.musicPlaying) return;

    this.musicTimer += delta;
    const beatDuration = 150; // 150ms por beat, para un ritmo rápido

    if (this.musicTimer >= beatDuration) {
      this.musicTimer -= beatDuration;

      // Kick drum en los tiempos 1 y 3
      if (this.beatCount % 4 === 0 || this.beatCount % 4 === 2) {
        this.playKick();
      }
      
      // Hi-hat en los tiempos 2 y 4
      if (this.beatCount % 4 === 1 || this.beatCount % 4 === 3) {
        this.playHiHat();
      }

      // Tocar nota del arpegio
      const arpeggio = this.arpeggioPatterns[this.patternIndex];
      const note = arpeggio[this.arpeggioIndex % arpeggio.length];
      this.playTone(note, 0.1, 0.07, "sawtooth");
      this.arpeggioIndex++;

      // Cambiar de bajo y patrón cada 16 beats
      if (this.beatCount > 0 && this.beatCount % 16 === 0) {
        this.patternIndex = (this.patternIndex + 1) % this.arpeggioPatterns.length;
        const bassNote = this.bassLine[this.patternIndex % this.bassLine.length];
        this.playTone(bassNote, 0.5, 0.15, "square");
      }

      this.beatCount++;
    }
  }

  playKick() {
    const ctx = this.sound.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.1);
    
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  playHiHat() {
    const ctx = this.sound.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square'; // Ruido blanco es mejor, pero square es una buena aproximación
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    osc.frequency.setValueAtTime(6000 + Math.random() * 4000, ctx.currentTime); // Frecuencia alta
    
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
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
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
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
    this.noteIndex = 0;
    
    // Progresión de acordes menores (triste)
    this.melody = [392.00, 311.13, 261.63, 349.23, 293.66, 246.94]; // G, Eb, C | F, D, Bb
    this.bassLine = [130.81, 146.83]; // C3, F3
    this.bassIndex = 0;
  }

  update(time, delta) {
    if (!this.musicPlaying) return;

    this.musicTimer += delta;
    
    // Tocar una nota de la melodía lentamente
    if (this.musicTimer >= 600) {
      this.musicTimer = 0;
      
      // Tocar bajo al inicio de la frase
      if (this.noteIndex % 3 === 0) {
        const bassNote = this.bassLine[this.bassIndex % this.bassLine.length];
        this.playTone(bassNote, 1.8, 0.12, "sawtooth");
        this.bassIndex++;
      }
      
      const note = this.melody[this.noteIndex % this.melody.length];
      this.playTone(note, 0.5, 0.08, "triangle");
      
      this.noteIndex++;
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
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
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
