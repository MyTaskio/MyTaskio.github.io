const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// === Global Variables & Constants ===
let tasks = [];
let currentUser = null;
let authMode = 'login'; 

const THEME_COLORS = ['#FFA500', '#2196F3', '#4CAF50', '#E91E63', '#9C27B0', '#F44336', '#00BCD4', '#FFC107', '#795548', '#607D8B'];
const PRIORITY_MAP = { 0: 'بدون اولویت', 1: 'پایین', 2: 'متوسط', 3: 'بالا' };

const els = {
    // Existing elements
    headerTitle: document.getElementById('header-title'),
    menuBtn: document.getElementById('menu-btn'),
    dropdown: document.getElementById('settings-dropdown'),
    todoInput: document.getElementById('todo-input'),
    addBtn: document.getElementById('add-btn'),
    todoList: document.getElementById('todo-list'),
    authModal: document.getElementById('auth-modal'),
    closeModal: document.querySelector('.close-modal'),
    submitAuthBtn: document.getElementById('submit-auth-btn'),
    switchAuthBtn: document.getElementById('switch-auth-btn'),
    authFooterLinks: document.getElementById('auth-footer-links'),
    modalTitle: document.getElementById('modal-title'),
    fnameInput: document.getElementById('fname-input'),
    lnameInput: document.getElementById('lname-input'),
    usernameInput: document.getElementById('username-input'),
    passwordInput: document.getElementById('password-input'),
    signupFields: document.getElementById('signup-fields'),
    credentialsFields: document.getElementById('credentials-fields'),
    authMsg: document.getElementById('auth-msg'),
    alertModal: document.getElementById('alert-modal'),
    alertTitle: document.getElementById('alert-title'),
    alertText: document.getElementById('alert-text'),
    alertOkBtn: document.getElementById('alert-ok-btn'),
    alertCancelBtn: document.getElementById('alert-cancel-btn'),

    // New task modal elements
    taskModal: document.getElementById('task-modal'),
    closeTaskModal: document.getElementById('close-task-modal'),
    taskModalTitle: document.getElementById('task-modal-title'),
    taskIdInput: document.getElementById('task-id-input'),
    taskTextInput: document.getElementById('task-text-input'),
    taskPrioritySelect: document.getElementById('task-priority-select'),
    taskDueDateInput: document.getElementById('task-due-date-input'),
    tagsContainer: document.getElementById('tags-container'),
    taskTagsInput: document.getElementById('task-tags-input'),
    taskErrorMsg: document.getElementById('task-error-msg'),
    saveTaskBtn: document.getElementById('save-task-btn'),
};

// === Initial Setup ===
document.addEventListener('DOMContentLoaded', async () => {
    loadLocalSettings();
    
    // Event Listeners
    window.addEventListener('click', (e) => {
        if (!els.menuBtn.contains(e.target) && !els.dropdown.contains(e.target)) {
            els.dropdown.classList.remove('show');
        }
    });

    els.menuBtn.addEventListener('click', () => { renderMenu(); els.dropdown.classList.toggle('show'); });
    els.addBtn.addEventListener('click', () => openTaskModal());
    els.todoInput.addEventListener('focus', () => openTaskModal()); // Open modal on focus
    
    els.saveTaskBtn.addEventListener('click', saveTask);
    els.closeTaskModal.addEventListener('click', () => closeModalFunc(els.taskModal));
    els.taskTagsInput.addEventListener('keydown', handleTagInput);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        setCurrentUser(session.user);
    } else {
        els.headerTitle.textContent = 'وظایف من';
        const localData = localStorage.getItem('todo_local_tasks');
        if (localData) tasks = JSON.parse(localData);
        renderTasks();
    }
});

