// --- تنظیمات Supabase (اصلاح شده) ---
const supabaseUrl = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';

// تغییر مهم: اضافه کردن window.supabase برای جلوگیری از ارور
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- Elements ---
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const themeToggle = document.getElementById('theme-toggle');
const headerTitle = document.getElementById('header-title');

// Auth Elements
const authBtn = document.getElementById('auth-btn');
const userDropdown = document.getElementById('user-dropdown');
const authModal = document.getElementById('auth-modal');
const closeModal = document.getElementById('close-modal');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const fnameInput = document.getElementById('fname-input');
const lnameInput = document.getElementById('lname-input');
const signupFields = document.getElementById('signup-fields');
const switchAuthLink = document.getElementById('switch-auth-link');
const modalTitle = document.getElementById('modal-title');
const authMsg = document.getElementById('auth-msg');
const dropdownUsername = document.getElementById('dropdown-username');
const logoutBtn = document.getElementById('logout-btn');
const forgotPassLink = document.getElementById('forgot-pass-link');

// Profile Edit Elements
const editProfileBtn = document.getElementById('edit-profile-btn');
const profileModal = document.getElementById('profile-modal');
const closeProfileModal = document.getElementById('close-profile-modal');
const saveProfileBtn = document.getElementById('save-profile-btn');
const editFname = document.getElementById('edit-fname');
const editLname = document.getElementById('edit-lname');
const editEmail = document.getElementById('edit-email');
const editPassword = document.getElementById('edit-password');

// Theme Modal Elements
const colorPaletteBtn = document.getElementById('color-palette-btn');
const themeModal = document.getElementById('theme-modal');
const colorGrid = document.getElementById('color-grid');

// --- آیکون‌ها ---
const ICONS = {
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
};

let tasks = [];
let currentUser = null;
let isLoginMode = true;

// --- شروع برنامه ---
document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    
    // بررسی نشست کاربر
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        handleLoginSuccess(session.user);
    } else {
        loadLocalTasks();
    }
});

// --- Theme Logic ---
const themes = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#64748b'];

function loadTheme() {
    const isDark = localStorage.getItem('dark-mode') === 'true';
    const color = localStorage.getItem('theme-color') || '#3b82f6';
    
    if (isDark) document.body.classList.add('dark-mode');
    
    // اطمینان از وجود دکمه قبل از تغییر محتوا
    if (themeToggle) {
        themeToggle.innerHTML = isDark ? ICONS.sun : ICONS.moon;
    }
    
    document.documentElement.style.setProperty('--primary', color);
    renderColorGrid(color);
}

function renderColorGrid(selectedColor) {
    if (!colorGrid) return;
    colorGrid.innerHTML = '';
    themes.forEach(color => {
        const div = document.createElement('div');
        div.className = `color-option ${color === selectedColor ? 'selected' : ''}`;
        div.style.backgroundColor = color;
        div.onclick = () => {
            document.documentElement.style.setProperty('--primary', color);
            localStorage.setItem('theme-color', color);
            document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            closeModalFunc(themeModal);
        };
        colorGrid.appendChild(div);
    });
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('dark-mode', isDark);
    themeToggle.innerHTML = isDark ? ICONS.sun : ICONS.moon;
});

colorPaletteBtn.addEventListener('click', () => openModal(themeModal));

// --- Task Logic ---
function renderTasks() {
    taskList.innerHTML = '';
    tasks.sort((a, b) => a.completed - b.completed); // مرتب‌سازی
    
    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    if (activeTasks.length === 0 && completedTasks.length === 0) {
        taskList.innerHTML = '<div style="text-align:center; opacity:0.5; margin-top:20px;">لیست خالی است</div>';
        return;
    }

    activeTasks.forEach(task => createTaskElement(task));
    
    if (completedTasks.length > 0) {
        const separator = document.createElement('div');
        separator.className = 'list-separator';
        separator.innerHTML = '<span>انجام شده</span>';
        taskList.appendChild(separator);
        completedTasks.forEach(task => createTaskElement(task));
    }
}

function createTaskElement(task) {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');
    
    li.innerHTML = `
        <div class="check-circle">${task.completed ? ICONS.check : ''}</div>
        <span>${task.task}</span>
        <button class="delete-btn">${ICONS.trash}</button>
    `;
    
    // ایونت لیسنر برای تیک زدن
    li.querySelector('.check-circle').addEventListener('click', async () => {
        task.completed = !task.completed;
        renderTasks(); // آپدیت سریع UI
        
        if (currentUser) {
            await supabase.from('todos').update({ is_complete: task.completed }).eq('id', task.id);
        } else {
            saveLocalTasks();
        }
    });

    // ایونت لیسنر برای حذف
    li.querySelector('.delete-btn').addEventListener('click', async () => {
        const confirm = await showConfirm('آیا از حذف این تسک مطمئن هستید؟');
        if (confirm) {
            // حذف از آرایه محلی برای آپدیت سریع
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex > -1) tasks.splice(taskIndex, 1);
            renderTasks();

            if (currentUser) {
                await supabase.from('todos').delete().eq('id', task.id);
            } else {
                saveLocalTasks();
            }
        }
    });
    
    taskList.appendChild(li);
}

