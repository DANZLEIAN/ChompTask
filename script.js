document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const ongoingTasks = document.getElementById('ongoingTasks');
    const completedTasks = document.getElementById('completedTasks');
    const deleteAllCompletedBtn = document.getElementById('deleteAllCompleted');
    const biteAnim = document.getElementById('bite-animation');
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
            <div class="task-actions">
                <button class="complete-action-btn" title="Complete task"><i class="fas fa-check"></i></button>
                <button class="edit-btn" title="Edit task"><i class="fas fa-edit"></i></button>
                <button class="save-btn" title="Save changes" style="display: none;"><i class="fas fa-check-double"></i></button>
                <button class="delete-btn" title="Delete task"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        if (task.is_completed) {
            li.classList.add('completed');
            completedTasks.appendChild(li);
            li.querySelector('.edit-btn').style.display = 'none';
            // Change checkmark to an undo arrow when inside the Completed tab
            const completeBtn = li.querySelector('.complete-action-btn');
            completeBtn.title = "Move back to Ongoing";
            completeBtn.innerHTML = '<i class="fas fa-undo"></i>';
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
            
            const tasks = getStoredTasks();
            tasks.push(newTask);
            saveStoredTasks(tasks);

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
        const completeBtn = li.querySelector('.complete-action-btn');
        const taskText = li.querySelector('.task-text');
        const editBtn = li.querySelector('.edit-btn');
        const saveBtn = li.querySelector('.save-btn');
        const deleteBtn = li.querySelector('.delete-btn');
        
        // 1. Complete Task via dedicated check button
        completeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCurrentlyCompleted = li.classList.contains('completed');
            const targetCompletedState = !isCurrentlyCompleted;
            const now = new Date().toISOString();

            // Update in localStorage
            const tasks = getStoredTasks();
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.is_completed = targetCompletedState;
                task.updated_at = now;
                saveStoredTasks(tasks);
            }

            // Play Chomp bite sound and animation on completing
            playChompSound();
            playBiteAnimation(li, () => {
                if (targetCompletedState) {
                    li.classList.add('completed');
                    editBtn.style.display = 'none';
                    saveBtn.style.display = 'none';
                    completeBtn.title = "Move back to Ongoing";
                    completeBtn.innerHTML = '<i class="fas fa-undo"></i>';
                    completedTasks.appendChild(li);
                } else {
                    li.classList.remove('completed');
                    editBtn.style.display = 'flex';
                    completeBtn.title = "Complete task";
                    completeBtn.innerHTML = '<i class="fas fa-check"></i>';
                    ongoingTasks.appendChild(li);
                }
                if (task) updateTaskDates(li, task);
            });
        });
        
        // 2. Edit task
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            taskText.contentEditable = true;
            taskText.focus();
            editBtn.style.display = 'none';
            saveBtn.style.display = 'flex';
        });
        
        // 3. Save edited task
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
        
        // 4. Delete task
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            let tasks = getStoredTasks();
            tasks = tasks.filter(t => t.id !== taskId);
            saveStoredTasks(tasks);

            playChompSound();
            playBiteAnimation(li, () => {
                li.remove();
            });
        });
    }

    // Play chomp sound function
    function playChompSound() {
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
                    playBiteAnimation(item, () => item.remove());
                }, index * 150);
            });
        }
    });

    // Bite animation helper with callback
    function playBiteAnimation(taskElement, callback) {
        const rect = taskElement.getBoundingClientRect();
        biteAnim.style.left = `${rect.left + rect.width / 2}px`;
        biteAnim.style.top = `${rect.top + rect.height / 2}px`;
        
        biteAnim.classList.add('bite-active');
        
        setTimeout(() => {
            biteAnim.classList.remove('bite-active');
            if (callback) callback();
        }, 500);
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

    // Bubble styles
    const style = document.createElement('style');
    style.textContent = `
        .bubble {
            position: absolute;
            bottom: -100px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            animation: bubble ${Math.random() * 10 + 10}s linear infinite;
        }
        
        @keyframes bubble {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: translateY(-100vh) scale(1.2); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Initial load
    loadTasks();
});
