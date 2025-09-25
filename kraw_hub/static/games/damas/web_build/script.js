const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const turnLabel = document.getElementById("turnLabel");
const hintLabel = document.getElementById("hintLabel");
const restartBtn = document.getElementById("restartBtn");
const winnerOverlay = document.getElementById("winnerOverlay");
const winnerText = document.getElementById("winnerText");
const closeOverlayBtn = document.getElementById("closeOverlay");

const BOARD_SIZE = 8;
const SQUARE_SIZE = canvas.width / BOARD_SIZE;
const COLORS = {
  beige: "#f0d9b5",
  brown: "#b58863",
  white: "#f5f5f5",
  black: "#1e1e1e",
  grey: "#808080",
  highlight: "#3a6bff",
  forced: "rgba(255, 215, 0, 0.75)",
};

const WHITE = "white";
const BLACK = "black";

let board;
let turn;
let selected;
let validMoves;
let forcedPieces;
let winner;

function createInitialBoard() {
  const newBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if ((row + col) % 2 === 1) {
        if (row < 3) {
          newBoard[row][col] = { color: BLACK, king: false };
        } else if (row > 4) {
          newBoard[row][col] = { color: WHITE, king: false };
        }
      }
    }
  }
  return newBoard;
}

function toKey(row, col) {
  return `${row},${col}`;
}

function fromKey(key) {
  return key.split(",").map(Number);
}

function drawBoard() {
  ctx.fillStyle = COLORS.beige;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = row % 2; col < BOARD_SIZE; col += 2) {
      ctx.fillStyle = COLORS.brown;
      ctx.fillRect(col * SQUARE_SIZE, row * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
    }
  }
}