async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    
    // حالت بهینه: ابتدا به لیست اضافه کن (Optimistic UI)
    const tempId = Date.now();
    const tempTask = { id: tempId, task: text, completed: false };
    tasks.unshift(tempTask); 
    renderTasks();
    taskInput.value = '';

    if (currentUser) {
        const { data, error } = await supabase
            .from('todos')
            .insert([{ task: text, user_id: currentUser.id, is_complete: false }])
            .select();
        
        if (data && data.length > 0) {
            // جایگزینی ID موقت با ID واقعی
            const idx = tasks.findIndex(t => t.id === tempId);
            if (idx !== -1) {
                tasks[idx].id = data[0].id;
            }
        } else if (error) {
            console.error(error);
            showAlert('خطا در ذخیره تسک در سرور');
        }
    } else {
        saveLocalTasks();
    }
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

function saveLocalTasks() { localStorage.setItem('localTasks', JSON.stringify(tasks)); }

function loadLocalTasks() {
    const stored = localStorage.getItem('localTasks');
    if (stored) tasks = JSON.parse(stored);
    renderTasks();
}

// --- User/Auth Logic ---
async function handleLoginSuccess(user) {
    currentUser = user;
    closeModalFunc(authModal);
    
    const { data: meta } = await supabase.from('users_meta').select('*').eq('user_id', user.id).single();
    let displayName = 'کاربر';
    
    if (meta && meta.first_name) {
        headerTitle.textContent = `سلام ${meta.first_name} 👋`;
        displayName = meta.first_name + ' ' + meta.last_name;
    } else {
        headerTitle.textContent = 'لیست کارها';
    }
    
    dropdownUsername.textContent = displayName;
    authBtn.classList.add('active');
    
    await syncLocalTasksToCloud();
    fetchTasks();
}

async function syncLocalTasksToCloud() {
    const localTasks = JSON.parse(localStorage.getItem('localTasks') || '[]');
    if (localTasks.length > 0) {
        const formattedTasks = localTasks.map(t => ({ 
            task: t.task, 
            is_complete: t.completed, 
            user_id: currentUser.id 
        }));
        
        await supabase.from('todos').insert(formattedTasks);
        localStorage.removeItem('localTasks');
        showAlert('تسک‌های آفلاین شما ذخیره شدند.');
    }
}

async function fetchTasks() {
    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
        
    if (data) {
        tasks = data.map(t => ({ id: t.id, task: t.task, completed: t.is_complete }));
        renderTasks();
    }
}

// Auth Events
authBtn.addEventListener('click', (e) => { 
    e.stopPropagation(); 
    if (currentUser) {
        userDropdown.classList.toggle('show');
    } else {
        openModal(authModal);
    }
});

window.addEventListener('click', () => { 
    if (userDropdown.classList.contains('show')) userDropdown.classList.remove('show'); 
});

closeModal.addEventListener('click', () => closeModalFunc(authModal));

switchAuthLink.addEventListener('click', (e) => {
    e.preventDefault(); 
    isLoginMode = !isLoginMode;
    modalTitle.textContent = isLoginMode ? 'ورود به حساب' : 'ثبت نام';
    submitAuthBtn.textContent = isLoginMode ? 'ورود' : 'ثبت نام';
    document.getElementById('switch-text').textContent = isLoginMode ? 'حساب ندارید؟' : 'حساب دارید؟';
    switchAuthLink.textContent = isLoginMode ? 'ثبت نام کنید' : 'وارد شوید';
    authMsg.textContent = '';
    signupFields.style.display = isLoginMode ? 'none' : 'flex';
    forgotPassLink.style.display = isLoginMode ? 'block' : 'none';
});

