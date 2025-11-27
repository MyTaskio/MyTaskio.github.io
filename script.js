// --- تنظیمات Supabase ---
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- آیکون‌های SVG ---
const ICONS = {
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
};

// --- متغیرها ---
let tasks = [];
let currentUser = null;
let isLoginMode = true;

// --- انتخابگرها ---
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const themeToggle = document.getElementById('theme-toggle');
const colorPicker = document.getElementById('color-picker');
const authBtn = document.getElementById('auth-btn');
const authModal = document.getElementById('auth-modal');
const closeModal = document.querySelector('.close-modal');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const switchAuthLink = document.getElementById('switch-auth-link');
const modalTitle = document.getElementById('modal-title');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const authMsg = document.getElementById('auth-msg');
const userStatusBar = document.getElementById('user-status-bar');
const userDisplayName = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');

// --- شروع برنامه ---
document.addEventListener('DOMContentLoaded', async () => {
    loadLocalSettings();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        setCurrentUser(session.user);
    } else {
        const localData = localStorage.getItem('todo_local_tasks');
        if (localData) tasks = JSON.parse(localData);
        renderTasks();
    }
});

function setCurrentUser(user) {
    currentUser = user;
    userStatusBar.style.display = 'flex';
    userDisplayName.textContent = user.user_metadata.username || 'کاربر';
    authBtn.style.color = 'var(--primary)';
    authBtn.style.borderColor = 'var(--primary)';
    fetchTasks();
}

// --- دیتابیس ---
async function fetchTasks() {
    todoList.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-light)">در حال بارگذاری...</div>';
    const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });

    if (!error) {
        tasks = data;
        renderTasks();
    }
}

// --- توابع تسک ---
addBtn.addEventListener('click', addNewTask);
todoInput.addEventListener('keypress', (e) => e.key === 'Enter' && addNewTask());

async function addNewTask() {
    const text = todoInput.value.trim();
    if (!text) return;

    const tempId = Date.now();
    const newTask = { id: tempId, task: text, is_completed: false };

    tasks.unshift(newTask);
    renderTasks();
    todoInput.value = '';

    if (currentUser) {
        const { data, error } = await supabase.from('todos').insert([{ task: text, user_id: currentUser.id }]).select();
        if (!error && data) {
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

    if (currentUser) {
        await supabase.from('todos').update({ is_completed: tasks[index].is_completed }).eq('id', id);
    } else {
        saveLocal();
    }
}

async function deleteTask(id) {
    if (!confirm('حذف شود؟')) return;

    tasks = tasks.filter(t => t.id !== id);
    renderTasks();

    if (currentUser) {
        await supabase.from('todos').delete().eq('id', id);
    } else {
        saveLocal();
    }
}

function saveLocal() {
    localStorage.setItem('todo_local_tasks', JSON.stringify(tasks));
}

// --- رندرینگ (UI) ---
function renderTasks() {
    todoList.innerHTML = '';
    
    const active = tasks.filter(t => !t.is_completed);
    const completed = tasks.filter(t => t.is_completed);

    if (active.length === 0 && completed.length === 0) {
        todoList.innerHTML = '<div style="text-align:center; opacity:0.5; margin-top:30px;">لیست خالی است</div>';
        return;
    }

    active.forEach(task => createEl(task));

    if (completed.length > 0) {
        if (active.length > 0) {
            const sep = document.createElement('div');
            sep.className = 'list-separator';
            sep.innerHTML = '<span>انجام شده</span>';
            todoList.appendChild(sep);
        }
        completed.forEach(task => createEl(task));
    }
}

function createEl(task) {
    const li = document.createElement('li');
    if (task.is_completed) li.classList.add('completed');

    li.innerHTML = `
        <div class="check-circle" onclick="toggleTask(${task.id})">
            ${ICONS.check}
        </div>
        <span>${task.task}</span>
        <button class="delete-btn" onclick="deleteTask(${task.id})">
            ${ICONS.trash}
        </button>
    `;
    todoList.appendChild(li);
}

// --- تم و رنگ ---
function loadLocalSettings() {
    const theme = localStorage.getItem('theme_color');
    const isDark = localStorage.getItem('dark_mode') === 'true';
    
    if (theme) {
        document.documentElement.style.setProperty('--primary', theme);
        colorPicker.value = theme;
    }
    
    if (isDark) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = ICONS.sun; // تغییر آیکون به خورشید
    } else {
        themeToggle.innerHTML = ICONS.moon; // تغییر آیکون به ماه
    }
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDark ? ICONS.sun : ICONS.moon;
    localStorage.setItem('dark_mode', isDark);
});

colorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('theme_color', color);
});

// --- مدیریت مودال و احراز هویت ---
authBtn.addEventListener('click', () => {
    if (currentUser) return; 
    authModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => authModal.style.display = 'none');
window.onclick = (e) => { if (e.target == authModal) authModal.style.display = 'none'; };

switchAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    modalTitle.textContent = isLoginMode ? 'ورود به حساب' : 'ثبت نام';
    submitAuthBtn.textContent = isLoginMode ? 'ورود' : 'ثبت نام';
    document.getElementById('switch-text').textContent = isLoginMode ? 'حساب ندارید؟' : 'حساب دارید؟';
    switchAuthLink.textContent = isLoginMode ? 'ثبت نام' : 'ورود';
    authMsg.textContent = '';
});

submitAuthBtn.addEventListener('click', async () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();
    
    if (user.length < 3 || pass.length < 4) {
        authMsg.style.color = 'var(--danger)';
        authMsg.textContent = 'نام کاربری (۳) و رمز (۴) کاراکتر';
        return;
    }

    authMsg.style.color = 'var(--text)';
    authMsg.textContent = 'لطفا صبر کنید...';

    const fakeEmail = `${user}@example.com`;
    let result;

    if (isLoginMode) {
        result = await supabase.auth.signInWithPassword({ email: fakeEmail, password: pass });
    } else {
        result = await supabase.auth.signUp({ email: fakeEmail, password: pass, options: { data: { username: user } } });
    }

    const { data, error } = result;

    if (error) {
        authMsg.style.color = 'var(--danger)';
        authMsg.textContent = 'خطا: اطلاعات اشتباه یا تکراری است';
    } else {
        authModal.style.display = 'none';
        // اگر ساین‌آپ بود، خودش اتوماتیک لاگین میشه چون کانفرم ایمیل خاموشه
        if (data.user) setCurrentUser(data.user);
        
        usernameInput.value = '';
        passwordInput.value = '';
        alert('موفقیت آمیز بود!');
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    tasks = [];
    userStatusBar.style.display = 'none';
    authBtn.style.color = 'var(--text)'; // برگشت رنگ آیکون به حالت عادی
    authBtn.style.borderColor = 'var(--border)';
    
    const localData = localStorage.getItem('todo_local_tasks');
    if (localData) tasks = JSON.parse(localData);
    renderTasks();
});
