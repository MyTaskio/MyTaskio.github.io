// ---------------------------------------------------------
// CONFIGURATION - تنظیمات
// ---------------------------------------------------------
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';

// کلید طولانی که کار می‌کند را برای شما اینجا قرار دادم:
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State Variables
let tasks = [];
let currentUser = null; // null means guest/offline

// DOM Elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const authIcon = document.getElementById('authIcon');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeColors = document.querySelectorAll('.theme-color');

// Modal Elements
const authModal = document.getElementById('authModal');
const closeBtn = document.querySelector('.close-btn');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const authMessage = document.getElementById('authMessage');

// ---------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    
    // Check local session first
    const localUser = localStorage.getItem('todo_user');
    if (localUser) {
        currentUser = JSON.parse(localUser);
        updateAuthIconState();
    }

    // Load tasks based on state
    await loadTasks();
});

// ---------------------------------------------------------
// THEME HANDLING
// ---------------------------------------------------------
themeColors.forEach(colorDiv => {
    colorDiv.addEventListener('click', () => {
        const color = colorDiv.getAttribute('data-color');
        document.documentElement.style.setProperty('--primary-color', color);
        localStorage.setItem('todo_theme_color', color);
    });
});

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('todo_dark_mode', isDark);
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
});

function loadTheme() {
    const savedColor = localStorage.getItem('todo_theme_color');
    const savedDarkMode = localStorage.getItem('todo_dark_mode') === 'true';

    if (savedColor) {
        document.documentElement.style.setProperty('--primary-color', savedColor);
    }
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggleBtn.textContent = '☀️';
    }
}

// ---------------------------------------------------------
// AUTHENTICATION LOGIC (Supabase)
// ---------------------------------------------------------
authIcon.addEventListener('click', () => {
    if (currentUser) {
        // Already logged in? Logout confirmation could go here
        if(confirm('آیا می‌خواهید از حساب کاربری خارج شوید؟')) {
            logout();
        }
    } else {
        openModal();
    }
});

function openModal() {
    authModal.style.display = 'flex';
    authMessage.textContent = '';
    authUsernameInput.value = '';
    authPasswordInput.value = '';
}

closeBtn.addEventListener('click', () => {
    authModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.style.display = 'none';
    }
});

// Helper to make fake email from username (since Supabase requires email)
function getEmail(username) {
    return `${username}@myapp.local`;
}

// SIGN UP
signupBtn.addEventListener('click', async () => {
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value.trim();

    if (username.length < 4 || password.length < 4) {
        authMessage.style.color = 'red';
        authMessage.textContent = 'نام کاربری و رمز عبور باید حداقل ۴ حرف باشند.';
        return;
    }

    authMessage.textContent = 'در حال ثبت نام...';
    
    const { data, error } = await supabase.auth.signUp({
        email: getEmail(username),
        password: password,
        options: {
            data: { username: username } // Save username in metadata
        }
    });

    if (error) {
        authMessage.style.color = 'red';
        authMessage.textContent = error.message;
    } else {
        authMessage.style.color = 'green';
        authMessage.textContent = 'ثبت نام موفق! در حال ورود...';
        // Auto login success handling handled by session listener usually, 
        // but let's manual set for simplicity
        handleLoginSuccess(data.user, username);
    }
});

// LOGIN
loginBtn.addEventListener('click', async () => {
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value.trim();

    if (username.length < 4 || password.length < 4) {
        authMessage.style.color = 'red';
        authMessage.textContent = 'نام کاربری و رمز عبور باید حداقل ۴ حرف باشند.';
        return;
    }

    authMessage.textContent = 'در حال ورود...';

    const { data, error } = await supabase.auth.signInWithPassword({
        email: getEmail(username),
        password: password
    });

    if (error) {
        authMessage.style.color = 'red';
        authMessage.textContent = 'نام کاربری یا رمز عبور اشتباه است.';
    } else {
        handleLoginSuccess(data.user, username);
    }
});

