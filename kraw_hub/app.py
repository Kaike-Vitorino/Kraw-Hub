from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from jinja2 import Environment, FileSystemLoader
from .registry import load_registry

app = FastAPI()
env = Environment(loader=FileSystemLoader("kraw_hub/templates"))

# Carregar lista de jogos no startup
REGISTRY = load_registry()

# Servir arquivos estáticos
app.mount("/static", StaticFiles(directory="kraw_hub/static"), name="static")

@app.get("/", response_class=HTMLResponse)
def home():
    tpl = env.get_template("index.html")
    return tpl.render(games=REGISTRY)

@app.get("/play/{gid}", response_class=HTMLResponse)
def play(gid: str):
    game = next((g for g in REGISTRY if g["id"] == gid), None)
    if not game:
        raise HTTPException(404, "Jogo não encontrado")
    tpl = env.get_template("play.html")
    iframe_src = f"/static/games/{gid}/web_build/index.html"
    return tpl.render(game=game, iframe_src=iframe_src)
