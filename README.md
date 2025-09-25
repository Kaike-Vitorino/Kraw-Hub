# 🎮 Kraw-Hub — Guia para Desenvolvedores de Jogos

O **Kraw-Hub** é um hub de jogos em Python com arquitetura **plug-and-play**.
Isso significa que **cada jogo tem sua própria pasta** e, quando você adiciona essa pasta na estrutura correta, o hub já reconhece o jogo e mostra automaticamente na interface — sem precisar mexer no código central.

---

## 📂 Estrutura do projeto

A raiz do repositório tem duas pastas principais:

```
/kraw_hub/    → código do hub (não altere)
/games/       → aqui ficam os jogos (você vai criar suas pastas dentro dela)
```

### Dentro de `/games/`

Cada **jogo** deve estar em **sua própria pasta** dentro de `/games/`.
Exemplo de dois jogos (Damas e Tetris):

```
/games/
   damas/
      kraw.json
      icon.png
      main.py
      web_build/   → será gerado no build
   tetris/
      kraw.json
      icon.png
      main.py
      web_build/   → será gerado no build
```

📌 **Regra**: cada pasta dentro de `/games/` representa **um jogo**.

---

## 🧾 O manifesto do jogo (`kraw.json`)

Cada pasta de jogo deve ter um arquivo chamado **`kraw.json`**, que descreve as informações do jogo.
Exemplo:

```json
{
  "id": "damas",
  "name": "Damas",
  "author": "Equipe Kraw",
  "engine": "pygame",
  "entry": "main.py",
  "width": 800,
  "height": 600,
  "tags": ["tabuleiro", "clássico"],
  "version": "1.0.0"
}
```

### Campos principais:

* **id** → identificador único do jogo (minúsculo, sem espaços, ex: `"damas"`).
* **name** → nome que aparecerá no hub.
* **author** → nome do criador.
* **engine** → pode ser `"pygame"` ou `"pyodide"`.
* **entry** → nome do arquivo principal (`main.py` ou outro).
* **width/height** → tamanho da tela dentro do navegador.
* **tags** → palavras-chave (opcional).
* **version** → versão do jogo (opcional).

---

## 🎨 Arquivos obrigatórios dentro de cada pasta de jogo

* `kraw.json` → manifesto com informações do jogo.
* `icon.png` → ícone quadrado (256x256 px recomendado).
* Código do jogo:

  * Se for **Pygame** → coloque seu código em `main.py` (ou outro nome definido em `entry`).
  * Se for **Pyodide** → coloque um `index.html` que carrega o Pyodide e roda seu código.
* `web_build/` → pasta gerada automaticamente no **build**. Deve conter um `index.html` pronto para rodar no navegador.

---

## 🚀 Como rodar o hub localmente

1. Instale as dependências:

   ```bash
   pip install -r requirements.txt
   ```
2. Rode o servidor:

   ```bash
   uvicorn kraw_hub.app:app --reload
   ```
3. Abra no navegador:

   ```
   http://localhost:8000/
   ```

O catálogo aparecerá e vai listar todos os jogos dentro de `/games/` que tiverem `kraw.json` válido.

---

## 🕹️ Como adicionar um novo jogo

### Passo 1 — Criar a pasta do jogo

Dentro de `/games/`, crie uma pasta com o **id** do jogo.
Exemplo para o jogo **Flappy**:

```
/games/flappy/
```

### Passo 2 — Adicionar arquivos obrigatórios

Dentro da sua pasta (`/games/flappy/`), crie:

* `kraw.json`
* `icon.png`
* Código do jogo (`main.py` ou `index.html` dependendo da engine escolhida).

### Passo 3 — Escolher a engine

#### 🔹 Se o jogo usa **Pygame**

1. Escreva o código em `main.py`.
2. Instale e rode o build com **pygbag**:

   ```bash
   pip install pygbag
   pygbag --build games/flappy
   ```

   Isso vai gerar os arquivos web em `games/flappy/build/web/`.
3. Copie para `web_build/`:

   ```bash
   rm -rf games/flappy/web_build
   mkdir -p games/flappy/web_build
   cp -r games/flappy/build/web/* games/flappy/web_build/
   ```

#### 🔹 Se o jogo usa **Pyodide**

1. Crie um `index.html` que carregue `pyodide.js` e execute seu código Python.
2. Coloque esse `index.html` (e arquivos necessários) em `games/seu_jogo/web_build/`.

### Passo 4 — Testar no hub

* Rode o hub (`uvicorn ...`)
* Seu jogo deve aparecer automaticamente no catálogo.
* Clique no card → abre `/play/seu_jogo`.

---

## ✅ Checklist para PR de novos jogos

* [ ] Criou uma pasta em `/games/` com o nome do jogo.
* [ ] Incluiu `kraw.json` válido.
* [ ] Incluiu `icon.png` (256x256).
* [ ] Gerou `web_build/index.html`.
* [ ] Testou localmente e o jogo rodou no navegador.

---

## 📌 Exemplo prático (resumido)

Para criar um jogo de **Damas**:

```
/games/damas/
   kraw.json
   icon.png
   main.py
   web_build/ (gerado pelo build)
```

---

## 🧩 Fluxo para devs

1. Criar pasta em `/games/`.
2. Adicionar `kraw.json`, `icon.png` e código.
3. Gerar `web_build/`.
4. Testar localmente no hub.
5. Abrir PR.

Se tudo estiver certo, o hub reconhece o jogo e mostra automaticamente. 🎉
