const express = require("express");
const cors = require("cors");
const { pool, ensureSchema, writeBacklog, listBacklog } = require("./db");
const { logInfo, logError } = require("./logger");

const app = express();
const PORT = Number(process.env.PORT || 4173);
const VALID_PRIORITIES = new Set(["high", "medium", "low"]);

function parsePriority(value) {
  return VALID_PRIORITIES.has(value) ? value : "medium";
}

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  logInfo("Requisição recebida", { method: req.method, path: req.path });
  next();
});

async function registerBacklog(action, details) {
  try {
    await writeBacklog(action, details);
  } catch (error) {
    logError("Falha ao registrar backlog", { action, details, error: error.message });
  }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/todos", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, done, priority, createdAt FROM todos ORDER BY createdAt DESC"
    );

    const todos = rows.map((row) => ({
      id: row.id,
      title: row.title,
      done: Boolean(row.done),
      priority: parsePriority(row.priority),
      createdAt: new Date(row.createdAt).toISOString(),
    }));

    await registerBacklog("TODOS_LISTADOS", `Total de tarefas retornadas: ${todos.length}`);
    res.json(todos);
  } catch (error) {
    logError("Erro ao listar tarefas", { error: error.message });
    res.status(500).json({
      error: "Falha ao conectar/executar no MySQL (filess.io).",
      details: error.message,
    });
  }
});

app.post("/api/todos", async (req, res) => {
  const input = req.body || {};

  if (!input.title || !input.id || !input.createdAt) {
    res.status(422).json({ error: "Campos id, title e createdAt são obrigatórios." });
    return;
  }

  try {
    await pool.query(
      "INSERT INTO todos (id, title, done, priority, createdAt) VALUES (?, ?, ?, ?, ?)",
      [
        input.id,
        String(input.title).trim(),
        input.done ? 1 : 0,
        parsePriority(input.priority),
        new Date(input.createdAt).toISOString().slice(0, 19).replace("T", " "),
      ]
    );

    await registerBacklog("TODO_CRIADA", `Tarefa criada com id ${input.id}`);
    res.json({ ok: true });
  } catch (error) {
    logError("Erro ao criar tarefa", { error: error.message, todoId: input.id });
    res.status(500).json({
      error: "Falha ao conectar/executar no MySQL (filess.io).",
      details: error.message,
    });
  }
});

app.put("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const input = req.body || {};

  const fields = [];
  const params = [];

  if (Object.prototype.hasOwnProperty.call(input, "title")) {
    fields.push("title = ?");
    params.push(String(input.title).trim());
  }

  if (Object.prototype.hasOwnProperty.call(input, "done")) {
    fields.push("done = ?");
    params.push(input.done ? 1 : 0);
  }

  if (Object.prototype.hasOwnProperty.call(input, "priority")) {
    fields.push("priority = ?");
    params.push(parsePriority(input.priority));
  }

  if (fields.length === 0) {
    res.status(422).json({ error: "Nada para atualizar." });
    return;
  }

  try {
    params.push(id);
    await pool.query(`UPDATE todos SET ${fields.join(", ")} WHERE id = ?`, params);
    await registerBacklog("TODO_ATUALIZADA", `Tarefa ${id} atualizada`);
    res.json({ ok: true });
  } catch (error) {
    logError("Erro ao atualizar tarefa", { error: error.message, todoId: id });
    res.status(500).json({
      error: "Falha ao conectar/executar no MySQL (filess.io).",
      details: error.message,
    });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM todos WHERE id = ?", [req.params.id]);
    await registerBacklog("TODO_REMOVIDA", `Tarefa ${req.params.id} removida`);
    res.json({ ok: true });
  } catch (error) {
    logError("Erro ao remover tarefa", { error: error.message, todoId: req.params.id });
    res.status(500).json({
      error: "Falha ao conectar/executar no MySQL (filess.io).",
      details: error.message,
    });
  }
});

app.get("/api/backlog", async (req, res) => {
  try {
    const logs = await listBacklog(req.query.limit);
    res.json(logs);
  } catch (error) {
    logError("Erro ao listar backlog", { error: error.message });
    res.status(500).json({ error: "Falha ao listar backlog.", details: error.message });
  }
});

async function boot() {
  try {
    await ensureSchema();
    app.listen(PORT, () => {
      logInfo(`TaskFlow API running on port ${PORT}`);
    });
  } catch (error) {
    logError("Falha ao iniciar API", { error: error.message });
    process.exit(1);
  }
}

boot();
