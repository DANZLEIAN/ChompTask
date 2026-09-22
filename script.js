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

    // Preload audio and image
    if (chompSound) chompSound.load();

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

    // Create task element (Horizontal button layout)
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
            <button class="complete-btn" title="${task.is_completed ? 'Restore task' : 'Complete task'}">
                <i class="fas ${task.is_completed ? 'fa-undo' : 'fa-check'}"></i>
            </button>
            <button class="edit-btn" title="Edit task"><i class="fas fa-edit"></i></button>
            <button class="save-btn" title="Save changes" style="display: none;"><i class="fas fa-check-double"></i></button>
            <button class="delete-btn" title="Delete task"><i class="fas fa-times"></i></button>
        `;
        
        const completeBtn = li.querySelector('.complete-btn');
        const editBtn = li.querySelector('.edit-btn');
        const saveBtn = li.querySelector('.save-btn');

        if (task.is_completed) {
            li.classList.add('completed');
            completeBtn.classList.add('undo-mode');
            editBtn.style.display = 'none';
            saveBtn.style.display = 'none';
            completedTasks.appendChild(li);
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
        const completeBtn = li.querySelector('.complete-btn');
        const taskText = li.querySelector('.task-text');
        const editBtn = li.querySelector('.edit-btn');
        const saveBtn = li.querySelector('.save-btn');
        const deleteBtn = li.querySelector('.delete-btn');
        
        // Complete / Restore button
        completeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCurrentlyCompleted = li.classList.contains('completed');
            const targetCompletedState = !isCurrentlyCompleted;
            const now = new Date().toISOString();

            const tasks = getStoredTasks();
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.is_completed = targetCompletedState;
                task.updated_at = now;
                saveStoredTasks(tasks);
            }

            // Play Chomp bite sound and animation
            playChompSound();
            playBiteAnimation(li, () => {
                if (targetCompletedState) {
                    li.classList.add('completed');
                    completeBtn.classList.add('undo-mode');
                    completeBtn.title = "Restore task";
                    completeBtn.innerHTML = '<i class="fas fa-undo"></i>';
                    editBtn.style.display = 'none';
                    saveBtn.style.display = 'none';
                    completedTasks.appendChild(li);
                } else {
                    li.classList.remove('completed');
                    completeBtn.classList.remove('undo-mode');
                    completeBtn.title = "Complete task";
                    completeBtn.innerHTML = '<i class="fas fa-check"></i>';
                    editBtn.style.display = 'inline-flex';
                    ongoingTasks.appendChild(li);
                }
                if (task) updateTaskDates(li, task);
            });
        });
        
        // Edit task
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            taskText.contentEditable = true;
            taskText.focus();
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-flex';
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
                editBtn.style.display = 'inline-flex';
                updateTaskDates(li, task);
            }
        });
        
        // Delete task
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
                    playBiteAnimation(item, () => item.remove());
                }, index * 150);
            });
        }
    });

    // Bite animation helper
    // Bite animation helper
    // Bite animation function (Dynamic Injection)
    function playBiteAnimation(taskElement, callback) {
        const rect = taskElement.getBoundingClientRect();
        
        // 1. Create a fresh bite element
        const bite = document.createElement('img');
        bite.src = 'photos/Bite2.webp';
        bite.alt = 'Chomp!';
        bite.className = 'dynamic-bite';
        
        // 2. Position exactly at the center of the clicked task card
        bite.style.position = 'fixed';
        bite.style.left = `${rect.left + rect.width / 2}px`;
        bite.style.top = `${rect.top + rect.height / 2}px`;
        bite.style.transform = 'translate(-50%, -50%) scale(0.2)';
        bite.style.width = '140px';
        bite.style.height = '140px';
        bite.style.pointerEvents = 'none';
        bite.style.zIndex = '999999';
        bite.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-in-out';
        bite.style.opacity = '1';

        // 3. Mount directly to body
        document.body.appendChild(bite);

        // 4. Trigger pop animation
        requestAnimationFrame(() => {
            bite.style.transform = 'translate(-50%, -50%) scale(1.2)';
        });

        // 5. Complete animation, trigger action, and clean up element
        setTimeout(() => {
            bite.style.opacity = '0';
            bite.style.transform = 'translate(-50%, -50%) scale(1.4)';
            
            setTimeout(() => {
                bite.remove();
            }, 200);

            if (callback) callback();
        }, 350);
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

    // Add bubble animations
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
