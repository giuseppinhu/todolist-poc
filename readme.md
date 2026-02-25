# TaskFlow (GitHub Pages + backend opcional em Node.js)

To-do list profissional com CRUD completo.

## 1) GitHub Pages (sem backend)

Por padrão, o app salva tarefas em `localStorage` (no navegador), então funciona direto no GitHub Pages sem backend.

## 2) Backend opcional (Node.js + MySQL filess.io)

Se quiser persistência em banco compartilhado, rode a API Node.js (`server.js`) em qualquer host com suporte a Node e acesso ao MySQL.

Defina no ambiente da API:

```bash
export MYSQL_HOST="seu-host-filess"
export MYSQL_PORT="3306"
export MYSQL_DATABASE="seu_database"
export MYSQL_USER="seu_usuario"
export MYSQL_PASSWORD="sua_senha"
```

> Também são aceitas variáveis com prefixo `FILESS_MYSQL_`.

Instalação e execução da API:

```bash
npm install
npm start
```

A API expõe:
- `GET /api/todos`
- `POST /api/todos`
- `PUT /api/todos/:id`
- `DELETE /api/todos/:id`

## 3) Deploy no GitHub Pages (frontend estático)

### Passos
1. Publique o frontend no GitHub Pages.
2. Se tiver backend Node, configure a URL base da API editando `config.js`:

```js
window.TASKFLOW_API_BASE = "https://seu-backend.com";
```

Se deixar vazio (`""`), o app roda 100% no navegador usando `localStorage`.

## 4) Rodar localmente

### Frontend estático (simulando GitHub Pages)
```bash
python3 -m http.server 4173
```

### API Node.js
```bash
npm install
PORT=3000 npm start
```

Exemplo com frontend local apontando para API local:

```js
window.TASKFLOW_API_BASE = "http://localhost:3000";
```

## Schema usado no backend opcional

```sql
CREATE TABLE IF NOT EXISTS todos (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL
);
```
