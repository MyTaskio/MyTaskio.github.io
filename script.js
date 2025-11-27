// --- تنظیمات Supabase ---
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- متغیرها ---
let tasks = [];
let currentUser = null;
let authMode = 'login'; // login | signup | edit

const THEME_COLORS = [
    '#FFA500', '#2196F3', '#4CAF50', '#E91E63', '#9C27B0', 
    '#F44336', '#00BCD4', '#FFC107', '#795548', '#607D8B'
];

const els = {
    headerTitle: document.getElementById('header-title'),
    menuBtn: document.getElementById('menu-btn'),
    dropdown: document.getElementById('settings-dropdown'),
    todoInput: document.getElementById('todo-input'),
    addBtn: document.getElementById('add-btn'),
    todoList: document.getElementById('todo-list'),
    authModal: document.getElementById('auth-modal'),
    closeModal: document.querySelector('.close-modal'),
    submitAuthBtn: document.getElementById('submit-auth-btn'),
    switchAuthLink: document.getElementById('switch-auth-link'),
    authFooterLinks: document.getElementById('auth-footer-links'),
    modalTitle: document.getElementById('modal-title'),
    fnameInput: document.getElementById('fname-input'),
    lnameInput: document.getElementById('lname-input'),
    usernameInput: document.getElementById('username-input'),
    passwordInput: document.getElementById('password-input'),
    signupFields: document.getElementById('signup-fields'),
    authMsg: document.getElementById('auth-msg'),
    alertModal: document.getElementById('alert-modal'),
    alertTitle: document.getElementById('alert-title'),
    alertText: document.getElementById('alert-text'),
    alertOkBtn: document.getElementById('alert-ok-btn'),
    alertCancelBtn: document.getElementById('alert-cancel-btn')
};

