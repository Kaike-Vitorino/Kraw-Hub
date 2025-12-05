 const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const GRAVITY = 0.5;
        const JUMP = -8;
        const PIPE_WIDTH = 60;
        const PIPE_GAP = 150;
        const PIPE_SPEED = 2;

        let bird = { x: 80, y: 250, velocity: 0 };
        let pipes = [];
        let score = 0;
        let bestScore = 0;
        let gameActive = false;
        let gameOver = false;
        let frame = 0;

        //trocar a imagem do pássaro aqui
        
        const birdImg = new Image();
        birdImg.src = 'https://www.pikpng.com/pngl/b/273-2737091_flappy-bird-flappy-bird-gif-clipart.png';

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
            ctx.fillStyle = '#2ECC71';
            ctx.fillRect(x, 0, PIPE_WIDTH, topH);
            ctx.fillRect(x, topH + PIPE_GAP, PIPE_WIDTH, 600);
            
            ctx.fillStyle = '#27AE60';
            ctx.fillRect(x - 5, topH - 25, PIPE_WIDTH + 10, 25);
            ctx.fillRect(x - 5, topH + PIPE_GAP, PIPE_WIDTH + 10, 25);
        }

        function drawBackground() {
            let grad = ctx.createLinearGradient(0, 0, 0, 500);
            grad.addColorStop(0, '#87CEEB');
            grad.addColorStop(1, '#B0E0E6');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 400, 500);
            
            ctx.fillStyle = '#228B22';
            ctx.fillRect(0, 500, 400, 100);
        }

        function drawScore() {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.font = 'bold 50px Inter';
            ctx.textAlign = 'center';
            ctx.strokeText(score, 200, 70);
            ctx.fillText(score, 200, 70);
        }

        function drawStartScreen() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, 400, 600);
            
            ctx.fillStyle = 'white';
            ctx.fillRect(50, 180, 300, 240);
            ctx.strokeStyle = '#5de4c7';
            ctx.lineWidth = 4;
            ctx.strokeRect(50, 180, 300, 240);
            
            ctx.fillStyle = '#5de4c7';
            ctx.font = 'bold 48px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Flappy Bird', 200, 240);
            
            ctx.fillStyle = '#333';
            ctx.font = '18px Inter';
            ctx.fillText('Clique para começar', 200, 310);
            
            ctx.fillStyle = '#666';
            ctx.font = '14px Inter';
            ctx.fillText('Use ESPAÇO ou clique para voar', 200, 380);
        }

        function endGame() {
            if (score > bestScore) bestScore = score;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, 400, 600);
            
            ctx.fillStyle = 'white';
            ctx.fillRect(50, 200, 300, 200);
            ctx.strokeStyle = '#5de4c7';
            ctx.lineWidth = 4;
            ctx.strokeRect(50, 200, 300, 200);
            
            ctx.fillStyle = '#5de4c7';
            ctx.font = 'bold 48px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', 200, 260);
            
            ctx.fillStyle = '#333';
            ctx.font = 'bold 24px Inter';
            ctx.fillText('Pontuação: ' + score, 200, 310);
            ctx.fillText('Melhor: ' + bestScore, 200, 345);
            
            ctx.fillStyle = '#666';
            ctx.font = '16px Inter';
            ctx.fillText('Clique para jogar novamente', 200, 380);
        }

        function update() {
            if (!gameActive) return;

            bird.velocity += GRAVITY;
            bird.y += bird.velocity;

            if (frame % 100 === 0) {
                let h = Math.random() * 200 + 100;
                pipes.push({ x: 400, top: h, scored: false });
            }

            for (let i = pipes.length - 1; i >= 0; i--) {
                pipes[i].x -= PIPE_SPEED;

                if (pipes[i].x + PIPE_WIDTH < bird.x && !pipes[i].scored) {
                    score++;
                    pipes[i].scored = true;
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

            frame++;
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

        function loop() {
            update();
            draw();
            requestAnimationFrame(loop);
        }

        function jump() {
            if (!gameActive && !gameOver) {
                startGame();
            } else if (!gameActive && gameOver) {
                resetGame();
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
        }

        function resetGame() {
            gameActive = false;
            gameOver = false;
            bird.y = 250;
            bird.velocity = 0;
            pipes = [];
            score = 0;
            frame = 0;
        }

        canvas.addEventListener('click', jump);
        document.addEventListener('keydown', e => {
            if (e.code === 'Space') {
                e.preventDefault();
                jump();
            }
        });


        loop();