#!/bin/bash
set -e

# Criar estrutura de diretórios (sem criar pasta raiz duplicada)
mkdir -p {kraw_hub/{templates,static/{css,js,img},schemas},.github/workflows,tests}

# Arquivos raiz
cat > .gitignore <<'EOF'
__pycache__/
*.pyc
.venv/
build/
dist/
games/*/web_build/
EOF

cat > requirements.txt <<'EOF'
fastapi
uvicorn
jinja2
pydantic
EOF

cat > README.md <<'EOF'
# 🎮 Kraw-Hub

Hub de jogos em Python com arquitetura **plug-and-play**.
Cada jogo vive dentro de `/games/<nome-do-jogo>/` e é automaticamente reconhecido
pelo hub através de um arquivo `kraw.json`.

Consulte o guia de desenvolvedores no README dentro do repositório.
EOF

cat > LICENSE <<'EOF'
MIT License
EOF

# Arquivos em kraw_hub/
cat > kraw_hub/__init__.py <<'EOF'
# Kraw-Hub package initializer
EOF

cat > kraw_hub/app.py <<'EOF'
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
EOF

cat > kraw_hub/registry.py <<'EOF'
import json
from pathlib import Path

GAMES_DIR = Path(__file__).parent.parent / "games"

def load_registry():
    games = []
    for manifest in GAMES_DIR.glob("*/kraw.json"):
        try:
            data = json.loads(manifest.read_text(encoding="utf-8"))
            gid = data.get("id")
            if not gid:
                continue
            data["path"] = str(manifest.parent)
            data["web_entry"] = str(manifest.parent / "web_build" / "index.html")
            games.append(data)
        except Exception as e:
            print(f"Erro ao carregar {manifest}: {e}")
    return sorted(games, key=lambda g: g["name"].lower() if "name" in g else "")
EOF

# Templates
cat > kraw_hub/templates/index.html <<'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Kraw-Hub</title>
  <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
  <h1>Kraw-Hub 🎮</h1>
  <div class="games-grid">
    {% for game in games %}
    <div class="game-card">
      <img src="/static/games/{{game.id}}/icon.png" alt="{{game.name}} icon">
      <h2>{{ game.name }}</h2>
      <p>{{ game.author or "Autor desconhecido" }}</p>
      <a href="/play/{{game.id}}">Jogar</a>
    </div>
    {% endfor %}
  </div>
</body>
</html>
EOF

cat > kraw_hub/templates/play.html <<'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>{{ game.name }} - Kraw-Hub</title>
  <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
  <h1>{{ game.name }}</h1>
  <iframe src="{{ iframe_src }}" width="{{ game.width }}" height="{{ game.height }}"
          allow="gamepad; fullscreen"
          style="border:none;"></iframe>
</body>
</html>
EOF

# Static files
cat > kraw_hub/static/css/style.css <<'EOF'
body {
  font-family: sans-serif;
  background: #f9f9f9;
  margin: 0;
  padding: 20px;
}
h1 { text-align: center; }
.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}
.game-card {
  background: white;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 0 5px rgba(0,0,0,0.1);
  text-align: center;
}
.game-card img {
  max-width: 100%;
  height: auto;
}
EOF

cat > kraw_hub/static/js/script.js <<'EOF'
// Scripts do hub (busca, filtros etc. no futuro)
console.log("Kraw-Hub carregado");
EOF

# JSON schema (simplificado)
cat > kraw_hub/schemas/kraw_schema.json <<'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "KrawHub Game Manifest",
  "type": "object",
  "required": ["id", "name", "engine", "entry"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "author": { "type": "string" },
    "engine": { "enum": ["pygame", "pyodide"] },
    "entry": { "type": "string" },
    "width": { "type": "number" },
    "height": { "type": "number" },
    "tags": { "type": "array", "items": { "type": "string" } },
    "version": { "type": "string" }
  }
}
EOF

# Tests
cat > tests/test_registry.py <<'EOF'
from kraw_hub import registry

def test_load_registry_runs():
    games = registry.load_registry()
    assert isinstance(games, list)
EOF

# GitHub Actions
cat > .github/workflows/build.yml <<'EOF'
name: Build and Validate

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: "3.10"
    - name: Install dependencies
      run: pip install -r requirements.txt
    - name: Run tests
      run: pytest
EOF

echo "✅ Estrutura do Kraw-Hub criada com sucesso!"
