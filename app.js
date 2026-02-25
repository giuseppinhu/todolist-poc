const STORAGE_KEY = "taskflow.todos.v1";

const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const todoList = document.querySelector("#todoList");
const template = document.querySelector("#todoItemTemplate");
const emptyState = document.querySelector("#emptyState");
const completionRate = document.querySelector("#completionRate");
const summaryText = document.querySelector("#summaryText");
const clearDone = document.querySelector("#clearDone");
const filterButtons = document.querySelectorAll(".filter-btn");

let todos = loadTodos();
let currentFilter = "all";

function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
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
  if (currentFilter === "pending") {
    return todos.filter((todo) => !todo.done);
  }

  if (currentFilter === "done") {
    return todos.filter((todo) => todo.done);
  }

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

    if (todo.done) {
      item.classList.add("done");
    }

    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    editBtn.addEventListener("click", () => {
      const updated = window.prompt("Edite sua tarefa:", todo.title);
      if (!updated) return;
      const cleaned = updated.trim();
      if (!cleaned) return;
      todo.title = cleaned;
      saveTodos();
      renderTodos();
    });

    deleteBtn.addEventListener("click", () => {
      todos = todos.filter((itemTodo) => itemTodo.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    todoList.appendChild(fragment);
  });

  emptyState.classList.toggle("visible", visibleTodos.length === 0);
  renderSummary();
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const value = todoInput.value.trim();
  if (!value) return;

  todos.unshift(createTodo(value));
  saveTodos();
  renderTodos();
  todoInput.value = "";
  todoInput.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    renderTodos();
  });
});

clearDone.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.done);
  saveTodos();
  renderTodos();
});

renderTodos();