// === Task Rendering & Sorting ===
function sortTasks(taskArray) {
    return taskArray.sort((a, b) => {
        // 1. Completed tasks go to the bottom
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;

        // 2. Sort by priority (descending: 3 > 2 > 1 > 0)
        const priorityA = a.priority || 0;
        const priorityB = b.priority || 0;
        if (priorityA !== priorityB) return priorityB - priorityA;

        // 3. Sort by due date (ascending: earlier dates first)
        const dateA = a.due_date ? new Date(a.due_date) : null;
        const dateB = b.due_date ? new Date(b.due_date) : null;
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        if (dateA && dateB) {
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
        }
        
        // 4. Fallback to creation time
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

function renderTasks() {
    els.todoList.innerHTML = '';
    const sortedTasks = sortTasks([...tasks]);

    if (sortedTasks.length === 0) {
        els.todoList.innerHTML = '<div style="text-align:center; opacity:0.5; font-size:0.9rem; margin-top:30px;">هیچ کاری برای انجام نیست!</div>';
        return;
    }

    const activeTasks = sortedTasks.filter(t => !t.is_completed);
    const completedTasks = sortedTasks.filter(t => t.is_completed);

    activeTasks.forEach(task => els.todoList.appendChild(createTaskElement(task)));

    if (completedTasks.length > 0) {
        if (activeTasks.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'completed-section';
            separator.innerHTML = '<span class="completed-label">انجام شده</span>';
            els.todoList.appendChild(separator);
        }
        completedTasks.forEach(task => els.todoList.appendChild(createTaskElement(task)));
    }
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.is_completed ? 'completed' : ''}`;
    
    const priorityClass = task.priority ? `priority-${task.priority}` : '';
    const dueDateHTML = task.due_date ? `
        <div class="due-date-display ${new Date(task.due_date) < new Date() && !task.is_completed ? 'overdue' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>${formatDueDate(task.due_date)}</span>
        </div>` : '';

    const tagsHTML = task.tags && task.tags.length > 0 ? `
        <div class="tags-display">
            ${task.tags.map(tag => `<span class="tag-pill-sm">#${tag}</span>`).join('')}
        </div>` : '';

    li.innerHTML = `
        <div class="priority-indicator ${priorityClass}"></div>
        <div class="task-left">
            <div class="check-circle ${task.is_completed ? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
        </div>
        <div class="task-content" onclick="openTaskModal(${task.id})">
            <span class="task-text">${task.task}</span>
            <div class="task-details">
                ${dueDateHTML}
                ${tagsHTML}
            </div>
        </div>
        <button class="delete-btn" onclick="deleteTask(${task.id})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
    `;
    return li;
}

function formatDueDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'امروز';
    if (date.getTime() === tomorrow.getTime()) return 'فردا';

    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}


// === Task Modal Logic ===
function openTaskModal(taskId = null) {
    els.taskErrorMsg.textContent = '';
    
    // Clear previous tag pills
    els.tagsContainer.querySelectorAll('.tag-pill').forEach(pill => pill.remove());

    if (taskId) {
        // Edit mode
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        els.taskModalTitle.textContent = 'ویرایش وظیفه';
        els.taskIdInput.value = task.id;
        els.taskTextInput.value = task.task;
        els.taskPrioritySelect.value = task.priority || '0';
        els.taskDueDateInput.value = task.due_date || '';
        if (task.tags && task.tags.length > 0) {
            task.tags.forEach(createTagPill);
        }
    } else {
        // Add mode
        els.taskModalTitle.textContent = 'ایجاد وظیفه جدید';
        els.taskIdInput.value = '';
        els.taskTextInput.value = '';
        els.taskPrioritySelect.value = '0';
        els.taskDueDateInput.value = '';
    }
    
    // Reset input placeholder
    els.todoInput.value = '';
    els.todoInput.placeholder = 'کار جدید را بنویسید...';
    
    openModal(els.taskModal);
}

async function saveTask() {
    const id = els.taskIdInput.value;
    const taskText = els.taskTextInput.value.trim();
    if (!taskText) {
        els.taskErrorMsg.textContent = 'عنوان وظیفه نمی‌تواند خالی باشد.';
        return;
    }
    
    els.saveTaskBtn.textContent = 'در حال ذخیره...';
    
    const taskData = {
        task: taskText,
        priority: parseInt(els.taskPrioritySelect.value, 10),
        due_date: els.taskDueDateInput.value || null,
        tags: Array.from(els.tagsContainer.querySelectorAll('.tag-pill')).map(p => p.dataset.tag),
        user_id: currentUser ? currentUser.id : undefined,
    };

    if (id) {
        // Update existing task
        const index = tasks.findIndex(t => t.id == id);
        if (index > -1) {
            tasks[index] = { ...tasks[index], ...taskData };
            renderTasks();
            closeModalFunc(els.taskModal);
            if (currentUser) {
                await supabase.from('todos').update(taskData).eq('id', id);
            } else {
                saveLocal();
            }
        }
    } else {
        // Create new task
        const tempId = Date.now();
        const newTask = { id: tempId, ...taskData, is_completed: false, created_at: new Date().toISOString() };
        tasks.unshift(newTask);
        renderTasks();
        closeModalFunc(els.taskModal);
        
        if (currentUser) {
            const { data } = await supabase.from('todos').insert([taskData]).select();
            if (data) {
                const index = tasks.findIndex(t => t.id === tempId);
                if (index !== -1) tasks[index] = data[0];
                renderTasks(); // Re-render to get final ID
            }
        } else {
            saveLocal();
        }
    }
    els.saveTaskBtn.textContent = 'ذخیره وظیفه';
}

// === Tag Input Logic ===
function handleTagInput(e) {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const tagText = els.taskTagsInput.value.trim();
        if (tagText) {
            createTagPill(tagText);
            els.taskTagsInput.value = '';
        }
    }
}
function createTagPill(text) {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.dataset.tag = text;
    pill.innerHTML = `${text} <span class="remove-tag" onclick="this.parentElement.remove()">×</span>`;
    els.tagsContainer.insertBefore(pill, els.taskTagsInput);
}

// === Core Task Actions (Toggle, Delete) ===
async function toggleTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;
    tasks[index].is_completed = !tasks[index].is_completed;
    renderTasks();
    if (currentUser) {
        await supabase.from('todos').update({ is_completed: tasks[index].is_completed }).eq('id', id);
    } else {
        saveLocal();
    }
}

async function deleteTask(id) {
    if (!await showConfirm('آیا مطمئن هستید که می‌خواهید این مورد را حذف کنید؟', 'حذف تسک', true)) return;
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    if (currentUser) {
        await supabase.from('todos').delete().eq('id', id);
    } else {
        saveLocal();
    }
}

async function deleteAllTasks() {
    if (tasks.length === 0) return;
    if (!await showConfirm('همه تسک‌ها پاک شوند؟ این عمل غیرقابل برگشت است.', 'حذف همه', true)) return;
    if (currentUser) {
        await supabase.from('todos').delete().neq('id', 0);
    }
    tasks = [];
    saveLocal();
    renderTasks();
    els.dropdown.classList.remove('show');
}

// === Auth & User Management (Mostly Unchanged) ===
async function setCurrentUser(user) {
    currentUser = user;
    const meta = user.user_metadata || {};
    const firstName = meta.first_name || 'کاربر';
    els.headerTitle.textContent = `سلام ${firstName} 👋`;
    closeModalFunc(els.authModal);
    
    const localData = localStorage.getItem('todo_local_tasks');
    if (localData) {
        const localTasks = JSON.parse(localData);
        if (localTasks.length > 0) {
            const updates = localTasks.map(t => ({
                task: t.task,
                is_completed: t.is_completed,
                priority: t.priority,
                due_date: t.due_date,
                tags: t.tags,
                user_id: currentUser.id
            }));
            await supabase.from('todos').insert(updates);
            localStorage.removeItem('todo_local_tasks');
        }
    }
    fetchTasks();
}

async function logoutUser() {
    await supabase.auth.signOut();
    currentUser = null;
    tasks = [];
    els.headerTitle.textContent = 'وظایف من';
    els.dropdown.classList.remove('show');
    saveLocal(); 
    renderTasks();
    showAlert('خروج موفقیت آمیز بود');
}

async function fetchTasks() {
    els.todoList.innerHTML = '<div style="text-align:center; padding:20px;">در حال بارگذاری...</div>';
    const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
    if (data) {
        tasks = data;
        renderTasks();
    } else if (error) {
        console.error('Error fetching tasks:', error);
        els.todoList.innerHTML = '<div style="text-align:center; color:red;">خطا در بارگذاری وظایف</div>';
    }
}

// === Local Storage & Settings (Unchanged) ===
function saveLocal() { 
    localStorage.setItem('todo_local_tasks', JSON.stringify(tasks)); 
}
function loadLocalSettings() {
    const theme = localStorage.getItem('theme_color');
    if (theme) document.documentElement.style.setProperty('--primary-color', theme);
    if (localStorage.getItem('dark_mode') === 'true') document.body.classList.add('dark-mode');
}
function setTheme(color) {
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('theme_color', color);
}
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark_mode', document.body.classList.contains('dark-mode'));
    renderMenu();
}

// === Modals and Alerts (Unchanged) ===
function openModal(modal) { modal.classList.add('open'); }
function closeModalFunc(modal) { modal.classList.remove('open'); }
function showAlert(msg) {
    els.alertTitle.textContent = 'پیام'; els.alertText.textContent = msg;
    els.alertCancelBtn.style.display = 'none';
    openModal(els.alertModal); els.alertOkBtn.onclick = () => closeModalFunc(els.alertModal);
}
function showConfirm(msg, title = 'تاییدیه', isDestructive = false) {
    return new Promise((resolve) => {
        els.alertTitle.textContent = title;
        els.alertText.textContent = msg;
        els.alertCancelBtn.style.display = 'inline-block';
        if (isDestructive) {
            els.alertOkBtn.classList.add('destructive'); 
            els.alertOkBtn.textContent = 'حذف'; 
        } else {
            els.alertOkBtn.classList.remove('destructive'); 
            els.alertOkBtn.textContent = 'باشه'; 
        }
        openModal(els.alertModal);
        els.alertOkBtn.onclick = () => { closeModalFunc(els.alertModal); resolve(true); };
        els.alertCancelBtn.onclick = () => { closeModalFunc(els.alertModal); resolve(false); };
    });
}
// === Auth Modal Functions (Unchanged, for brevity, you already have them) ===
// ... All your existing auth functions (openAuthModal, openEditProfile, etc.) go here ...
// They are not listed again to keep this response focused on the new features.
// Just make sure they are present in your final script.
// NOTE: I've included them below for completeness.
function openAuthModal(mode) { /* ... */ }
function openEditProfile() { /* ... */ }
els.switchAuthBtn.addEventListener('click', (e) => { /* ... */ });
els.submitAuthBtn.addEventListener('click', async () => { /* ... */ });
els.closeModal.addEventListener('click', () => closeModalFunc(els.authModal));
// --- Start of Unchanged Auth Functions ---
function openAuthModal(mode) {
    authMode = mode;
    els.dropdown.classList.remove('show');
    els.authMsg.textContent = '';
    els.usernameInput.value = '';
    els.passwordInput.value = '';
    els.fnameInput.value = '';
    els.lnameInput.value = '';

    if (mode === 'login') {
        els.modalTitle.textContent = 'ورود به حساب';
        els.submitAuthBtn.textContent = 'ورود';
        els.signupFields.style.display = 'none';
        els.authFooterLinks.style.display = 'flex';
        document.getElementById('switch-text').textContent = 'حساب ندارید؟';
        els.switchAuthBtn.textContent = 'ثبت نام';
    } else if (mode === 'signup') {
        els.modalTitle.textContent = 'ثبت نام کاربر جدید';
        els.submitAuthBtn.textContent = 'ثبت نام';
        els.signupFields.style.display = 'block'; 
        els.authFooterLinks.style.display = 'flex';
        document.getElementById('switch-text').textContent = 'حساب دارید؟';
        els.switchAuthBtn.textContent = 'ورود';
    }
    openModal(els.authModal);
}
function openEditProfile() {
    authMode = 'edit';
    els.dropdown.classList.remove('show');
    els.modalTitle.textContent = 'ویرایش مشخصات';
    els.submitAuthBtn.textContent = 'ذخیره تغییرات';
    els.signupFields.style.display = 'block'; 
    els.credentialsFields.style.display = 'block'; 
    els.authFooterLinks.style.display = 'none';
    const meta = currentUser.user_metadata || {};
    els.fnameInput.value = meta.first_name || '';
    els.lnameInput.value = meta.last_name || '';
    els.usernameInput.value = currentUser.email || ''; 
    els.passwordInput.value = '';
    els.passwordInput.placeholder = 'رمز عبور جدید';
    openModal(els.authModal);
}
els.switchAuthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal(authMode === 'login' ? 'signup' : 'login');
});
els.submitAuthBtn.addEventListener('click', async () => {
    if (authMode === 'edit') {
        const fname = els.fnameInput.value.trim();
        const lname = els.lnameInput.value.trim();
        const email = els.usernameInput.value.trim();
        const pass = els.passwordInput.value.trim();
        if(!fname) return els.authMsg.textContent = 'نام الزامی است';
        els.submitAuthBtn.textContent = '...';
        const updateData = { data: { first_name: fname, last_name: lname } };
        if (pass.length > 0) updateData.password = pass; 
        const { data, error } = await supabase.auth.updateUser(updateData);
        if(error) els.authMsg.textContent = error.message;
        else { setCurrentUser(data.user); showAlert('مشخصات بروز شد'); }
        return;
    }
    const email = els.usernameInput.value.trim();
    const password = els.passwordInput.value.trim();
    const fname = els.fnameInput.value.trim();
    const lname = els.lnameInput.value.trim();
    if (!email || !password) return els.authMsg.textContent = 'ایمیل و رمز الزامی است';
    els.submitAuthBtn.textContent = '...';
    if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) els.authMsg.textContent = 'اطلاعات اشتباه است';
        else setCurrentUser(data.user);
    } else {
        const { error } = await supabase.auth.signUp({
            email, password,
            options: { data: { first_name: fname, last_name: lname } }
        });
        if (error) els.authMsg.textContent = error.message;
        else { showAlert('ثبت نام انجام شد. وارد شوید.'); openAuthModal('login'); }
    }
});
els.closeModal.addEventListener('click', () => closeModalFunc(els.authModal));
// --- End of Unchanged Auth Functions ---


// === Menu Rendering (Unchanged) ===
function renderMenu() {
    const isDark = document.body.classList.contains('dark-mode');
    let menuHTML = '';
    const sunIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    if (currentUser) {
        const meta = currentUser.user_metadata || {};
        const fullName = (meta.first_name || '') + ' ' + (meta.last_name || '');
        menuHTML += `<div class="menu-item" onclick="openEditProfile()" style="border-bottom:1px solid var(--border-color);"><span>${fullName || 'کاربر ناشناس'}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>`;
    } else {
        menuHTML += `<div class="menu-item" onclick="openAuthModal('login')"><span>ورود یا ثبت نام</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg></div>`;
    }
    menuHTML += `<div class="color-grid">${THEME_COLORS.map(color => `<div class="color-circle" style="background:${color}" onclick="setTheme('${color}')"></div>`).join('')}</div>`;
    menuHTML += `<div class="menu-item" onclick="toggleDarkMode()"><span>${isDark ? 'حالت روز' : 'حالت شب'}</span>${isDark ? sunIcon : moonIcon}</div>`;
    menuHTML += `<div class="menu-item danger" onclick="deleteAllTasks()"><span>حذف همه تسک‌ها</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></div>`;
    if (currentUser) {
        menuHTML += `<div class="menu-item danger" onclick="logoutUser()"><span>خروج از حساب</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2 2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></div>`;
    }
    els.dropdown.innerHTML = menuHTML;
}

// === Expose functions to window (for inline onclick) ===
window.openAuthModal = openAuthModal;
window.openEditProfile = openEditProfile;
window.logoutUser = logoutUser;
window.deleteAllTasks = deleteAllTasks;
window.toggleDarkMode = toggleDarkMode;
window.setTheme = setTheme;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.openTaskModal = openTaskModal;
