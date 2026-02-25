<?php

function getDbConnection(): PDO
{
    $host = getenv('MYSQL_HOST') ?: getenv('FILESS_MYSQL_HOST') ?: 'localhost';
    $port = getenv('MYSQL_PORT') ?: getenv('FILESS_MYSQL_PORT') ?: '3306';
    $database = getenv('MYSQL_DATABASE') ?: getenv('FILESS_MYSQL_DATABASE') ?: '';
    $username = getenv('MYSQL_USER') ?: getenv('FILESS_MYSQL_USER') ?: '';
    $password = getenv('MYSQL_PASSWORD') ?: getenv('FILESS_MYSQL_PASSWORD') ?: '';

    if ($database === '' || $username === '') {
        http_response_code(500);
        echo json_encode([
            'error' => 'Configuração MySQL ausente. Defina MYSQL_DATABASE, MYSQL_USER e demais variáveis.',
        ]);
        exit;
    }

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database);

    return new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function ensureSchema(PDO $pdo): void
{
    $sql = <<<SQL
CREATE TABLE IF NOT EXISTS todos (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL
)
SQL;

    $pdo->exec($sql);
}
