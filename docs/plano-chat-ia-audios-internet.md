# Plano: URL com chat de IA para buscar áudios na internet e adicionar à biblioteca

Especificação da rota (URL) que integra um chat com IA: a IA busca na internet áudios e músicas conforme os parâmetros do usuário, traz uma lista das melhores opções encontradas e permite **adicionar por ali mesmo** esses itens na URL de áudios default do projeto (biblioteca).

---

## 1. Objetivo

- **URL do chat:** uma rota no app (ex.: `/library/ai` ou `/sounds/ai`) onde o usuário **conversa com uma IA**.
- **Comportamento da IA:** com base na conversa, a IA **busca na internet** (varredura web real, não só uma API fixa) por **áudios e músicas** que atendam ao que o usuário pediu (ex.: “sons de chuva bem avaliados”, “músicas épicas para batalha”, “efeitos de cidade”).
- **Resultado:** a IA devolve uma **lista das melhores opções** encontradas naqueles parâmetros (nome, URL, origem).
- **Ação na mesma página:** o usuário pode **adicionar** cada item da lista **direto dali** para a **URL de áudios default** do projeto — ou seja, para a **biblioteca de áudios** (página que lista os áudios por tipo: efeitos de tempo, batalha, animais, cidades, etc.).

---

## 2. URLs envolvidas

| URL (rota) | Descrição |
|------------|-----------|
| **`/library/ai`** (ou `/sounds/ai`) | Página do **chat com IA**. Usuário descreve o que precisa; a IA busca na internet e retorna lista de melhores áudios/músicas; na mesma tela o usuário pode adicionar cada item à biblioteca. |
| **`/library`** (ou `/sounds/library`) | Página de **áudios default** do projeto: lista da biblioteca de áudios, **divididos por tipo** (efeitos de tempo, batalha, animais, cidades, ambiente, música, outros). Itens adicionados pelo chat aparecem aqui. |

Ambas as rotas são protegidas por **feature flag** (visíveis apenas para usuários permitidos em `AI_LIBRARY_ALLOWED_USER_IDS`).

---

## 3. Fluxo completo

```mermaid
sequenceDiagram
  participant U as Usuário
  participant Chat as Página /library/ai
  participant API as POST /api/ai/chat
  participant Lib as POST /api/library
  participant Web as Busca na Web
  participant LLM as LLM

  U->>Chat: Abre chat e escreve ex.: "sons de chuva e trovão bem avaliados"
  Chat->>API: messages
  API->>Web: Query (ex.: melhores sons chuva trovão download)
  Web->>API: Resultados (títulos, links, snippets)
  API->>LLM: Contexto + resultados
  LLM->>API: Resposta + lista de sugestões (name, sourceUrl, source)
  API->>Chat: message + suggestions[]
  Chat->>U: Mostra resposta e lista de áudios com botão "Adicionar à biblioteca"
  U->>Chat: Clica "Adicionar" em um item (e escolhe tipo)
  Chat->>Lib: POST name, sourceUrl, type
  Lib->>Chat: 201 item criado
  Chat->>U: Item adicionado; pode ir em /library para ver
```

1. Usuário acessa **`/library/ai`** e envia uma mensagem (ex.: “quero sons de batalha épicos e bem avaliados”).
2. O front chama **POST `/api/ai/chat`** com o histórico de mensagens.
3. O backend usa **busca na internet** (Serper, Google, Bing, etc.) com uma query derivada do pedido e envia os resultados ao **LLM**.
4. O LLM analisa e devolve uma **lista das melhores opções** (nome, URL, fonte) em formato estruturado (`suggestions`).
5. O front exibe no **mesmo chat** a resposta da IA e a **lista de sugestões** com um botão **“Adicionar à biblioteca”** (e seletor de tipo) em cada item.
6. Ao clicar, o front chama **POST `/api/library`** com `name`, `sourceUrl` e `type`; o item passa a fazer parte da **biblioteca**.
7. Os áudios adicionados ficam disponíveis na **URL de áudios default**: **`/library`**, organizados por tipo (efeitos de tempo, batalha, animais, cidades, etc.).

