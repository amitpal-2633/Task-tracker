const apiBaseUrl = 'http://localhost:5000/api';

// Get modal elements
const addTaskModal = document.getElementById('addTaskModal');
const editTaskModal = document.getElementById('editTaskModal');
const openAddTaskButton = document.getElementById('openAddTaskModal');
const closeAddTaskButton = document.getElementById('closeAddTaskModal');
const closeEditTaskButton = document.getElementById('closeEditTaskModal');
const showAllTasksButton = document.getElementById('showAllTasksButton');

// Open modals
openAddTaskButton.onclick = function() {
    addTaskModal.style.display = 'block';
};

closeAddTaskButton.onclick = function() {
    addTaskModal.style.display = 'none';
};

closeEditTaskButton.onclick = function() {
    editTaskModal.style.display = 'none';
};

// Close modals when clicking outside of them
window.onclick = function(event) {
    if (event.target == addTaskModal) {
        addTaskModal.style.display = 'none';
    }
    if (event.target == editTaskModal) {
        editTaskModal.style.display = 'none';
    }
};

// Handle logout
document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token'); // Remove token from localStorage
    window.location.href = 'login.html'; // Redirect to login page
});

// Function to load tasks
async function loadTasks() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${apiBaseUrl}/tasks`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const tasks = await response.json();
        displayTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// Display tasks function
function displayTasks(tasks) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <h3>${task.task}</h3>
            <p>${task.description}</p>
            <p>Status: ${task.status}</p>
            <div class="task-actions">
                <button onclick="openEditTaskModal('${task._id}', '${task.task}', '${task.description}', '${task.status}')">Update</button>
                <button onclick="deleteTask('${task._id}')">Delete</button>
            </div>
        `;
        taskList.appendChild(taskElement);
    });
}

// Function to open the edit task modal
function openEditTaskModal(id, task, description, status) {
    document.getElementById('editTaskId').value = id;
    document.getElementById('editTask').value = task;
    document.getElementById('editDescription').value = description;
    document.getElementById('editStatus').value = status;
    editTaskModal.style.display = 'block';
}

// Load tasks on page load
loadTasks();




// Handle search functionality
document.getElementById('searchButton').addEventListener('click', async () => {
    const query = document.getElementById('searchBar').value;
    if (!query) {
        alert('Please enter a search term.');
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${apiBaseUrl}/tasks/search?query=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const tasks = await response.json();
        displayTasks(tasks); // Update the task list with search results
    } catch (error) {
        console.error('Error searching tasks:', error);
    }
});


// Add a new task
document.getElementById('taskForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const task = document.getElementById('task').value;
    const description = document.getElementById('description').value;
    const status = document.getElementById('status').value;

    if (!task || !description || !status) {
        alert('Please fill out all fields.');
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${apiBaseUrl}/tasks/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ task, description, status })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Task added:', data);
        document.getElementById('taskForm').reset(); // Reset form fields
        addTaskModal.style.display = 'none'; // Close modal
        loadTasks(); // Reload tasks
    } catch (error) {
        console.error('Error adding task:', error);
    }
});

// Show all tasks
showAllTasksButton.addEventListener('click', loadTasks);

// Update a task
document.getElementById('editTaskForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('editTaskId').value;
    const task = document.getElementById('editTask').value;
    const description = document.getElementById('editDescription').value;
    const status = document.getElementById('editStatus').value;

    if (!task || !description || !status) {
        alert('Please fill out all fields.');
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${apiBaseUrl}/tasks/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ task, description, status })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Task updated:', data);
        editTaskModal.style.display = 'none'; // Close modal
        loadTasks(); // Reload tasks
    } catch (error) {
        console.error('Error updating task:', error);
    }
});

// Delete a task
async function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${apiBaseUrl}/tasks/delete/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Task deleted:', data);
            loadTasks(); // Reload tasks
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }
}
