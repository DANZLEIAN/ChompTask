document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const ongoingTasks = document.getElementById('ongoingTasks');
    const completedTasks = document.getElementById('completedTasks');
    const deleteAllCompletedBtn = document.getElementById('deleteAllCompleted');
    const biteContainer = document.getElementById('bite-container');
    const biteImage = document.getElementById('bite-image');
    const chompSound = document.getElementById('chompSound');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Storage Key
    const STORAGE_KEY = 'chompTasks_data';

    // --- LocalStorage Helpers ---
    function getStoredTasks() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveStoredTasks(tasks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    // Create bubbles
    createBubbles();

    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Load tasks from localStorage
    function loadTasks() {
        ongoingTasks.innerHTML = '';
        completedTasks.innerHTML = '';
        
        const tasks = getStoredTasks();
        tasks.forEach(task => {
            createTaskElement(task);
        });
    }

    // Create task element
    function createTaskElement(task) {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        
        li.innerHTML = `
            <div class="task-content">
                <span class="task-text">${task.task_text}</span>
                <div class="task-dates">
                    <span class="task-date">Created: ${formatDate(task.created_at)}</span>
                    ${task.created_at !== task.updated_at ? 
                      `<span class="task-date">Updated: ${formatDate(task.updated_at)}</span>` : ''}
                </div>
            </div>
            <div class="action-buttons">
                <button class="toggle-complete-btn" title="${task.is_completed ? 'Undo' : 'Complete'}">
                    <i class="fas ${task.is_completed ? 'fa-undo' : 'fa-check'}"></i>
                </button>
                <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="save-btn" title="Save"><i class="fas fa-save"></i></button>
                <button class="delete-btn" title="Delete"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        if (task.is_completed) {
            li.classList.add('completed');
            completedTasks.appendChild(li);
            li.querySelector('.edit-btn').style.display = 'none';
            li.querySelector('.save-btn').style.display = 'none';
        } else {
            ongoingTasks.appendChild(li);
        }
        
        setupTaskEvents(li);
    }

    // Date formatting helper
    function formatDate(dateInput) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        
        if (isNaN(date.getTime())) {
            return 'Just now';
        }
        
        return date.toLocaleDateString(undefined, options);
    }

    // Add Task Function
    function addTask() {
        const taskText = taskInput.value.trim();
        
        if (taskText) {
            const now = new Date().toISOString();
            const newTask = {
                id: Date.now().toString(),
                task_text: taskText,
                is_completed: false,
                created_at: now,
                updated_at: now
            };
            
            // Save to localStorage
            const tasks = getStoredTasks();
            tasks.push(newTask);
            saveStoredTasks(tasks);

            // Render to DOM
            createTaskElement(newTask);
            taskInput.value = '';
        }
    }

    // Update task dates in DOM
    function updateTaskDates(element, taskData) {
        const datesDiv = element.querySelector('.task-dates');
        if (datesDiv) {
            datesDiv.innerHTML = `
                <span class="task-date">Created: ${formatDate(taskData.created_at)}</span>
                ${taskData.created_at !== taskData.updated_at ? 
                  `<span class="task-date">Updated: ${formatDate(taskData.updated_at)}</span>` : ''}
            `;
        }
    }

    // Set up event listeners for a task item
    function setupTaskEvents(li) {
        const taskId = li.dataset.id;
        const toggleBtn = li.querySelector('.toggle-complete-btn');
        const toggleIcon = toggleBtn.querySelector('i');
        const taskText = li.querySelector('.task-text');
        const editBtn = li.querySelector('.edit-btn');
        const saveBtn = li.querySelector('.save-btn');
        const deleteBtn = li.querySelector('.delete-btn');
        
        // Complete / Undo Button Click Handler
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Don't toggle state if task is currently being edited
            if (taskText.isContentEditable) return;

            const isCompleted = !li.classList.contains('completed');
            const now = new Date().toISOString();

            // Update in localStorage
            const tasks = getStoredTasks();
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.is_completed = isCompleted;
                task.updated_at = now;
                saveStoredTasks(tasks);

                // Update DOM state & Move lists
                li.classList.toggle('completed', isCompleted);
                
                if (isCompleted) {
                    completedTasks.appendChild(li);
                    editBtn.style.display = 'none';
                    saveBtn.style.display = 'none';
                    toggleIcon.className = 'fas fa-undo';
                    toggleBtn.title = 'Undo';
                } else {
                    ongoingTasks.appendChild(li);
                    editBtn.style.display = 'flex';
                    toggleIcon.className = 'fas fa-check';
                    toggleBtn.title = 'Complete';
                }
                
                updateTaskDates(li, task);
            }
        });
        
        // Edit task
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            taskText.contentEditable = true;
            taskText.focus();
            editBtn.style.display = 'none';
            saveBtn.style.display = 'flex';
        });
        
        // Save edited task
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const newText = taskText.textContent.trim();
            
            if (newText === '') {
                taskText.textContent = 'Untitled Task';
                return;
            }
            
            const now = new Date().toISOString();
            const tasks = getStoredTasks();
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.task_text = newText;
                task.updated_at = now;
                saveStoredTasks(tasks);

                taskText.contentEditable = false;
                saveBtn.style.display = 'none';
                editBtn.style.display = 'flex';
                updateTaskDates(li, task);
            }
        });
        
        // Delete task
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Remove from localStorage
            let tasks = getStoredTasks();
            tasks = tasks.filter(t => t.id !== taskId);
            saveStoredTasks(tasks);

            // Play animation and sound
            playBiteAnimation(li);
            playChompSound();
        });
    }

    // Play chomp sound function
    function playChompSound() {
        if (!chompSound) return;
        chompSound.currentTime = 0;
        chompSound.play().catch(e => console.log("Audio play failed:", e));
    }

    // Delete all completed tasks
    deleteAllCompletedBtn.addEventListener('click', function() {
        let tasks = getStoredTasks();
        const hasCompleted = tasks.some(t => t.is_completed);

        if (hasCompleted) {
            tasks = tasks.filter(t => !t.is_completed);
            saveStoredTasks(tasks);

            playChompSound();
            const items = completedTasks.querySelectorAll('li');
            items.forEach((item, index) => {
                setTimeout(() => {
                    playBiteAnimation(item);
                }, index * 150);
            });
        }
    });

    // Bite animation function
    function playBiteAnimation(taskElement) {
        if (!biteContainer || !biteImage) return;

        // Force WebP to replay
        const currentSrc = biteImage.src.split('?')[0];
        biteImage.src = `${currentSrc}?t=${Date.now()}`;

        // Center directly over the task being deleted
        const rect = taskElement.getBoundingClientRect();
        biteContainer.style.left = `${rect.left + rect.width / 2}px`;
        biteContainer.style.top = `${rect.top + rect.height / 2}px`;

        // Reset and trigger animation
        biteContainer.classList.remove('bite-active');
        void biteContainer.offsetWidth; // Force CSS repaint
        biteContainer.classList.add('bite-active');

        // Delete the task mid-chomp
        setTimeout(() => {
            if (taskElement && taskElement.parentNode) {
                taskElement.remove();
            }
        }, 300);

        // Hide teeth when animation ends
        setTimeout(() => {
            biteContainer.classList.remove('bite-active');
        }, 600);
    }

    // Create floating bubbles
    function createBubbles() {
        const bubblesContainer = document.querySelector('.bubbles');
        if (!bubblesContainer) return;

        for (let i = 0; i < 20; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.style.left = `${Math.random() * 100}%`;
            bubble.style.width = `${Math.random() * 20 + 10}px`;
            bubble.style.height = bubble.style.width;
            bubble.style.animationDelay = `${Math.random() * 5}s`;
            bubble.style.opacity = Math.random() * 0.5 + 0.1;
            bubblesContainer.appendChild(bubble);
        }
    }

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Bubbles keyframes & styling
    const style = document.createElement('style');
    style.textContent = `
        .bubble {
            position: absolute;
            bottom: -100px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            animation: bubble 12s linear infinite;
        }
    `;
    document.head.appendChild(style);

    // Initial load of tasks
    loadTasks();
});
