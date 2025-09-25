import sys
import pygame

from constants import WIDTH, HEIGHT
from board import Board
from logic import WHITE, BLACK
from utils import get_row_col_from_mouse

pygame.init()
WIN = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Jogo de Damas")

COLOR_LABEL = {
    WHITE: "Brancas",
    BLACK: "Negras",
}


def draw_winner_overlay(win, winner):
    font = pygame.font.SysFont(None, 64)
    text = f"{COLOR_LABEL[winner]} venceram!"
    surface = font.render(text, True, (255, 215, 0))
    rect = surface.get_rect(center=(WIDTH // 2, HEIGHT // 2))
    win.blit(surface, rect)


def main():
    run = True
    clock = pygame.time.Clock()
    board = Board()

    while run:
        clock.tick(60)
        board.draw(WIN)

        winner = board.get_winner()
        if winner:
            draw_winner_overlay(WIN, winner)

        pygame.display.update()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                run = False

            if event.type == pygame.MOUSEBUTTONDOWN and not winner:
                pos = pygame.mouse.get_pos()
                row, col = get_row_col_from_mouse(pos)
                finished_turn = board.select(row, col)
                if finished_turn:
                    winner = board.get_winner()
                    if winner:
                        run = False

    pygame.quit()


if __name__ == "__main__" or sys.platform == "emscripten":
    main()
