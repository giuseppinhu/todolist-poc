<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/db.php';

try {
    $pdo = getDbConnection();
    ensureSchema($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $id = $_GET['id'] ?? null;

    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT id, title, done, createdAt FROM todos ORDER BY createdAt DESC');
        $rows = $stmt->fetchAll();
        $todos = array_map(function ($row) {
            return [
                'id' => $row['id'],
                'title' => $row['title'],
                'done' => (bool)$row['done'],
                'createdAt' => (new DateTime($row['createdAt']))->format(DateTime::ATOM),
            ];
        }, $rows);

        echo json_encode($todos);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    if ($method === 'POST') {
        if (empty($input['title']) || empty($input['id']) || empty($input['createdAt'])) {
            http_response_code(422);
            echo json_encode(['error' => 'Campos id, title e createdAt são obrigatórios.']);
            exit;
        }

        $stmt = $pdo->prepare('INSERT INTO todos (id, title, done, createdAt) VALUES (:id, :title, :done, :createdAt)');
        $stmt->execute([
            ':id' => $input['id'],
            ':title' => trim($input['title']),
            ':done' => !empty($input['done']) ? 1 : 0,
            ':createdAt' => (new DateTime($input['createdAt']))->format('Y-m-d H:i:s'),
        ]);

        echo json_encode(['ok' => true]);
        exit;
    }

    if ($method === 'PUT') {
        if (!$id) {
            http_response_code(422);
            echo json_encode(['error' => 'Parâmetro id é obrigatório no PUT.']);
            exit;
        }

        $fields = [];
        $params = [':id' => $id];

        if (array_key_exists('title', $input)) {
            $fields[] = 'title = :title';
            $params[':title'] = trim((string)$input['title']);
        }

        if (array_key_exists('done', $input)) {
            $fields[] = 'done = :done';
            $params[':done'] = $input['done'] ? 1 : 0;
        }

        if (empty($fields)) {
            http_response_code(422);
            echo json_encode(['error' => 'Nada para atualizar.']);
            exit;
        }

        $sql = 'UPDATE todos SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['ok' => true]);
        exit;
    }

    if ($method === 'DELETE') {
        if (!$id) {
            http_response_code(422);
            echo json_encode(['error' => 'Parâmetro id é obrigatório no DELETE.']);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM todos WHERE id = :id');
        $stmt->execute([':id' => $id]);

        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método não suportado.']);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Falha ao conectar/executar no MySQL (filess.io).',
        'details' => $error->getMessage(),
    ]);
}
