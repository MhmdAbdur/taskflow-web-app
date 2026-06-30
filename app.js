// State Management
let tasks = [];
let currentFilter = 'all'; // all | active | completed
let currentCategory = ''; // empty string means 'All Categories'

// DOM Elements
const taskListEl = document.getElementById('task-list');
const emptyStateEl = document.getElementById('empty-state');
const taskInputEl = document.getElementById('task-input');
const categorySelectEl = document.getElementById('category-select');
const prioritySelectEl = document.getElementById('priority-select');
const addTaskForm = document.getElementById('add-task-form');
const errorMessageEl = document.getElementById('error-message');
const filterBtns = document.querySelectorAll('.filter-btn');
const filterCategoryEl = document.getElementById('filter-category');
const addBtn = document.querySelector('.btn-add'); // ADDED: Button reference
const taskCountEl = document.getElementById('task-count'); // ADDED: Task count badge
const loadingSpinner = document.getElementById('loading-spinner'); // ADDED: Loading spinner

// API Endpoints
const API = {
    GET: 'get_tasks.php',
    ADD: 'add_task.php',
    UPDATE: 'update_task.php',
    DELETE: 'delete_task.php'
};

// ADDED: Toast Notification Function
function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Trigger reflow to ensure transition works
    void toast.offsetWidth;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300); // Wait for transition
    }, 2500);
}

// 1. fetchTasks()
async function fetchTasks() {
    // ADDED: Show loading state
    loadingSpinner.classList.remove('hidden');
    taskListEl.classList.add('hidden');
    emptyStateEl.classList.add('hidden');

    try {
        const response = await fetch(API.GET);
        const result = await response.json();
        
        if (result.success) {
            tasks = result.data;
            renderTasks();
        } else {
            console.error('Failed to fetch tasks:', result.error);
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
    } finally {
        // ADDED: Hide loading state
        loadingSpinner.classList.add('hidden');
    }
}

// 2. renderTasks()
function renderTasks() {
    // Filter tasks based on current state
    const filteredTasks = tasks.filter(task => {
        // Status filter
        const statusMatch = 
            currentFilter === 'all' || 
            (currentFilter === 'active' && parseInt(task.completed) === 0) || 
            (currentFilter === 'completed' && parseInt(task.completed) === 1);
            
        // Category filter
        const categoryMatch = currentCategory === '' || task.category === currentCategory;
        
        return statusMatch && categoryMatch;
    });

    // ADDED: Update Task Count
    const activeTasksCount = filteredTasks.filter(t => parseInt(t.completed) === 0).length;
    taskCountEl.textContent = `${activeTasksCount} task${activeTasksCount !== 1 ? 's' : ''} remaining`;

    // Clear the current list
    taskListEl.innerHTML = '';

    // Show or hide empty state
    if (filteredTasks.length === 0) {
        taskListEl.classList.add('hidden');
        emptyStateEl.classList.remove('hidden');
    } else {
        taskListEl.classList.remove('hidden');
        emptyStateEl.classList.add('hidden');

        // Render each matching task
        filteredTasks.forEach(task => {
            const isCompleted = parseInt(task.completed) === 1;
            
            // Create task item container
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${isCompleted ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;

            // Left side (checkbox + text)
            const leftDiv = document.createElement('div');
            leftDiv.className = 'task-left';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = isCompleted;
            // Toggle completed status on change
            checkbox.addEventListener('change', () => toggleComplete(task.id, parseInt(task.completed)));
            
            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = task.text;
            
            leftDiv.appendChild(checkbox);
            leftDiv.appendChild(textSpan);

            // Right side (badges + actions)
            const rightDiv = document.createElement('div');
            rightDiv.className = 'task-right';
            
            const categoryBadge = document.createElement('span');
            categoryBadge.className = 'badge category-badge';
            categoryBadge.textContent = task.category;
            
            const priorityBadge = document.createElement('span');
            // e.g., 'priority-high'
            priorityBadge.className = `badge priority-badge priority-${task.priority.toLowerCase()}`;
            priorityBadge.textContent = task.priority;
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-icon btn-edit';
            editBtn.textContent = 'Edit';
            // Pass the text span so we can swap it out with an input
            editBtn.addEventListener('click', () => editTask(task.id, textSpan, taskItem));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon btn-delete';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                // ADDED: Inline delete confirmation
                const confirmUi = document.createElement('div');
                confirmUi.className = 'delete-confirm-ui';
                confirmUi.innerHTML = `
                    <span>Are you sure?</span>
                    <button class="btn-confirm-yes">Yes</button>
                    <button class="btn-confirm-cancel">Cancel</button>
                `;
                
                // Replace delete button with confirm UI
                rightDiv.replaceChild(confirmUi, deleteBtn);
                
                confirmUi.querySelector('.btn-confirm-cancel').addEventListener('click', () => {
                    rightDiv.replaceChild(deleteBtn, confirmUi);
                });
                
                confirmUi.querySelector('.btn-confirm-yes').addEventListener('click', () => {
                    deleteTask(task.id);
                });
            });
            
            rightDiv.appendChild(categoryBadge);
            rightDiv.appendChild(priorityBadge);
            rightDiv.appendChild(editBtn);
            rightDiv.appendChild(deleteBtn);

            taskItem.appendChild(leftDiv);
            taskItem.appendChild(rightDiv);
            
            taskListEl.appendChild(taskItem);
        });
    }
}

