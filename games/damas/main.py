import pygame
import sys
from constants import WIDTH, HEIGHT, WHITE, BLACK
from board import Board
from utils import get_row_col_from_mouse

pygame.init()
WIN = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Jogo de Damas")

def main():
    run = True
    clock = pygame.time.Clock()
    board = Board()
    turn = WHITE

    winner = None
    while run:
        clock.tick(60)
        board.draw(WIN)
        # feedback de vencedor
        if winner:
            font = pygame.font.SysFont(None, 64)
            text = "Brancas venceram!" if winner == WHITE else "Negras venceram!"
            surf = font.render(text, True, (255, 215, 0))
            rect = surf.get_rect(center=(WIDTH//2, HEIGHT//2))
            WIN.blit(surf, rect)
        pygame.display.update()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                run = False

            if event.type == pygame.MOUSEBUTTONDOWN:
                pos = pygame.mouse.get_pos()
                row, col = get_row_col_from_mouse(pos)
                moved = board.select(row, col, turn)
                if moved:
                    turn = BLACK if turn == WHITE else WHITE
                    winner = board.get_winner()
                    if winner:
                        # parar a interação após vitória
                        run = False

    pygame.quit()


if __name__ == "__main__" or sys.platform == "emscripten":
    main()
