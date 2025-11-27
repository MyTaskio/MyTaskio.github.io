// --- تنظیمات Supabase ---
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- متغیرها و المنت‌ها ---
let tasks = [];
let currentUser = null;
let isLoginMode = true;

const els = {
    todoInput: document.getElementById('todo-input'),
    addBtn: document.getElementById('add-btn'),
    todoList: document.getElementById('todo-list'),
    themeToggle: document.getElementById('theme-toggle'),
    colorPicker: document.getElementById('color-picker'),
    colorBtn: document.getElementById('color-btn'),
    authBtn: document.getElementById('auth-btn'),
    authModal: document.getElementById('auth-modal'),
    closeModal: document.querySelector('.close-modal'),
    submitAuthBtn: document.getElementById('submit-auth-btn'),
    switchAuthLink: document.getElementById('switch-auth-link'),
    modalTitle: document.getElementById('modal-title'),
    usernameInput: document.getElementById('username-input'),
    passwordInput: document.getElementById('password-input'),
    fnameInput: document.getElementById('fname-input'),
    lnameInput: document.getElementById('lname-input'),
    signupFields: document.getElementById('signup-fields'),
    authMsg: document.getElementById('auth-msg'),
    userDropdown: document.getElementById('user-dropdown'),
    logoutBtn: document.getElementById('logout-btn'),
    dropdownUsername: document.getElementById('dropdown-username'),
    headerTitle: document.getElementById('header-title'),
    deleteAllBtn: document.getElementById('delete-all-btn'),
    alertModal: document.getElementById('alert-modal'),
    alertTitle: document.getElementById('alert-title'),
    alertText: document.getElementById('alert-text'),
    alertOkBtn: document.getElementById('alert-ok-btn'),
    alertCancelBtn: document.getElementById('alert-cancel-btn')
};

// --- آیکون‌ها ---
const ICONS = {
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
};

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

// --- مدیریت کاربر ---
async function setCurrentUser(user) {
    currentUser = user;
    
    // دریافت نام از متادیتا
    const meta = user.user_metadata || {};
    const name = meta.first_name || 'کاربر';
    
    // تنظیم UI
    els.dropdownUsername.textContent = name;
    els.headerTitle.textContent = `سلام ${name} 👋`;
    els.authBtn.classList.add('active');
    
    // بستن مودال اگر باز است
    closeModalFunc(els.authModal);

    // سینک کردن تسک‌های لوکال به سرور
    await syncLocalTasks();

    // دریافت تسک‌ها
    fetchTasks();
}

// --- انتقال تسک‌های لوکال به سرور ---
async function syncLocalTasks() {
    const localData = localStorage.getItem('todo_local_tasks');
    if (!localData) return;

    const localTasks = JSON.parse(localData);
    if (localTasks.length === 0) return;

    // تبدیل فرمت تسک‌ها برای دیتابیس
    const updates = localTasks.map(t => ({
        task: t.task,
        is_completed: t.is_completed,
        user_id: currentUser.id
    }));

    const { error } = await supabase.from('todos').insert(updates);
    
    if (!error) {
        localStorage.removeItem('todo_local_tasks');
        showAlert('تسک‌های قبلی شما به حساب کاربری منتقل شدند.');
    }
}

// --- لاگین و ثبت نام ---
els.authBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUser) els.userDropdown.classList.toggle('show');
    else openModal(els.authModal);
});

window.addEventListener('click', () => els.userDropdown.classList.remove('show'));

els.switchAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    els.modalTitle.textContent = isLoginMode ? 'ورود به حساب' : 'ثبت نام';
    els.submitAuthBtn.textContent = isLoginMode ? 'ورود' : 'ثبت نام';
    document.getElementById('switch-text').textContent = isLoginMode ? 'حساب ندارید؟' : 'حساب دارید؟';
    els.switchAuthLink.textContent = isLoginMode ? 'ثبت نام کنید' : 'وارد شوید';
    els.signupFields.style.display = isLoginMode ? 'none' : 'flex';
    els.authMsg.textContent = '';
});

els.submitAuthBtn.addEventListener('click', async () => {
    const email = els.usernameInput.value.trim();
    const password = els.passwordInput.value.trim();
    const fname = els.fnameInput.value.trim();
    const lname = els.lnameInput.value.trim();

    if (!email || !password) {
        els.authMsg.textContent = 'لطفا ایمیل و رمز عبور را وارد کنید';
        return;
    }

    els.submitAuthBtn.textContent = 'لطفا صبر کنید...';
    els.authMsg.textContent = '';

    if (isLoginMode) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) els.authMsg.textContent = 'ایمیل یا رمز عبور اشتباه است';
        else setCurrentUser(data.user);
    } else {
        // ثبت نام با متادیتا (نام)
        const { data, error } = await supabase.auth.signUp({
            email, 
            password,
            options: {
                data: {
                    first_name: fname,
                    last_name: lname
                }
            }
        });
        if (error) els.authMsg.textContent = 'خطا در ثبت نام: ' + error.message;
        else {
            showAlert('ثبت نام موفقیت آمیز بود! وارد شوید.');
            isLoginMode = true;
            els.switchAuthLink.click(); // بازگشت به حالت لاگین
        }
    }
    els.submitAuthBtn.textContent = isLoginMode ? 'ورود' : 'ثبت نام';
});

