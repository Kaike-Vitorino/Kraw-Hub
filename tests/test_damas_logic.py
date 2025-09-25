from games.damas.logic import CheckersGame, Piece, WHITE, BLACK


def count_color(board, color):
    return sum(1 for row in board for piece in row if piece and piece["color"] == color)


def test_initial_state_has_12_pieces_each():
    game = CheckersGame()
    snapshot = game.snapshot()
    assert count_color(snapshot["board"], WHITE) == 12
    assert count_color(snapshot["board"], BLACK) == 12
    assert snapshot["turn"] == WHITE
    assert snapshot["forced"] == []
    assert snapshot["winner"] is None


def test_forced_capture_enforced():
    game = CheckersGame()
    game.board = [[None for _ in range(8)] for _ in range(8)]
    game.board[5][0] = Piece(WHITE)
    game.board[4][1] = Piece(BLACK)
    game.board[2][3] = Piece(BLACK)
    game.turn = WHITE

    forced = game.forced_pieces()
    assert forced == [(5, 0)]

    moves = game.valid_moves(5, 0)
    assert any(move["capture"] == [4, 1] for move in moves)
    # simple forward move should be rejected because capture is available
    result = game.move(5, 0, 4, 1)
    assert not result["success"]

    capture_result = game.move(5, 0, 3, 2)
    assert capture_result["success"]
    assert capture_result["extra_capture"]
    assert capture_result["selected"] == [3, 2]
    assert any(move["row"] == 1 and move["col"] == 4 for move in capture_result["next_moves"])


def test_multi_capture_switches_turn_after_sequence():
    game = CheckersGame()
    game.board = [[None for _ in range(8)] for _ in range(8)]
    game.board[5][0] = Piece(WHITE)
    game.board[4][1] = Piece(BLACK)
    game.board[2][3] = Piece(BLACK)
    game.turn = WHITE

    first = game.move(5, 0, 3, 2)
    assert first["extra_capture"]
    second = game.move(3, 2, 1, 4)
    assert second["success"]
    assert not second["extra_capture"]
    assert game.turn == BLACK


def test_winner_detected_when_no_moves():
    game = CheckersGame()
    game.board = [[None for _ in range(8)] for _ in range(8)]
    game.board[0][1] = Piece(WHITE)
    game.turn = BLACK
    game.winner = None

    assert game.get_winner() == WHITE
