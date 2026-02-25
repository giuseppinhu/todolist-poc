# TaskFlow (MySQL + filess.io)

To-do list profissional com CRUD completo conectado ao MySQL.

## 1) Configurar variáveis de ambiente

Defina no shell (ou no seu serviço de deploy) os dados do banco MySQL do filess.io:

```bash
export MYSQL_HOST="seu-host-filess"
export MYSQL_PORT="3306"
export MYSQL_DATABASE="seu_database"
export MYSQL_USER="seu_usuario"
export MYSQL_PASSWORD="sua_senha"
```

> Também são aceitas variáveis com prefixo `FILESS_MYSQL_`.

## 2) Rodar localmente

```bash
php -S 0.0.0.0:4173
```

Abra `http://localhost:4173`.

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
