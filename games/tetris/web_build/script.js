const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");
const holdCanvas = document.getElementById("holdCanvas");
const holdCtx = holdCanvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const SHAPES = [
  [[1, 1, 1, 1]], // I
  [
    [1, 1],
    [1, 1],
  ], // O
  [
    [1, 1, 1],
    [0, 1, 0],
  ], // T
  [
    [1, 1, 1],
    [1, 0, 0],
  ], // L
  [
    [1, 1, 1],
    [0, 0, 1],
  ], // J
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // S
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // Z
];

const COLORS = [
  "#00f0f0", // I - cyan
  "#f0f000", // O - yellow
  "#a000f0", // T - purple
  "#f0a000", // L - orange
  "#0000f0", // J - blue
  "#00f000", // S - green
  "#f00000", // Z - red
];

// Default keybinds
let keybinds = {
  left: "ArrowLeft",
  right: "ArrowRight",
  down: "ArrowDown",
  rotate: "ArrowUp",
  hardDrop: " ",
  hold: "c",
  pause: "p",
};

// Load saved keybinds
try {
  const savedKeys = localStorage.getItem("tetrisKeys");
  if (savedKeys) {
    keybinds = JSON.parse(savedKeys);
  }
} catch (e) {
  console.error("Error loading keybinds:", e);
}

let board = [];
let currentPiece = null;
let nextPiece = null;
let holdPiece = null;
let canHold = true;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop = null;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = false;
let isGameOver = false;

// Key repeat handling
let keyState = {};
let keyRepeatDelay = 150;
let keyRepeatInterval = 50;
let keyTimers = {};

function createBoard() {
  return Array(ROWS)
    .fill()
    .map(() => Array(COLS).fill(0));
}

function createPiece() {
  const type = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[type],
    color: COLORS[type],
    type: type,
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
    y: 0,
  };
}

function drawBlock(context, x, y, color) {
  context.fillStyle = color;
  context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  context.strokeStyle = "#000";
  context.lineWidth = 2;
  context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
  ctx.fillStyle = "#0a0f1e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        drawBlock(ctx, x, y, board[y][x]);
      }
    }
  }
}

function drawGhostPiece() {
  if (!currentPiece) return;

  let ghostY = currentPiece.y;

  // Find where the piece would land
  while (true) {
    const testPiece = { ...currentPiece, y: ghostY + 1 };
    if (collide(testPiece, 0, 0)) {
      break;
    }
    ghostY++;
  }

  // Only draw ghost if it's below the current piece
  if (ghostY <= currentPiece.y) return;

  // Draw ghost piece with transparency
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        const posX = (currentPiece.x + x) * BLOCK_SIZE;
        const posY = (ghostY + y) * BLOCK_SIZE;

        ctx.fillStyle = currentPiece.color + "33";
        ctx.fillRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = currentPiece.color + "66";
        ctx.lineWidth = 2;
        ctx.strokeRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);
      }
    });
  });
}

function drawPiece(piece, context = ctx, offsetX = 0, offsetY = 0) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        drawBlock(
          context,
          piece.x + x + offsetX,
          piece.y + y + offsetY,
          piece.color
        );
      }
    });
  });
}

function drawPreview(piece, context, canvasWidth, canvasHeight) {
  context.fillStyle = "#0a0f1e";
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  if (piece) {
    const offsetX = (4 - piece.shape[0].length) / 2;
    const offsetY = (4 - piece.shape.length) / 2;

    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          drawBlock(context, x + offsetX, y + offsetY, piece.color);
        }
      });
    });
  }
}

function drawNext() {
  drawPreview(nextPiece, nextCtx, nextCanvas.width, nextCanvas.height);
}

function drawHold() {
  const holdContainer = document.querySelector(".hold-piece");
  if (holdContainer) {
    if (!canHold) {
      holdContainer.classList.add("used");
    } else {
      holdContainer.classList.remove("used");
    }
  }
  drawPreview(holdPiece, holdCtx, holdCanvas.width, holdCanvas.height);
}

function collide(piece, offsetX, offsetY) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const newX = piece.x + col + offsetX;
        const newY = piece.y + row + offsetY;

        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          return true;
        }

        if (newY >= 0 && board[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

function merge() {
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        const boardY = currentPiece.y + y;
        const boardX = currentPiece.x + x;
        if (boardY >= 0) {
          board[boardY][boardX] = currentPiece.color;
        }
      }
    });
  });
}

function rotate() {
  const rotated = currentPiece.shape[0].map((_, i) =>
    currentPiece.shape.map((row) => row[i]).reverse()
  );

  const previousShape = currentPiece.shape;
  const previousX = currentPiece.x;
  currentPiece.shape = rotated;

  // Try basic rotation
  if (collide(currentPiece, 0, 0)) {
    // Try wall kicks
    const kicks = [1, -1, 2, -2];
    let kicked = false;

    for (let kick of kicks) {
      currentPiece.x = previousX + kick;
      if (!collide(currentPiece, 0, 0)) {
        kicked = true;
        break;
      }
    }

    if (!kicked) {
      // Rotation failed, revert
      currentPiece.shape = previousShape;
      currentPiece.x = previousX;
    }
  }
}

