from kraw_hub import registry

def test_load_registry_runs():
    games = registry.load_registry()
    assert isinstance(games, list)
