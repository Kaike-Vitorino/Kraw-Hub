(() => {
  const BOARD_SIZE = 8;
  const TILE_SIZE = 78;
  const BOARD_PIXEL = BOARD_SIZE * TILE_SIZE;
  const BOARD_OFFSET_X = 56;
  const BOARD_OFFSET_Y = 56;
  const PANEL_GAP = 40;
  const PANEL_WIDTH = 320;
  const GAME_WIDTH = BOARD_OFFSET_X * 2 + BOARD_PIXEL + PANEL_GAP + PANEL_WIDTH;
  const GAME_HEIGHT = BOARD_OFFSET_Y * 2 + BOARD_PIXEL;

  const COLORS = {
    background: 0x050b18,
    boardFrame: 0x0f1628,
    lightTile: 0xf7eed0,
    darkTile: 0x8b5a2b,
    highlight: 0x5de4c7,
    capture: 0xff6b6b,
    selection: 0xf6c945,
    whitePiece: 0xf6f8ff,
    blackPiece: 0x161c2e,
    whiteStroke: 0xb7c8f2,
    blackStroke: 0x3b4a6b,
    kingStroke: 0xe6b422,
  };

  const PLAYER_LABEL = {
    white: 'Brancas',
    black: 'Pretas'
  };

  const THEME_COLORS = {
    dark: {
      background: 0x050b18,
      boardFrame: 0x0f1628,
      boardStroke: 0x253453,
      panelBg: 0x101a2b,
      panelStroke: 0x1e314d,
      heading: '#f8fbff',
      subheading: '#5de4c7',
      body: '#c0c9e7',
      score: '#dee5ff',
      buttonFill: 0x1c2d4a,
      buttonFillHover: 0x234063,
      buttonStroke: 0x5de4c7,
      buttonText: '#f8fbff'
    },
    light: {
      background: 0xf3f6ff,
      boardFrame: 0xe3e9f7,
      boardStroke: 0xcad7ef,
      panelBg: 0xf7f8fd,
      panelStroke: 0xcad7ef,
      heading: '#0f172a',
      subheading: '#2563eb',
      body: '#1f2937',
      score: '#111827',
      buttonFill: 0xe2e8f0,
      buttonFillHover: 0xd7deeb,
      buttonStroke: 0x2563eb,
      buttonText: '#0f172a'
    }
  };

  const getCurrentTheme = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  class GameScene extends Phaser.Scene {
    constructor() {
      super({ key: 'Game' });
      this.boardData = [];
      this.tiles = [];
      this.highlights = [];
      this.selected = null;
      this.possibleMoves = [];
      this.currentPlayer = 'white';
      this.mustContinueCapture = false;
      this.lockedPiece = null;
      this.gameOver = false;
      this.messageTimer = null;
      this.themeColors = THEME_COLORS.dark;
      this.boardFrame = null;
      this.panelRect = null;
      this.infoTitle = null;
      this.sectionPieces = null;
      this.rulesTitle = null;
      this.rulesText = null;
    }

    create() {
      this.setupState();
      this.setTheme(getCurrentTheme());
      this.drawBoard();
      this.createTiles();
      this.placeInitialPieces();
      this.createSelectionMarker();
      this.buildPanel();
      this.updateTurnText();
      this.updateScoreboard();

      this.game.events.on('theme-change', this.setTheme, this);
      this.events.on('shutdown', () => {
        this.game.events.off('theme-change', this.setTheme, this);
      });
    }

    setupState() {
      this.boardData = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
      this.tiles = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
      this.highlights = [];
      this.selected = null;
      this.possibleMoves = [];
      this.currentPlayer = 'white';
      this.mustContinueCapture = false;
      this.lockedPiece = null;
      this.gameOver = false;
      this.messageTimer = null;
    }

    setTheme(theme) {
      const key = THEME_COLORS[theme] ? theme : 'dark';
      this.themeColors = THEME_COLORS[key];
      this.refreshThemeStyles();
    }

    refreshThemeStyles() {
      const colors = this.themeColors || THEME_COLORS.dark;
      if (this.cameras && this.cameras.main) {
        this.cameras.main.setBackgroundColor(colors.background);
      }
      if (this.boardFrame) {
        this.boardFrame.setFillStyle(colors.boardFrame, 0.92);
        this.boardFrame.setStrokeStyle(4, colors.boardStroke, 0.9);
      }
      if (this.panelRect) {
        this.panelRect.setFillStyle(colors.panelBg, 0.88);
        this.panelRect.setStrokeStyle(3, colors.panelStroke, 0.9);
      }
      if (this.infoTitle) this.infoTitle.setColor(colors.heading);
      if (this.turnText) this.turnText.setColor(colors.subheading);
      if (this.messageText) this.messageText.setColor(colors.body);
      if (this.sectionPieces) this.sectionPieces.setColor(colors.heading);
      if (this.scoreText) this.scoreText.setColor(colors.score);
      if (this.rulesTitle) this.rulesTitle.setColor(colors.heading);
      if (this.rulesText) this.rulesText.setColor(colors.body);
      if (this.resetButton) {
        this.resetButton.setFillStyle(colors.buttonFill, 0.9);
        this.resetButton.setStrokeStyle(2, colors.buttonStroke, 0.9);
      }
      if (this.resetLabel) this.resetLabel.setColor(colors.buttonText);
    }

    drawBoard() {
      const colors = this.themeColors || THEME_COLORS.dark;
      const boardCenterX = BOARD_OFFSET_X + BOARD_PIXEL / 2;
      const boardCenterY = BOARD_OFFSET_Y + BOARD_PIXEL / 2;
      this.boardFrame = this.add.rectangle(boardCenterX, boardCenterY, BOARD_PIXEL + 24, BOARD_PIXEL + 24, colors.boardFrame, 0.92)
        .setStrokeStyle(4, colors.boardStroke, 0.9);

      const panelLeft = BOARD_OFFSET_X + BOARD_PIXEL + PANEL_GAP;
      const panelCenterX = panelLeft + PANEL_WIDTH / 2;
      const panelCenterY = BOARD_OFFSET_Y + BOARD_PIXEL / 2;
      this.panelRect = this.add.rectangle(panelCenterX, panelCenterY, PANEL_WIDTH, BOARD_PIXEL, colors.panelBg, 0.88)
        .setStrokeStyle(3, colors.panelStroke, 0.9);
    }

    createTiles() {
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          const isDark = (row + col) % 2 === 1;
          const color = isDark ? COLORS.darkTile : COLORS.lightTile;
          const { x, y } = this.toWorldPosition(row, col);
          const tile = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, color, 1);
          tile.setStrokeStyle(1, 0x0c0c0c, 0.25);
          tile.setInteractive({ useHandCursor: isDark });
          tile.on('pointerdown', () => this.handleTileClick(row, col));
          this.tiles[row][col] = tile;
        }
      }
    }

    placeInitialPieces() {
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          if ((row + col) % 2 === 0) {
            continue;
          }
          if (row <= 2) {
            this.spawnPiece(row, col, 'black');
          }
          if (row >= BOARD_SIZE - 3) {
            this.spawnPiece(row, col, 'white');
          }
        }
      }
    }

    spawnPiece(row, col, player) {
      const { x, y } = this.toWorldPosition(row, col);
      const color = player === 'white' ? COLORS.whitePiece : COLORS.blackPiece;
      const stroke = player === 'white' ? COLORS.whiteStroke : COLORS.blackStroke;
      const sprite = this.add.circle(x, y, TILE_SIZE * 0.4, color, 1);
      sprite.setStrokeStyle(4, stroke, 1);
      sprite.setDepth(2);
      this.boardData[row][col] = { player, king: false, sprite };
    }

    createSelectionMarker() {
      this.selectionMarker = this.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE);
      this.selectionMarker.setStrokeStyle(4, COLORS.selection, 1);
      this.selectionMarker.setVisible(false);
      this.selectionMarker.setDepth(1.05);
    }

    buildPanel() {
      const colors = this.themeColors || THEME_COLORS.dark;
      const panelLeft = BOARD_OFFSET_X + BOARD_PIXEL + PANEL_GAP;
      const panelRight = panelLeft + PANEL_WIDTH;

      this.infoTitle = this.add.text(panelLeft + 16, BOARD_OFFSET_Y, 'Informacoes', {
        fontFamily: 'Inter',
        fontSize: '22px',
        color: colors.heading
      });

      this.turnText = this.add.text(panelLeft + 16, BOARD_OFFSET_Y + 40, '', {
        fontFamily: 'Inter',
        fontSize: '20px',
        color: colors.subheading
      });

      this.messageText = this.add.text(panelLeft + 16, BOARD_OFFSET_Y + 76, '', {
        fontFamily: 'Inter',
        fontSize: '16px',
        color: colors.body,
        wordWrap: { width: PANEL_WIDTH - 32 }
      });

      this.sectionPieces = this.add.text(panelLeft + 16, BOARD_OFFSET_Y + 146, 'Pecas restantes', {
        fontFamily: 'Inter',
        fontSize: '18px',
        color: colors.heading
      });

      this.scoreText = this.add.text(panelLeft + 16, BOARD_OFFSET_Y + 176, '', {
        fontFamily: 'Inter',
        fontSize: '16px',
        color: colors.score,
        lineSpacing: 6
      });

      this.rulesTitle = this.add.text(panelLeft + 16, BOARD_OFFSET_Y + 266, 'Regras rapidas', {
        fontFamily: 'Inter',
        fontSize: '18px',
        color: colors.heading
      });

      this.rulesText = this.add.text(
        panelLeft + 16,
        BOARD_OFFSET_Y + 296,
        'Movimente em diagonais.\nCapturas sao obrigatorias.\nDamas movem nas duas direcoes.\nVence quem impede o rival de jogar.',
        {
          fontFamily: 'Inter',
          fontSize: '15px',
          color: colors.body,
          lineSpacing: 8,
          wordWrap: { width: PANEL_WIDTH - 32 }
        }
      );

      const buttonY = BOARD_OFFSET_Y + BOARD_PIXEL - 60;
      this.resetButton = this.add.rectangle(panelLeft + PANEL_WIDTH / 2, buttonY, PANEL_WIDTH - 40, 46, colors.buttonFill, 0.9)
        .setStrokeStyle(2, colors.buttonStroke, 0.9)
        .setInteractive({ useHandCursor: true });

      this.resetLabel = this.add.text(panelLeft + PANEL_WIDTH / 2, buttonY, 'Reiniciar partida', {
        fontFamily: 'Inter',
        fontSize: '18px',
        color: colors.buttonText
      }).setOrigin(0.5);

      this.resetButton.on('pointerover', () => {
        if (!this.gameOver) {
          this.resetButton.setFillStyle(this.themeColors.buttonFillHover, 0.92);
        }
      });
      this.resetButton.on('pointerout', () => this.resetButton.setFillStyle(this.themeColors.buttonFill, 0.9));
      this.resetButton.on('pointerdown', () => {
        this.scene.restart();
      });
    }

    handleTileClick(row, col) {
      if (this.gameOver) {
        return;
      }

      const piece = this.boardData[row][col];
      if (piece && piece.player === this.currentPlayer) {
        if (this.mustContinueCapture && (!this.lockedPiece || this.lockedPiece.row !== row || this.lockedPiece.col !== col)) {
          this.flashMessage('Voce deve continuar com a peca selecionada.');
          return;
        }
        if (this.selected && this.selected.row === row && this.selected.col === col && !this.mustContinueCapture) {
          this.clearSelection();
          return;
        }
        this.selectPiece(row, col);
        return;
      }

      if (!this.selected) {
        return;
      }

      const move = this.possibleMoves.find((opt) => opt.row === row && opt.col === col);
      if (move) {
        this.executeMove(this.selected.row, this.selected.col, move);
      }
    }

    selectPiece(row, col) {
      const piece = this.boardData[row][col];
      if (!piece) {
        return;
      }

      const mustCapture = this.mustContinueCapture || this.playerHasCapture(this.currentPlayer);
      const moves = this.getValidMoves(row, col, piece, mustCapture);
      if (mustCapture && moves.length === 0) {
        this.flashMessage('Outra peca deve realizar a captura.');
        return;
      }
      if (!moves.length) {
        this.flashMessage('Sem movimentos disponiveis.');
        return;
      }

      this.selected = { row, col };
      this.possibleMoves = moves;
      const { x, y } = this.toWorldPosition(row, col);
      this.selectionMarker.setPosition(x, y);
      this.selectionMarker.setVisible(true);
      this.showHighlights(moves);
      this.flashMessage(mustCapture ? 'Selecione uma casa de captura.' : 'Escolha uma casa valida.', 1200);
    }

    getValidMoves(row, col, piece, captureOnly) {
      const { moves, captures } = this.scanMoves(row, col, piece);
      if (captureOnly) {
        return captures;
      }
      return captures.length ? captures : moves;
    }

    scanMoves(row, col, piece) {
      const allDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      const moveDirs = piece.king
        ? allDirs
        : (piece.player === 'white' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]]);
      const captureDirs = allDirs;

      const moves = [];
      const captures = [];

      for (const [dr, dc] of moveDirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (!this.isInside(nr, nc)) {
          continue;
        }
        if (!this.boardData[nr][nc]) {
          moves.push({ row: nr, col: nc, captures: [] });
        }
      }

      for (const [dr, dc] of captureDirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (!this.isInside(nr, nc)) {
          continue;
        }
        const occupant = this.boardData[nr][nc];
        if (!occupant || occupant.player === piece.player) {
          continue;
        }
        const jumpR = nr + dr;
        const jumpC = nc + dc;
        if (this.isInside(jumpR, jumpC) && !this.boardData[jumpR][jumpC]) {
          captures.push({ row: jumpR, col: jumpC, captures: [{ row: nr, col: nc }] });
        }
      }

      return { moves, captures };
    }

    executeMove(fromRow, fromCol, move) {
      const piece = this.boardData[fromRow][fromCol];
      this.boardData[fromRow][fromCol] = null;
      this.clearHighlights();
      this.selectionMarker.setVisible(false);

      for (const point of move.captures) {
        const captured = this.boardData[point.row][point.col];
        if (captured) {
          captured.sprite.destroy();
          this.boardData[point.row][point.col] = null;
        }
      }

      const destination = this.toWorldPosition(move.row, move.col);
      this.tweens.add({
        targets: piece.sprite,
        x: destination.x,
        y: destination.y,
        duration: 140,
        ease: 'Quad.easeOut'
      });

      this.boardData[move.row][move.col] = piece;
      const promoted = this.maybePromote(piece, move.row);
      this.updateScoreboard();

      const canContinue = move.captures.length > 0 && !promoted && this.hasCaptureFrom(move.row, move.col, piece);
      if (canContinue) {
        this.mustContinueCapture = true;
        this.lockedPiece = { row: move.row, col: move.col };
        this.flashMessage('Continue a sequencia de capturas.', 0);
        this.selectPiece(move.row, move.col);
        return;
      }

      this.mustContinueCapture = false;
      this.lockedPiece = null;
      this.selected = null;
      this.endTurn();
    }

    maybePromote(piece, row) {
      if (piece.king) {
        return false;
      }
      if (piece.player === 'white' && row === 0) {
        piece.king = true;
      } else if (piece.player === 'black' && row === BOARD_SIZE - 1) {
        piece.king = true;
      }
      if (piece.king) {
        piece.sprite.setStrokeStyle(6, COLORS.kingStroke, 1);
        this.flashMessage('Peca coroada! Agora ela anda nas duas direcoes.', 1600);
        return true;
      }
      return false;
    }

    hasCaptureFrom(row, col, piece) {
      const { captures } = this.scanMoves(row, col, piece);
      return captures.length > 0;
    }

    endTurn() {
      const opponent = this.currentPlayer === 'white' ? 'black' : 'white';
      if (!this.playerHasPieces(opponent) || !this.playerHasAnyMoves(opponent)) {
        this.declareWinner(this.currentPlayer);
        return;
      }
      this.currentPlayer = opponent;
      this.updateTurnText();
      if (this.playerHasCapture(this.currentPlayer)) {
        const label = PLAYER_LABEL[this.currentPlayer];
        this.flashMessage('Captura obrigatoria para as ' + label + '.', 1500);
      } else {
        this.flashMessage('', 0);
      }
    }

    declareWinner(player) {
      this.gameOver = true;
      this.updateTurnText('Vitoria das ' + PLAYER_LABEL[player] + '!');
      this.flashMessage('Clique em Reiniciar para jogar novamente.', 0);
    }

    playerHasPieces(player) {
      return this.boardData.some((row) => row.some((piece) => piece && piece.player === player));
    }

    playerHasAnyMoves(player) {
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          const piece = this.boardData[row][col];
          if (!piece || piece.player !== player) {
            continue;
          }
          const { moves, captures } = this.scanMoves(row, col, piece);
          if (moves.length > 0 || captures.length > 0) {
            return true;
          }
        }
      }
      return false;
    }

    playerHasCapture(player) {
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          const piece = this.boardData[row][col];
          if (!piece || piece.player !== player) {
            continue;
          }
          const { captures } = this.scanMoves(row, col, piece);
          if (captures.length > 0) {
            return true;
          }
        }
      }
      return false;
    }

    clearSelection() {
      this.selected = null;
      this.possibleMoves = [];
      this.selectionMarker.setVisible(false);
      this.clearHighlights();
    }

    showHighlights(moves) {
      this.clearHighlights();
      for (const move of moves) {
        const { x, y } = this.toWorldPosition(move.row, move.col);
        const color = move.captures.length ? COLORS.capture : COLORS.highlight;
        const highlight = this.add.rectangle(x, y, TILE_SIZE * 0.9, TILE_SIZE * 0.9, color, 0.35);
        highlight.setDepth(1.02);
        this.highlights.push(highlight);
      }
    }

    clearHighlights() {
      for (const marker of this.highlights) {
        marker.destroy();
      }
      this.highlights = [];
    }

    updateTurnText(override) {
      const nextText = override || `Vez: ${PLAYER_LABEL[this.currentPlayer]}`;
      this.turnText.setText(nextText);
    }

    flashMessage(text, duration = 1200) {
      if (this.messageTimer) {
        this.messageTimer.remove(false);
        this.messageTimer = null;
      }
      this.messageText.setText(text || '');
      if (text && duration > 0) {
        this.messageTimer = this.time.addEvent({
          delay: duration,
          callback: () => {
            if (!this.mustContinueCapture && !this.gameOver) {
              this.messageText.setText('');
            }
            this.messageTimer = null;
          }
        });
      }
    }

    updateScoreboard() {
      const whitePieces = this.countPieces('white');
      const blackPieces = this.countPieces('black');
      this.scoreText.setText(`Brancas: ${whitePieces}\nPretas: ${blackPieces}`);
    }

    countPieces(player) {
      let total = 0;
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          const piece = this.boardData[row][col];
          if (piece && piece.player === player) {
            total += 1;
          }
        }
      }
      return total;
    }

    toWorldPosition(row, col) {
      return {
        x: BOARD_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2,
        y: BOARD_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2
      };
    }

    isInside(row, col) {
      return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }
  }

  const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game',
    backgroundColor: '#050b18',
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  const game = new Phaser.Game(config);

  const pushThemeToGame = () => {
    const theme = getCurrentTheme();
    game.events.emit('theme-change', theme);
  };

  pushThemeToGame();

  const themeObserver = new MutationObserver(pushThemeToGame);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('unload', () => themeObserver.disconnect());
})();
