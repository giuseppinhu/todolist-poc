# TaskFlow (Node.js + MySQL)

To-do list profissional com CRUD completo conectado em API Node.js.

## 1) Backend Node.js (obrigatório)

O frontend consome os endpoints REST em `/api/todos`.
Você pode hospedar a API em qualquer serviço com suporte a Node.js e acesso ao MySQL do filess.io.

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
- `GET /api/backlog?limit=50` (histórico de ações com logger)

## 2) Frontend

Configure a URL da API em `config.js`:

```js
window.TASKFLOW_API_BASE = "https://seu-backend.com";
```

Se deixar vazio (`""`), o frontend tenta usar o mesmo host (`/api/todos`).

## 4) Rodar localmente

### API Node.js
```bash
npm install
PORT=3000 npm start
```

### Frontend estático
```bash
npm install
PORT=3000 npm start
```

Para desenvolvimento local, use:

```js
window.TASKFLOW_API_BASE = "http://localhost:3000";
```

## Schema usado

```sql
CREATE TABLE IF NOT EXISTS todos (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL
);
```

## Backlog + logger

Cada ação importante do CRUD gera um registro em `backlog_logs` e também um log no console da API.

Schema adicional:

```sql
CREATE TABLE IF NOT EXISTS backlog_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(80) NOT NULL,
  details TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
