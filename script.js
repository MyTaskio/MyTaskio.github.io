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
    palette: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.744 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>'
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
const paletteToggle = document.getElementById('palette-toggle');
const colorPalette = document.getElementById('color-palette');
const userDropdown = document.getElementById('user-dropdown');
const logoutBtn = document.getElementById('logout-btn');
const userDisplayName = document.getElementById('user-display-name');
const headerTitle = document.getElementById('header-title');
const colorDots = document.querySelectorAll('.color-dot');
const editProfileBtn = document.getElementById('edit-profile-btn');

// --- شروع برنامه ---
document.addEventListener('DOMContentLoaded', async () => {
    themeToggle.innerHTML = ICONS.moon;
    userBtn.innerHTML = ICONS.user;
    paletteToggle.innerHTML = ICONS.palette;

    loadTheme();

    // چک کردن سشن فعال
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        setCurrentUser(session.user);
    } else {
        loadLocalTasks();
    }
});

// --- 1. مدیریت تسک‌ها (Database Column Fixed: 'task') ---

// بارگذاری از لوکال
function loadLocalTasks() {
    const saved = localStorage.getItem('my_tasks_local');
    tasks = saved ? JSON.parse(saved) : [];
    renderTasks();
}

// بارگذاری از Supabase
async function fetchTasks() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error && data) {
        tasks = data;
        renderTasks();
    }
}

// افزودن تسک
async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const tempTask = { 
        id: Date.now(), 
        task: text,  // تغییر مهم: استفاده از task بجای title
        is_completed: false 
    };

    tasks.unshift(tempTask);
    renderTasks();
    taskInput.value = '';

    if (currentUser) {
        const { data, error } = await supabase
            .from('todos')
            .insert([{ task: text, user_id: currentUser.id, is_completed: false }])
            .select();

        if (error) {
            showAlert('خطا در ذخیره آنلاین: ' + error.message);
        } else if (data) {
            // آپدیت ID واقعی
            const index = tasks.findIndex(t => t.id === tempTask.id);
            if(index !== -1) tasks[index] = data[0];
        }
    } else {
        saveLocal();
    }
}

function saveLocal() {
    localStorage.setItem('my_tasks_local', JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = '';
    completedList.innerHTML = '';
    let hasCompleted = false;

    tasks.forEach(item => {
        const li = document.createElement('li');
        if (item.is_completed) {
            li.classList.add('completed');
            hasCompleted = true;
        }
        
        // استفاده از item.task یا item.title (برای سازگاری با دیتای قدیمی)
        const displayTitle = item.task || item.title || 'بدون عنوان';

        li.innerHTML = `
            <div class="check-circle" onclick="toggleTask('${item.id}', ${item.is_completed})">
                ${item.is_completed ? ICONS.check : ''}
            </div>
            <span>${displayTitle}</span>
            <button class="delete-btn" onclick="requestDelete('${item.id}')">
                ${ICONS.trash}
            </button>
        `;

        if (item.is_completed) completedList.appendChild(li);
        else taskList.appendChild(li);
    });

    completedSection.style.display = hasCompleted ? 'block' : 'none';
}

window.toggleTask = async (id, status) => {
    const index = tasks.findIndex(t => t.id == id);
    if (index === -1) return;

    tasks[index].is_completed = !status;
    renderTasks();

    if (currentUser) {
        await supabase.from('todos').update({ is_completed: tasks[index].is_completed }).eq('id', id);
    } else {
        saveLocal();
    }
};

// --- 2. مدیریت حذف (Custom Confirm Modal) ---
let taskToDeleteId = null;
const confirmModal = document.getElementById('confirm-modal');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');

window.requestDelete = (id) => {
    taskToDeleteId = id;
    confirmModal.classList.add('open');
};

confirmYesBtn.onclick = async () => {
    if (taskToDeleteId) {
        const id = taskToDeleteId;
        tasks = tasks.filter(t => t.id != id);
        renderTasks();
        confirmModal.classList.remove('open');

        if (currentUser) {
            await supabase.from('todos').delete().eq('id', id);
        } else {
            saveLocal();
        }
    }
};

confirmNoBtn.onclick = () => confirmModal.classList.remove('open');


// --- 3. مدیریت کاربر و Sync ---
const authModal = document.getElementById('auth-modal');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const authMsg = document.getElementById('auth-msg');
const switchAuthLink = document.getElementById('switch-auth-link');

submitAuthBtn.addEventListener('click', async () => {
    const email = document.getElementById('email-input').value.trim();
    const pass = document.getElementById('password-input').value.trim();
    const fname = document.getElementById('fname-input').value.trim();

    if (!email.includes('@') || pass.length < 6) {
        authMsg.textContent = 'اطلاعات ورودی نامعتبر است (رمز حداقل ۶ رقم)';
        return;
    }

    authMsg.textContent = 'در حال پردازش...';
    authMsg.style.color = 'var(--text)';

    let result;
    if (isLoginMode) {
        result = await supabase.auth.signInWithPassword({ email, password: pass });
    } else {
        result = await supabase.auth.signUp({
            email, password: pass,
            options: { data: { first_name: fname } }
        });
    }

    const { data, error } = result;

    if (error) {
        authMsg.style.color = 'var(--danger)';
        authMsg.textContent = translateError(error.message);
    } else {
        if (!isLoginMode && !data.session) {
            authMsg.textContent = 'لینک تایید به ایمیل ارسال شد.';
        } else if (data.user) {
            authModal.classList.remove('open');
            setCurrentUser(data.user);
            await syncLocalTasksWithServer(data.user.id); // همگام سازی
            showAlert('خوش آمدید!');
        }
    }
});

// تابع مهم: همگام سازی تسک‌های آفلاین با سرور
async function syncLocalTasksWithServer(userId) {
    const localData = localStorage.getItem('my_tasks_local');
    if (localData) {
        const localTasks = JSON.parse(localData);
        if (localTasks.length > 0) {
            // آماده‌سازی برای دیتابیس (حذف ID موقت)
            const tasksToInsert = localTasks.map(t => ({
                task: t.task || t.title, // پشتیبانی از هر دو نام
                is_completed: t.is_completed,
                user_id: userId
            }));
            
            const { error } = await supabase.from('todos').insert(tasksToInsert);
            if (!error) {
                localStorage.removeItem('my_tasks_local'); // پاک کردن لوکال بعد از انتقال موفق
                await fetchTasks(); // دریافت لیست ترکیبی
            }
        }
    }
}

function setCurrentUser(user) {
    currentUser = user;
    const name = user.user_metadata.first_name || 'کاربر';
    userDisplayName.textContent = name;
    headerTitle.textContent = `سلام ${name}`;
    userBtn.classList.add('active');
    editProfileBtn.style.display = 'flex'; // نمایش دکمه ویرایش
    fetchTasks();
}

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    tasks = [];
    userDropdown.classList.remove('show');
    headerTitle.textContent = 'لیست کارها';
    userDisplayName.textContent = 'کاربر مهمان';
    editProfileBtn.style.display = 'none';
    userBtn.classList.remove('active');
    
    loadLocalTasks(); // برگشت به حالت مهمان
    showAlert('از حساب خارج شدید');
});

