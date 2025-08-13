// assets/js/tasks.js
import { storage } from './storage.js';

const KEY = 'tasks';

let state = {
  tasks: [],
  filter: ''
};

function generateId() {
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

function save() {
  storage.set(KEY, state.tasks);
}

function load() {
  state.tasks = storage.get(KEY, []);
}

export function mount(container) {
  load();
  container.innerHTML = `
    <section class="v-tasks">
      <header class="view-header">
        <h2>Tasks</h2>
        <input id="task-search" class="input" placeholder="Search tasks..." />
      </header>
      <form id="task-form" class="inline-form">
        <input id="task-title" class="input" placeholder="Task title" required />
        <button class="btn" type="submit">Add</button>
      </form>
      <div id="task-list" class="list"></div>
    </section>
  `;

  container.querySelector('#task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const titleEl = container.querySelector('#task-title');
    const title = titleEl.value.trim();
    if (!title) return;
    state.tasks.push({ id: generateId(), title, done: false });
    save();
    titleEl.value = '';
    renderList(container);
  });

  container.querySelector('#task-search').addEventListener('input', (e) => {
    state.filter = e.target.value.toLowerCase();
    renderList(container);
  });

  renderList(container);
}

export function unmount() {
  // no-op; view is fully re-rendered on mount
}

function renderList(container) {
  const list = container.querySelector('#task-list');
  const q = state.filter;
  const tasks = state.tasks.filter(t => t.title.toLowerCase().includes(q));

  if (tasks.length === 0) {
    list.innerHTML = '<div class="empty">No tasks yet</div>';
    return;
  }

  list.innerHTML = tasks.map(t => `
    <div class="list-row" data-id="${t.id}">
      <label class="checkbox">
        <input type="checkbox" class="toggle-done" ${t.done ? 'checked' : ''} />
        <span>${t.title}</span>
      </label>
      <button class="btn btn-danger delete">Delete</button>
    </div>
  `).join('');

  list.querySelectorAll('.toggle-done').forEach(input => {
    input.addEventListener('change', (e) => {
      const row = e.target.closest('.list-row');
      const id = row.dataset.id;
      const item = state.tasks.find(x => x.id === id);
      if (item) {
        item.done = e.target.checked;
        save();
      }
    });
  });

  list.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('.list-row');
      const id = row.dataset.id;
      state.tasks = state.tasks.filter(x => x.id !== id);
      save();
      renderList(container);
    });
  });
}