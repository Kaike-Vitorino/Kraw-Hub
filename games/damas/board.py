import pygame
from constants import ROWS, COLS, SQUARE_SIZE, BEIGE, BROWN, BLUE, WHITE, BLACK
from piece import Piece

class Board:
    def __init__(self):
        self.board = []
        self.selected_piece = None
        self.valid_moves = {}
        self.create_board()

    def draw_squares(self, win):
        win.fill(BEIGE)
        for row in range(ROWS):
            for col in range(row % 2, COLS, 2):
                pygame.draw.rect(win, BROWN, (col * SQUARE_SIZE, row * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE))

    def create_board(self):
        for row in range(ROWS):
            self.board.append([])
            for col in range(COLS):
                if row < 3 and (row + col) % 2 == 1:
                    self.board[row].append(Piece(row, col, BLACK))
                elif row > 4 and (row + col) % 2 == 1:
                    self.board[row].append(Piece(row, col, WHITE))
                else:
                    self.board[row].append(0)

    def draw(self, win):
        self.draw_squares(win)
        for row in range(ROWS):
            for col in range(COLS):
                piece = self.board[row][col]
                if isinstance(piece, Piece):
                    piece.draw(win)
        self.highlight_moves(win)

    def get_piece(self, row, col):
        return self.board[row][col]

    def move(self, piece, row, col):
        """
        Move a peça para (row, col).
        Retorna True se houve promoção a rei durante este movimento.
        """
        # move a peça no tabuleiro
        self.board[piece.row][piece.col], self.board[row][col] = 0, piece
        piece.move(row, col)
        was_king_before = piece.king
        if piece.color == WHITE and piece.row == 0:
            piece.king = True
        elif piece.color == BLACK and piece.row == ROWS - 1:
            piece.king = True

        promoted_now = (not was_king_before) and piece.king

        # se foi captura, já tratada em select/move flow (captura removida lá)
        # aqui mantemos apenas a movimentação.
        return promoted_now

    def select(self, row, col, current_color):
        """
        Retorna True se o turno deve ser trocado (jogada completa),
        Retorna False se o turno permanece (quando apenas selecionou peça ou multi-captura continua).
        """
        piece = self.get_piece(row, col)

        # 1) Se já existe uma peça selecionada e o usuário clicou em um destino válido
        if self.selected_piece:
            if (row, col) in self.valid_moves:
                captured = self.valid_moves[(row, col)]  # None se não for captura, (r,c) se for captura

                # Executa o movimento (move a peça)
                promoted_now = self.move(self.selected_piece, row, col)

                # Se foi captura, remove a peça capturada do tabuleiro
                if captured:
                    cap_r, cap_c = captured
                    self.board[cap_r][cap_c] = 0

                # Depois do movimento, verificar se a mesma peça tem nova(s) captura(s)
                # (multi-capture). Atualizamos valid_moves apenas com capturas.
                next_moves = self.get_valid_moves(self.selected_piece)
                capture_only = {m:v for m, v in next_moves.items() if v is not None}

                if captured and capture_only and not promoted_now:
                    # ainda pode capturar com a mesma peça -> jogador continua (não troca o turno)
                    self.valid_moves = capture_only
                    # manter a peça selecionada (para o próximo clique destino)
                    return False
                else:
                    # jogada finalizada (não há mais capturas obrigatórias com essa peça)
                    self.selected_piece = None
                    self.valid_moves = {}
                    return True
            else:
                # clique inválido quando havia seleção -> desselcionar
                self.selected_piece = None
                self.valid_moves = {}
                return False

        # 2) Sem peça selecionada: o jogador quer selecionar uma peça
        elif piece != 0 and piece.color == current_color:
            # quando houver capturas obrigatórias no tabuleiro, só permitir selecionar peças
            # que tenham pelo menos uma captura.
            forced = self.get_forced_captures(current_color)
            piece_moves = self.get_valid_moves(piece)
            piece_has_capture = any(v is not None for v in piece_moves.values())

            if forced:
                # existem capturas em algum lugar: só permissível selecionar se essa peça captura
                if not piece_has_capture:
                    # não permite seleção — jogador deve escolher outra peça que capture
                    return False

            # seleção válida
            self.selected_piece = piece
            # se houver capturas obrigatórias, filtrar para mostrar só movimentos de captura desta peça
            if forced:
                self.valid_moves = {m:v for m,v in piece_moves.items() if v is not None}
            else:
                self.valid_moves = piece_moves
            return False

    def get_valid_moves(self, piece):
        """
        Retorna um dict { (r,c): None_or_(captured_r,captured_c) }.
        None significa movimento simples, tupla significa captura da coordenada indicada.
        Capturas têm precedência: se existir ao menos uma captura para a peça,
        movimentos simples não são retornados.
        """
        capture_moves = {}
        simple_moves = {}

        # movimentos simples: peças comuns só para frente; rei para todas as direções
        simple_dirs = [(-1, -1), (-1, 1)] if piece.color == WHITE else [(1, -1), (1, 1)]
        if piece.king:
            simple_dirs = [(-1, -1), (-1, 1), (1, -1), (1, 1)]

        # capturas: agora permitido para trás também para peças comuns; rei também em todas
        capture_dirs = [(-1, -1), (-1, 1), (1, -1), (1, 1)]

        # movimentos simples
        for dr, dc in simple_dirs:
            r = piece.row + dr
            c = piece.col + dc
            if 0 <= r < ROWS and 0 <= c < COLS and self.board[r][c] == 0:
                simple_moves[(r, c)] = None

        # movimentos de captura
        for dr, dc in capture_dirs:
            r = piece.row + dr
            c = piece.col + dc
            if 0 <= r < ROWS and 0 <= c < COLS:
                target = self.board[r][c]
                jump_r = r + dr
                jump_c = c + dc
                if (
                    isinstance(target, Piece) and target.color != piece.color
                    and 0 <= jump_r < ROWS and 0 <= jump_c < COLS
                    and self.board[jump_r][jump_c] == 0
                ):
                    capture_moves[(jump_r, jump_c)] = (r, c)

        # se existem capturas, retorná-las exclusivamente
        return capture_moves if capture_moves else simple_moves

    def get_forced_captures(self, color):
        """
        Retorna True se existe pelo menos uma captura para a cor informada.
        """
        for r in range(ROWS):
            for c in range(COLS):
                p = self.board[r][c]
                if isinstance(p, Piece) and p.color == color:
                    moves = self.get_valid_moves(p)
                    if any(v is not None for v in moves.values()):
                        return True
        return False

    def has_any_moves(self, color):
        """Retorna True se a cor possui ao menos um movimento (simples ou captura)."""
        for r in range(ROWS):
            for c in range(COLS):
                p = self.board[r][c]
                if isinstance(p, Piece) and p.color == color:
                    if self.get_valid_moves(p):
                        return True
        return False

    def count_pieces(self):
        whites = 0
        blacks = 0
        for r in range(ROWS):
            for c in range(COLS):
                p = self.board[r][c]
                if isinstance(p, Piece):
                    if p.color == WHITE:
                        whites += 1
                    else:
                        blacks += 1
        return whites, blacks

    def get_winner(self):
        """
        Retorna WHITE, BLACK, ou None se ainda não há vencedor.
        Critérios: sem peças ou sem movimentos disponíveis.
        """
        whites, blacks = self.count_pieces()
        if whites == 0 and blacks == 0:
            return None
        if whites == 0:
            return BLACK
        if blacks == 0:
            return WHITE
        # Se ainda há peças de ambos, verificar se algum está travado
        if not self.has_any_moves(WHITE):
            return BLACK
        if not self.has_any_moves(BLACK):
            return WHITE
        return None

    def highlight_moves(self, win):
        for move in self.valid_moves:
            row, col = move
            pygame.draw.circle(win, BLUE, (col * SQUARE_SIZE + SQUARE_SIZE // 2, row * SQUARE_SIZE + SQUARE_SIZE // 2), 15)
