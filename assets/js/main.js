// assets/js/main.js
import * as Projects from './projects.js';
import * as Users from './users.js';
import * as Tasks from './tasks.js';

const routes = { projects: Projects, users: Users, tasks: Tasks };
let current = null;

function setActiveLink(name) {
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.view === name);
  });
}

function render() {
  const name = (location.hash.replace('#', '') || 'projects').toLowerCase();
  const view = routes[name] ? name : 'projects';
  const mod = routes[view];
  const content = document.getElementById('content');

  if (!content) {
    console.error('Missing #content container');
    return;
  }

  if (current && routes[current] && typeof routes[current].unmount === 'function') {
    try { routes[current].unmount(); } catch (e) { console.warn('Unmount error:', e); }
  }

  try {
    mod.mount(content);
    current = view;
    setActiveLink(view);
  } catch (e) {
    console.error('Mount error:', e);
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);