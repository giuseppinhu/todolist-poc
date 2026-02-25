const express = require("express");
const cors = require("cors");
const { pool, ensureSchema } = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 4173);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/todos", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, done, createdAt FROM todos ORDER BY createdAt DESC"
    );

    const todos = rows.map((row) => ({
      id: row.id,
      title: row.title,
      done: Boolean(row.done),
      createdAt: new Date(row.createdAt).toISOString(),
    }));

    res.json(todos);
  } catch (error) {
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
      "INSERT INTO todos (id, title, done, createdAt) VALUES (?, ?, ?, ?)",
      [
        input.id,
        String(input.title).trim(),
        input.done ? 1 : 0,
        new Date(input.createdAt).toISOString().slice(0, 19).replace("T", " "),
      ]
    );

    res.json({ ok: true });
  } catch (error) {
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

  if (fields.length === 0) {
    res.status(422).json({ error: "Nada para atualizar." });
    return;
  }

  try {
    params.push(id);
    await pool.query(`UPDATE todos SET ${fields.join(", ")} WHERE id = ?`, params);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({
      error: "Falha ao conectar/executar no MySQL (filess.io).",
      details: error.message,
    });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM todos WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({
      error: "Falha ao conectar/executar no MySQL (filess.io).",
      details: error.message,
    });
  }
});

async function boot() {
  try {
    await ensureSchema();
    app.listen(PORT, () => {
      console.log(`TaskFlow API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar API:", error.message);
    process.exit(1);
  }
}

boot();
