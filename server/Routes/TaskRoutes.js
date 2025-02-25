const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const app = require('../server');

// Add Task
app.post('/projects/:projectId/tasks', taskController.addTask);

// Get Tasks
app.get('/projects/:projectId/tasks', taskController.getTasks);

// Move Task
app.put('/projects/:projectId/tasks/:taskId/move', taskController.moveTask);

// Delete Task
app.delete('/projects/:projectId/tasks/:taskId', taskController.deleteTask);

// Update Task (Rename)
app.put('/projects/:projectId/tasks/:taskId', taskController.updateTask);

module.exports = router;