function handleLoginSuccess(user, username) {
    currentUser = { id: user.id, username: username };
    localStorage.setItem('todo_user', JSON.stringify(currentUser));
    
    // Sync Local Tasks to Supabase? (Optional feature)
    // For now, we just switch context
    authModal.style.display = 'none';
    updateAuthIconState();
    loadTasks(); // Reload from server
    alert(`خوش آمدید ${username}!`);
}

function logout() {
    supabase.auth.signOut();
    currentUser = null;
    localStorage.removeItem('todo_user');
    updateAuthIconState();
    loadTasks(); // Switch back to local storage tasks
}

function updateAuthIconState() {
    if (currentUser) {
        authIcon.style.color = '#4CAF50'; // Green when logged in
        authIcon.title = `کاربر: ${currentUser.username}`;
    } else {
        authIcon.style.color = 'var(--text-color)';
        authIcon.title = 'ورود / ثبت نام';
    }
}

// ---------------------------------------------------------
// TASK MANAGEMENT
// ---------------------------------------------------------

// Load Tasks (Decides source: LocalStorage vs Supabase)
async function loadTasks() {
    taskList.innerHTML = '<div style="text-align:center;">در حال بارگذاری...</div>';
    tasks = [];

    if (currentUser) {
        // Fetch from Supabase
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tasks:', error);
            alert('خطا در دریافت اطلاعات از سرور');
        } else {
            tasks = data || [];
        }
    } else {
        // Fetch from LocalStorage
        const localTasks = localStorage.getItem('todo_local_tasks');
        if (localTasks) {
            tasks = JSON.parse(localTasks);
        }
    }
    renderTasks();
}

// Add Task
addTaskBtn.addEventListener('click', async () => {
    const text = taskInput.value.trim();
    if (!text) return;

    if (currentUser) {
        // Save to Supabase
        const newTask = {
            task: text,
            is_completed: false,
            user_id: currentUser.id
        };

        const { data, error } = await supabase
            .from('todos')
            .insert([newTask])
            .select();

        if (error) {
            console.error('Error adding task:', error);
            alert('خطا در ذخیره تسک');
        } else {
            if(data && data.length > 0) {
                tasks.unshift(data[0]);
            }
        }
    } else {
        // Save to LocalStorage
        const newTask = {
            id: Date.now(),
            task: text,
            is_completed: false
        };
        tasks.unshift(newTask);
        saveLocalTasks();
    }

    taskInput.value = '';
    renderTasks();
});

// Delete Task
async function deleteTask(id) {
    if (currentUser) {
        // Delete from Supabase
        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting task:', error);
            alert('خطا در حذف تسک');
            return;
        }
    }
    
    // Update UI array
    tasks = tasks.filter(t => t.id !== id);
    if (!currentUser) saveLocalTasks();
    renderTasks();
}

// Toggle Complete
async function toggleTask(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    const newStatus = !tasks[taskIndex].is_completed;

    if (currentUser) {
        // Update Supabase
        const { error } = await supabase
            .from('todos')
            .update({ is_completed: newStatus })
            .eq('id', id);

        if (error) {
            console.error('Error updating task:', error);
            // Revert changes in UI if server fails could be implemented here
            return;
        }
    }

    tasks[taskIndex].is_completed = newStatus;
    if (!currentUser) saveLocalTasks();
    renderTasks();
}

// Render UI
function renderTasks() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state">هیچ کاری ثبت نشده است!</div>';
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.is_completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <span onclick="toggleTask(${currentUser ? task.id : task.id})">${task.task}</span>
            <button class="delete-btn" onclick="deleteTask(${currentUser ? task.id : task.id})">🗑️</button>
        `;
        taskList.appendChild(li);
    });
}

// Save helper for LocalStorage
function saveLocalTasks() {
    localStorage.setItem('todo_local_tasks', JSON.stringify(tasks));
}