// --- 4. ویرایش پروفایل (Modal) ---
const profileModal = document.getElementById('profile-modal');
const saveProfileBtn = document.getElementById('save-profile-btn');
const profileMsg = document.getElementById('profile-msg');

editProfileBtn.addEventListener('click', () => {
    userDropdown.classList.remove('show');
    profileModal.classList.add('open');
    // پر کردن نام فعلی
    if(currentUser) document.getElementById('edit-fname').value = currentUser.user_metadata.first_name || '';
});

saveProfileBtn.addEventListener('click', async () => {
    const newName = document.getElementById('edit-fname').value.trim();
    const newPass = document.getElementById('edit-password').value.trim();
    const newEmail = document.getElementById('edit-email').value.trim();
    
    profileMsg.textContent = 'در حال بروزرسانی...';
    const updates = {};
    if(newName) updates.data = { first_name: newName };
    if(newPass) updates.password = newPass;
    if(newEmail && newEmail !== currentUser.email) updates.email = newEmail;

    const { data, error } = await supabase.auth.updateUser(updates);

    if(error) {
        profileMsg.textContent = translateError(error.message);
    } else {
        profileModal.classList.remove('open');
        showAlert('اطلاعات با موفقیت بروز شد');
        if(newName) headerTitle.textContent = `سلام ${newName}`;
        if(newEmail && newEmail !== currentUser.email) showAlert('ایمیل تایید به آدرس جدید ارسال شد. لطفا تایید کنید.');
    }
});

// --- 5. UI & Utilities ---
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if(e.key==='Enter') addTask() });

// پالت رنگ
paletteToggle.addEventListener('click', () => {
    colorPalette.classList.toggle('show');
});
colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
        const color = dot.getAttribute('data-color');
        document.documentElement.style.setProperty('--primary', color);
        localStorage.setItem('primary_color', color);
        colorPalette.classList.remove('show'); // بستن بعد از انتخاب
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
    const savedColor = localStorage.getItem('primary_color');
    if (savedColor) document.documentElement.style.setProperty('--primary', savedColor);
    
    if (localStorage.getItem('theme_mode') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = ICONS.sun;
    }
}

// بستن مودال‌ها
document.querySelectorAll('.close-modal-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
        authModal.classList.remove('open');
        profileModal.classList.remove('open');
    });
});

// منو
userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUser) userDropdown.classList.toggle('show');
    else {
        authModal.classList.add('open');
        isLoginMode = true;
        document.getElementById('signup-fields').style.display = 'none';
        switchAuthLink.textContent = 'ثبت نام کنید';
        document.getElementById('modal-title').textContent = 'ورود به حساب';
        submitAuthBtn.textContent = 'ورود';
    }
});

switchAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    document.getElementById('modal-title').textContent = isLoginMode ? 'ورود به حساب' : 'ثبت نام';
    submitAuthBtn.textContent = isLoginMode ? 'ورود' : 'ثبت نام';
    document.getElementById('signup-fields').style.display = isLoginMode ? 'none' : 'flex';
    switchAuthLink.textContent = isLoginMode ? 'ثبت نام کنید' : 'وارد شوید';
});

window.addEventListener('click', (e) => {
    if(!userDropdown.contains(e.target) && !userBtn.contains(e.target)) userDropdown.classList.remove('show');
});

function translateError(msg) {
    if (msg.includes('Invalid login')) return 'ایمیل یا رمز اشتباه است';
    if (msg.includes('already registered')) return 'این ایمیل قبلا ثبت شده';
    if (msg.includes('limit exceeded')) return 'تعداد درخواست زیاد. لطفا صبر کنید';
    return msg;
}

const customAlert = document.getElementById('custom-alert');
function showAlert(msg) {
    document.getElementById('alert-msg').textContent = msg;
    customAlert.classList.add('open');
}
document.getElementById('alert-ok-btn').onclick = () => customAlert.classList.remove('open');
