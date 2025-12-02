// === SUPABASE & GLOBAL VARS ===
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let tasks = [];
let currentUser = null;
let authMode = 'login';
let activePopover = null;
let composerState = {
    id: null,
    priority: 0,
    due_date: null,
    tags: []
};

// === DOM ELEMENTS ===
const els = {
    // ... (your existing els for header, modals, etc.)
    headerTitle: document.getElementById('header-title'),
    menuBtn: document.getElementById('menu-btn'),
    dropdown: document.getElementById('settings-dropdown'),
    todoList: document.getElementById('todo-list'),
    authModal: document.getElementById('auth-modal'),
    closeModal: document.querySelector('.close-modal'), // This might need to be more specific
    // ... all your auth modal elements
    
    // New Composer Elements
    taskComposer: document.getElementById('task-composer'),
    composerTaskId: document.getElementById('composer-task-id'),
    composerCheck: document.getElementById('composer-check'),
    composerTitle: document.getElementById('composer-title'),
    composerDescription: document.getElementById('composer-description'),
    composerSaveBtn: document.getElementById('composer-save-btn'),
    composerDateDisplay: document.getElementById('composer-date-display'),
    composerTagsDisplay: document.getElementById('composer-tags-display'),

    // Action Buttons & Popovers
    priorityBtn: document.getElementById('composer-priority-btn'),
    dateBtn: document.getElementById('composer-date-btn'),
    tagsBtn: document.getElementById('composer-tags-btn'),
    
    priorityPopover: document.getElementById('priority-popover'),
    calendarPopover: document.getElementById('calendar-popover'),
    tagsPopover: document.getElementById('tags-popover'),

    newTagInput: document.getElementById('new-tag-input'),
    addNewTagBtn: document.getElementById('add-new-tag-btn'),
    tagsListContainer: document.getElementById('tags-popover').querySelector('#tags-list'),
};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', async () => {
    loadLocalSettings();
    initComposer();
    initPopovers();

    // ... (your existing DOMContentLoaded logic for auth)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        setCurrentUser(session.user);
    } else {
        els.headerTitle.textContent = 'وظایف من';
        const localData = localStorage.getItem('todo_local_tasks');
        if (localData) tasks = JSON.parse(localData);
        renderTasks();
    }
    
    // Global click listener to close popovers/composer
    document.addEventListener('click', handleGlobalClick);
});


