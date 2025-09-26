# Kraw-Hub - Hub de Jogos Web Plug-and-Play

O Kraw-Hub é um catálogo de jogos web com arquitetura plug-and-play. Cada jogo vive na pasta `/games/<id-do-jogo>/` e é carregado automaticamente a partir de um manifesto `kraw.json`. Nenhuma alteração no código do hub é necessária para cadastrar um novo título.

---

## Estrutura do projeto

```
/kraw_hub/    -> código do hub (FastAPI + templates)
/games/       -> onde os jogos ficam (uma pasta por jogo)
```

Dentro de `/games/<id>/` você deve manter:

```
/games/damas/
  kraw.json          <- manifesto do jogo
  icon.png           <- ícone 1:1 (256x256 recomendado)
  web_build/         <- build web (HTML, JS, CSS, assets)
```

Regra básica: uma pasta corresponde a um único jogo.

---

## Manifesto `kraw.json`

Exemplo:

```json
{
  "id": "damas",
  "name": "Damas",
  "author": "Equipe Kraw",
  "engine": "javascript",
  "entry": "index.html",
  "width": 900,
  "height": 640,
  "tags": ["tabuleiro", "classico", "phaser"],
  "version": "2.0.0"
}
```

Campos principais:

- **id** – identificador único (minúsculo, sem espaços).
- **name** – nome exibido no hub.
- **author** – crédito do jogo.
- **engine** – use `"javascript"` para builds web (Phaser, Canvas, etc.).
- **entry** – arquivo inicial dentro de `web_build/` (geralmente `index.html`).
- **width/height** – dimensão usada no iframe do hub.
- **tags** – palavras-chave exibidas como chips (opcional).
- **version** – versão do jogo (opcional).

---

## Conteúdo obrigatório do jogo

- `kraw.json`
- `icon.png`
- `web_build/`
  - `index.html` (ou o arquivo indicado em `entry`)
  - Todos os assets necessários (JS, CSS, imagens, áudio, etc.)

Dica: se estiver usando Phaser ou outra stack moderna, mantenha o build final já pronto dentro de `web_build/`.

---

## Rodando o hub localmente

```bash
pip install -r requirements.txt
uvicorn kraw_hub.app:app --reload
```

Em seguida, acesse `http://localhost:8000/` para visualizar o catálogo. O hub lista automaticamente qualquer jogo com `kraw.json` válido.

---

## Adicionando um novo jogo

1. Crie a pasta do jogo em `/games/<id>/`.
2. Adicione `kraw.json` e `icon.png`.
3. Gere a pasta `web_build/` com sua aplicação web (HTML/CSS/JS).
   - Exemplos: projeto Phaser, Vite, bundlers em geral ou HTML puro.
4. Garanta que `web_build/index.html` (ou o arquivo configurado) funciona abrindo direto no navegador.
5. Rode o hub e confirme que o jogo aparece como esperado.

---

## Checklist antes do PR

- [ ] Pasta criada em `/games/<id>/`.
- [ ] `kraw.json` válido contendo `"engine": "javascript"` e `"entry": "index.html"` (ou equivalente).
- [ ] `icon.png` incluído.
- [ ] `web_build/` com todos os arquivos do jogo web.
- [ ] Jogo testado via hub (`/play/<id>`).

---

## Exemplo atual

O jogo Damas incluído no repositório foi reimplementado em JavaScript/Phaser, seguindo esse fluxo. Use-o como referência para estruturar novos jogos.

Bom desenvolvimento!
