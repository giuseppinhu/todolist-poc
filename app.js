const API_BASE = (window.TASKFLOW_API_BASE || "").replace(/\/$/, "");
const USE_REMOTE_API = Boolean(API_BASE);
const LOCAL_STORAGE_KEY = "taskflow.todos";

const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const todoList = document.querySelector("#todoList");
const template = document.querySelector("#todoItemTemplate");
const emptyState = document.querySelector("#emptyState");
const completionRate = document.querySelector("#completionRate");
const summaryText = document.querySelector("#summaryText");
const clearDone = document.querySelector("#clearDone");
const filterButtons = document.querySelectorAll(".filter-btn");

let todos = [];
let currentFilter = "all";

function readLocalTodos() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalTodos(nextTodos) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextTodos));
}

async function apiRequest(path, options = {}) {
  const url = `${API_BASE}/${path}`;

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Erro inesperado no servidor");
  }

  return payload;
}

async function loadData() {
  if (!USE_REMOTE_API) {
    todos = readLocalTodos();
    return;
  }

  todos = await apiRequest("api/todos");
}

async function createData(newTodo) {
  if (!USE_REMOTE_API) {
    todos.unshift(newTodo);
    writeLocalTodos(todos);
    return;
  }

  await apiRequest("api/todos", {
    method: "POST",
    body: JSON.stringify(newTodo),
  });
  todos.unshift(newTodo);
}

async function updateData(todoId, patch) {
  if (!USE_REMOTE_API) {
    todos = todos.map((todo) => (todo.id === todoId ? { ...todo, ...patch } : todo));
    writeLocalTodos(todos);
    return;
  }

  await apiRequest(`api/todos/${encodeURIComponent(todoId)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });

  todos = todos.map((todo) => (todo.id === todoId ? { ...todo, ...patch } : todo));
}

async function deleteData(todoId) {
  if (!USE_REMOTE_API) {
    todos = todos.filter((todo) => todo.id !== todoId);
    writeLocalTodos(todos);
    return;
  }

  await apiRequest(`api/todos/${encodeURIComponent(todoId)}`, { method: "DELETE" });
  todos = todos.filter((todo) => todo.id !== todoId);
}

function getFormattedDate(dateString) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function createTodo(title) {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    done: false,
    createdAt: new Date().toISOString(),
  };
}

function getVisibleTodos() {
  if (currentFilter === "pending") return todos.filter((todo) => !todo.done);
  if (currentFilter === "done") return todos.filter((todo) => todo.done);
  return todos;
}

function renderSummary() {
  const doneCount = todos.filter((todo) => todo.done).length;
  const total = todos.length;
  const percentage = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  completionRate.textContent = `${percentage}%`;
  summaryText.textContent = `${doneCount} de ${total} finalizadas`;
}

function renderTodos() {
  todoList.innerHTML = "";
  const visibleTodos = getVisibleTodos();

  visibleTodos.forEach((todo) => {
    const fragment = template.content.cloneNode(true);
    const item = fragment.querySelector(".todo-item");
    const checkbox = fragment.querySelector(".todo-check");
    const title = fragment.querySelector(".todo-title");
    const date = fragment.querySelector(".todo-date");
    const editBtn = fragment.querySelector(".edit-btn");
    const deleteBtn = fragment.querySelector(".delete-btn");

    title.textContent = todo.title;
    date.textContent = `Criada em ${getFormattedDate(todo.createdAt)}`;
    checkbox.checked = todo.done;

    if (todo.done) item.classList.add("done");

    checkbox.addEventListener("change", async () => {
      try {
        await updateData(todo.id, { done: checkbox.checked });
        renderTodos();
      } catch (error) {
        checkbox.checked = !checkbox.checked;
        alert(error.message);
      }
    });

    editBtn.addEventListener("click", async () => {
      const updated = window.prompt("Edite sua tarefa:", todo.title);
      if (!updated) return;
      const cleaned = updated.trim();
      if (!cleaned) return;

      try {
        await updateData(todo.id, { title: cleaned });
        renderTodos();
      } catch (error) {
        alert(error.message);
      }
    });

    deleteBtn.addEventListener("click", async () => {
      try {
        await deleteData(todo.id);
        renderTodos();
      } catch (error) {
        alert(error.message);
      }
    });

    todoList.appendChild(fragment);
  });

  emptyState.classList.toggle("visible", visibleTodos.length === 0);
  renderSummary();
}

async function loadTodos() {
  try {
    await loadData();
  } catch (error) {
    alert(`Falha ao carregar dados: ${error.message}`);
    todos = [];
  }
  renderTodos();
}

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const value = todoInput.value.trim();
  if (!value) return;

  const newTodo = createTodo(value);

  try {
    await createData(newTodo);
    renderTodos();
    todoInput.value = "";
    todoInput.focus();
  } catch (error) {
    alert(error.message);
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    renderTodos();
  });
});

clearDone.addEventListener("click", async () => {
  const completedTodoIds = todos.filter((todo) => todo.done).map((todo) => todo.id);

  try {
    await Promise.all(completedTodoIds.map((todoId) => deleteData(todoId)));
    renderTodos();
  } catch (error) {
    alert(error.message);
  }
});

loadTodos();
