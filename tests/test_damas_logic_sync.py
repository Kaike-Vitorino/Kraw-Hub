from pathlib import Path


def test_web_and_runtime_logic_are_identical():
    repo_root = Path(__file__).resolve().parents[1]
    runtime_logic = repo_root / "games" / "damas" / "logic.py"
    web_logic = repo_root / "kraw_hub" / "static" / "games" / "damas" / "web_build" / "logic.py"

    assert runtime_logic.is_file()
    assert web_logic.is_file()

    assert runtime_logic.read_text(encoding="utf-8") == web_logic.read_text(encoding="utf-8")
