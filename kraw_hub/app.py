import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from jinja2 import Environment, FileSystemLoader

from .registry import load_registry

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

logger = logging.getLogger("kraw_hub")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("[KRAW] %(levelname)s %(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

app = FastAPI()
env = Environment(loader=FileSystemLoader(str(BASE_DIR / "templates")))

# Servir arquivos estáticos do hub e dos jogos usando caminhos absolutosa
app.mount("/static/games", StaticFiles(directory=str(ROOT_DIR / "games")), name="legacy-games")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
app.mount("/games", StaticFiles(directory=str(ROOT_DIR / "games")), name="games")

@app.get("/", response_class=HTMLResponse)
def home():
    games = load_registry()
    logger.info("Home render: games=%s", [g.get("id") for g in games])
    tpl = env.get_template("index.html")
    return tpl.render(games=games)

@app.get("/play/{gid}", response_class=HTMLResponse)
def play(gid: str):
    games = load_registry()
    game = next((g for g in games if g["id"] == gid), None)
    if not game:
        logger.warning("Play %s: jogo não encontrado", gid)
        raise HTTPException(404, "Jogo não encontrado")
    tpl = env.get_template("play.html")
    iframe_src = game.get("iframe_src")
    if not iframe_src:
        entry = Path(game.get("entry", "index.html")).name
        iframe_src = f"/games/{gid}/web_build/{entry}"
    logger.info(
        "Play %s: entry=%s iframe_src=%s tags=%s",
        gid,
        game.get("entry"),
        iframe_src,
        game.get("tags"),
    )
    return tpl.render(game=game, iframe_src=iframe_src)
