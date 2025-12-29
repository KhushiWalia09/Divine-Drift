// Canvas Setup (Hi-DPI) =======================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");

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
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault(); // Prevent scrolling
  keys[" "] = true; // Simulate spacebar press
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  keys[" "] = false;
}, { passive: false });

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

// Left Button
btnLeft.addEventListener("touchstart", handleTouchStart("ArrowLeft"), { passive: false });
btnLeft.addEventListener("touchend", handleTouchEnd("ArrowLeft"), { passive: false });

// Right Button
btnRight.addEventListener("touchstart", handleTouchStart("ArrowRight"), { passive: false });
btnRight.addEventListener("touchend", handleTouchEnd("ArrowRight"), { passive: false });

// Fly Button (Up / specific fly action)
btnFly.addEventListener("touchstart", handleTouchStart(" "), { passive: false });
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
// =======================
// Game Loop
// =======================
function gameLoop() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  // Draw orb
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
  ctx.fillStyle = "gold";
  ctx.fill();
  ctx.closePath();

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = "white";
    ctx.font = "32px Arial";
    ctx.fillText("GAME OVER", GAME_WIDTH / 2 - 90, GAME_HEIGHT / 2);

    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, GAME_WIDTH / 2 - 45, GAME_HEIGHT / 2 + 40);
    restartBtn.style.display = "inline-block";
    return; // stop the loop
  }
  // Draw score
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 30);
  // Draw lives
  ctx.fillStyle = "black";
  ctx.font = "18px Arial";
  ctx.fillText("Lives: " + (MAX_HITS - hits), 20, 55);

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
    // Collected!
    score += 1;
    orb.x = Math.random() * (GAME_WIDTH - 40) + 20;
    orb.y = Math.random() * (GAME_HEIGHT - 40) + 20;
  }

  // Wing flap (single push)
  if (keys[" "] || keys["ArrowUp"]) {
    angel.velocityY = angel.lift;
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

    // Reset obstacle so it doesn't hit repeatedly
    obstacle.x = GAME_WIDTH + Math.random() * 200;

    if (hits >= MAX_HITS) {
      gameOver = true;
    }
  }
  // Draw angel
  ctx.drawImage(angelImg, angel.x, angel.y, angel.width, angel.height);

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

  gameLoop();
});

// =======================
// Start Game After Image Loads
// =======================
angelImg.onload = () => {
  gameLoop();
};
