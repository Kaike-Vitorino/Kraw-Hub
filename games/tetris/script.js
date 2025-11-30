const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");

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

let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop = null;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = false;
let isGameOver = false;

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
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
    y: 0,
  };
}

function drawBlock(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        drawBlock(ctx, x, y, board[y][x]);
      }
    }
  }
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

function drawNext() {
  nextCtx.fillStyle = "#1a1a2e";
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  if (nextPiece) {
    const offsetX = (4 - nextPiece.shape[0].length) / 2;
    const offsetY = (4 - nextPiece.shape.length) / 2;

    nextPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          drawBlock(nextCtx, x + offsetX, y + offsetY, nextPiece.color);
        }
      });
    });
  }
}

function collide(piece, x, y) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const newX = piece.x + col + x;
        const newY = piece.y + row + y;

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
  currentPiece.shape = rotated;

  if (collide(currentPiece, 0, 0)) {
    currentPiece.shape = previousShape;
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
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 100);
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
    drawNext();

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
  score = 0;
  level = 1;
  lines = 0;
  dropInterval = 1000;
  isPaused = false;
  isGameOver = false;

  updateScore();
  drawNext();

  document.getElementById("gameOver").classList.remove("show");

  if (gameLoop) cancelAnimationFrame(gameLoop);
  gameLoop = requestAnimationFrame(update);
}

function gameOver() {
  isGameOver = true;
  cancelAnimationFrame(gameLoop);
  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOver").classList.add("show");
}

function togglePause() {
  if (isGameOver) return;
  isPaused = !isPaused;
  if (!isPaused) {
    lastTime = performance.now();
    gameLoop = requestAnimationFrame(update);
  }
}

document.addEventListener("keydown", (e) => {
  if (isGameOver) return;

  switch (e.key) {
    case "ArrowLeft":
      move(-1);
      break;
    case "ArrowRight":
      move(1);
      break;
    case "ArrowDown":
      drop();
      score += 1;
      updateScore();
      dropCounter = 0;
      break;
    case "ArrowUp":
      rotate();
      break;
    case " ":
      e.preventDefault();
      hardDrop();
      break;
    case "p":
    case "P":
      togglePause();
      break;
  }

  drawBoard();
  drawPiece(currentPiece);
});

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("restartBtn").addEventListener("click", startGame);

// Draw initial empty board
drawBoard();
