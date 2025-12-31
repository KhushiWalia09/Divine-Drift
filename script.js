// Canvas Setup (Hi-DPI) =======================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");
let floatOffset = 0;
// =======================
// Clouds (GLOBAL)
// =======================
let clouds = [
  { x: 100, y: 120, speed: 0.3, size: 50 },
  { x: 350, y: 80, speed: 0.2, size: 70 },
  { x: 650, y: 150, speed: 0.25, size: 60 },
];

function drawCloud(cloud) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
  ctx.arc(
    cloud.x + cloud.size * 0.4,
    cloud.y - 10,
    cloud.size * 0.6,
    0,
    Math.PI * 2
  );
  ctx.arc(
    cloud.x + cloud.size * 0.8,
    cloud.y,
    cloud.size * 0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}
// Logical game size (CSS pixels)
const GAME_WIDTH = 900;
const GAME_HEIGHT = 700;

// Device Pixel Ratio
const dpr = window.devicePixelRatio || 1;

// Set CSS size
/* 
  We control display size via CSS (width: 100%, height: auto/aspect-ratio).
  We ONLY set the internal resolution (canvas.width/height) here.
*/
// canvas.style.width = GAME_WIDTH + "px"; // REMOVED
// canvas.style.height = GAME_HEIGHT + "px"; // REMOVED

// Set actual pixel size
canvas.width = GAME_WIDTH * dpr;
canvas.height = GAME_HEIGHT * dpr;

// Reset transform & scale for Hi-DPI
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.scale(dpr, dpr);

// Pixel-art friendly (change to true for smooth sprites)
ctx.imageSmoothingEnabled = false;

// =======================
// Angel Image
// =======================
const angelImg = new Image();
angelImg.src = "angel.png";
// =======================
// Sound Effects
// =======================
const flapSound = new Audio("sounds/flap.m4a");
const collectSound = new Audio("sounds/collect.m4a");
const gameOverSound = new Audio("sounds/gameover.m4a");
const obstacleHitSound = new Audio("sounds/obstacle.m4a");
// Mobile-friendly settings
flapSound.volume = 0.4;
collectSound.volume = 0.5;
gameOverSound.volume = 0.6;
obstacleHitSound.volume = 0.5;
// Angel Object (Physics) =======================
let angel = {
  x: 100,
  y: 100,
  width: 50,
  height: 50,
  velocityY: 0,
  gravity: 0.1,
  lift: -6,
  speedX: 4,
};
const isMobile = window.innerWidth <= 768;

// =======================
// Keyboard Handling
// =======================
let keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// =======================
// Touch Handling (Mobile)
// =======================
canvas.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault(); // Prevent scrolling
    keys[" "] = true; // Simulate spacebar press
  },
  { passive: false }
);

canvas.addEventListener(
  "touchend",
  (e) => {
    e.preventDefault();
    keys[" "] = false;
  },
  { passive: false }
);

// Mobile Directional Controls
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const btnFly = document.getElementById("btnFly");

const handleTouchStart = (key) => (e) => {
  e.preventDefault();
  keys[key] = true;
};

const handleTouchEnd = (key) => (e) => {
  e.preventDefault();
  keys[key] = false;
};
let soundUnlocked = false;

function unlockSounds() {
  if (soundUnlocked) return;

  flapSound
    .play()
    .then(() => {
      flapSound.pause();
      flapSound.currentTime = 0;
      soundUnlocked = true;
    })
    .catch(() => { });
}

canvas.addEventListener("touchstart", unlockSounds, { once: true });
document.addEventListener("keydown", unlockSounds, { once: true });

// Left Button
btnLeft.addEventListener("touchstart", handleTouchStart("ArrowLeft"), {
  passive: false,
});
btnLeft.addEventListener("touchend", handleTouchEnd("ArrowLeft"), {
  passive: false,
});

// Right Button
btnRight.addEventListener("touchstart", handleTouchStart("ArrowRight"), {
  passive: false,
});
btnRight.addEventListener("touchend", handleTouchEnd("ArrowRight"), {
  passive: false,
});

