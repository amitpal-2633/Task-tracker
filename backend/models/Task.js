// models/task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    task: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Reference to User
});

module.exports = mongoose.model('Task', TaskSchema);
