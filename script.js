// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_PUBLISHABLE_KEY_HERE'; // کلید طولانی که با sb_ شروع نمی‌شود را اینجا بگذارید (معمولا anon key)
// اگر کلید sb_publishable_... دارید آن را قرار دهید اما معمولا در کلاینت JS از کلید anon استفاده میشود.

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------
// STATE MANAGEMENT
// ---------------------------------------------------------
let todos = [];
let user = null; // If null, save to LocalStorage. If object, save to Supabase.
let currentThemeColor = '#3b82f6'; // Blue default

// ---------------------------------------------------------
// DOM ELEMENTS
// ---------------------------------------------------------
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const themeModeBtn = document.getElementById('theme-mode-btn');
const themeColorBtn = document.getElementById('theme-color-btn');
const authBtn = document.getElementById('auth-btn');
const authModal = document.getElementById('auth-modal');
const closeModal = document.querySelector('.close-modal');

// Auth Inputs
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-submit-btn');
const signupBtn = document.getElementById('signup-submit-btn');
const authMessage = document.getElementById('auth-message');
const userInfoDisplay = document.getElementById('user-info-display');
const usernameSpan = document.getElementById('username-span');
const logoutBtn = document.getElementById('logout-btn');

// ---------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    await checkUserSession();
    if (!user) {
        loadLocalTodos();
    } else {
        loadSupabaseTodos();
    }
});

// ---------------------------------------------------------
// CORE FUNCTIONS
// ---------------------------------------------------------

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        if (todo.is_completed) li.classList.add('completed');

        li.innerHTML = `
            <span onclick="toggleTodo(${index})">${todo.task}</span>
            <button class="delete-btn" onclick="deleteTodo(${index})">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        todoList.appendChild(li);
    });
}

async function addTodo() {
    const taskText = todoInput.value.trim();
    if (!taskText) return;

    const newTodo = { task: taskText, is_completed: false };

    if (user) {
        // Supabase
        const { data, error } = await supabase
            .from('todos')
            .insert([{ task: taskText, user_id: user.id }])
            .select();
        
        if(data) {
            todos.push(data[0]); // Use returned data which has ID
        }
    } else {
        // LocalStorage
        todos.push(newTodo);
        saveLocalTodos();
    }

    todoInput.value = '';
    renderTodos();
}

window.deleteTodo = async (index) => {
    const todoToDelete = todos[index];

    if (user) {
        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', todoToDelete.id);
        
        if (!error) {
            todos.splice(index, 1);
        }
    } else {
        todos.splice(index, 1);
        saveLocalTodos();
    }
    renderTodos();
};

window.toggleTodo = async (index) => {
    const todoToToggle = todos[index];
    const newStatus = !todoToToggle.is_completed;

    if (user) {
        const { error } = await supabase
            .from('todos')
            .update({ is_completed: newStatus })
            .eq('id', todoToToggle.id);
        
        if(!error) {
            todos[index].is_completed = newStatus;
        }
    } else {
        todos[index].is_completed = newStatus;
        saveLocalTodos();
    }
    renderTodos();
};

// ---------------------------------------------------------
// LOCAL STORAGE HELPERS
// ---------------------------------------------------------
function loadLocalTodos() {
    const stored = localStorage.getItem('local_todos');
    if (stored) {
        todos = JSON.parse(stored);
    }
    renderTodos();
}

function saveLocalTodos() {
    localStorage.setItem('local_todos', JSON.stringify(todos));
}

// ---------------------------------------------------------
// SUPABASE HELPERS
// ---------------------------------------------------------
async function loadSupabaseTodos() {
    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: true });

    if (!error) {
        todos = data;
        renderTodos();
    }
}

async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        user = session.user;
        showLoggedInUI(user.user_metadata.username || user.email);
    }
}

// ---------------------------------------------------------
// AUTHENTICATION UI LOGIC
// ---------------------------------------------------------
authBtn.addEventListener('click', () => {
    if(!user) {
        authModal.classList.remove('hidden');
        authMessage.innerText = '';
    }
});

closeModal.addEventListener('click', () => {
    authModal.classList.add('hidden');
});

// Helper for "Fake" Email generation since Supabase Auth needs Email
function createEmailFromUsername(username) {
    return `${username}@myapp.local`;
}

signupBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username.length < 4 || password.length < 4) {
        authMessage.innerText = 'نام کاربری و رمز عبور باید حداقل ۴ حرف باشند.';
        authMessage.style.color = 'red';
        return;
    }

    const email = createEmailFromUsername(username);

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { username: username }
        }
    });

    if (error) {
        authMessage.innerText = error.message;
        authMessage.style.color = 'red';
    } else {
        authMessage.innerText = 'ثبت نام موفق! وارد شوید.';
        authMessage.style.color = 'green';
    }
});

loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const email = createEmailFromUsername(username);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        authMessage.innerText = 'نام کاربری یا رمز عبور اشتباه است.';
        authMessage.style.color = 'red';
    } else {
        user = data.user;
        authModal.classList.add('hidden');
        // Sync strategy: Could merge local todos to cloud here if needed.
        // For now, we just switch to cloud view.
        todos = []; 
        loadSupabaseTodos();
        showLoggedInUI(username);
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    user = null;
    userInfoDisplay.classList.add('hidden');
    authBtn.style.display = 'block';
    // Switch back to local todos
    todos = [];
    loadLocalTodos();
});

function showLoggedInUI(name) {
    authBtn.style.display = 'none';
    userInfoDisplay.classList.remove('hidden');
    usernameSpan.innerText = `کاربر: ${name}`;
}

// ---------------------------------------------------------
// THEME & EVENTS
// ---------------------------------------------------------
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

// Dark/Light Mode
themeModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeModeBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem('theme_mode', isDark ? 'dark' : 'light');
});

// Color Theme
const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
let colorIndex = 0;

themeColorBtn.addEventListener('click', () => {
    colorIndex = (colorIndex + 1) % colors.length;
    const newColor = colors[colorIndex];
    document.documentElement.style.setProperty('--primary-color', newColor);
    localStorage.setItem('theme_color', newColor);
});

function loadTheme() {
    // Mode
    const savedMode = localStorage.getItem('theme_mode');
    if (savedMode === 'dark') {
        document.body.classList.add('dark-mode');
        themeModeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    // Color
    const savedColor = localStorage.getItem('theme_color');
    if (savedColor) {
        document.documentElement.style.setProperty('--primary-color', savedColor);
        // Find index to cycle correctly next time
        const idx = colors.indexOf(savedColor);
        if(idx !== -1) colorIndex = idx;
    }
}
