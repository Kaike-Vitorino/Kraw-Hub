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

let pyodide = null;
let game = null;
let boardState = [];
let turn = WHITE;
let forcedPieces = [];
let winner = null;
let selected = null;
let validMoves = new Map();

const toKey = (row, col) => `${row},${col}`;

const pieceColor = (piece) => (piece.color === WHITE ? COLORS.white : COLORS.black);

function pyToJs(pyObject) {
  if (!pyObject) return null;
  const result = pyObject.toJs({ dict_converter: Object.fromEntries });
  pyObject.destroy();
  return result;
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
      const piece = boardState?.[row]?.[col];
      if (!piece) continue;

      const centerX = col * SQUARE_SIZE + SQUARE_SIZE / 2;
      const centerY = row * SQUARE_SIZE + SQUARE_SIZE / 2;
      const radius = SQUARE_SIZE / 2 - 15;

      ctx.beginPath();
      ctx.fillStyle = COLORS.grey;
      ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = pieceColor(piece);
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
    const [row, col] = key.split(",").map(Number);
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
  forcedPieces.forEach(([row, col]) => {
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

function applyState(state) {
  if (!state) return;
  boardState = state.board;
  turn = state.turn;
  winner = state.winner;
  forcedPieces = state.forced || [];
}

function updateHud() {
  if (!game) {
    turnLabel.textContent = "Carregando regras em Python…";
    restartBtn.disabled = true;
    return;
  }

  restartBtn.disabled = false;

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

function forcedSet() {
  return new Set(forcedPieces.map(([row, col]) => toKey(row, col)));
}

async function selectPiece(row, col) {
  if (!game || winner) return;
  const piece = boardState?.[row]?.[col];
  if (!piece || piece.color !== turn) {
    return;
  }

  const forced = forcedSet();
  if (forced.size && !forced.has(toKey(row, col))) {
    hintLabel.textContent = "Escolha uma peça com captura obrigatória.";
    return;
  }

  const moves = pyToJs(game.valid_moves(row, col));
  if (!moves || !moves.length) {
    hintLabel.textContent = "Essa peça não possui movimentos válidos.";
    return;
  }

  const filtered = forced.size ? moves.filter((move) => move.capture) : moves;
  if (!filtered.length) {
    hintLabel.textContent = "Essa peça precisa capturar para se mover.";
    return;
  }

  selected = { row, col };
  validMoves = new Map(
    filtered.map((move) => [toKey(move.row, move.col), move])
  );
  render();
  updateHud();
}

function handleMoveResult(result, targetRow, targetCol) {
  applyState(result);
  if (result.extra_capture) {
    selected = { row: targetRow, col: targetCol };
    validMoves = new Map(
      result.next_moves.map((move) => [toKey(move.row, move.col), move])
    );
  } else {
    resetSelection();
  }

  render();
  updateHud();

  if (result.winner) {
    showWinnerOverlay(result.winner);
  }
}

function attemptMove(row, col) {
  if (!selected || !game) return;
  const key = toKey(row, col);
  if (!validMoves.has(key)) {
    resetSelection();
    render();
    updateHud();
    return;
  }

  const result = pyToJs(
    game.move(selected.row, selected.col, row, col)
  );

  if (!result?.success) {
    resetSelection();
    render();
    updateHud();
    return;
  }

  handleMoveResult(result, row, col);
}

function handleClick(event) {
  if (winner || !game) return;
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
  if (!game) return;
  const state = pyToJs(game.reset());
  applyState(state);
  resetSelection();
  hideWinnerOverlay();
  render();
  updateHud();
}

async function bootstrap() {
  try {
    pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" });
    const response = await fetch("logic.py");
    const logicSource = await response.text();
    await pyodide.runPythonAsync(logicSource);
    await pyodide.runPythonAsync("from logic import CheckersGame\nweb_game = CheckersGame()");
    game = pyodide.globals.get("web_game");
    const state = pyToJs(game.snapshot());
    applyState(state);
    render();
  } catch (error) {
    console.error("Falha ao inicializar o Pyodide", error);
    turnLabel.textContent = "Erro ao carregar o jogo.";
    hintLabel.textContent = "Verifique sua conexão e recarregue a página.";
    restartBtn.disabled = true;
    return;
  }

  updateHud();
}

canvas.addEventListener("click", handleClick);
restartBtn.addEventListener("click", restartGame);
closeOverlayBtn.addEventListener("click", hideWinnerOverlay);

bootstrap();