submitAuthBtn.addEventListener('click', async () => {
    const email = usernameInput.value.trim();
    const pass = passwordInput.value.trim();
    const fname = fnameInput.value.trim();
    const lname = lnameInput.value.trim();
    
    if (!email || !pass) { authMsg.textContent = 'لطفا ایمیل و رمز را وارد کنید'; return; }
    
    authMsg.textContent = 'لطفا صبر کنید...';
    authMsg.style.color = 'var(--text)'; // رنگ عادی
    
    if (isLoginMode) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            authMsg.textContent = 'اطلاعات اشتباه است';
            authMsg.style.color = 'var(--danger)';
        } else {
            handleLoginSuccess(data.user);
        }
    } else {
        if (!fname || !lname) { authMsg.textContent = 'نام و نام خانوادگی الزامی است'; return; }
        
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password: pass, 
            options: { data: { first_name: fname, last_name: lname } } 
        });
        
        if (error) { 
            authMsg.textContent = error.message; 
        } else {
            if (data.user) {
                // ذخیره اطلاعات تکمیلی
                await supabase.from('users_meta').insert([{ user_id: data.user.id, first_name: fname, last_name: lname }]);
                handleLoginSuccess(data.user);
            } else {
                authMsg.textContent = 'لطفا ایمیل خود را تایید کنید.';
            }
        }
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut(); 
    currentUser = null;
    authBtn.classList.remove('active'); 
    headerTitle.textContent = 'لیست کارها';
    tasks = []; 
    loadLocalTasks();
});

// Profile & Reset Pass Logic
forgotPassLink.addEventListener('click', async (e) => {
    e.preventDefault(); 
    const email = usernameInput.value.trim();
    if (!email) { authMsg.textContent = 'برای بازیابی، ایمیل را وارد کنید'; return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
    error ? authMsg.textContent = error.message : showAlert('لینک بازیابی به ایمیل شما ارسال شد');
});

editProfileBtn.addEventListener('click', async () => {
    const { data: meta } = await supabase.from('users_meta').select('*').eq('user_id', currentUser.id).single();
    if (meta) { editFname.value = meta.first_name; editLname.value = meta.last_name; }
    editEmail.value = currentUser.email; 
    openModal(profileModal);
});

closeProfileModal.addEventListener('click', () => closeModalFunc(profileModal));

saveProfileBtn.addEventListener('click', async () => {
    const newFname = editFname.value.trim(), newLname = editLname.value.trim(), newEmail = editEmail.value.trim(), newPass = editPassword.value.trim();
    saveProfileBtn.textContent = 'در حال ذخیره...';
    try {
        if (newFname && newLname) {
            await supabase.from('users_meta').update({ first_name: newFname, last_name: newLname }).eq('user_id', currentUser.id);
            headerTitle.textContent = `سلام ${newFname} 👋`; 
            dropdownUsername.textContent = newFname + ' ' + newLname;
        }
        if (newEmail && newEmail !== currentUser.email) { 
            const { error } = await supabase.auth.updateUser({ email: newEmail }); 
            if (error) throw error; 
            showAlert('ایمیل تغییر کرد. لطفا تایید کنید.'); 
        }
        if (newPass) { 
            const { error } = await supabase.auth.updateUser({ password: newPass }); 
            if (error) throw error; 
        }
        closeModalFunc(profileModal); 
        showAlert('تغییرات ذخیره شد');
    } catch (e) { 
        showAlert('خطا: ' + e.message); 
    } finally { 
        saveProfileBtn.textContent = 'ذخیره تغییرات'; 
    }
});

// --- Modal Functions ---
function openModal(m) { 
    m.style.display = 'flex'; // ابتدا دیسپلی
    setTimeout(() => m.classList.add('open'), 10); // سپس انیمیشن
}

function closeModalFunc(m) { 
    m.classList.remove('open'); 
    setTimeout(() => m.style.display = 'none', 300); // حذف دیسپلی بعد از انیمیشن
}

function showAlert(msg, title = 'پیام') {
    return new Promise((resolve) => {
        document.getElementById('alert-title').textContent = title;
        document.getElementById('alert-text').textContent = msg;
        const okBtn = document.getElementById('alert-ok-btn');
        const cancelBtn = document.getElementById('alert-cancel-btn');
        
        okBtn.textContent = 'باشه';
        cancelBtn.style.display = 'none';
        
        openModal(document.getElementById('alert-modal'));
        
        // حذف لیسنرهای قبلی با کلون کردن
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        
        newOkBtn.onclick = () => { 
            closeModalFunc(document.getElementById('alert-modal')); 
            resolve(true); 
        };
    });
}

function showConfirm(msg) {
    return new Promise((resolve) => {
        document.getElementById('alert-title').textContent = 'تایید عملیات';
        document.getElementById('alert-text').textContent = msg;
        
        const okBtn = document.getElementById('alert-ok-btn');
        const cancelBtn = document.getElementById('alert-cancel-btn');
        
        okBtn.textContent = 'بله، حذف شود';
        cancelBtn.style.display = 'inline-block';
        
        openModal(document.getElementById('alert-modal'));
        
        // ریست کردن لیسنرها
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newOkBtn.onclick = () => { 
            closeModalFunc(document.getElementById('alert-modal')); 
            resolve(true); 
        };
        newCancelBtn.onclick = () => { 
            closeModalFunc(document.getElementById('alert-modal')); 
            resolve(false); 
        };
    });
}
