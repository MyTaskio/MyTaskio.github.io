// تنظیمات Supabase (با همان کلید درست شما)
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// متغیرها
let tasks = [];
let currentUser = null;

// عناصر صفحه
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const authIcon = document.getElementById('authIcon');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeColors = document.querySelectorAll('.theme-color');
const authModal = document.getElementById('authModal');
const closeBtn = document.querySelector('.close-btn');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const authMessage = document.getElementById('authMessage');

// شروع برنامه
document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    const localUser = localStorage.getItem('todo_user');
    if (localUser) {
        currentUser = JSON.parse(localUser);
        updateAuthIconState();
    }
    await loadTasks();
});

// مدیریت تم
themeColors.forEach(c => c.addEventListener('click', () => {
    const color = c.getAttribute('data-color');
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('todo_theme_color', color);
}));

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('todo_dark_mode', isDark);
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
});

function loadTheme() {
    const savedColor = localStorage.getItem('todo_theme_color');
    const isDark = localStorage.getItem('todo_dark_mode') === 'true';
    if (savedColor) document.documentElement.style.setProperty('--primary-color', savedColor);
    if (isDark) {
        document.body.classList.add('dark-mode');
        themeToggleBtn.textContent = '☀️';
    }
}

// احراز هویت
authIcon.addEventListener('click', () => currentUser ? (confirm('خروج؟') && logout()) : authModal.style.display = 'flex');
closeBtn.addEventListener('click', () => authModal.style.display = 'none');
window.onclick = (e) => { if (e.target == authModal) authModal.style.display = 'none'; };

// *** تغییر مهم: استفاده از دامنه example.com برای رفع ارور invalid email ***
const getEmail = (u) => `${u}@example.com`;

async function handleAuth(isSignup) {
    const u = authUsernameInput.value.trim();
    const p = authPasswordInput.value.trim();
    if (u.length < 4 || p.length < 4) return authMessage.textContent = 'حداقل ۴ کاراکتر وارد کنید';
    
    authMessage.textContent = 'لطفا صبر کنید...';
    const { data, error } = isSignup 
        ? await supabase.auth.signUp({ email: getEmail(u), password: p, options: { data: { username: u } } })
        : await supabase.auth.signInWithPassword({ email: getEmail(u), password: p });

    if (error) {
        authMessage.style.color = 'red';
        // ترجمه خطاهای رایج برای درک بهتر
        if (error.message.includes('already registered')) {
            authMessage.textContent = 'این نام کاربری قبلا گرفته شده است.';
        } else if (error.message.includes('Invalid login')) {
            authMessage.textContent = 'نام کاربری یا رمز عبور اشتباه است.';
        } else {
            authMessage.textContent = error.message;
        }
    } else {
        currentUser = { id: data.user.id, username: u };
        localStorage.setItem('todo_user', JSON.stringify(currentUser));
        authModal.style.display = 'none';
        updateAuthIconState();
        await loadTasks();
        alert('خوش آمدید!');
    }
}

signupBtn.onclick = () => handleAuth(true);
loginBtn.onclick = () => handleAuth(false);

function logout() {
    supabase.auth.signOut();
    currentUser = null;
    localStorage.removeItem('todo_user');
    updateAuthIconState();
    loadTasks();
}

function updateAuthIconState() {
    authIcon.style.color = currentUser ? '#4CAF50' : 'inherit';
    authIcon.style.border = currentUser ? '2px solid #4CAF50' : '1px solid var(--border-color)';
}

// مدیریت تسک‌ها
async function loadTasks() {
    taskList.innerHTML = '<div style="text-align:center; padding:20px;">در حال بارگذاری...</div>';
    
    if (currentUser) {
        const { data } = await supabase.from('todos').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        tasks = data || [];
    } else {
        tasks = JSON.parse(localStorage.getItem('todo_local_tasks') || '[]');
    }
    renderTasks();
}

addTaskBtn.addEventListener('click', async () => {
    const text = taskInput.value.trim();
    if (!text) return;

    const tempId = Date.now();
    const newTask = { id: tempId, task: text, is_completed: false, user_id: currentUser?.id };

    // اضافه کردن موقت به UI برای سرعت
    tasks.unshift(newTask);
    renderTasks();
    taskInput.value = '';

    if (currentUser) {
        const { data, error } = await supabase.from('todos').insert([{ task: text, user_id: currentUser.id }]).select();
        if (!error && data) {
            // جایگزینی ID واقعی با ID موقت
            tasks = tasks.map(t => t.id === tempId ? data[0] : t);
        } else {
            alert('خطا در ذخیره سازی');
            tasks = tasks.filter(t => t.id !== tempId);
            renderTasks();
        }
    } else {
        saveLocal();
    }
});

async function toggleTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;

    const newState = !tasks[idx].is_completed;
    tasks[idx].is_completed = newState;
    renderTasks(); // رندر مجدد برای جابجایی

    if (currentUser) {
        await supabase.from('todos').update({ is_completed: newState }).eq('id', id);
    } else {
        saveLocal();
    }
}

async function deleteTask(id) {
    if(!confirm('حذف شود؟')) return;
    
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

// رندر (نمایش) با منطق جداسازی تکمیل شده‌ها
function renderTasks() {
    taskList.innerHTML = '';
    
    const activeTasks = tasks.filter(t => !t.is_completed);
    const completedTasks = tasks.filter(t => t.is_completed);

    if (activeTasks.length === 0 && completedTasks.length === 0) {
        taskList.innerHTML = '<div style="text-align:center; opacity:0.5; margin-top:20px;">لیست خالی است</div>';
        return;
    }

    // نمایش تسک‌های فعال
    activeTasks.forEach(task => appendTaskElement(task));

    // اگر تسک تکمیل شده داریم، خط جداکننده و لیست آنها را نمایش بده
    if (completedTasks.length > 0) {
        if (activeTasks.length > 0) {
            const hr = document.createElement('hr');
            hr.className = 'completed-separator';
            taskList.appendChild(hr);
        }
        
        completedTasks.forEach(task => appendTaskElement(task));
    }
}

function appendTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.is_completed ? 'completed' : ''}`;
    
    li.innerHTML = `
        <div class="task-content" onclick="toggleTask(${task.id})">
            <div class="check-circle"></div>
            <span>${task.task}</span>
        </div>
        <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️</button>
    `;
    taskList.appendChild(li);
}