// === COMPOSER LOGIC ===
function initComposer() {
    els.taskComposer.addEventListener('click', (e) => e.stopPropagation());
    els.composerTitle.addEventListener('focus', activateComposer);
    els.composerSaveBtn.addEventListener('click', saveTaskFromComposer);
    
    // Auto-expand textarea
    els.composerDescription.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

function activateComposer() {
    if (!els.taskComposer.classList.contains('active')) {
        els.taskComposer.classList.add('active');
        updateComposerUI();
    }
}

function deactivateComposer() {
    if (els.composerTitle.value.trim() === '' && els.composerDescription.value.trim() === '') {
        resetAndCollapseComposer();
    }
}

function resetAndCollapseComposer() {
    els.taskComposer.classList.remove('active');
    els.composerTitle.value = '';
    els.composerDescription.value = '';
    els.composerDescription.style.height = 'auto';
    
    composerState = { id: null, priority: 0, due_date: null, tags: [] };
    updateComposerUI();
    closeActivePopover();
}

function openComposerForEdit(task) {
    activateComposer();
    composerState = {
        id: task.id,
        priority: task.priority || 0,
        due_date: task.due_date,
        tags: [...(task.tags || [])]
    };
    els.composerTitle.value = task.task;
    els.composerDescription.value = task.description || '';
    
    // Trigger height adjustment for description
    const event = new Event('input', { bubbles: true });
    els.composerDescription.dispatchEvent(event);
    
    updateComposerUI();
    els.taskComposer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateComposerUI() {
    // Update priority button
    els.priorityBtn.classList.remove('p-1', 'p-2', 'p-3');
    if (composerState.priority > 0) {
        els.priorityBtn.classList.add(`p-${composerState.priority}`);
    }

    // Update date display
    if (composerState.due_date) {
        els.composerDateDisplay.textContent = `تاریخ: ${formatDueDate(composerState.due_date)}`;
        els.dateBtn.classList.add('active');
    } else {
        els.composerDateDisplay.textContent = '';
        els.dateBtn.classList.remove('active');
    }

    // Update tags display
    els.composerTagsDisplay.innerHTML = composerState.tags.map(t => `<span>#${t}</span>`).join(' ');
    els.tagsBtn.classList.toggle('active', composerState.tags.length > 0);

    // Update save button text
    els.composerSaveBtn.querySelector('span').textContent = composerState.id ? 'ذخیره' : 'افزودن';
}


// === POPOVER LOGIC ===
function initPopovers() {
    // Priority Popover
    els.priorityBtn.addEventListener('click', (e) => togglePopover(els.priorityPopover, els.priorityBtn, e));
    els.priorityPopover.addEventListener('click', (e) => {
        const item = e.target.closest('.popover-item');
        if (item) {
            composerState.priority = parseInt(item.dataset.priority, 10);
            updateComposerUI();
            closeActivePopover();
        }
    });

    // Calendar Popover
    kamaDatepicker('datepicker-container', {
        buttonsColor: "var(--primary-color)",
        forceFarsiDigits: true,
        gotoToday: true,
        onSelect: (data) => {
            // Convert Jalali to Gregorian for storage
            const gDate = new Date(data.gregorian);
            composerState.due_date = gDate.toISOString().split('T')[0]; // YYYY-MM-DD
            updateComposerUI();
            closeActivePopover();
        }
    });
    els.dateBtn.addEventListener('click', (e) => togglePopover(els.calendarPopover, els.dateBtn, e));

    // Tags Popover
    els.tagsBtn.addEventListener('click', (e) => {
        renderTagsPopover();
        togglePopover(els.tagsPopover, els.tagsBtn, e);
    });
    
    // Add new tag
    els.addNewTagBtn.addEventListener('click', () => {
        const newTag = els.newTagInput.value.trim();
        if (newTag && !composerState.tags.includes(newTag)) {
            composerState.tags.push(newTag);
            renderTagsPopover();
            updateComposerUI();
        }
        els.newTagInput.value = '';
        els.newTagInput.focus();
    });
    els.newTagInput.addEventListener('keypress', (e) => e.key === 'Enter' && els.addNewTagBtn.click());
}

function togglePopover(popover, button, event) {
    event.stopPropagation();
    if (activePopover === popover) {
        closeActivePopover();
    } else {
        closeActivePopover();
        popover.classList.add('show');
        activePopover = popover;
        positionPopover(popover, button);
    }
}

function positionPopover(popover, button) {
    const btnRect = button.getBoundingClientRect();
    const containerRect = els.taskComposer.offsetParent.getBoundingClientRect(); // .container
    popover.style.top = `${btnRect.bottom - containerRect.top + 5}px`;
    popover.style.left = `${btnRect.left - containerRect.left}px`;
}

function closeActivePopover() {
    if (activePopover) {
        activePopover.classList.remove('show');
        activePopover = null;
    }
}

function handleGlobalClick(e) {
    if (activePopover && !activePopover.contains(e.target)) {
        closeActivePopover();
    }
    if (els.taskComposer.classList.contains('active') && !els.taskComposer.contains(e.target)) {
        deactivateComposer();
    }
}

function renderTagsPopover() {
    // Get all unique tags from all tasks
    const allTags = [...new Set(tasks.flatMap(t => t.tags || []))];
    
    els.tagsListContainer.innerHTML = allTags.map(tag => `
        <div class="popover-item" data-tag="${tag}">
            <span>${tag}</span>
            <span class="tag-check">${composerState.tags.includes(tag) ? '✓' : ''}</span>
        </div>
    `).join('');

    // Add click listener for toggling tags
    els.tagsListContainer.querySelectorAll('.popover-item').forEach(item => {
        item.addEventListener('click', () => {
            const tag = item.dataset.tag;
            if (composerState.tags.includes(tag)) {
                composerState.tags = composerState.tags.filter(t => t !== tag);
            } else {
                composerState.tags.push(tag);
            }
            renderTagsPopover(); // Re-render to update checkmarks
            updateComposerUI();
        });
    });
}

// === TASK DATA LOGIC ===
async function saveTaskFromComposer() {
    const title = els.composerTitle.value.trim();
    if (!title) return;

    const taskData = {
        task: title,
        description: els.composerDescription.value.trim(),
        priority: composerState.priority,
        due_date: composerState.due_date,
        tags: composerState.tags,
        user_id: currentUser ? currentUser.id : undefined,
    };

    if (composerState.id) { // UPDATE
        const index = tasks.findIndex(t => t.id == composerState.id);
        if (index > -1) {
            tasks[index] = { ...tasks[index], ...taskData };
            if (currentUser) {
                await supabase.from('todos').update(taskData).eq('id', composerState.id);
            }
        }
    } else { // CREATE
        const tempId = Date.now();
        const newTask = { ...taskData, id: tempId, is_completed: false, created_at: new Date().toISOString() };
        tasks.unshift(newTask);
        if (currentUser) {
            const { data } = await supabase.from('todos').insert([taskData]).select();
            if (data && data[0]) {
                const idx = tasks.findIndex(t => t.id === tempId);
                if (idx > -1) tasks[idx] = data[0];
            }
        }
    }
    
    if (!currentUser) saveLocal();
    renderTasks();
    resetAndCollapseComposer();
}

function renderTasks() {
    els.todoList.innerHTML = '';
    // Sorting logic can be added here as before
    const sortedTasks = tasks; // Add sorting later if needed
    
    if (sortedTasks.length === 0) {
        els.todoList.innerHTML = '<div style="text-align:center; opacity:0.5; font-size:0.9rem; margin-top:30px;">هیچ کاری برای انجام نیست!</div>';
        return;
    }
    // Separate active and completed tasks
    const activeTasks = sortedTasks.filter(t => !t.is_completed);
    const completedTasks = sortedTasks.filter(t => t.is_completed);

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
    li.dataset.taskId = task.id;

    const descriptionHTML = task.description ? `<p class="task-description">${task.description}</p>` : '';
    
    const priorityHTML = task.priority > 0 ? `
        <div class="meta-item">
            <div class="priority-dot p-${task.priority}"></div>
        </div>
    ` : '';
    
    const dueDateHTML = task.due_date ? `
        <div class="meta-item ${new Date(task.due_date) < new Date() && !task.is_completed ? 'overdue' : ''}">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"></path></svg>
            <span>${formatDueDate(task.due_date)}</span>
        </div>
    ` : '';

    const tagsHTML = task.tags && task.tags.length > 0 ? `
        <div class="meta-item">
            <span>${task.tags.map(t => `#${t}`).join(' ')}</span>
        </div>` : '';

    li.innerHTML = `
        <div class="task-left">
            <div class="check-circle ${task.is_completed ? 'checked' : ''}"></div>
        </div>
        <div class="task-content">
            <p class="task-text">${task.task}</p>
            ${descriptionHTML}
            <div class="task-meta">
                ${priorityHTML}
                ${dueDateHTML}
                ${tagsHTML}
            </div>
        </div>
        <button class="delete-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
    `;

    // Event listeners for the task item
    li.querySelector('.check-circle').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTask(task.id);
    });
    li.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });
    li.querySelector('.task-content').addEventListener('click', () => {
        openComposerForEdit(task);
    });

    return li;
}

// === UTILITY & HELPER FUNCTIONS ===
async function toggleTask(id) { /* ... unchanged ... */ }
async function deleteTask(id) { /* ... unchanged ... */ }
function formatDueDate(dateString) { /* ... unchanged ... */ }
function saveLocal() { /* ... unchanged ... */ }
// ... paste all your other unchanged functions here (setCurrentUser, fetchTasks, auth functions, etc.)

// === PASTE UNCHANGED FUNCTIONS HERE ===
async function toggleTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;
    tasks[index].is_completed = !tasks[index].is_completed;
    if (currentUser) {
        await supabase.from('todos').update({ is_completed: tasks[index].is_completed }).eq('id', id);
    } else {
        saveLocal();
    }
    renderTasks();
}

async function deleteTask(id) {
    if (!await showConfirm('آیا مطمئن هستید که می‌خواهید این مورد را حذف کنید؟', 'حذف تسک', true)) return;
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    if (currentUser) {
        await supabase.from('todos').delete().eq('id', id);
    } else {
        saveLocal();
    }
}

function formatDueDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'امروز';
    if (date.getTime() === tomorrow.getTime()) return 'فردا';

    return new Intl.DateTimeFormat('fa-IR', { month: 'long', day: 'numeric' }).format(date);
}

function saveLocal() { localStorage.setItem('todo_local_tasks', JSON.stringify(tasks)); }

// Add other functions like setCurrentUser, fetchTasks, all auth modals, menu rendering etc.
// They are mostly unchanged but need to be present in the final file.
// For brevity I'm omitting re-pasting them but you should include them.
