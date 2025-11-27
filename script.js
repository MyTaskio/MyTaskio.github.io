// --- تنظیمات Supabase ---
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- آیکون‌ها ---
const ICONS = {
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    logout: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>'
};

// --- متغیرها ---
let tasks = [];
let currentUser = null;
let isLoginMode = true;

// --- DOM Elements ---
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const completedList = document.getElementById('completed-list');
const completedSection = document.getElementById('completed-section');
const themeToggle = document.getElementById('theme-toggle');
const userBtn = document.getElementById('user-btn');
const userDropdown = document.getElementById('user-dropdown');
const logoutBtn = document.getElementById('logout-btn');
const logoutIcon = document.getElementById('logout-icon');
const userDisplayName = document.getElementById('user-display-name');
const headerTitle = document.getElementById('header-title');
const colorDots = document.querySelectorAll('.color-dot');

// Modal Auth
const authModal = document.getElementById('auth-modal');
const closeModalBtn = document.getElementById('close-modal');
const authMsg = document.getElementById('auth-msg');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const switchAuthLink = document.getElementById('switch-auth-link');
const modalTitle = document.getElementById('modal-title');
const forgotPassLink = document.getElementById('forgot-pass-link');

// Inputs
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const fnameInput = document.getElementById('fname-input');
const lnameInput = document.getElementById('lname-input');
const signupFields = document.getElementById('signup-fields');

// Custom Alert
const customAlert = document.getElementById('custom-alert');
const alertTitle = document.getElementById('alert-title');
const alertMsg = document.getElementById('alert-msg');
const alertOkBtn = document.getElementById('alert-ok-btn');


// --- شروع برنامه ---
document.addEventListener('DOMContentLoaded', async () => {
    themeToggle.innerHTML = ICONS.moon;
    userBtn.innerHTML = ICONS.user;
    logoutIcon.innerHTML = ICONS.logout;

    // لود تم ذخیره شده
    loadTheme();

    // بررسی وضعیت لاگین
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        setCurrentUser(session.user);
    } else {
        // اگر لاگین نیست، دیتای لوکال را بخوان
        loadLocalTasks();
    }
});

// --- 1. مدیریت تسک‌ها (هیبرید: آنلاین و آفلاین) ---

// بارگذاری از لوکال (مهمان)
function loadLocalTasks() {
    const saved = localStorage.getItem('my_tasks_local');
    if (saved) {
        tasks = JSON.parse(saved);
    } else {
        tasks = [];
    }
    renderTasks();
}

// بارگذاری از Supabase (کاربر)
async function fetchTasks() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error) {
        tasks = data;
        renderTasks();
    }
}

// افزودن تسک
async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    // ساخت آبجکت تسک
    // اگر آنلاین باشد ID موقت میزنیم تا دیتابیس جواب دهد
    const newTask = { 
        id: Date.now(), // موقت
        title: text, 
        is_completed: false,
        created_at: new Date().toISOString()
    };

    // اضافه کردن به لیست (نمایش فوری)
    tasks.unshift(newTask);
    renderTasks();
    taskInput.value = '';

    if (currentUser) {
        // ذخیره در Supabase
        const { data, error } = await supabase
            .from('todos')
            .insert([{ title: text, user_id: currentUser.id, is_completed: false }])
            .select();

        if (error) {
            showAlert('خطا در ذخیره آنلاین: ' + error.message);
        } else if (data) {
            // بروزرسانی ID واقعی
            const index = tasks.findIndex(t => t.id === newTask.id);
            if(index !== -1) tasks[index] = data[0];
        }
    } else {
        // ذخیره در LocalStorage
        saveLocal();
    }
}

// ذخیره در حافظه مرورگر
function saveLocal() {
    localStorage.setItem('my_tasks_local', JSON.stringify(tasks));
}

// رندر کردن لیست
function renderTasks() {
    taskList.innerHTML = '';
    completedList.innerHTML = '';
    let hasCompleted = false;

    tasks.forEach(task => {
        const li = document.createElement('li');
        if (task.is_completed) {
            li.classList.add('completed');
            hasCompleted = true;
        }

        li.innerHTML = `
            <div class="check-circle" onclick="toggleTask('${task.id}', ${task.is_completed})">
                ${task.is_completed ? ICONS.check : ''}
            </div>
            <span>${task.title}</span>
            <button class="delete-btn" onclick="deleteTask('${task.id}')">
                ${ICONS.trash}
            </button>
        `;

        if (task.is_completed) {
            completedList.appendChild(li);
        } else {
            taskList.appendChild(li);
        }
    });

    completedSection.style.display = hasCompleted ? 'block' : 'none';
}

// تغییر وضعیت (تیک زدن)
window.toggleTask = async (id, currentStatus) => {
    const index = tasks.findIndex(t => t.id == id); // == برای هندل کردن عدد/رشته
    if (index === -1) return;

    tasks[index].is_completed = !currentStatus;
    renderTasks();

    if (currentUser) {
        await supabase.from('todos').update({ is_completed: tasks[index].is_completed }).eq('id', id);
    } else {
        saveLocal();
    }
};

// حذف تسک
window.deleteTask = async (id) => {
    if(!confirm('آیا از حذف این مورد اطمینان دارید؟')) return;
    
    tasks = tasks.filter(t => t.id != id);
    renderTasks();

    if (currentUser) {
        await supabase.from('todos').delete().eq('id', id);
    } else {
        saveLocal();
    }
};


// --- 2. مدیریت کاربر و احراز هویت ---

submitAuthBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();
    const fname = fnameInput.value.trim();
    const lname = lnameInput.value.trim();

    if (!email.includes('@')) {
        authMsg.style.color = 'var(--danger)';
        authMsg.textContent = 'ایمیل نامعتبر است';
        return;
    }
    if (pass.length < 6) {
        authMsg.style.color = 'var(--danger)';
        authMsg.textContent = 'رمز عبور کوتاه است';
        return;
    }
    if (!isLoginMode && (!fname || !lname)) {
        authMsg.style.color = 'var(--danger)';
        authMsg.textContent = 'نام و نام خانوادگی الزامی است';
        return;
    }

    authMsg.style.color = 'var(--text)';
    authMsg.textContent = 'لطفا صبر کنید...';

    let result;
    if (isLoginMode) {
        result = await supabase.auth.signInWithPassword({ email, password: pass });
    } else {
        result = await supabase.auth.signUp({
            email, password: pass,
            options: { data: { first_name: fname, last_name: lname } }
        });
    }

    const { data, error } = result;

    if (error) {
        authMsg.style.color = 'var(--danger)';
        authMsg.textContent = translateError(error.message);
    } else {
        if (!isLoginMode && data.user && !data.session) {
            authMsg.style.color = '#34c759';
            authMsg.innerHTML = 'لینک تایید به ایمیل شما ارسال شد.';
        } else if (data.user) {
            closeModalFunc(authModal);
            setCurrentUser(data.user);
            showAlert('خوش آمدید!');
            // ادغام تسک های لوکال با آنلاین (اختیاری - فعلا خالی میکنیم لوکال رو)
            // localStorage.removeItem('my_tasks_local');
        }
    }
});

function setCurrentUser(user) {
    currentUser = user;
    const name = user.user_metadata.first_name || 'کاربر';
    userDisplayName.textContent = name;
    headerTitle.textContent = `سلام ${name}`;
    userBtn.classList.add('active'); // رنگی شدن آیکون
    fetchTasks(); // گرفتن تسک های سرور
}

// فراموشی رمز عبور
forgotPassLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = prompt("لطفا ایمیل خود را وارد کنید:");
    if (email && email.includes('@')) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href,
        });
        if (error) showAlert(translateError(error.message));
        else showAlert("ایمیل بازیابی رمز ارسال شد. لطفا ایمیل خود را چک کنید.");
    } else if (email) {
        showAlert("ایمیل نامعتبر است.");
    }
});

function translateError(msg) {
    if (msg.includes('Invalid login')) return 'ایمیل یا رمز اشتباه است';
    if (msg.includes('already registered')) return 'این ایمیل قبلا ثبت شده';
    return msg;
}

// خروج
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    tasks = [];
    userDropdown.classList.remove('show');
    userBtn.classList.remove('active');
    headerTitle.textContent = 'لیست کارها';
    userDisplayName.textContent = 'کاربر مهمان';
    loadLocalTasks(); // برگشت به حالت لوکال
    showAlert('خارج شدید');
});


// --- 3. مدیریت ظاهر و UI ---

// افزودن با اینتر
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if(e.key==='Enter') addTask() });

// تم رنگی
colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
        const color = dot.getAttribute('data-color');
        document.documentElement.style.setProperty('--primary', color);
        localStorage.setItem('primary_color', color);
        
        // آپدیت کلاس active
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
    });
});

// دارک مود
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme_mode', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? ICONS.sun : ICONS.moon;
});

function loadTheme() {
    // رنگ اصلی
    const savedColor = localStorage.getItem('primary_color');
    if (savedColor) {
        document.documentElement.style.setProperty('--primary', savedColor);
        // پیدا کردن دات مربوطه و اکتیو کردن
        colorDots.forEach(d => {
            if(d.getAttribute('data-color') === savedColor) d.classList.add('active');
        });
    } else {
        // پیش فرض آبی
        colorDots[0].classList.add('active');
    }

    // دارک مود
    if (localStorage.getItem('theme_mode') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = ICONS.sun;
    }
}

// منو و مودال
userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUser) userDropdown.classList.toggle('show');
    else openAuthModal();
});
switchAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    modalTitle.textContent = isLoginMode ? 'ورود به حساب' : 'ثبت نام کاربر جدید';
    submitAuthBtn.textContent = isLoginMode ? 'ورود' : 'ثبت نام';
    document.getElementById('switch-text').textContent = isLoginMode ? 'حساب ندارید؟' : 'حساب دارید؟';
    switchAuthLink.textContent = isLoginMode ? 'ثبت نام کنید' : 'وارد شوید';
    signupFields.style.display = isLoginMode ? 'none' : 'flex';
    forgotPassLink.style.display = isLoginMode ? 'block' : 'none';
    authMsg.textContent = '';
});

function openAuthModal() {
    authModal.classList.add('open');
    isLoginMode = true;
    signupFields.style.display = 'none';
    forgotPassLink.style.display = 'block';
    modalTitle.textContent = 'ورود به حساب';
    submitAuthBtn.textContent = 'ورود';
}
function closeModalFunc(m) { m.classList.remove('open'); }
closeModalBtn.addEventListener('click', () => closeModalFunc(authModal));
document.addEventListener('click', (e) => {
    if(!userDropdown.contains(e.target) && !userBtn.contains(e.target)) userDropdown.classList.remove('show');
});

// آلرت
function showAlert(msg) {
    alertMsg.textContent = msg;
    customAlert.classList.add('open');
}
alertOkBtn.addEventListener('click', () => closeModalFunc(customAlert));
