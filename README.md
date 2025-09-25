# 🎮 Kraw-Hub — Guia para Desenvolvedores de Jogos (JavaScript/Phaser)

O **Kraw-Hub** é um hub de jogos com arquitetura **plug-and-play**, projetado para integrar jogos desenvolvidos para a web, preferencialmente utilizando JavaScript e frameworks como o Phaser. Isso significa que **cada jogo tem sua própria pasta** e, quando você adiciona essa pasta na estrutura correta, o hub já reconhece o jogo e o disponibiliza automaticamente na interface, sem a necessidade de alterar o código central do hub.

---

## 📂 Estrutura do projeto

A raiz do repositório possui duas pastas principais:

```
/kraw_hub/    → Código do hub (não altere)
/games/       → Aqui ficam os jogos (você criará suas pastas dentro dela)
```

### Dentro de `/games/`

Cada **jogo** deve estar em **sua própria pasta** dentro de `/games/`.
Exemplo para o jogo de Damas:

```
/games/
   damas/
      kraw.json
      icon.png
      web_build/   → Contém todos os arquivos do jogo compilado para web
```

📌 **Regra**: Cada pasta dentro de `/games/` representa **um jogo**.

---

## 🧾 O manifesto do jogo (`kraw.json`)

Cada pasta de jogo deve conter um arquivo chamado **`kraw.json`**, que descreve as informações essenciais do jogo.
Exemplo:

```json
{
  "id": "damas",
  "name": "Damas",
  "author": "Equipe Kraw",
  "engine": "javascript",
  "entry": "index.html",
  "width": 800,
  "height": 600,
  "tags": ["tabuleiro", "clássico"],
  "version": "1.0.0"
}
```

### Campos principais:

*   **id** → Identificador único do jogo (minúsculo, sem espaços, ex: `"damas"`).
*   **name** → Nome que aparecerá no hub.
*   **author** → Nome do criador.
*   **engine** → Deve ser `"javascript"` para jogos desenvolvidos para a web.
*   **entry** → Nome do arquivo principal do seu jogo web (geralmente `index.html`).
*   **width/height** → Dimensões (largura e altura) da tela do jogo em pixels, que serão usadas para o `iframe` no navegador.
*   **tags** → Palavras-chave para categorização (opcional).
*   **version** → Versão do jogo (opcional).

---

## 🎨 Arquivos obrigatórios dentro de cada pasta de jogo

*   `kraw.json` → Manifesto com as informações do jogo.
*   `icon.png` → Ícone quadrado do jogo (256x256 px recomendado).
*   `web_build/` → Esta pasta deve conter todos os arquivos do seu jogo compilado para web (HTML, CSS, JavaScript, imagens, áudios, etc.). É fundamental que ela inclua um arquivo `index.html` que servirá como ponto de entrada para o jogo no navegador.

    Exemplo de estrutura para um jogo Phaser:

    ```
    /games/seu_jogo/
       kraw.json
       icon.png
       web_build/
          index.html
          js/
             game.js
             phaser.min.js
          assets/
             sprites/
             audio/
    ```

---

## 🚀 Como rodar o hub localmente

1.  Instale as dependências do projeto (se ainda não o fez):

    ```bash
    pip install -r requirements.txt
    ```

2.  Inicie o servidor Uvicorn:

    ```bash
    uvicorn kraw_hub.app:app --reload
    ```

3.  Abra o navegador e acesse:

    ```
    http://localhost:8000/
    ```

O catálogo de jogos aparecerá e listará automaticamente todos os jogos dentro de `/games/` que possuírem um `kraw.json` válido.

---

## 🕹️ Como adicionar um novo jogo (JavaScript/Phaser)

### Passo 1 — Criar a pasta do jogo

Dentro de `/games/`, crie uma pasta com o **id** único do seu jogo.
Exemplo para o jogo **Flappy Bird**:

```
/games/flappy_bird/
```

### Passo 2 — Adicionar arquivos obrigatórios

Dentro da pasta do seu jogo (`/games/flappy_bird/`), crie:

*   `kraw.json` (conforme o exemplo acima, com `"engine": "javascript"`)
*   `icon.png`
*   A pasta `web_build/`

### Passo 3 — Desenvolver o jogo em JavaScript (ex: com Phaser)

1.  Desenvolva seu jogo utilizando JavaScript e um framework como Phaser, ou qualquer outra tecnologia web (HTML, CSS, JavaScript).
2.  O ponto de entrada do seu jogo deve ser um arquivo `index.html` localizado dentro da pasta `web_build/`.
3.  Todos os arquivos necessários para o funcionamento do jogo (scripts, assets, estilos, etc.) devem ser organizados dentro da pasta `web_build/` ou em suas subpastas.

### Passo 4 — Testar no hub

*   Certifique-se de que o hub esteja rodando (`uvicorn ...`).
*   Seu jogo deverá aparecer automaticamente no catálogo.
*   Clique no card do seu jogo para abri-lo em `/play/seu_jogo` e testar seu funcionamento no navegador.

---

## ✅ Checklist para PR de novos jogos

Para que seu jogo seja aceito no Kraw-Hub, siga este checklist:

*   [ ] Criou uma pasta em `/games/` com o nome do jogo (usando o `id` como nome da pasta).
*   [ ] Incluiu um arquivo `kraw.json` válido, com `"engine": "javascript"` e `"entry": "index.html"`.
*   [ ] Incluiu um arquivo `icon.png` (256x256 px recomendado).
*   [ ] Criou a pasta `web_build/` contendo o `index.html` e todos os arquivos necessários para o jogo web.
*   [ ] Testou localmente e confirmou que o jogo roda corretamente no navegador através do Kraw-Hub.

---

## 🧩 Fluxo para Desenvolvedores

1.  Crie a pasta do seu jogo em `/games/`.
2.  Adicione `kraw.json`, `icon.png` e a pasta `web_build/`.
3.  Desenvolva seu jogo em JavaScript/Phaser (ou outra tecnologia web) dentro de `web_build/`.
4.  Teste o jogo localmente no Kraw-Hub.
5.  Abra um Pull Request (PR) com suas alterações.

Se tudo estiver de acordo com as diretrizes, seu jogo será reconhecido e disponibilizado automaticamente no Kraw-Hub! 🎉