els.logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    tasks = [];
    els.userDropdown.classList.remove('show');
    els.authBtn.classList.remove('active');
    els.headerTitle.textContent = 'لیست کارها';
    renderTasks();
    showAlert('از حساب خارج شدید');
});

// --- عملیات تسک (CRUD) ---
els.addBtn.addEventListener('click', addNewTask);
els.todoInput.addEventListener('keypress', (e) => e.key === 'Enter' && addNewTask());

async function addNewTask() {
    const text = els.todoInput.value.trim();
    if (!text) return;

    const tempId = Date.now();
    const newTask = { id: tempId, task: text, is_completed: false };

    // Optimistic UI
    tasks.unshift(newTask);
    renderTasks();
    els.todoInput.value = '';

    if (currentUser) {
        const { data, error } = await supabase
            .from('todos')
            .insert([{ task: text, user_id: currentUser.id }]) // ارسال user_id حیاتی است
            .select();

        if (error) {
            console.error('Supabase Error:', error);
            showAlert('خطا در ذخیره تسک در سرور');
            // رول بک کردن تسک اگر ارور داد (اختیاری)
        } else if (data) {
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
    if (!await showConfirm('آیا این تسک حذف شود؟')) return;

    tasks = tasks.filter(t => t.id !== id);
    renderTasks();

    if (currentUser) {
        await supabase.from('todos').delete().eq('id', id);
    } else {
        saveLocal();
    }
}

// --- حذف همه تسک‌ها ---
els.deleteAllBtn.addEventListener('click', async () => {
    if (tasks.length === 0) return;
    
    const confirmDelete = await showConfirm('آیا مطمئن هستید؟ همه تسک‌ها پاک خواهند شد!');
    if (!confirmDelete) return;

    if (currentUser) {
        // حذف از سرور (همه تسک‌های این کاربر)
        const { error } = await supabase.from('todos').delete().neq('id', 0); // پاک کردن همه ردیف‌ها
        if (error) {
            showAlert('خطا در حذف تسک‌ها');
            return;
        }
    }
    
    // پاک کردن از حافظه و لوکال
    tasks = [];
    saveLocal();
    renderTasks();
    els.userDropdown.classList.remove('show');
});

// --- دیتابیس و رندر ---
async function fetchTasks() {
    els.todoList.innerHTML = '<div style="text-align:center; padding:20px; opacity:0.5;">...</div>';
    const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
    
    if (!error) {
        tasks = data;
        renderTasks();
    } else {
        console.error(error);
        els.todoList.innerHTML = '<div style="text-align:center; color:red;">خطا در دریافت اطلاعات</div>';
    }
}

function renderTasks() {
    els.todoList.innerHTML = '';

    if (tasks.length === 0) {
        // فضای خالی کمتر و مرتب‌تر
        els.todoList.innerHTML = '<div style="text-align:center; opacity:0.5; font-size:0.9rem; padding: 10px;">لیست خالی است</div>';
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.is_completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div style="display:flex; align-items:center; flex:1;">
                <button class="delete-btn" onclick="deleteTask(${task.id})">${ICONS.trash}</button>
                <div class="check-circle" onclick="toggleTask(${task.id})"></div>
                <span onclick="toggleTask(${task.id})" style="margin-right:10px; cursor:pointer; flex:1;">${task.task}</span>
            </div>
        `;
        els.todoList.appendChild(li);
    });
}

function saveLocal() {
    localStorage.setItem('todo_local_tasks', JSON.stringify(tasks));
}

// --- تم و رنگ ---
els.colorBtn.addEventListener('click', () => els.colorPicker.click());
els.colorPicker.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--primary-color', e.target.value);
    localStorage.setItem('theme_color', e.target.value);
});

els.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('dark_mode', isDark);
    els.themeToggle.innerHTML = isDark ? ICONS.sun : ICONS.moon;
});

function loadLocalSettings() {
    const theme = localStorage.getItem('theme_color');
    const isDark = localStorage.getItem('dark_mode') === 'true';
    
    if (theme) {
        document.documentElement.style.setProperty('--primary-color', theme);
        els.colorPicker.value = theme;
    }
    if (isDark) document.body.classList.add('dark-mode');
    els.themeToggle.innerHTML = isDark ? ICONS.sun : ICONS.moon;
}

// --- سیستم مودال ---
function openModal(modal) { modal.classList.add('open'); }
function closeModalFunc(modal) { modal.classList.remove('open'); }
els.closeModal.addEventListener('click', () => closeModalFunc(els.authModal));

function showAlert(msg) {
    els.alertTitle.textContent = 'پیام سیستم';
    els.alertText.textContent = msg;
    els.alertOkBtn.onclick = () => closeModalFunc(els.alertModal);
    els.alertCancelBtn.style.display = 'none';
    openModal(els.alertModal);
}

function showConfirm(msg) {
    return new Promise((resolve) => {
        els.alertTitle.textContent = 'تاییدیه';
        els.alertText.textContent = msg;
        els.alertCancelBtn.style.display = 'inline-block';
        openModal(els.alertModal);
        
        els.alertOkBtn.onclick = () => { closeModalFunc(els.alertModal); resolve(true); };
        els.alertCancelBtn.onclick = () => { closeModalFunc(els.alertModal); resolve(false); };
    });
}