// Fly Button (Up / specific fly action)
btnFly.addEventListener("touchstart", handleTouchStart(" "), {
  passive: false,
});
btnFly.addEventListener("touchend", handleTouchEnd(" "), { passive: false });
// =======================
// Score
// =======================
let score = 0;
// =======================
// Light Orb
// =======================
let orb = {
  x: 600,
  y: 200,
  radius: 12,
};
let hits = 0;
const MAX_HITS = 3;
let gameOver = false;
// =======================
// Obstacle
// =======================
let obstacle = {
  x: 800,
  y: 150,
  width: 40,
  height: 40,
  speed: 2,
};
let canFlapSound = true;
let canPlayHitSound = true;
// =======================
// Game Loop
// =======================
function gameLoop() {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  skyGradient.addColorStop(0, "#87CEEB"); // sky blue
  skyGradient.addColorStop(1, "#E0F6FF"); // soft white-blue

  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Move & draw clouds (BACKGROUND)
  clouds.forEach((cloud) => {
    cloud.x -= cloud.speed;

    // Loop cloud when it leaves screen
    if (cloud.x + cloud.size * 2 < 0) {
      cloud.x = GAME_WIDTH + Math.random() * 100;
      cloud.y = Math.random() * 200 + 50;
    }

    drawCloud(cloud);
  });

  // Draw orb
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
  ctx.fillStyle = "gold";
  ctx.shadowColor = "gold";
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0; // Reset shadow
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = "white";
    ctx.font = isMobile ? "48px Arial" : "32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

    ctx.font = isMobile ? "32px Arial" : "20px Arial";
    ctx.fillText("Score: " + score, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    ctx.textAlign = "left"; // reset
    restartBtn.style.display = "inline-block";
    return; // stop the loop
  }
  // Draw score
  // Draw score/lives
  const uiFontSize = isMobile ? 28 : 20;
  ctx.fillStyle = "black";
  ctx.font = `bold ${uiFontSize}px Arial`;

  if (isMobile) {
    ctx.textAlign = "right";
    ctx.fillText("Score: " + score, GAME_WIDTH - 20, 40);
    ctx.font = `bold ${isMobile ? 24 : 18}px Arial`;
    ctx.fillText("Lives: " + (MAX_HITS - hits), GAME_WIDTH - 20, 80);
    ctx.textAlign = "left"; // reset
  } else {
    ctx.fillText("Score: " + score, 20, 30);
    ctx.font = `bold ${isMobile ? 24 : 18}px Arial`;
    ctx.fillText("Lives: " + (MAX_HITS - hits), 20, 55);
  }

  // Horizontal movement
  if (keys["ArrowRight"]) angel.x += angel.speedX;
  if (keys["ArrowLeft"]) angel.x -= angel.speedX;
  // Collision check (angel vs orb)
  const angelCenterX = angel.x + angel.width / 2;
  const angelCenterY = angel.y + angel.height / 2;

  const dx = angelCenterX - orb.x;
  const dy = angelCenterY - orb.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < orb.radius + angel.width / 2) {
    score += 1;

    // Optimize for responsiveness - stop previous instance if still playing
    collectSound.pause();
    collectSound.currentTime = 0;
    collectSound.play().catch(() => { });

    orb.x = Math.random() * (GAME_WIDTH - 40) + 20;
    orb.y = Math.random() * (GAME_HEIGHT - 40) + 20;
  }

  // Continuous flying while key is held
  if (keys[" "] || keys["ArrowUp"]) {
    angel.velocityY = angel.lift;

    // Play sound continuously while flying
    if (flapSound.paused) {
      flapSound.loop = true;
      flapSound.play().catch(() => { });
    }
  } else {
    // Stop sound when not flying
    if (!flapSound.paused) {
      flapSound.pause();
      flapSound.currentTime = 0;
    }
  }

  // Gravity
  angel.velocityY += angel.gravity;

  // Limit fall speed
  if (angel.velocityY > 4) angel.velocityY = 4;

  angel.y += angel.velocityY;

  // Boundaries
  if (angel.x < 0) angel.x = 0;
  if (angel.x + angel.width > GAME_WIDTH) angel.x = GAME_WIDTH - angel.width;

  if (angel.y < 0) {
    angel.y = 0;
    angel.velocityY = 0;
  }

  if (angel.y + angel.height > GAME_HEIGHT) {
    angel.y = GAME_HEIGHT - angel.height;
    angel.velocityY = 0;
  }
  // Move obstacle (right → left)
  obstacle.x -= obstacle.speed;

  // Respawn obstacle when it goes off screen
  if (obstacle.x + obstacle.width < 0) {
    obstacle.x = GAME_WIDTH + Math.random() * 200;
    obstacle.y = Math.random() * (GAME_HEIGHT - obstacle.height);
    canPlayHitSound = true;
  }
  // Draw obstacle
  ctx.fillStyle = "#333";
  ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  // Collision check (angel vs obstacle)
  if (
    angel.x < obstacle.x + obstacle.width &&
    angel.x + angel.width > obstacle.x &&
    angel.y < obstacle.y + obstacle.height &&
    angel.y + angel.height > obstacle.y
  ) {
    hits++;

    // Play hit sound once per hit
    if (canPlayHitSound) {
      obstacleHitSound.currentTime = 0;
      obstacleHitSound.play();
      canPlayHitSound = false;
    }

    obstacle.x = GAME_WIDTH + Math.random() * 200;
    canPlayHitSound = true;
    if (hits >= MAX_HITS && !gameOver) {
      gameOver = true;
      gameOverSound.play();
    }
  }
  // Floating animation
  floatOffset += 0.05;
  const floatY = Math.sin(floatOffset) * 2;

  // Draw angel
  ctx.drawImage(angelImg, angel.x, angel.y + floatY, angel.width, angel.height);

  requestAnimationFrame(gameLoop);
}
restartBtn.addEventListener("click", () => {
  // Reset game state
  score = 0;
  hits = 0;
  gameOver = false;

  // Reset angel
  angel.x = 100;
  angel.y = 100;
  angel.velocityY = 0;

  // Reset obstacle
  obstacle.x = GAME_WIDTH + 100;
  obstacle.y = Math.random() * (GAME_HEIGHT - obstacle.height);

  // Reset orb
  orb.x = Math.random() * (GAME_WIDTH - 40) + 20;
  orb.y = Math.random() * (GAME_HEIGHT - 40) + 20;

  restartBtn.style.display = "none";
  canPlayHitSound = true;
  gameLoop();
});

// =======================
// Start Game After Image Loads
// =======================
angelImg.onload = () => {
  gameLoop();
};
