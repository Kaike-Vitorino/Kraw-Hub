const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.5;
const JUMP = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 2;
const PIPE_INTERVAL = 1500; // Intervalo entre canos em ms

let lastTime = 0;
const FIXED_SPEED = 60;

let bird = { x: 80, y: 250, velocity: 0 };
let pipes = [];
let score = 0;
let bestScore = 0;
let gameActive = false;
let gameOver = false;
let frame = 0;
let lastPipeTime = 0;
let themeColors = {
    skyTop: '#87CEEB',
    skyBottom: '#B0E0E6',
    grass: '#228B22',
    pipe: '#2ECC71',
    pipeShadow: '#27AE60',
    overlay: 'rgba(0, 0, 0, 0.7)',
    cardBg: '#ffffff',
    cardText: '#333',
    cardHint: '#666',
    scoreFill: '#ffffff',
    scoreStroke: '#000000',
    accent: '#5de4c7',
};

const THEME_COLORS = {
    dark: {
        skyTop: '#87CEEB',
        skyBottom: '#B0E0E6',
        grass: '#228B22',
        pipe: '#2ECC71',
        pipeShadow: '#27AE60',
        overlay: 'rgba(0, 0, 0, 0.7)',
        cardBg: '#ffffff',
        cardText: '#333',
        cardHint: '#666',
        scoreFill: '#ffffff',
        scoreStroke: '#000000',
        accent: '#5de4c7',
    },
    light: {
        skyTop: '#cfe6ff',
        skyBottom: '#e9f1ff',
        grass: '#8ac17c',
        pipe: '#4c9b3d',
        pipeShadow: '#3f7e32',
        overlay: 'rgba(15, 23, 42, 0.22)',
        cardBg: '#f8fbff',
        cardText: '#1f2937',
        cardHint: '#4b5563',
        scoreFill: '#0f172a',
        scoreStroke: '#ffffff',
        accent: '#2563eb',
    },
};

function applyTheme() {
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    themeColors = THEME_COLORS[theme] || THEME_COLORS.dark;
}

const birdImg = new Image();
birdImg.src = 'https://www.pikpng.com/pngl/b/273-2737091_flappy-bird-flappy-bird-gif-clipart.png';

function updateUI() {
    document.getElementById('currentScore').textContent = score;
    document.getElementById('bestScore').textContent = bestScore;
    
    if (!gameActive && !gameOver) {
        document.getElementById('gameStatus').textContent = 'Aguardando início';
    } else if (gameActive) {
        document.getElementById('gameStatus').textContent = 'Jogando';
    } else if (gameOver) {
        document.getElementById('gameStatus').textContent = 'Game Over';
    }
}

function drawBird() {
    if (birdImg.complete) {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.velocity * 0.05);
        ctx.drawImage(birdImg, -15, -15, 30, 30);
        ctx.restore();
    }
}

function drawPipe(x, topH) {
    ctx.fillStyle = themeColors.pipe;
    ctx.fillRect(x, 0, PIPE_WIDTH, topH);
    ctx.fillRect(x, topH + PIPE_GAP, PIPE_WIDTH, 600);

    ctx.fillStyle = themeColors.pipeShadow;
    ctx.fillRect(x - 5, topH - 25, PIPE_WIDTH + 10, 25);
    ctx.fillRect(x - 5, topH + PIPE_GAP, PIPE_WIDTH + 10, 25);
}

function drawBackground() {
    let grad = ctx.createLinearGradient(0, 0, 0, 500);
    grad.addColorStop(0, themeColors.skyTop);
    grad.addColorStop(1, themeColors.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 500);

    ctx.fillStyle = themeColors.grass;
    ctx.fillRect(0, 500, 400, 100);
}

function drawScore() {
    ctx.fillStyle = themeColors.scoreFill;
    ctx.strokeStyle = themeColors.scoreStroke;
    ctx.lineWidth = 3;
    ctx.font = 'bold 50px Inter';
    ctx.textAlign = 'center';
    ctx.strokeText(score, 200, 70);
    ctx.fillText(score, 200, 70);
}