// --- شروع برنامه ---
document.addEventListener('DOMContentLoaded', async () => {
    loadLocalSettings();
    
    window.addEventListener('click', (e) => {
        if (!els.menuBtn.contains(e.target) && !els.dropdown.contains(e.target)) {
            els.dropdown.classList.remove('show');
        }
    });

    els.menuBtn.addEventListener('click', () => {
        renderMenu(); 
        els.dropdown.classList.toggle('show');
    });

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

// --- منو ---
function renderMenu() {
    const isDark = document.body.classList.contains('dark-mode');
    let menuHTML = '';

    if (currentUser) {
        // فقط نام و نام خانوادگی یکبار نمایش داده می‌شود
        const meta = currentUser.user_metadata || {};
        const fullName = (meta.first_name || '') + ' ' + (meta.last_name || '');
        
        menuHTML += `
            <div class="menu-item" onclick="openEditProfile()" style="border-bottom:1px solid var(--border-color);">
                <span>${fullName || 'کاربر ناشناس'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </div>
        `;
    } else {
        menuHTML += `
            <div class="menu-item" onclick="openAuthModal('login')">
                <span>ورود یا ثبت نام</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            </div>
        `;
    }

    menuHTML += `<div class="color-grid">`;
    THEME_COLORS.forEach(color => {
        menuHTML += `<div class="color-circle" style="background:${color}" onclick="setTheme('${color}')"></div>`;
    });
    menuHTML += `</div>`;

    menuHTML += `
        <div class="menu-item" onclick="toggleDarkMode()">
            <span>${isDark ? 'حالت روز' : 'حالت شب'}</span>
            ${isDark ? '☀️' : '🌙'}
        </div>
    `;

    menuHTML += `
        <div class="menu-item danger" onclick="deleteAllTasks()">
            <span>حذف همه تسک‌ها</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </div>
    `;

    if (currentUser) {
        menuHTML += `
            <div class="menu-item danger" onclick="logoutUser()">
                <span>خروج از حساب</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </div>
        `;
    }

    els.dropdown.innerHTML = menuHTML;
}

// --- مدیریت کاربر ---
async function setCurrentUser(user) {
    currentUser = user;
    const meta = user.user_metadata || {};
    const firstName = meta.first_name || 'کاربر';
    
    // تغییر به حالت سلام + اسم کوچک + ایموجی
    els.headerTitle.textContent = `سلام ${firstName} 👋`;
    
    closeModalFunc(els.authModal);
    
    // سینک
    const localData = localStorage.getItem('todo_local_tasks');
    if (localData) {
        const localTasks = JSON.parse(localData);
        if (localTasks.length > 0) {
            const updates = localTasks.map(t => ({
                task: t.task, is_completed: t.is_completed, user_id: currentUser.id
            }));
            await supabase.from('todos').insert(updates);
            localStorage.removeItem('todo_local_tasks');
        }
    }
    fetchTasks();
}

// --- تسک‌ها ---
function renderTasks() {
    els.todoList.innerHTML = '';

    if (tasks.length === 0) {
        els.todoList.innerHTML = '<div style="text-align:center; opacity:0.5; font-size:0.9rem; margin-top:30px;">هیچ کاری برای انجام نیست!</div>';
        return;
    }

    const activeTasks = tasks.filter(t => !t.is_completed);
    const completedTasks = tasks.filter(t => t.is_completed);

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
    li.innerHTML = `
        <div class="task-left">
            <div class="check-circle ${task.is_completed ? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
            <span class="task-text" onclick="toggleTask(${task.id})">${task.task}</span>
        </div>
        <button class="delete-btn" onclick="deleteTask(${task.id})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
    `;
    return li;
}

els.addBtn.addEventListener('click', addNewTask);
els.todoInput.addEventListener('keypress', (e) => e.key === 'Enter' && addNewTask());

async function addNewTask() {
    const text = els.todoInput.value.trim();
    if (!text) return;

    const tempId = Date.now();
    const newTask = { id: tempId, task: text, is_completed: false };

    tasks.unshift(newTask);
    renderTasks();
    els.todoInput.value = '';

    if (currentUser) {
        const { data } = await supabase.from('todos').insert([{ task: text, user_id: currentUser.id }]).select();
        if (data) {
            const index = tasks.findIndex(t => t.id === tempId);
            if (index !== -1) tasks[index] = data[0];
        }
    } else {
        saveLocal();
    }
}

async function toggleTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;
    tasks[index].is_completed = !tasks[index].is_completed;
    renderTasks();
    if (currentUser) await supabase.from('todos').update({ is_completed: tasks[index].is_completed }).eq('id', id);
    else saveLocal();
}

async function deleteTask(id) {
    if (!await showConfirm('این تسک حذف شود؟')) return;
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    if (currentUser) await supabase.from('todos').delete().eq('id', id);
    else saveLocal();
}

// --- مودال و Auth ---
function openAuthModal(mode) {
    authMode = mode;
    els.dropdown.classList.remove('show');
    els.authMsg.textContent = '';
    
    // ریست فیلدها
    els.usernameInput.value = '';
    els.passwordInput.value = '';
    els.fnameInput.value = '';
    els.lnameInput.value = '';

    if (mode === 'login') {
        els.modalTitle.textContent = 'ورود به حساب';
        els.submitAuthBtn.textContent = 'ورود';
        els.signupFields.style.display = 'none';
        els.usernameInput.parentElement.style.display = 'block'; // نمایش ایمیل
        els.authFooterLinks.style.display = 'flex';
        document.getElementById('switch-text').textContent = 'حساب ندارید؟';
        els.switchAuthLink.textContent = 'ثبت نام';
    } else if (mode === 'signup') {
        els.modalTitle.textContent = 'ثبت نام کاربر جدید';
        els.submitAuthBtn.textContent = 'ثبت نام';
        els.signupFields.style.display = 'block';
        els.authFooterLinks.style.display = 'flex';
        document.getElementById('switch-text').textContent = 'حساب دارید؟';
        els.switchAuthLink.textContent = 'ورود';
    }
    openModal(els.authModal);
}

function openEditProfile() {
    authMode = 'edit';
    els.dropdown.classList.remove('show');
    
    els.modalTitle.textContent = 'ویرایش مشخصات';
    els.submitAuthBtn.textContent = 'ذخیره تغییرات';
    els.signupFields.style.display = 'block';
    els.authFooterLinks.style.display = 'none'; // مخفی کردن لینک سوییچ
    
    // پر کردن اطلاعات فعلی
    const meta = currentUser.user_metadata || {};
    els.fnameInput.value = meta.first_name || '';
    els.lnameInput.value = meta.last_name || '';
    els.usernameInput.parentElement.style.display = 'none'; // ایمیل در ویرایش مخفی (یا نمایشی)
    // ایمیل و پسورد رو مخفی میکنیم برای سادگی چون تغییرشون پروسه داره
    els.usernameInput.style.display = 'none';
    els.passwordInput.style.display = 'none';

    openModal(els.authModal);
}

els.switchAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal(authMode === 'login' ? 'signup' : 'login');
});

