"""Shared Damas rules for both the pygame runtime and the web build."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple

BOARD_SIZE = 8
WHITE = "white"
BLACK = "black"


@dataclass
class Piece:
    """Represents a checker piece with its color and king status."""

    color: str
    king: bool = False

    def to_payload(self) -> Dict[str, object]:
        return {"color": self.color, "king": self.king}


Move = Dict[str, Optional[object]]
Coordinate = Tuple[int, int]


def _create_initial_board() -> List[List[Optional[Piece]]]:
    board: List[List[Optional[Piece]]] = [
        [None for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)
    ]
    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            if (row + col) % 2 == 1:
                if row < 3:
                    board[row][col] = Piece(BLACK)
                elif row > 4:
                    board[row][col] = Piece(WHITE)
    return board


def _serialize_board(board: Iterable[Iterable[Optional[Piece]]]) -> List[List[Optional[dict]]]:
    return [
        [piece.to_payload() if piece else None for piece in row] for row in board
    ]


class CheckersGame:
    """Encapsulates the rules of the Damas game."""

    board: List[List[Optional[Piece]]]
    turn: str
    winner: Optional[str]

    def __init__(self) -> None:
        self.board = []
        self.turn = WHITE
        self.winner = None
        self.reset()

    def reset(self) -> Dict[str, object]:
        """Reset the board and return a fresh snapshot for the UI."""
        self.board = _create_initial_board()
        self.turn = WHITE
        self.winner = None
        return self.snapshot()

    def snapshot(self) -> Dict[str, object]:
        """Return a serializable snapshot of the current game state."""
        forced = self.forced_pieces(self.turn) if not self.winner else []
        return {
            "board": _serialize_board(self.board),
            "turn": self.turn,
            "winner": self.winner,
            "forced": [list(pos) for pos in forced],
        }

    def piece_at(self, row: int, col: int) -> Optional[Piece]:
        if 0 <= row < BOARD_SIZE and 0 <= col < BOARD_SIZE:
            return self.board[row][col]
        return None

    def valid_moves(self, row: int, col: int, *, respect_turn: bool = True) -> List[Move]:
        piece = self.piece_at(row, col)
        if piece is None:
            return []
        if respect_turn and piece.color != self.turn and not self.winner:
            return []

        if piece.king:
            simple_dirs = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
        elif piece.color == WHITE:
            simple_dirs = [(-1, -1), (-1, 1)]
        else:
            simple_dirs = [(1, -1), (1, 1)]

        capture_dirs = [(-1, -1), (-1, 1), (1, -1), (1, 1)]

        simple_moves: List[Move] = []
        for dr, dc in simple_dirs:
            r = row + dr
            c = col + dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE and self.board[r][c] is None:
                simple_moves.append({"row": r, "col": c, "capture": None})

        capture_moves: List[Move] = []
        for dr, dc in capture_dirs:
            r = row + dr
            c = col + dc
            jump_r = r + dr
            jump_c = c + dc
            if not (
                0 <= r < BOARD_SIZE
                and 0 <= c < BOARD_SIZE
                and 0 <= jump_r < BOARD_SIZE
                and 0 <= jump_c < BOARD_SIZE
            ):
                continue
            target = self.board[r][c]
            if target and target.color != piece.color and self.board[jump_r][jump_c] is None:
                capture_moves.append(
                    {"row": jump_r, "col": jump_c, "capture": [r, c]}
                )

        return capture_moves if capture_moves else simple_moves

    def forced_pieces(self, color: Optional[str] = None) -> List[Coordinate]:
        color = color or self.turn
        forced: List[Coordinate] = []
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                piece = self.board[row][col]
                if piece and piece.color == color:
                    moves = self.valid_moves(row, col, respect_turn=False)
                    if any(move["capture"] is not None for move in moves):
                        forced.append((row, col))
        return forced

    def has_any_moves(self, color: str) -> bool:
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                piece = self.board[row][col]
                if piece and piece.color == color:
                    if self.valid_moves(row, col, respect_turn=False):
                        return True
        return False

    def _count_pieces(self) -> Tuple[int, int]:
        whites = 0
        blacks = 0
        for row in self.board:
            for piece in row:
                if piece is None:
                    continue
                if piece.color == WHITE:
                    whites += 1
                else:
                    blacks += 1
        return whites, blacks

    def get_winner(self) -> Optional[str]:
        whites, blacks = self._count_pieces()
        if whites == 0 and blacks == 0:
            return None
        if whites == 0:
            return BLACK
        if blacks == 0:
            return WHITE
        if not self.has_any_moves(WHITE):
            return BLACK
        if not self.has_any_moves(BLACK):
            return WHITE
        return None

    def move(self, from_row: int, from_col: int, to_row: int, to_col: int) -> Dict[str, object]:
        if self.winner:
            return {"success": False, "board": _serialize_board(self.board), "turn": self.turn, "winner": self.winner, "forced": []}

        piece = self.piece_at(from_row, from_col)
        if piece is None or piece.color != self.turn:
            return {"success": False}

        moves = self.valid_moves(from_row, from_col)
        chosen: Optional[Move] = None
        for move in moves:
            if move["row"] == to_row and move["col"] == to_col:
                chosen = move
                break
        if chosen is None:
            return {"success": False}

        forced_now = self.forced_pieces(self.turn)
        if forced_now and chosen["capture"] is None:
            return {"success": False}

        self.board[to_row][to_col] = piece
        self.board[from_row][from_col] = None

        promoted = False
        if not piece.king:
            if piece.color == WHITE and to_row == 0:
                piece.king = True
                promoted = True
            elif piece.color == BLACK and to_row == BOARD_SIZE - 1:
                piece.king = True
                promoted = True

        capture = chosen["capture"]
        if capture:
            cap_row, cap_col = capture
            self.board[cap_row][cap_col] = None

        next_captures = []
        if capture and not promoted:
            for move in self.valid_moves(to_row, to_col):
                if move["capture"] is not None:
                    next_captures.append(move)

        extra_capture = bool(next_captures)
        if not extra_capture:
            self.turn = BLACK if self.turn == WHITE else WHITE

        self.winner = self.get_winner()
        forced = []
        if self.winner:
            forced = []
        elif extra_capture:
            forced = [[to_row, to_col]]
        else:
            forced = [list(pos) for pos in self.forced_pieces(self.turn)]

        return {
            "success": True,
            "board": _serialize_board(self.board),
            "turn": self.turn,
            "winner": self.winner,
            "forced": forced,
            "extra_capture": extra_capture,
            "next_moves": next_captures,
            "selected": [to_row, to_col],
            "capture": capture,
            "promoted": promoted,
        }


__all__ = ["CheckersGame", "Piece", "WHITE", "BLACK", "BOARD_SIZE"]