function clearLines() {
  let linesCleared = 0;

  outer: for (let y = ROWS - 1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (!board[y][x]) {
        continue outer;
      }
    }

    board.splice(y, 1);
    board.unshift(Array(COLS).fill(0));
    linesCleared++;
    y++;
  }

  if (linesCleared > 0) {
    lines += linesCleared;
    score += [0, 40, 100, 300, 1200][linesCleared] * level;

    // Update level and speed
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
      level = newLevel;
      // Speed increases: starts at 1000ms, decreases by 50ms per level
      // Minimum speed is 100ms
      dropInterval = Math.max(100, 1000 - (level - 1) * 50);
      console.log(`Level ${level}! Speed: ${dropInterval}ms`);
    }

    updateScore();
  }
}

function drop() {
  if (!collide(currentPiece, 0, 1)) {
    currentPiece.y++;
  } else {
    merge();
    clearLines();
    currentPiece = nextPiece;
    nextPiece = createPiece();
    canHold = true;
    drawNext();
    drawHold();

    if (collide(currentPiece, 0, 0)) {
      gameOver();
    }
  }
}

function hardDrop() {
  while (!collide(currentPiece, 0, 1)) {
    currentPiece.y++;
    score += 2;
  }
  updateScore();
  drop();
}

function move(dir) {
  if (!collide(currentPiece, dir, 0)) {
    currentPiece.x += dir;
  }
}

function holdCurrentPiece() {
  if (!canHold) return;

  if (holdPiece === null) {
    holdPiece = {
      shape: SHAPES[currentPiece.type],
      color: COLORS[currentPiece.type],
      type: currentPiece.type,
      x: 0,
      y: 0,
    };
    currentPiece = nextPiece;
    nextPiece = createPiece();
    drawNext();
  } else {
    const temp = {
      shape: SHAPES[currentPiece.type],
      color: COLORS[currentPiece.type],
      type: currentPiece.type,
      x: 0,
      y: 0,
    };

    currentPiece = {
      shape: SHAPES[holdPiece.type],
      color: COLORS[holdPiece.type],
      type: holdPiece.type,
      x:
        Math.floor(COLS / 2) - Math.floor(SHAPES[holdPiece.type][0].length / 2),
      y: 0,
    };

    holdPiece = temp;
  }

  canHold = false;
  drawHold();
}

function update(time = 0) {
  if (isPaused || isGameOver) return;

  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) {
    drop();
    dropCounter = 0;
  }

  drawBoard();
  drawGhostPiece();
  drawPiece(currentPiece);

  gameLoop = requestAnimationFrame(update);
}

function updateScore() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
  document.getElementById("lines").textContent = lines;
}

function startGame() {
  board = createBoard();
  currentPiece = createPiece();
  nextPiece = createPiece();
  holdPiece = null;
  canHold = true;
  score = 0;
  level = 1;
  lines = 0;
  dropInterval = 1000;
  isPaused = false;
  isGameOver = false;
  dropCounter = 0;

  updateScore();
  drawNext();
  drawHold();

  const gameOverEl = document.getElementById("gameOver");
  const pauseOverlayEl = document.getElementById("pauseOverlay");
  if (gameOverEl) gameOverEl.classList.remove("show");
  if (pauseOverlayEl) pauseOverlayEl.classList.remove("show");

  if (gameLoop) cancelAnimationFrame(gameLoop);
  lastTime = performance.now();
  gameLoop = requestAnimationFrame(update);
}

function gameOver() {
  isGameOver = true;
  if (gameLoop) cancelAnimationFrame(gameLoop);
  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOver").classList.add("show");
}

function togglePause() {
  if (isGameOver) return;
  isPaused = !isPaused;

  const pauseOverlay = document.getElementById("pauseOverlay");
  if (isPaused) {
    if (pauseOverlay) pauseOverlay.classList.add("show");
    if (gameLoop) {
      cancelAnimationFrame(gameLoop);
      gameLoop = null;
    }
  } else {
    if (pauseOverlay) pauseOverlay.classList.remove("show");
    dropCounter = 0;
    lastTime = performance.now();
    gameLoop = requestAnimationFrame(update);
  }
}

// Keybind system
function getKeyDisplay(key) {
  const keyMap = {
    " ": "Space",
    ArrowLeft: "←",
    ArrowRight: "→",
    ArrowUp: "↑",
    ArrowDown: "↓",
  };
  return keyMap[key] || key.toUpperCase();
}

