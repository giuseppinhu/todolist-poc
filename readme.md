# TaskFlow (MySQL + filess.io)

To-do list profissional com CRUD completo conectado ao MySQL.

## 1) Backend MySQL (filess.io)

O frontend chama um endpoint HTTP (`api.php`) para persistência.
Você pode hospedar esse backend em qualquer servidor PHP com acesso ao MySQL do filess.io.

Defina no ambiente do backend:

```bash
export MYSQL_HOST="seu-host-filess"
export MYSQL_PORT="3306"
export MYSQL_DATABASE="seu_database"
export MYSQL_USER="seu_usuario"
export MYSQL_PASSWORD="sua_senha"
```

> Também são aceitas variáveis com prefixo `FILESS_MYSQL_`.

## 2) Deploy no GitHub Pages (frontend estático)

Este repositório já está configurado com workflow em `.github/workflows/deploy-pages.yml`.

### Passos
1. No GitHub, habilite **Settings → Pages → Source: GitHub Actions**.
2. Faça push para a branch (`main`, `master` ou `work`) para disparar deploy.
3. Configure a URL do backend editando `config.js`:

```js
window.TASKFLOW_API_BASE = "https://seu-backend.com";
```

Se deixar vazio (`""`), o app chama `api.php` no mesmo host.

## 3) Rodar localmente

### Frontend + backend juntos (PHP local)
```bash
php -S 0.0.0.0:4173
```
Abra `http://localhost:4173`.

### Apenas frontend estático (simulando GitHub Pages)
```bash
python3 -m http.server 4173
```

## Schema mantido

A tabela `todos` usa os campos do schema pedido (`id`, `done`, `createdAt`) e adiciona `title`:

```sql
CREATE TABLE IF NOT EXISTS todos (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL
);
```

A criação da tabela é automática via backend (`db.php`).
