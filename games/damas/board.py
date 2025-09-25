import pygame
from constants import ROWS, COLS, SQUARE_SIZE, BEIGE, BROWN, BLUE, WHITE as WHITE_RGB, BLACK as BLACK_RGB, GREY
from logic import CheckersGame, WHITE, BLACK

PIECE_COLORS = {
    WHITE: WHITE_RGB,
    BLACK: BLACK_RGB,
}

KING_COLOR = (255, 215, 0)


class Board:
    def __init__(self):
        self.game = CheckersGame()
        self.selected = None  # (row, col)
        self.valid_moves = {}

    def draw_squares(self, win):
        win.fill(BEIGE)
        for row in range(ROWS):
            for col in range(row % 2, COLS, 2):
                pygame.draw.rect(
                    win,
                    BROWN,
                    (col * SQUARE_SIZE, row * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE),
                )

    def draw(self, win):
        self.draw_squares(win)
        for row in range(ROWS):
            for col in range(COLS):
                piece = self.game.board[row][col]
                if not piece:
                    continue
                center = (
                    col * SQUARE_SIZE + SQUARE_SIZE // 2,
                    row * SQUARE_SIZE + SQUARE_SIZE // 2,
                )
                radius = SQUARE_SIZE // 2 - 15
                pygame.draw.circle(win, GREY, center, radius + 2)
                pygame.draw.circle(win, PIECE_COLORS[piece.color], center, radius)
                if piece.king:
                    pygame.draw.circle(win, KING_COLOR, center, radius // 2)

        if self.selected:
            row, col = self.selected
            center = (
                col * SQUARE_SIZE + SQUARE_SIZE // 2,
                row * SQUARE_SIZE + SQUARE_SIZE // 2,
            )
            pygame.draw.circle(win, BLUE, center, SQUARE_SIZE // 2 - 8, 3)

        for move in self.valid_moves:
            row, col = move
            center = (
                col * SQUARE_SIZE + SQUARE_SIZE // 2,
                row * SQUARE_SIZE + SQUARE_SIZE // 2,
            )
            pygame.draw.circle(win, BLUE, center, 15)

    def select(self, row, col):
        if self.game.winner:
            return False

        if self.selected:
            move = self.valid_moves.get((row, col))
            if not move:
                self.selected = None
                self.valid_moves = {}
                return False

            result = self.game.move(self.selected[0], self.selected[1], row, col)
            if not result.get("success"):
                self.selected = None
                self.valid_moves = {}
                return False

            if result.get("extra_capture"):
                self.selected = tuple(result["selected"])
                self.valid_moves = {
                    (m["row"], m["col"]): m for m in result["next_moves"]
                }
                return False

            self.selected = None
            self.valid_moves = {}
            return True

        piece = self.game.piece_at(row, col)
        if not piece or piece.color != self.game.turn:
            return False

        forced = {tuple(pos) for pos in self.game.forced_pieces()}
        if forced and (row, col) not in forced:
            return False

        moves = self.game.valid_moves(row, col)
        if forced:
            moves = [m for m in moves if m["capture"] is not None]
        if not moves:
            return False

        self.selected = (row, col)
        self.valid_moves = {(m["row"], m["col"]): m for m in moves}
        return False

    def get_winner(self):
        return self.game.winner