function updateKeyDisplays() {
  Object.keys(keybinds).forEach((action) => {
    const key = keybinds[action];
    const display = getKeyDisplay(key);

    const displayEl = document.getElementById(
      `key${action.charAt(0).toUpperCase() + action.slice(1)}`
    );
    if (displayEl) displayEl.textContent = display;

    const configEl = document.getElementById(
      `configKey${action.charAt(0).toUpperCase() + action.slice(1)}`
    );
    if (configEl) configEl.textContent = display;
  });
}

let listeningFor = null;

document.querySelectorAll(".key-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    if (listeningFor) {
      const prevBtn = document.querySelector(`[data-action="${listeningFor}"]`);
      if (prevBtn) prevBtn.classList.remove("listening");
    }

    listeningFor = this.dataset.action;
    this.classList.add("listening");
    this.querySelector("span").textContent = "Press key...";
  });
});

document.addEventListener("keydown", (e) => {
  // Config modal key listening
  if (listeningFor) {
    e.preventDefault();
    keybinds[listeningFor] = e.key;
    try {
      localStorage.setItem("tetrisKeys", JSON.stringify(keybinds));
    } catch (err) {
      console.error("Error saving keybinds:", err);
    }
    updateKeyDisplays();

    const btn = document.querySelector(`[data-action="${listeningFor}"]`);
    if (btn) btn.classList.remove("listening");
    listeningFor = null;
    return;
  }

  // Game controls
  if (isGameOver) return;

  const key = e.key;

  // Prevent default for game keys
  if (Object.values(keybinds).includes(key)) {
    e.preventDefault();
  }

  // Handle pause separately
  if (key === keybinds.pause || key === keybinds.pause.toUpperCase()) {
    togglePause();
    return;
  }

  if (isPaused) return;

  // Prevent key repeat for non-movement keys
  if (
    key === keybinds.rotate ||
    key === keybinds.hardDrop ||
    key === keybinds.hold
  ) {
    if (keyState[key]) return;
    keyState[key] = true;
  }

  // Handle movement with repeat
  if (key === keybinds.left) {
    if (!keyState[key]) {
      keyState[key] = true;
      move(-1);

      keyTimers[key] = setTimeout(() => {
        keyTimers[key] = setInterval(() => {
          if (keyState[key] && !isPaused) move(-1);
        }, keyRepeatInterval);
      }, keyRepeatDelay);
    }
  } else if (key === keybinds.right) {
    if (!keyState[key]) {
      keyState[key] = true;
      move(1);

      keyTimers[key] = setTimeout(() => {
        keyTimers[key] = setInterval(() => {
          if (keyState[key] && !isPaused) move(1);
        }, keyRepeatInterval);
      }, keyRepeatDelay);
    }
  } else if (key === keybinds.down) {
    if (!keyState[key]) {
      keyState[key] = true;
      drop();
      dropCounter = 0;

      keyTimers[key] = setTimeout(() => {
        keyTimers[key] = setInterval(() => {
          if (keyState[key] && !isPaused) {
            drop();
            dropCounter = 0;
          }
        }, keyRepeatInterval);
      }, keyRepeatDelay);
    }
  } else if (key === keybinds.rotate) {
    rotate();
  } else if (key === keybinds.hardDrop) {
    hardDrop();
  } else if (key === keybinds.hold) {
    holdCurrentPiece();
  } else {
    return;
  }

  drawBoard();
  drawGhostPiece();
  drawPiece(currentPiece);
});

document.addEventListener("keyup", (e) => {
  const key = e.key;

  if (keyState[key]) {
    keyState[key] = false;

    if (keyTimers[key]) {
      clearTimeout(keyTimers[key]);
      clearInterval(keyTimers[key]);
      delete keyTimers[key];
    }
  }
});

// Modal controls
const configBtn = document.getElementById("configBtn");
const closeConfigBtn = document.getElementById("closeConfigBtn");
const resetKeysBtn = document.getElementById("resetKeysBtn");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

if (configBtn) {
  configBtn.addEventListener("click", () => {
    document.getElementById("configModal").classList.add("show");
  });
}

if (closeConfigBtn) {
  closeConfigBtn.addEventListener("click", () => {
    document.getElementById("configModal").classList.remove("show");
    if (listeningFor) {
      const btn = document.querySelector(`[data-action="${listeningFor}"]`);
      if (btn) btn.classList.remove("listening");
      listeningFor = null;
      updateKeyDisplays();
    }
  });
}

if (resetKeysBtn) {
  resetKeysBtn.addEventListener("click", () => {
    keybinds = {
      left: "ArrowLeft",
      right: "ArrowRight",
      down: "ArrowDown",
      rotate: "ArrowUp",
      hardDrop: " ",
      hold: "c",
      pause: "p",
    };
    try {
      localStorage.setItem("tetrisKeys", JSON.stringify(keybinds));
    } catch (err) {
      console.error("Error saving keybinds:", err);
    }
    updateKeyDisplays();
  });
}

if (startBtn) startBtn.addEventListener("click", startGame);
if (restartBtn) restartBtn.addEventListener("click", startGame);

// Initialize
updateKeyDisplays();
drawBoard();
drawHold();
