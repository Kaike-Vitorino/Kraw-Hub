import pygame
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

    while run:
        clock.tick(60)
        board.draw(WIN)
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

    pygame.quit()


if __name__ == "__main__":
    main()
