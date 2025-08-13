// assets/js/projects.js
import { storage } from './storage.js';

let projects = [];
let users = [];
let mounted = false;
let container = null;

function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

function saveProjects() {
    storage.set('projects', projects);
}

function loadProjects() {
    projects = storage.get('projects', []);
    users = storage.get('users', []);
    
    if (projects.length === 0) {
        projects = [
            { id: generateId(), name: 'Website Redesign', status: 'active', ownerUserId: null },
            { id: generateId(), name: 'Mobile App', status: 'planned', ownerUserId: null },
            { id: generateId(), name: 'API Documentation', status: 'done', ownerUserId: null }
        ];
        saveProjects();
    }
}

function renderProjects(filteredProjects = projects) {
    const tbody = container.querySelector('#projects-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = filteredProjects.map(project => {
        const owner = users.find(u => u.id === project.ownerUserId);
        return `
            <tr class="project-item" data-id="${project.id}">
                <td>
                    <span class="project-name">${escapeHtml(project.name)}</span>
                </td>
                <td>
                    <span class="status-badge status-${project.status}">${project.status}</span>
                </td>
                <td>
                    <span class="project-owner">${owner ? escapeHtml(owner.name) : 'Unassigned'}</span>
                </td>
                <td>
                    <div class="actions">
                        <button class="btn btn-sm btn-secondary edit-btn">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.status.toLowerCase().includes(query)
    );
    renderProjects(filtered);
}

function handleAdd(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const project = {
        id: generateId(),
        name: formData.get('name').trim(),
        status: formData.get('status'),
        ownerUserId: formData.get('ownerUserId') || null
    };
    
    if (!project.name) return;
    
    projects.push(project);
    saveProjects();
    renderProjects();
    form.reset();
    showToast('Project added successfully');
}

function handleEdit(row) {
    if (row.classList.contains('editing')) return;
    
    const id = row.dataset.id;
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    row.classList.add('editing');
    row.innerHTML = `
        <td>
            <input type="text" class="edit-name" value="${escapeHtml(project.name)}" required>
        </td>
        <td>
            <select class="edit-status">
                <option value="planned" ${project.status === 'planned' ? 'selected' : ''}>Planned</option>
                <option value="active" ${project.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="done" ${project.status === 'done' ? 'selected' : ''}>Done</option>
            </select>
        </td>
        <td>
            <select class="edit-owner">
                <option value="">Unassigned</option>
                ${users.map(u => `<option value="${u.id}" ${u.id === project.ownerUserId ? 'selected' : ''}>${escapeHtml(u.name)}</option>`).join('')}
            </select>
        </td>
        <td>
            <div class="actions">
                <button class="btn btn-sm btn-success save-btn">Save</button>
                <button class="btn btn-sm btn-secondary cancel-btn">Cancel</button>
            </div>
        </td>
    `;
    
    row.querySelector('.edit-name').focus();
}

function handleSave(row) {
    const id = row.dataset.id;
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    const name = row.querySelector('.edit-name').value.trim();
    const status = row.querySelector('.edit-status').value;
    const ownerUserId = row.querySelector('.edit-owner').value || null;
    
    if (!name) return;
    
    project.name = name;
    project.status = status;
    project.ownerUserId = ownerUserId;
    
    saveProjects();
    renderProjects();
    showToast('Project updated successfully');
}

function handleDelete(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        projects = projects.filter(p => p.id !== id);
        saveProjects();
        renderProjects();
        showToast('Project deleted successfully');
    }
}

function handleTableClick(event) {
    const row = event.target.closest('tr');
    if (!row || !row.dataset.id) return;
    
    if (event.target.classList.contains('edit-btn')) {
        handleEdit(row);
    } else if (event.target.classList.contains('save-btn')) {
        handleSave(row);
    } else if (event.target.classList.contains('cancel-btn')) {
        renderProjects();
    } else if (event.target.classList.contains('delete-btn')) {
        handleDelete(row.dataset.id);
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        const row = event.target.closest('tr');
        if (row && row.classList.contains('editing')) {
            handleSave(row);
        }
    }
}

export function mount(containerEl) {
    if (mounted) return;
    
    container = containerEl;
    loadProjects();
    
    container.innerHTML = `
        <div class="v-projects">
            <h2>Projects</h2>
            
            <div class="search-container">
                <input type="text" class="search-input" placeholder="Search projects..." id="project-search">
            </div>
            
            <form class="form project-form" id="add-project-form">
                <div class="form-group">
                    <label for="project-name">Project Name</label>
                    <input type="text" id="project-name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="project-status">Status</label>
                    <select id="project-status" name="status">
                        <option value="planned">Planned</option>
                        <option value="active">Active</option>
                        <option value="done">Done</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="project-owner">Owner</label>
                    <select id="project-owner" name="ownerUserId">
                        <option value="">Unassigned</option>
                        ${users.map(u => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Add Project</button>
                </div>
            </form>
            
            <table class="table" id="projects-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="projects-tbody">
                </tbody>
            </table>
        </div>
    `;
    
    renderProjects();
    
    container.querySelector('#project-search').addEventListener('input', handleSearch);
    container.querySelector('#add-project-form').addEventListener('submit', handleAdd);
    container.querySelector('#projects-table').addEventListener('click', handleTableClick);
    container.addEventListener('keypress', handleKeyPress);
    
    mounted = true;
}

export function unmount() {
    if (container) {
        container.innerHTML = '';
    }
    mounted = false;
    container = null;
}