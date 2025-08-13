// assets/js/users.js
import { storage } from './storage.js';

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

function saveUsers() {
    storage.set('users', users);
}

function loadUsers() {
    users = storage.get('users', []);
    
    if (users.length === 0) {
        users = [
            { id: generateId(), name: 'John Doe', email: 'john@example.com' },
            { id: generateId(), name: 'Jane Smith', email: 'jane@example.com' },
            { id: generateId(), name: 'Mike Johnson', email: 'mike@example.com' }
        ];
        saveUsers();
    }
}

function renderUsers(filteredUsers = users) {
    const tbody = container.querySelector('#users-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = filteredUsers.map(user => `
        <tr class="user-item" data-id="${user.id}">
            <td>
                <span class="user-name">${escapeHtml(user.name)}</span>
            </td>
            <td>
                <span class="user-email">${escapeHtml(user.email)}</span>
            </td>
            <td>
                <div class="actions">
                    <button class="btn btn-sm btn-secondary edit-btn">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
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
    const filtered = users.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
    renderUsers(filtered);
}

function handleAdd(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const user = {
        id: generateId(),
        name: formData.get('name').trim(),
        email: formData.get('email').trim()
    };
    
    if (!user.name || !user.email) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    users.push(user);
    saveUsers();
    renderUsers();
    form.reset();
    showToast('User added successfully');
}

function handleEdit(row) {
    if (row.classList.contains('editing')) return;
    
    const id = row.dataset.id;
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    row.classList.add('editing');
    row.innerHTML = `
        <td>
            <input type="text" class="edit-name" value="${escapeHtml(user.name)}" required>
        </td>
        <td>
            <input type="email" class="edit-email" value="${escapeHtml(user.email)}" required>
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
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    const name = row.querySelector('.edit-name').value.trim();
    const email = row.querySelector('.edit-email').value.trim();
    
    if (!name || !email) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    user.name = name;
    user.email = email;
    
    saveUsers();
    renderUsers();
    showToast('User updated successfully');
}

function handleDelete(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        users = users.filter(u => u.id !== id);
        saveUsers();
        renderUsers();
        showToast('User deleted successfully');
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
        renderUsers();
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
    loadUsers();
    
    container.innerHTML = `
        <div class="v-users">
            <h2>Users</h2>
            
            <div class="search-container">
                <input type="text" class="search-input" placeholder="Search users..." id="user-search">
            </div>
            
            <form class="form user-form" id="add-user-form">
                <div class="form-group">
                    <label for="user-name">Name</label>
                    <input type="text" id="user-name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="user-email">Email</label>
                    <input type="email" id="user-email" name="email" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Add User</button>
                </div>
            </form>
            
            <table class="table" id="users-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="users-tbody">
                </tbody>
            </table>
        </div>
    `;
    
    renderUsers();
    
    container.querySelector('#user-search').addEventListener('input', handleSearch);
    container.querySelector('#add-user-form').addEventListener('submit', handleAdd);
    container.querySelector('#users-table').addEventListener('click', handleTableClick);
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