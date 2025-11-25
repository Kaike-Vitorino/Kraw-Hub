import json
import logging
from pathlib import Path

GAMES_DIR = (Path(__file__).resolve().parent.parent / "games").resolve()

logger = logging.getLogger("kraw_hub")


def load_registry():
    games = []
    for manifest in GAMES_DIR.glob("*/kraw.json"):
        try:
            data = json.loads(manifest.read_text(encoding="utf-8"))
            gid = data.get("id")
            if not gid:
                continue
            entry = Path(data.get("entry", "index.html")).name
            data["entry"] = entry
            data["width"] = int(data.get("width", 800))
            data["height"] = int(data.get("height", 600))
            data["icon_url"] = f"/games/{gid}/icon.png"
            data["iframe_src"] = f"/games/{gid}/web_build/{entry}"
            web_index = manifest.parent / "web_build" / entry
            logger.info(
                "Registry loaded %s: entry=%s web_exists=%s icon_exists=%s",
                gid,
                entry,
                web_index.exists(),
                (manifest.parent / "icon.png").exists(),
            )
            games.append(data)
        except Exception as e:
            print(f"Erro ao carregar {manifest}: {e}")
    return sorted(games, key=lambda g: g["name"].lower() if "name" in g else "")
