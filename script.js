// --- تنظیمات Supabase ---
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- متغیرها ---
let tasks = [];
let currentUser = null;
let isLoginMode = true;

// 10 رنگ انتخابی
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
    
    // بستن منو با کلیک بیرون
    window.addEventListener('click', (e) => {
        if (!els.menuBtn.contains(e.target) && !els.dropdown.contains(e.target)) {
            els.dropdown.classList.remove('show');
        }
    });

    els.menuBtn.addEventListener('click', () => {
        renderMenu(); // ساخت منو قبل از نمایش
        els.dropdown.classList.toggle('show');
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        setCurrentUser(session.user);
    } else {
        els.headerTitle.textContent = 'سلام کاربر مهمان';
        const localData = localStorage.getItem('todo_local_tasks');
        if (localData) tasks = JSON.parse(localData);
        renderTasks();
    }
});

// --- ساخت داینامیک منوی تنظیمات ---
function renderMenu() {
    const isDark = document.body.classList.contains('dark-mode');
    let menuHTML = '';

    // 1. دکمه اول: ورود/ثبت نام یا اسم کاربر
    if (currentUser) {
        const name = currentUser.user_metadata.first_name + ' ' + currentUser.user_metadata.last_name;
        menuHTML += `
            <div class="menu-item" style="cursor:default; font-weight:bold; border-bottom:1px solid var(--border-color);">
                <span>${name}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
        `;
    } else {
        menuHTML += `
            <div class="menu-item" onclick="openAuthModal()">
                <span>ورود یا ثبت نام</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            </div>
        `;
    }

    // 2. رنگ‌ها (گرید)
    menuHTML += `<div class="color-grid">`;
    THEME_COLORS.forEach(color => {
        menuHTML += `<div class="color-circle" style="background:${color}" onclick="setTheme('${color}')"></div>`;
    });
    menuHTML += `</div>`;

    // 3. دارک مود
    menuHTML += `
        <div class="menu-item" onclick="toggleDarkMode()">
            <span>${isDark ? 'حالت روز' : 'حالت شب'}</span>
            ${isDark 
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' 
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'}
        </div>
    `;

    // 4. حذف همه تسک‌ها
    menuHTML += `
        <div class="menu-item danger" onclick="deleteAllTasks()">
            <span>حذف همه تسک‌ها</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </div>
    `;

    // 5. خروج (فقط اگر لاگین باشد)
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
    
    els.headerTitle.textContent = `سلام ${firstName}`; // فقط نام کوچک
    closeModalFunc(els.authModal);
    
    // سینک تسک‌های لوکال
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

// --- رندر لیست تسک‌ها (با جداکننده) ---
function renderTasks() {
    els.todoList.innerHTML = '';

    if (tasks.length === 0) {
        els.todoList.innerHTML = '<div style="text-align:center; opacity:0.5; font-size:0.9rem; margin-top:30px;">هیچ کاری برای انجام نیست!</div>';
        return;
    }

    // جدا کردن تسک‌ها
    const activeTasks = tasks.filter(t => !t.is_completed);
    const completedTasks = tasks.filter(t => t.is_completed);

    // رندر تسک‌های فعال
    activeTasks.forEach(task => {
        els.todoList.appendChild(createTaskElement(task));
    });

    // اگر تسک تکمیل شده داریم، جداکننده و لیست پایین را اضافه کن
    if (completedTasks.length > 0) {
        // اگر تسک فعال هم داشتیم، جداکننده بزن، اگر نه فقط لیست
        if (activeTasks.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'completed-section';
            separator.innerHTML = '<span class="completed-label">انجام شده</span>';
            els.todoList.appendChild(separator);
        }
        
        completedTasks.forEach(task => {
            els.todoList.appendChild(createTaskElement(task));
        });
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
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
    `;
    return li;
}

// --- عملیات تسک (CRUD) ---
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
    renderTasks(); // خودکار میره پایین چون لیست بازسازی میشه

    if (currentUser) {
        await supabase.from('todos').update({ is_completed: tasks[index].is_completed }).eq('id', id);
    } else {
        saveLocal();
    }
}

async function deleteTask(id) {
    if (!await showConfirm('این تسک حذف شود؟')) return;

    tasks = tasks.filter(t => t.id !== id);
    renderTasks();

    if (currentUser) {
        await supabase.from('todos').delete().eq('id', id);
    } else {
        saveLocal();
    }
}

// --- توابع منو ---
function openAuthModal() {
    els.dropdown.classList.remove('show');
    openModal(els.authModal);
}

async function logoutUser() {
    await supabase.auth.signOut();
    currentUser = null;
    tasks = [];
    els.headerTitle.textContent = 'سلام کاربر مهمان';
    els.dropdown.classList.remove('show');
    saveLocal(); // پاک کردن لوکال یا بازگشت به حالت مهمان
    renderTasks();
    showAlert('خروج موفقیت آمیز بود');
}

async function deleteAllTasks() {
    if (tasks.length === 0) return;
    if (!await showConfirm('همه تسک‌ها پاک شوند؟')) return;

    if (currentUser) {
        await supabase.from('todos').delete().neq('id', 0);
    }
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
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('dark_mode', isDark);
    renderMenu(); // برای آپدیت آیکون منو
}

// --- دیتابیس و ابزارها ---
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

// --- لاجیک مودال‌ها ---
els.switchAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    els.modalTitle.textContent = isLoginMode ? 'ورود به حساب' : 'ثبت نام';
    els.submitAuthBtn.textContent = isLoginMode ? 'ورود' : 'ثبت نام';
    document.getElementById('switch-text').textContent = isLoginMode ? 'حساب ندارید؟' : 'حساب دارید؟';
    els.switchAuthLink.textContent = isLoginMode ? 'ثبت نام کنید' : 'وارد شوید';
    els.signupFields.style.display = isLoginMode ? 'none' : 'block';
    els.authMsg.textContent = '';
});

els.submitAuthBtn.addEventListener('click', async () => {
    const email = els.usernameInput.value.trim();
    const password = els.passwordInput.value.trim();
    const fname = els.fnameInput.value.trim();
    const lname = els.lnameInput.value.trim();

    if (!email || !password) return els.authMsg.textContent = 'ایمیل و رمز الزامی است';

    els.submitAuthBtn.textContent = '...';
    
    if (isLoginMode) {
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
            isLoginMode = true; els.switchAuthLink.click();
        }
    }
    els.submitAuthBtn.textContent = isLoginMode ? 'ورود' : 'ثبت نام';
});

function openModal(modal) { modal.classList.add('open'); }
function closeModalFunc(modal) { modal.classList.remove('open'); }
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

// اتصال توابع به window برای دسترسی از HTML
window.openAuthModal = openAuthModal;
window.logoutUser = logoutUser;
window.deleteAllTasks = deleteAllTasks;
window.toggleDarkMode = toggleDarkMode;
window.setTheme = setTheme;
