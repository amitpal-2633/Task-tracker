const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/user'); // Import your User model
const Task = require('./models/task'); // Import your Task model

const app = express();
const port = 6000;

const JWT_SECRET = 'your_jwt_secret'; // Replace with a strong secret

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taskdb')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware to authenticate JWT

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Authentication Routes
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    // console.log('Login attempt:', { email, password });

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // console.log('User not found');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password); // Updated to use async
        if (!isMatch) {
            // console.log('Password does not match');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        // console.log('Login successful, token issued');
        res.json({ token });
    } catch (err) {
        // console.error('Error logging in:', err);
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
});



// Search for tasks by title or description
app.get('/api/tasks/search', authenticateToken, async (req, res) => {
    const { query } = req.query; // Retrieve the search query from the URL parameters
    try {
        const tasks = await Task.find({
            $or: [
                { task: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Error searching tasks', error: err.message });
    }
});


app.post('/api/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' }); // In JWT, logout usually involves client-side token deletion
});

// Routes for Tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user._id }); // Fetch only tasks belonging to the user
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tasks', error: err.message });
    }
});


app.post('/api/tasks/add', authenticateToken, async (req, res) => {
    const { task, description, status } = req.body;
    try {
        const newTask = new Task({
            task,
            description,
            status,
            user: req.user._id // Associate the task with the logged-in user
        });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(500).json({ message: 'Error adding task', error: err.message });
    }
});


app.put('/api/tasks/update/:id', authenticateToken, async (req, res) => {
    const { task, description, status } = req.body;
    const taskId = req.params.id;

    try {
        const updatedTask = await Task.findOneAndUpdate(
            { _id: taskId, user: req.user._id }, // Ensure task belongs to the user
            { task, description, status },
            { new: true }
        );
        if (!updatedTask) return res.status(404).json({ message: 'Task not found or not owned by user' });
        res.json(updatedTask);
    } catch (err) {
        res.status(500).json({ message: 'Error updating task', error: err.message });
    }
});


app.delete('/api/tasks/delete/:id', authenticateToken, async (req, res) => {
    try {
        const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!deletedTask) return res.status(404).json({ message: 'Task not found or not owned by user' });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting task', error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
