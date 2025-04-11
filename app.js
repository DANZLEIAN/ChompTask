const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chomptask_db'
});

// Connect to database
db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chomptask.html'));
});

// API Routes

// Get all tasks
app.get('/api/tasks', (req, res) => {
    const query = 'SELECT * FROM tasks ORDER BY is_completed, updated_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Add new task
app.post('/api/tasks', (req, res) => {
    const { task_text } = req.body;
    if (!task_text) {
        return res.status(400).json({ error: 'Task text is required' });
    }
    
    const query = 'INSERT INTO tasks (task_text) VALUES (?)';
    db.query(query, [task_text], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Get the full task with timestamps
        const getQuery = 'SELECT * FROM tasks WHERE id = ?';
        db.query(getQuery, [results.insertId], (err, taskData) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json(taskData[0]);
        });
    });
});

// Update task (toggle completion or text)
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { task_text, is_completed } = req.body;
    
    let query, params;
    if (task_text !== undefined) {
        query = 'UPDATE tasks SET task_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params = [task_text, id];
    } else {
        query = 'UPDATE tasks SET is_completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params = [is_completed, id];
    }
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        // Return updated task
        const getQuery = 'SELECT * FROM tasks WHERE id = ?';
        db.query(getQuery, [id], (err, taskData) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(taskData[0]);
        });
    });
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM tasks WHERE id = ?';
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    });
});

// Delete all completed tasks
app.delete('/api/tasks', (req, res) => {
    const query = 'DELETE FROM tasks WHERE is_completed = TRUE';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: `Deleted ${results.affectedRows} completed tasks` });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});