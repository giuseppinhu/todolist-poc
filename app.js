const API_BASE = (window.TASKFLOW_API_BASE || "").replace(/\/$/, "");
const USE_REMOTE_API = Boolean(API_BASE);
const LOCAL_STORAGE_KEY = "taskflow.todos";

const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const todoPriority = document.querySelector("#todoPriority");
const todoList = document.querySelector("#todoList");
const template = document.querySelector("#todoItemTemplate");
const emptyState = document.querySelector("#emptyState");
const completionRate = document.querySelector("#completionRate");
const summaryText = document.querySelector("#summaryText");
const clearDone = document.querySelector("#clearDone");
const filterButtons = document.querySelectorAll(".filter-btn");

let todos = [];
let currentFilter = "all";
const priorityLabelMap = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const priorityOrder = {
  high: 0,
  medium: 1,
  low: 2,
};

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
  todos = await apiRequest("api/todos");
}

async function createData(newTodo) {
  await apiRequest("api/todos", {
    method: "POST",
    body: JSON.stringify(newTodo),
  });
  todos.unshift(newTodo);
}

async function updateData(todoId, patch) {
  await apiRequest(`api/todos/${encodeURIComponent(todoId)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });

  todos = todos.map((todo) => (todo.id === todoId ? { ...todo, ...patch } : todo));
}

async function deleteData(todoId) {
  await apiRequest(`api/todos/${encodeURIComponent(todoId)}`, { method: "DELETE" });
  todos = todos.filter((todo) => todo.id !== todoId);
}

function getFormattedDate(dateString) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function normalizePriority(value) {
  return Object.prototype.hasOwnProperty.call(priorityLabelMap, value) ? value : "medium";
}

function createTodo(title, priority) {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    done: false,
    priority: normalizePriority(priority),
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
  const visibleTodos = getVisibleTodos().slice().sort((a, b) => {
    const byPriority = priorityOrder[normalizePriority(a.priority)] - priorityOrder[normalizePriority(b.priority)];
    if (byPriority !== 0) return byPriority;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  visibleTodos.forEach((todo) => {
    const fragment = template.content.cloneNode(true);
    const item = fragment.querySelector(".todo-item");
    const checkbox = fragment.querySelector(".todo-check");
    const title = fragment.querySelector(".todo-title");
    const priority = fragment.querySelector(".todo-priority");
    const date = fragment.querySelector(".todo-date");
    const editBtn = fragment.querySelector(".edit-btn");
    const deleteBtn = fragment.querySelector(".delete-btn");

    title.textContent = todo.title;
    const normalizedPriority = normalizePriority(todo.priority);
    priority.textContent = priorityLabelMap[normalizedPriority];
    priority.classList.add(normalizedPriority);
    date.textContent = `Criada em ${getFormattedDate(todo.createdAt)}`;
    checkbox.checked = todo.done;

    if (todo.done) item.classList.add("done");

    checkbox.addEventListener("change", async () => {
      try {
        await apiRequest(`api/todos/${encodeURIComponent(todo.id)}`, {
          method: "PUT",
          body: JSON.stringify({ done: checkbox.checked }),
        });
        todo.done = checkbox.checked;
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
        await apiRequest(`api/todos/${encodeURIComponent(todo.id)}`, {
          method: "PUT",
          body: JSON.stringify({ title: cleaned, priority: normalizePriority(todo.priority) }),
        });
        todo.title = cleaned;
        renderTodos();
      } catch (error) {
        alert(error.message);
      }
    });

    deleteBtn.addEventListener("click", async () => {
      try {
        await apiRequest(`api/todos/${encodeURIComponent(todo.id)}`, { method: "DELETE" });
        todos = todos.filter((itemTodo) => itemTodo.id !== todo.id);
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
    todos = await apiRequest("api/todos");
  } catch (error) {
    alert(`Falha ao carregar dados da API: ${error.message}`);
    todos = [];
  }
  renderTodos();
}

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const value = todoInput.value.trim();
  if (!value) return;

  const newTodo = createTodo(value, todoPriority.value);

  try {
    await apiRequest("api/todos", {
      method: "POST",
      body: JSON.stringify(newTodo),
    });

    todos.unshift(newTodo);
    renderTodos();
    todoInput.value = "";
    todoPriority.value = "medium";
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
  const completedTodos = todos.filter((todo) => todo.done);

  try {
    await Promise.all(
      completedTodos.map((todo) =>
        apiRequest(`api/todos/${encodeURIComponent(todo.id)}`, { method: "DELETE" })
      )
    );
    todos = todos.filter((todo) => !todo.done);
    renderTodos();
  } catch (error) {
    alert(error.message);
  }
});

loadTodos();