function drawPieces() {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;

      const centerX = col * SQUARE_SIZE + SQUARE_SIZE / 2;
      const centerY = row * SQUARE_SIZE + SQUARE_SIZE / 2;
      const radius = SQUARE_SIZE / 2 - 15;

      ctx.beginPath();
      ctx.fillStyle = COLORS.grey;
      ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = piece.color === WHITE ? COLORS.white : COLORS.black;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      if (piece.king) {
        ctx.beginPath();
        ctx.fillStyle = "#ffd700";
        ctx.arc(centerX, centerY, radius / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawSelection() {
  if (!selected) return;
  const { row, col } = selected;
  const centerX = col * SQUARE_SIZE + SQUARE_SIZE / 2;
  const centerY = row * SQUARE_SIZE + SQUARE_SIZE / 2;
  const radius = SQUARE_SIZE / 2 - 8;

  ctx.beginPath();
  ctx.strokeStyle = COLORS.highlight;
  ctx.lineWidth = 5;
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawValidMoves() {
  validMoves.forEach((_, key) => {
    const [row, col] = fromKey(key);
    const centerX = col * SQUARE_SIZE + SQUARE_SIZE / 2;
    const centerY = row * SQUARE_SIZE + SQUARE_SIZE / 2;

    ctx.beginPath();
    ctx.fillStyle = COLORS.highlight;
    ctx.globalAlpha = 0.8;
    ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawForcedHints() {
  if (!forcedPieces.length || winner) return;
  forcedPieces.forEach((key) => {
    const [row, col] = fromKey(key);
    const centerX = col * SQUARE_SIZE + SQUARE_SIZE / 2;
    const centerY = row * SQUARE_SIZE + SQUARE_SIZE / 2;
    const radius = SQUARE_SIZE / 2 - 12;

    ctx.beginPath();
    ctx.strokeStyle = COLORS.forced;
    ctx.lineWidth = 6;
    ctx.setLineDash([10, 6]);
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

function render() {
  drawBoard();
  drawPieces();
  drawForcedHints();
  drawSelection();
  drawValidMoves();
}

function getValidMoves(row, col) {
  const piece = board[row][col];
  if (!piece) return new Map();

  const captureMoves = new Map();
  const simpleMoves = new Map();

  let simpleDirs;
  if (piece.king) {
    simpleDirs = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  } else if (piece.color === WHITE) {
    simpleDirs = [
      [-1, -1],
      [-1, 1],
    ];
  } else {
    simpleDirs = [
      [1, -1],
      [1, 1],
    ];
  }

  const captureDirs = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  simpleDirs.forEach(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return;
    if (!board[r][c]) {
      simpleMoves.set(toKey(r, c), { row: r, col: c, capture: null });
    }
  });

  captureDirs.forEach(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    const jumpR = r + dr;
    const jumpC = c + dc;
    if (
      r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE ||
      jumpR < 0 || jumpR >= BOARD_SIZE || jumpC < 0 || jumpC >= BOARD_SIZE
    ) {
      return;
    }
    const target = board[r][c];
    if (target && target.color !== piece.color && !board[jumpR][jumpC]) {
      captureMoves.set(toKey(jumpR, jumpC), { row: jumpR, col: jumpC, capture: { row: r, col: c } });
    }
  });

  return captureMoves.size ? captureMoves : simpleMoves;
}

function getForcedCaptures(color) {
  const forced = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      const moves = getValidMoves(row, col);
      const hasCapture = Array.from(moves.values()).some((m) => m.capture);
      if (hasCapture) {
        forced.push(toKey(row, col));
      }
    }
  }
  return forced;
}

function hasAnyMoves(color) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      const moves = getValidMoves(row, col);
      if (moves.size) {
        return true;
      }
    }
  }
  return false;
}

function countPieces() {
  let whites = 0;
  let blacks = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      if (piece.color === WHITE) whites += 1;
      else blacks += 1;
    }
  }
  return { whites, blacks };
}

function getWinner() {
  const { whites, blacks } = countPieces();
  if (whites === 0 && blacks === 0) return null;
  if (whites === 0) return BLACK;
  if (blacks === 0) return WHITE;
  if (!hasAnyMoves(WHITE)) return BLACK;
  if (!hasAnyMoves(BLACK)) return WHITE;
  return null;
}

function movePiece(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  const wasKing = piece.king;
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = null;

  if (!piece.king) {
    if (piece.color === WHITE && toRow === 0) {
      piece.king = true;
    } else if (piece.color === BLACK && toRow === BOARD_SIZE - 1) {
      piece.king = true;
    }
  }
  return !wasKing && piece.king;
}

function updateHud() {
  if (!winner) {
    const colorName = turn === WHITE ? "brancas" : "negras";
    turnLabel.textContent = `Vez das peças ${colorName}`;
  } else {
    const colorName = winner === WHITE ? "brancas" : "negras";
    turnLabel.textContent = `Fim de jogo — vitória das peças ${colorName}`;
  }

  if (winner) {
    hintLabel.textContent = "";
  } else if (forcedPieces.length) {
    hintLabel.textContent = "Capture obrigatoriamente com uma das peças destacadas.";
  } else if (selected) {
    hintLabel.textContent = "Clique em um destaque azul para mover.";
  } else {
    hintLabel.textContent = "";
  }
}

function showWinnerOverlay(color) {
  if (!color) return;
  winner = color;
  const message = color === WHITE ? "Brancas venceram!" : "Negras venceram!";
  winnerText.textContent = message;
  winnerOverlay.classList.remove("hidden");
  updateHud();
}

function hideWinnerOverlay() {
  winnerOverlay.classList.add("hidden");
}

function resetSelection() {
  selected = null;
  validMoves = new Map();
}

function finalizeTurn() {
  turn = turn === WHITE ? BLACK : WHITE;
  forcedPieces = getForcedCaptures(turn);
  updateHud();
}

function attemptMove(targetRow, targetCol) {
  const key = toKey(targetRow, targetCol);
  if (!validMoves.has(key)) {
    resetSelection();
    render();
    updateHud();
    return;
  }

  const move = validMoves.get(key);
  const { row: fromRow, col: fromCol } = selected;
  const promotedNow = movePiece(fromRow, fromCol, move.row, move.col);

  if (move.capture) {
    const { row: capRow, col: capCol } = move.capture;
    board[capRow][capCol] = null;
  }

  const newRow = move.row;
  const newCol = move.col;
  if (move.capture && !promotedNow) {
    const nextMoves = getValidMoves(newRow, newCol);
    const captureOnly = new Map(
      Array.from(nextMoves.entries()).filter(([, value]) => value.capture)
    );
    if (captureOnly.size) {
      selected = { row: newRow, col: newCol };
      validMoves = captureOnly;
      forcedPieces = [];
      render();
      updateHud();
      return;
    }
  }

  resetSelection();
  finalizeTurn();
  render();

  const matchWinner = getWinner();
  if (matchWinner) {
    showWinnerOverlay(matchWinner);
  }
}

function selectPiece(row, col) {
  const piece = board[row][col];
  if (!piece || piece.color !== turn || winner) return;

  const forced = forcedPieces;
  if (forced.length && !forced.includes(toKey(row, col))) {
    hintLabel.textContent = "Escolha uma peça com captura obrigatória.";
    return;
  }

  const moves = getValidMoves(row, col);
  if (!moves.size) {
    hintLabel.textContent = "Essa peça não possui movimentos válidos.";
    return;
  }

  if (forced.length) {
    const captureOnly = new Map(
      Array.from(moves.entries()).filter(([, value]) => value.capture)
    );
    validMoves = captureOnly;
  } else {
    validMoves = moves;
  }
  selected = { row, col };
  render();
  updateHud();
}

function handleClick(event) {
  if (winner) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  const row = Math.floor(y / SQUARE_SIZE);
  const col = Math.floor(x / SQUARE_SIZE);

  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;

  if (selected) {
    attemptMove(row, col);
  } else {
    selectPiece(row, col);
  }
}

function restartGame() {
  board = createInitialBoard();
  turn = WHITE;
  winner = null;
  forcedPieces = getForcedCaptures(turn);
  resetSelection();
  hideWinnerOverlay();
  render();
  updateHud();
}

canvas.addEventListener("click", handleClick);
restartBtn.addEventListener("click", restartGame);
closeOverlayBtn.addEventListener("click", hideWinnerOverlay);

restartGame();