function drawStartScreen() {
    ctx.fillStyle = themeColors.overlay;
    ctx.fillRect(0, 0, 400, 600);

    ctx.fillStyle = themeColors.cardBg;
    ctx.fillRect(50, 180, 300, 240);
    ctx.strokeStyle = themeColors.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 180, 300, 240);

    ctx.fillStyle = themeColors.accent;
    ctx.font = 'bold 48px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Flappy Bird', 200, 240);

    ctx.fillStyle = themeColors.cardText;
    ctx.font = '18px Inter';
    ctx.fillText('Clique para começar', 200, 310);

    ctx.fillStyle = themeColors.cardHint;
    ctx.font = '14px Inter';
    ctx.fillText('Use ESPAÇO ou clique para voar', 200, 380);
}

function endGame() {
    if (score > bestScore) {
        bestScore = score;
    }
    updateUI();

    ctx.fillStyle = themeColors.overlay;
    ctx.fillRect(0, 0, 400, 600);

    ctx.fillStyle = themeColors.cardBg;
    ctx.fillRect(50, 200, 300, 200);
    ctx.strokeStyle = themeColors.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 200, 300, 200);

    ctx.fillStyle = themeColors.accent;
    ctx.font = 'bold 48px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', 200, 260);

    ctx.fillStyle = themeColors.cardText;
    ctx.font = 'bold 24px Inter';
    ctx.fillText('Pontuação: ' + score, 200, 310);
    ctx.fillText('Melhor: ' + bestScore, 200, 345);

    ctx.fillStyle = themeColors.cardHint;
    ctx.font = '16px Inter';
    ctx.fillText('Clique para jogar novamente', 200, 380);
}

function update(delta) {
    if (!gameActive) return;

    const adj = delta / (1000 / FIXED_SPEED);

    bird.velocity += GRAVITY * adj;
    bird.y += bird.velocity * adj;

    // Sistema de geração de canos baseado em tempo real
    if (frame - lastPipeTime >= PIPE_INTERVAL) {
        let h = Math.random() * 200 + 100;
        pipes.push({ x: 400, top: h, scored: false });
        lastPipeTime = frame;
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED * adj;

        if (pipes[i].x + PIPE_WIDTH < bird.x && !pipes[i].scored) {
            score++;
            pipes[i].scored = true;
            updateUI();
        }

        if (pipes[i].x < -PIPE_WIDTH) {
            pipes.splice(i, 1);
        }

        if (pipes[i] && bird.x + 15 > pipes[i].x && bird.x - 15 < pipes[i].x + PIPE_WIDTH) {
            if (bird.y - 15 < pipes[i].top || bird.y + 15 > pipes[i].top + PIPE_GAP) {
                gameActive = false;
                gameOver = true;
            }
        }
    }

    if (bird.y + 15 > 500 || bird.y - 15 < 0) {
        gameActive = false;
        gameOver = true;
    }

    frame += delta;
}

function draw() {
    drawBackground();
    pipes.forEach(p => drawPipe(p.x, p.top));
    drawBird();
    drawScore();

    if (!gameActive && !gameOver) {
        drawStartScreen();
    }

    if (gameOver) {
        endGame();
    }
}

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    update(delta);
    draw();
    requestAnimationFrame(loop);
}

function jump() {
    if (!gameActive && !gameOver) {
        startGame();
    } else if (!gameActive && gameOver) {
        resetGameInternal();
    } else {
        bird.velocity = JUMP;
    }
}

function startGame() {
    gameActive = true;
    gameOver = false;
    bird.y = 250;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    frame = 0;
    lastPipeTime = 0;
    updateUI();
}

function resetGameInternal() {
    gameActive = false;
    gameOver = false;
    bird.y = 250;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    frame = 0;
    lastPipeTime = 0;
    updateUI();
}

function resetGame() {
    resetGameInternal();
}

canvas.addEventListener('click', jump);
document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

applyTheme();
const themeObserver = new MutationObserver(() => applyTheme());
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

updateUI();
loop();
