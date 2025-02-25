// controllers/taskController.js
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const AuditLog = require('../models/Auditlog');
const io = require('../server').io; // Adjust the path based on your actual setup

// Add Task
exports.addTask = async (req, res) => {
  const { projectId } = req.params;
  const { name, createdBy, createdDate } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const createdByUser = await User.findOne({ email: createdBy });
    if (!createdByUser) {
      return res.status(404).json({ message: "User not found for createdBy" });
    }

    const newTask = new Task({
      name,
      project: projectId,
      createdBy,
      createdDate,
    });

    await newTask.save();

    project.tasks.push(newTask._id);
    await project.save();

    const newAuditLog = new AuditLog({
      entityType: "Task",
      entityId: newTask._id,
      actionType: "create",
      actionDate: new Date(),
      performedBy: createdByUser.name,
      projectId,
      changes: [
        { field: "name", oldValue: null, newValue: name },
        { field: "project", oldValue: null, newValue: projectId },
        { field: "createdBy", oldValue: null, newValue: createdBy },
        { field: "createdDate", oldValue: null, newValue: createdDate },
      ],
    });

    await newAuditLog.save();

    const updatedProject = await Project.findById(projectId).populate("tasks");
    const updatedTasks = updatedProject.tasks.map((task) => ({
      id: task._id,
      name: task.name,
      cards: task.cards || [],
    }));

    io.emit("tasksUpdated", { projectId, tasks: updatedTasks });

    res.status(201).json({
      message: "Task created successfully",
      task: newTask,
      tasks: updatedTasks,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Error creating task" });
  }
};

// Get Tasks
exports.getTasks = async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId).populate("tasks");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const tasks = project.tasks.map((task) => ({
      id: task._id,
      name: task.name,
      cards: task.cards || [],
    }));

    res.status(200).json({ tasks, bgUrl: project.bgUrl });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

// Move Task
exports.moveTask = async (req, res) => {
    const { projectId, taskId } = req.params;
    const { newIndex, movedBy, movedDate } = req.body;

    try {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const taskIndex = project.tasks.indexOf(taskId);
      if (taskIndex === -1) {
        return res.status(404).json({ message: "Task not found in project" });
      }

      // Remove task from current position and insert at new position
      project.tasks.splice(taskIndex, 1);
      project.tasks.splice(newIndex, 0, taskId);

      // Update the task with movedBy and movedDate
      const task = await Task.findById(taskId);
      if (task) {
        task.movedBy.push(movedBy);
        task.movedDate.push(movedDate);
        await task.save();
      }

      await project.save();

      // Create a new audit log entry
      const movedByUser = await User.findOne({ email: movedBy });
      if (!movedByUser) {
        return res.status(404).json({ message: "User not found for movedBy" });
      }

      const newAuditLog = new AuditLog({
        projectId: projectId,
        entityType: "Task",
        entityId: taskId,
        actionType: "move",
        actionDate: movedDate,
        performedBy: movedByUser.name, // Save the email of the user
        changes: [
          {
            field: "index",
            oldValue: taskIndex,
            newValue: newIndex,
          },
          {
            field: "movedBy",
            oldValue: null,
            newValue: movedBy,
          },
          {
            field: "movedDate",
            oldValue: null,
            newValue: movedDate,
          },
        ],
      });

      await newAuditLog.save();

      // Emit event for real-time update
      io.emit("taskMoved", { projectId, taskId, newIndex });

      res.status(200).json({ message: "Task moved successfully" });
    } catch (error) {
      console.error("Error moving task:", error);
      res.status(500).json({ message: "Error moving task" });
    }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  const { projectId, taskId } = req.params;
  const { deletedBy, deletedDate } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const taskIndex = project.tasks.indexOf(taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found in project" });
    }

    project.tasks.splice(taskIndex, 1);
    await project.save();

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.deletedBy = deletedBy;
    task.deletedDate = deletedDate;
    await task.save();

    const deletedByUser = await User.findOne({ email: deletedBy });
    if (!deletedByUser) {
      return res.status(404).json({ message: "User not found for deletedBy" });
    }

    const newAuditLog = new AuditLog({
      projectId: projectId,
      entityType: "Task",
      entityId: taskId,
      actionType: "delete",
      actionDate: deletedDate,
      performedBy: deletedByUser.name,
      changes: [
        { field: "deletedBy", oldValue: null, newValue: deletedBy },
        { field: "deletedDate", oldValue: null, newValue: deletedDate },
      ],
    });

    await newAuditLog.save();

    io.emit("taskDeleted", { projectId, taskId });

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Error deleting task" });
  }
};

// Update (Rename) Task
exports.updateTask = async (req, res) => {
  const { projectId, taskId } = req.params;
  const { name, updatedBy, updatedDate } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldName = task.name;

    task.name = name;
    task.updatedBy = updatedBy;
    task.updatedDate = updatedDate;
    await task.save();

    const updatedByUser = await User.findOne({ email: updatedBy });
    if (!updatedByUser) {
      return res.status(404).json({ message: "User not found for updatedBy" });
    }

    const newAuditLog = new AuditLog({
      projectId: projectId,
      entityType: "Task",
      entityId: taskId,
      actionType: "update",
      actionDate: updatedDate,
      performedBy: updatedByUser.name,
      changes: [
        { field: "name", oldValue: oldName, newValue: name },
        { field: "updatedBy", oldValue: null, newValue: updatedBy },
        { field: "updatedDate", oldValue: null, newValue: updatedDate },
      ],
    });

    await newAuditLog.save();

    io.emit("taskRenamed", { projectId, taskId, newName: name });

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Error updating task" });
  }
};