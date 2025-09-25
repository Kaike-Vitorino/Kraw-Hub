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