// 3. addTask()
async function addTask(e) {
    if (e) e.preventDefault(); // Prevent form submission
    
    const text = taskInputEl.value.trim();
    const category = categorySelectEl.value;
    const priority = prioritySelectEl.value;
    
    // Validate
    if (!text) {
        errorMessageEl.classList.remove('hidden');
        return;
    }
    
    errorMessageEl.classList.add('hidden');
    
    // ADDED: Disable button while pending
    addBtn.disabled = true;
    addBtn.textContent = 'Adding...';
    
    try {
        const formData = new URLSearchParams();
        formData.append('text', text);
        formData.append('category', category);
        formData.append('priority', priority);
        
        const response = await fetch(API.ADD, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Clear form
            taskInputEl.value = '';
            showToast('Task added ✓'); // ADDED: Toast notification
            // Refresh tasks
            fetchTasks();
        } else {
            console.error('Failed to add task:', result.error);
        }
    } catch (error) {
        console.error('Error adding task:', error);
    } finally {
        // ADDED: Re-enable button
        addBtn.disabled = false;
        addBtn.textContent = 'Add Task';
    }
}

// 4. toggleComplete(id, currentStatus)
async function toggleComplete(id, currentStatus) {
    try {
        const newStatus = 1 - currentStatus; // Toggle 0 to 1, or 1 to 0
        
        const formData = new URLSearchParams();
        formData.append('id', id);
        formData.append('completed', newStatus);
        
        const response = await fetch(API.UPDATE, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(newStatus === 1 ? 'Marked complete ✓' : 'Marked active'); // ADDED: Toast notification
            fetchTasks(); // Refresh to ensure synchronization
        } else {
            console.error('Failed to update task status:', result.error);
        }
    } catch (error) {
        console.error('Error updating task status:', error);
    }
}

// 5. deleteTask(id)
async function deleteTask(id) {
    try {
        const formData = new URLSearchParams();
        formData.append('id', id);
        
        const response = await fetch(API.DELETE, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Task deleted'); // ADDED: Toast notification
            fetchTasks(); // Refresh tasks from backend
        } else {
            console.error('Failed to delete task:', result.error);
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// 6. editTask(id)
function editTask(id, textSpan, taskItem) {
    // Find the current text
    const currentText = textSpan.textContent;
    
    // Create an input element
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.value = currentText;
    inputEl.className = 'edit-task-input';
    
    // Basic inline styling for the edit state
    inputEl.style.width = '100%';
    inputEl.style.padding = '0.2rem 0.5rem';
    inputEl.style.fontSize = '0.95rem';
    inputEl.style.fontFamily = 'inherit';
    inputEl.style.border = '1px solid var(--primary-color)';
    inputEl.style.borderRadius = '4px';
    inputEl.style.outline = 'none';
    
    // Function to handle saving the edit
    const saveEdit = async () => {
        const newText = inputEl.value.trim();
        
        // If empty or unmodified, just revert it
        if (!newText || newText === currentText) {
            inputEl.replaceWith(textSpan);
            return;
        }
        
        try {
            const formData = new URLSearchParams();
            formData.append('id', id);
            formData.append('text', newText);
            
            const response = await fetch(API.UPDATE, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('Task updated ✓'); // ADDED: Toast notification
                fetchTasks(); // Reload the whole list to show updated text
            } else {
                console.error('Failed to update task text:', result.error);
                inputEl.replaceWith(textSpan); // Revert on failure
            }
        } catch (error) {
            console.error('Error updating task text:', error);
            inputEl.replaceWith(textSpan); // Revert on error
        }
    };
    
    // Replace text span with input
    textSpan.replaceWith(inputEl);
    inputEl.focus();
    
    // Event listeners for the edit input
    inputEl.addEventListener('blur', saveEdit);
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            inputEl.blur(); // Blur triggers the saveEdit function
        } else if (e.key === 'Escape') {
            inputEl.replaceWith(textSpan); // Cancel edit on escape
        }
    });
}

// Event Listeners setup
function setupEventListeners() {
    // Add Task Form submission
    addTaskForm.addEventListener('submit', addTask);

    // Status Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active style
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update filter state and re-render UI
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });

    // Category Filter Dropdown
    filterCategoryEl.addEventListener('change', (e) => {
        currentCategory = e.target.value;
        renderTasks();
    });
}

// Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchTasks();
});