---

## 4. Especificação da página do chat (`/library/ai`)

### 4.1 Conteúdo da tela

- **Cabeçalho:** título do recurso (ex.: “Buscar áudios com IA”) e link para **“Ver minha biblioteca”** → `/library`.
- **Área de chat:** histórico de mensagens (usuário e assistente) e campo para nova mensagem.
- **Bloco de sugestões:** quando a resposta do backend vier com `suggestions.length > 0`:
  - Lista de itens com: **nome**, **URL** (link clicável ou preview), **fonte** (ex.: site de origem).
  - Por item: botão **“Adicionar à biblioteca”** e **seletor de tipo** (dropdown com as mesmas categorias da biblioteca: efeitos de tempo, batalha, animais, cidades, ambiente, música, outros).
  - Ao adicionar: chamada **POST `/api/library`**; feedback de sucesso/erro (toast ou inline); opcionalmente remover o item da lista ou marcar como “Adicionado”.

### 4.2 Integração com a API

- **Enviar mensagem:** `POST /api/ai/chat` com `{ "messages": [ ... ] }`.
- **Resposta:** `{ "message": { "role", "content" }, "suggestions": [ { "name", "sourceUrl", "source" } ] }`.
- **Adicionar à biblioteca:** para cada clique em “Adicionar”, `POST /api/library` com `{ "name", "sourceUrl", "type" }` (o `type` vem do seletor escolhido pelo usuário naquela linha).

### 4.3 Regras de negócio

- A rota **`/library/ai`** só é acessível para usuários autenticados que estejam em **`AI_LIBRARY_ALLOWED_USER_IDS`** (feature flag). Caso contrário: 404 ou mensagem “Recurso indisponível” e sem exibir o link no menu.
- A IA deve ser instruída (system prompt) a **priorizar** resultados com boa avaliação, downloads gratuitos quando aplicável e **links diretos** para áudio (ex.: MP3, WAV) quando possível.
- Os itens adicionados ficam na **mesma** biblioteca exibida em **`/library`** (tabela `audio_library`), sem duplicar conceitos.

---

## 5. Integração com a URL de áudios default (`/library`)

- **`/library`** é a **única** “URL de áudios default” do projeto para esse recurso: lista todos os itens da biblioteca do usuário, **divididos por tipo** (abas ou seções: Efeitos de tempo, Batalha, Animais, Cidades, Ambiente, Música, Outros).
- Tudo que for adicionado **pelo chat em `/library/ai`** é criado via **POST `/api/library`** e passa a aparecer em **`/library`** no tipo escolhido.
- Não é necessária outra URL de “áudios default”: a biblioteca **é** esse lugar; o chat é apenas uma forma de **popular** a biblioteca a partir de uma busca na internet guiada por IA.

---

## 6. Resumo

| Item | Especificação |
|------|----------------|
| **URL do chat** | `/library/ai` (ou `/sounds/ai`) |
| **URL de áudios default** | `/library` — lista da biblioteca por tipo |
| **O que a IA faz** | Busca na internet (varredura web) por áudios/músicas conforme o que o usuário pediu e devolve lista das melhores opções |
| **Onde adicionar** | Na mesma página do chat, botão “Adicionar à biblioteca” por item + seletor de tipo → **POST `/api/library`** |
| **Onde os itens ficam** | Na página **`/library`**, organizados por tipo (efeitos de tempo, batalha, animais, cidades, etc.) |

Este documento pode ser usado como referência para implementar a UI do chat e a integração com **POST `/api/ai/chat`** e **POST `/api/library`**, garantindo que a lista das melhores opções encontradas na internet seja adicionável por ali mesmo à URL de áudios default do projeto.