els.submitAuthBtn.addEventListener('click', async () => {
    if (authMode === 'edit') {
        // لاجیک ویرایش
        const fname = els.fnameInput.value.trim();
        const lname = els.lnameInput.value.trim();
        if(!fname) return els.authMsg.textContent = 'نام الزامی است';
        
        els.submitAuthBtn.textContent = '...';
        const { data, error } = await supabase.auth.updateUser({
            data: { first_name: fname, last_name: lname }
        });
        
        if(error) els.authMsg.textContent = error.message;
        else {
            setCurrentUser(data.user);
            showAlert('مشخصات بروز شد');
        }
        return;
    }

    // لاجیک ورود/ثبت نام
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
        else {
            showAlert('ثبت نام انجام شد. وارد شوید.');
            openAuthModal('login');
        }
    }
});

// --- سایر ---
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

async function deleteAllTasks() {
    if (tasks.length === 0) return;
    if (!await showConfirm('همه تسک‌ها پاک شوند؟')) return;
    if (currentUser) await supabase.from('todos').delete().neq('id', 0);
    tasks = [];
    saveLocal();
    renderTasks();
    els.dropdown.classList.remove('show');
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

async function fetchTasks() {
    els.todoList.innerHTML = '<div style="text-align:center; padding:20px;">در حال بارگذاری...</div>';
    const { data } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
    if (data) {
        tasks = data;
        renderTasks();
    }
}

function saveLocal() { localStorage.setItem('todo_local_tasks', JSON.stringify(tasks)); }

function loadLocalSettings() {
    const theme = localStorage.getItem('theme_color');
    if (theme) document.documentElement.style.setProperty('--primary-color', theme);
    if (localStorage.getItem('dark_mode') === 'true') document.body.classList.add('dark-mode');
}

function openModal(modal) { modal.classList.add('open'); }
function closeModalFunc(modal) { 
    modal.classList.remove('open'); 
    // برگرداندن استایل فیلدها برای دفعه بعد
    els.usernameInput.style.display = 'block';
    els.passwordInput.style.display = 'block';
}
els.closeModal.addEventListener('click', () => closeModalFunc(els.authModal));

function showAlert(msg) {
    els.alertTitle.textContent = 'پیام'; els.alertText.textContent = msg;
    els.alertCancelBtn.style.display = 'none';
    openModal(els.alertModal); els.alertOkBtn.onclick = () => closeModalFunc(els.alertModal);
}

function showConfirm(msg) {
    return new Promise((resolve) => {
        els.alertTitle.textContent = 'تاییدیه'; els.alertText.textContent = msg;
        els.alertCancelBtn.style.display = 'inline-block';
        openModal(els.alertModal);
        els.alertOkBtn.onclick = () => { closeModalFunc(els.alertModal); resolve(true); };
        els.alertCancelBtn.onclick = () => { closeModalFunc(els.alertModal); resolve(false); };
    });
}

// Global Access
window.openAuthModal = openAuthModal;
window.openEditProfile = openEditProfile;
window.logoutUser = logoutUser;
window.deleteAllTasks = deleteAllTasks;
window.toggleDarkMode = toggleDarkMode;
window.setTheme = setTheme;
