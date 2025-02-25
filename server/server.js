require("dotenv").config();
const cron = require("node-cron");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const nodemailer = require("nodemailer");
const { type } = require("os");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const UNSPLASH_API_KEY = 'rn5n3NUhw16AjjwCfCt3e1TKhiiKHCOxBdEp8E0c-KY';
// Initialize the Express app
const port = process.env.PORT;
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(bodyParser.json());

const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const streamifier = require("streamifier");
const { url } = require("inspector");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "document",
    allowedFormats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

cloudinary.config({
  cloud_name: "dygueetvc",
  api_key: "427358345394463",
  api_secret: "hH5AUqdzvhNz8s7kZoGL2QTf6RQ",
});

const GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://meenakumarimaligeli:Meena%40123@cluster0.ba469xs.mongodb.net/taskBoard",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const Schema = mongoose.Schema;

const usedTokenSchema = new Schema({
  token: String,
  createdAt: { type: Date, expires: "1h", default: Date.now }, // Token expires after 1 hour
});
const UsedToken = mongoose.model("UsedToken", usedTokenSchema);

// Organization schema
const organizationSchema = new Schema({
  id: String,
  name: String,
  email: String,

  projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
  teams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
});




const ruleSchema = new Schema({
  projectId: [{ type: Schema.Types.ObjectId, ref: "Project" }],
  name: { type: String, required: true },
  trigger: {
    type: String,
    enum: [
      "Card Move",
      "Card Changes",
      "Dates",
      "Checklists",
      "Card Content",
      "Fields",
    ],
  },
  triggerCondition: { type: String },
  listName: { type: String },
  action: {
    type: String,
    enum: [
      "Move",
      "Add/Remove",
      "Dates",
      "Checklists",
      "Move to List",
      "Complete Task",
      "Members",
      "Content",
      "Fields",
    ],
  },
  actionDetails: { type: Map, of: String },
  createdBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdByCondition: {
    type: String,
    enum: ["by me", "by anyone", "by anyone except me"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  triggerSentence: { type: String },
  actionSentence: { type: String },
});

const projectSchema = new Schema(
  {
    id: String,
    name: String,
    description: String,
    projectManager: String,
    projectManagerName: String,
    teams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    organization: { type: Schema.Types.ObjectId, ref: "Organization" },
    rules: [{ type: Schema.Types.ObjectId, ref: "Rule" }],
    createdBy: String,
    updatedBy: String,
    deletedBy: String,

    startDate: { type: Date },

    bgUrl: {
      raw: String,
      thumb: String,
      full: String,
      regular: String,
    },
    repository: { type: String, default: "" },
    repoName: { type: String, default: "" },
  },
  {
    timestamps: {
      createdAt: "createdDate",
      updatedAt: "updatedDate",
      deletedDate: "deletedDate",
    },
  }
);
const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // userEmail: { type: String },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
   
  },
  message: {
    type: String,
    required: true,
  },
  // type: {
  //   type: String,
  //   enum: ['TASK_ASSIGNED', 'TASK_RENAMED'],
  //   required: true
  // },
  type: { type: String, required: true },
  assignedByEmail: {
    type: String,
    required: true,
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  readStatus: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

//teams schema
const teamSchema = new Schema(
  {
    id: String,
    name: String,
    organization: { type: Schema.Types.ObjectId, ref: "Organization" },
    slug: { type: String },

    users: [
      { user: { type: Schema.Types.ObjectId, ref: "User" }, role: String },
    ],
    addedBy: String,
    removedBy: String,
  },
  {
    timestamps: { addedDate: "addedDate", removedDate: "removedDate" },
  }
);


//cards schema
const cardSchema = new Schema(
  {
    name: String,
    description: String,
    assignedTo: { type: String },
    status: {
      type: String,
      enum: ["inprogress", "completed", "pending", "paused"],
      default: "pending",
    },
    createdDate: { type: Date },
    updatedDate: [{ type: Date }],
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    assignDate: { type: Date },
    dueDate: { type: Date },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    createdBy: String,
    updatedBy: [{ type: String }],
    movedBy: [{ type: String }],
    movedDate: [{ type: Date }],
    deletedBy: String,
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    activities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Activity" }],
    taskLogs: [{ type: Schema.Types.ObjectId, ref: "Tasklogs" }],
    estimatedHours: { type: Number, default: 0 },
    utilizedTime: [{ type: Number, default: 0 }],
    uniqueId: { type: String, unique: true, required: true }  // Add this field
  },
  {
    timestamps: { deletedDate: "deletedDate" },
  }
);

const activitySchema = new Schema(
  {
    commentBy: { type: String, required: true },
    comment: { type: String, required: true },
    card: { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
  },
  {
    timestamps: true,
  }
);

// Comment schema
const commentSchema = new Schema(
  {
    comment: { type: String, required: true },
    commentBy: { type: String, required: true },
    card: { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
  },
  {
    timestamps: true,
  }
);

// Task schema
const taskSchema = new Schema(
  {
    id: String,
    name: String,
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    card: [{ type: Schema.Types.ObjectId, ref: "Card" }],
    createdBy: String,
    updatedBy: String,
    movedBy: [{ type: String }],
    deletedBy: String,
    movedDate: [{ type: Date }],
  },
  {
    timestamps: {
      createdAt: "createdDate",
      updatedAt: "updatedDate",
    },
  }
);

// User schema
const userSchema = new Schema({
  id: String,
  name: String,
  email: String,
  username: String,
  employeeId: String,
  employeeName: String,  // New field
  department: String,  // New field
  teamLead: String,  // New field
  
  password: String,
  role: { type: String },
  organization: { type: Schema.Types.ObjectId, ref: "Organization" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, default: "UNVERIFY" },
});


// Audit log schema
const auditLogSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: ["Project", "Task", "Card", "Team"],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    actionType: {
      type: String,
      enum: ["create", "update", "delete", "move"],
      required: true,
    },
    actionDate: { type: Date, default: Date.now },
    performedBy: { type: String }, // Use ObjectId and reference the User model

    changes: [
      {
        field: { type: String },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
      },
    ],
    projectId: { type: Schema.Types.ObjectId, ref: "Project" }, // Add projectId reference
    // Optional fields to store taskId and cardId
    taskId: { type: Schema.Types.ObjectId, ref: "Task" },
    cardId: { type: Schema.Types.ObjectId, ref: "Card" },
  },
  {
    timestamps: true,
  }
);

const taskLogSchema = new Schema({
  taskId: {
    type: Schema.Types.ObjectId,
    ref: "Task",
  },
  cardId: {
    type: Schema.Types.ObjectId,
    ref: "Card",
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "Project",

  },
  hours: {
    type: Number,
    min: 0, // Ensures hours cannot be negative
  },
  logDate: {
    type: Date,
    default: Date.now,
  },

  loggedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

//timesheetSchema
const timesheetSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  employeeName: { type: String, required: true },
  employeeID: { type: String, required: true },
  department: { type: String, required: true },
  teamLeadName: { type: String, required: true },
  weekStartDate: { type: Date, required: true },
  weekEndDate: { type: Date, required: true },
  status:{type:String},
  days: [
    {
      dayOfWeek: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], required: true },
      tasks: [
        {
          taskName: { type: String, required: true },
          taskDescription: { type: String },
          startTime: { type: String, required: true },
          endTime: { type: String, required: true },
          breakHours: { type: Number, default: 0 },
          totalhoursworked: { type: Number, default: 0 },
          notes: { type: String }
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


const projectNewSchema = new Schema({
  id: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString(), // Generates a unique ID
  },
  name: {
    type: String,
    required: true,
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
});



const TaskDetailsSchema = new Schema({
  id: {
    type: String,
    unique: true,
    default: function () {
      return generateHashId({
        assignedTo: this.assignedTo,
        assignedDate: this.assignedDate,
        estimatedHours: this.estimatedHours
      });
    }
  },
  assignedTo: { type: String, required: true },   
  assignedDate: { type: Date, required: true },   
  estimatedHours: { type: Number, required: true },
});

const TasksSchema = new Schema({
  id: {
    type: String,
    unique: true,
    default: function () {
      return generateHashId({
        name: this.name,
        assignedBy: this.assignedBy,
        projectId: this.projectId
      });
    }
  },
  name: { type: String, required: true },        
  assignedBy: { type: String, required: true },
  status:{type:String}  ,
  projectId: { type: String, required: true },     
  TaskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TaskDetails',                         
    required: true 
  }        
}); 



// Creating models
const User = mongoose.model("User", userSchema);
const Task = mongoose.model("Task", taskSchema);
const Team = mongoose.model("Team", teamSchema);
const Project = mongoose.model("Project", projectSchema);
const Organization = mongoose.model("Organization", organizationSchema);
const Card = mongoose.model("Card", cardSchema);
const AuditLog = mongoose.model("AuditLog", auditLogSchema);
const Comment = mongoose.model("Comment", commentSchema);
const Activity = mongoose.model("Activity", activitySchema);
const Notification = mongoose.model("Notification", NotificationSchema);
const Rule = mongoose.model("Rule", ruleSchema);
const Tasklogs = mongoose.model("Tasklogs", taskLogSchema);
const Timesheet = mongoose.model("Timesheet", timesheetSchema);
const NewProject = mongoose.model("NewProject", projectNewSchema);
const TaskDetails=mongoose.model("TaskDetails",TaskDetailsSchema);
const NewTasks=mongoose.model("NewTasks", TasksSchema)
module.exports = {
  User,
  Task,
  Team,
  Project,
  Organization,
  Card,
  AuditLog,
  Comment,
  Activity,
  Notification,
  Rule,
  Tasklogs,
  Timesheet,
  NewProject,
  TaskDetails,
  NewTasks
};

const tempOrganizationSchema = new Schema({
  name: String,
  email: String,
  projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
});

const TempOrganization = mongoose.model(
  "TempOrganization",
  tempOrganizationSchema
);

const tempUserSchema = new Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String },
  organization: { type: Schema.Types.ObjectId, ref: "TempOrganization" },
  status: { type: String },
});
const TempUser = mongoose.model("TempUser", tempUserSchema);

// Socket.IO connection handling
io.on("connection", (socket) => {
  // console.log("New client connected");
  socket.on("disconnect", () => {
    // console.log("Client disconnected");
  });
});

// Create a transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "thinkailabs111@gmail.com",
    pass: "zwvu hhtq cavs zkmr",
  },
});

// // Send Registration Email with Token Function
const sendRegistrationEmail = (email, name, token) => {
  const link = `${process.env.UI_ADDRESS}/success?token=${token}`;
  const mailOptions = {
    from: "thinkailabs111@gmail.com",
    to: email,
    subject: "Registration Successful",
    text: `Dear ${name},\n\nYour registration was successful. Please click the following link to complete your registration and login: ${link}\n\nBest Regards,\nTeam`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending registration email:", error);
    } else {
      // console.log("Registration email sent:", info.response);
    }
  });
};

async function updateProjectIds() {
  const projects = await Project.find({ id: null });
  for (let project of projects) {
    project.id = new mongoose.Types.ObjectId().toString(); // Or any unique generation logic
    await project.save();
  }
}

updateProjectIds().then(() => console.log('Updated projects with null id')).catch(console.error);


app.post('/projects', async (req, res) => {
  const { name, organizationId } = req.body;

  if (!name || !organizationId) {
    return res.status(400).json({ message: 'Project name and organization ID are required.' });
  }

  try {
    // Fetch users based on the organization ID
    const users = await User.find({ organization: organizationId });

    // Create a new project with a unique id
    const newProject = new NewProject({
      name,
      users: users.map(user => user._id),
      organization: organizationId,
      // id: 'someUniqueId' // Optionally, you can set a custom unique id here
    });

    // Save the project to the database
    await newProject.save();

    // Return the newly created project
    return res.status(201).json(newProject);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while creating the project.' });
  }
});

app.get('/api/:organizationId/projects', async (req, res) => {
  const { organizationId } = req.params;

  if (!organizationId) {
    return res.status(400).json({ message: 'Organization ID is required.' });
  }

  try {
    // Fetch projects that belong to the given organization ID
    const projects = await NewProject.find({ organization: organizationId });

    if (projects.length === 0) {
      return res.status(404).json({ message: 'No projects found for this organization.' });
    }

    // Return the projects
    return res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while fetching the projects.' });
  }
});




function generateHashId(data) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));

  // Get the hash in hexadecimal format
  const hexHash = hash.digest('hex');

  // Extract only digits from the hexadecimal hash
  const numericHash = hexHash.replace(/[^0-9]/g, '');


  // Ensure it has at least 10 digits
  return numericHash.length >= 10
    ? numericHash.substring(0, 10)
    : numericHash.padEnd(10, '0'); // Pad with zeros if less than 10 digits
}

async function safeCreate(Model, data, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const doc = new Model(data);
      await doc.save();
      return doc;
    } catch (error) {
      if (error.code === 11000 && attempt < maxRetries - 1) {
        // If it's a duplicate key error and we haven't reached max retries,
        // regenerate the id and try again
        data.id = generateHashId(data);
        continue;
      }
      throw error; // If it's not a duplicate key error or we've reached max retries, throw the error
    }
  }
  throw new Error(`Failed to create document after ${maxRetries} attempts`);
}

// app.post('/tasks-with-details', async (req, res) => {
//   try {
//     const { taskDetailsData, tasks } = req.body;

//     const savedTasksWithDetails = [];

//     for (const task of tasks) {
//       // Create a new TaskDetails for each task
//       const taskDetails = await safeCreate(TaskDetails, {
//         assignedTo: taskDetailsData.assignedTo,
//         assignedDate: taskDetailsData.assignedDate,
//         estimatedHours: taskDetailsData.estimatedHours,
//       });

//       // Create a new task with its own TaskDetails
//       const newTask = await safeCreate(NewTasks, {
//         name: task.taskName,
//         assignedBy: task.assignedBy,
//         projectId: task.projectId,
//         TaskId: taskDetails._id,
//         status: "Pending",
//       });

//       savedTasksWithDetails.push({ task: newTask, taskDetails });
//     }

//     res.status(201).json({ savedTasksWithDetails });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });





// app.get('/tasks-with-details', async (req, res) => {
//   try {
//       const { assignedTo, assignedDate, status } = req.query; // Get the assignedTo email, assignedDate, and status from query params

//       // Build the query for TaskDetails
//       const taskDetailsQuery = { assignedTo };

//       if (assignedDate) {
//         const date = new Date(assignedDate);
//         taskDetailsQuery.assignedDate = { $eq: date }; 
//     }
    

//       // Find TaskDetails with matching assignedTo and assignedDate if provided
//       const taskDetails = await TaskDetails.find(taskDetailsQuery);

//       // Get the IDs of the matching TaskDetails
//       const taskDetailIds = taskDetails.map(detail => detail._id);

//       // Build the query for NewTasks
//       const tasksQuery = { TaskId: { $in: taskDetailIds } };

//       // If status is provided, filter by that status
//       if (status) {
//           tasksQuery.status = status; // Add status filter
//       }

//       // Fetch tasks that have TaskId in the list of matching TaskDetails
//       const tasks = await NewTasks.find(tasksQuery).populate('TaskId');

//       // Map tasks to include user and project details
//       const tasksWithUserAndProjectDetails = await Promise.all(tasks.map(async (task) => {
//           const taskDetails = task.TaskId;

//           let assignedToUser = null;
//           if (taskDetails.assignedTo) {
//               assignedToUser = await User.findOne({ email: taskDetails.assignedTo });
//           }

//           let assignedByUser = null;
//           if (task.assignedBy) {
//               assignedByUser = await User.findOne({ email: task.assignedBy });
//           }

//           const project = await NewProject.findById(task.projectId);

//           return {
//               ...task.toObject(),
//               TaskId: {
//                   ...taskDetails.toObject(),
//                   assignedTo: assignedToUser ? assignedToUser.username : null,
//               },
//               projectName: project ? project.name : null,
//               assignedBy: assignedByUser ? assignedByUser.username : null
//           };
//       }));

//       res.json(tasksWithUserAndProjectDetails);
//   } catch (err) {
//       res.status(500).json({ error: err.message });
//   }
// });

app.post('/tasks-with-details', async (req, res) => {
  try {
    const { taskDetailsData, tasks } = req.body;

    // Create a single TaskDetails object for all tasks
    const taskDetails = await safeCreate(TaskDetails, {
      assignedTo: taskDetailsData.assignedTo,
      assignedDate: taskDetailsData.assignedDate,
      estimatedHours: taskDetailsData.estimatedHours,
    });

    const savedTasksWithDetails = [];

    // Loop through each task and assign the same TaskDetails ID
    for (const task of tasks) {
      const newTask = await safeCreate(NewTasks, {
        name: task.taskName,
        assignedBy: task.assignedBy,
        projectId: task.projectId,
        TaskId: taskDetails._id, // Use the same TaskDetails ID
        status: "Pending",
      });

      savedTasksWithDetails.push({ task: newTask, taskDetails });
    }

    res.status(201).json({ savedTasksWithDetails });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});




app.get('/tasks-with-details', async (req, res) => {
  try {
      const { assignedTo, assignedDate, status } = req.query;

      const taskDetailsQuery = { assignedTo };

      if (assignedDate) {
          const date = new Date(assignedDate);
          taskDetailsQuery.assignedDate = { $eq: date };
      }

      const taskDetails = await TaskDetails.find(taskDetailsQuery);

      const taskDetailIds = taskDetails.map(detail => detail._id);

      const tasksQuery = { TaskId: { $in: taskDetailIds } };

      if (status) {
          tasksQuery.status = status;
      }

      const tasks = await NewTasks.find(tasksQuery).populate('TaskId');

      const tasksWithUserAndProjectDetails = await Promise.all(tasks.map(async (task) => {
          const taskDetails = task.TaskId;

          let assignedToUser = null;
          if (taskDetails.assignedTo) {
              assignedToUser = await User.findOne({ email: taskDetails.assignedTo });
          }

          // Try to find user based on task.assignedBy, if it exists
          let assignedByUser = await User.findOne({ email: task.assignedBy });
          // If no user found, just use the raw value from task.assignedBy
          const assignedByText = assignedByUser ? assignedByUser.username : task.assignedBy;

          const project = await NewProject.findById(task.projectId);

          return {
              ...task.toObject(),
              TaskId: {
                  ...taskDetails.toObject(),
                  assignedTo: assignedToUser ? assignedToUser.username : null,
              },
              taskDetailsId: taskDetails._id, // Add this line to include the TaskDetails ID
              projectName: project ? project.name : null,
              assignedBy: assignedByText // Display username if found, otherwise raw value
          };
      }));

      res.json(tasksWithUserAndProjectDetails);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});



app.get('/tasks-with-details/:id', async (req, res) => {
  try {
    // Fetch a single task and populate the task details
    const task = await NewTasks.findById(req.params.id).populate('TaskId');
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Update Task and Task Details
app.put('/tasks-with-details/:id', async (req, res) => {
  try {
    const { taskName, assignedBy, projectId, assignedTo, assignedDate, estimatedHours, status } = req.body;

    // Find the task by ID
    const task = await NewTasks.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Update the task fields if provided
    if (taskName) task.name = taskName;
    if (assignedBy) task.assignedBy = assignedBy;
    if (projectId) task.projectId = projectId;
    if (status) task.status = status; // Update status in task

    // Find and update the TaskDetails by TaskId
    const taskDetails = await TaskDetails.findById(task.TaskId);
    if (!taskDetails) return res.status(404).json({ error: "Task details not found" });

    // Update TaskDetails fields if provided
    if (assignedTo) taskDetails.assignedTo = assignedTo;
    if (assignedDate) taskDetails.assignedDate = assignedDate;
    if (estimatedHours) taskDetails.estimatedHours = estimatedHours;
    if (status) taskDetails.status = status; // Update status in task details

    // Save both updates
    await task.save();
    await taskDetails.save();

    res.json({ task, taskDetails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Task and Task Details
app.delete('/tasks-with-details/:id', async (req, res) => {
  try {
    // Find the task by ID
    const task = await NewTasks.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Delete the associated TaskDetails by TaskId
    await TaskDetails.findByIdAndDelete(task.TaskId);

    // Now delete the task itself
    await task.remove();

    res.json({ message: "Task and Task Details deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});






//reset password profile update
// Update password route
app.post('/api/users/:id/update-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Fetch the user from the database
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the current password (Assuming you are using bcrypt)
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password in the database
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});




//organisation register
app.post("/register", async (req, res) => {
  const {
    organizationName,
    organizationEmail,
    userName,
    userEmail,
    userPassword,
  } = req.body;

  try {
    // Check if the email is already registered
    const existingUser = await TempUser.findOne({ email: userEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Create the organization first
    const newOrganization = new TempOrganization({
      name: organizationName,
      email: organizationEmail,
      projects: [],
    });

    await newOrganization.save();

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Create the user with the organization reference and role 'admin'
    const newUser = new TempUser({
      name: userName,
      email: userEmail,
      password: hashedPassword, // Save the hashed password
      organization: newOrganization._id,
      role: "ADMIN",
      status: "VERIFIED",
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { email: userEmail, role: "ADMIN", userId: newUser._id },
      secretKey,
      { expiresIn: "3d" }
    );

    // Store the token in UsedToken collection
    const usedToken = new UsedToken({ token });
    await usedToken.save();

    // Send registration email with token
    sendRegistrationEmail(userEmail, userName, token);

    res.status(201).json({
      message: "Organization and user registered successfully",
      organization: newOrganization,
      user: newUser,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error registering organization and user" });
  }
});


app.get("/api/card/:cardId", authenticateToken, async (req, res) => {
  const { cardId } = req.params;

  try {
    const card = await Card.findById(cardId).populate({
      path: "comments",
      model: "Comment",
    }).populate({
      path: "activities",
      model: "Activity",
    }).populate({
      path: "taskLogs",
      model: "Tasklogs",
      populate: {
        path: "loggedBy",
        model: "User",
        select: "name email",
      },
    });

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Calculate the sum of logged hours for the card
    const logs = await Tasklogs.aggregate([
      { $match: { cardId: card._id } },
      { $group: { _id: "$cardId", totalHours: { $sum: "$hours" } } },
    ]);

    const hoursMap = logs.reduce((map, log) => {
      map[log._id] = log.totalHours;
      return map;
    }, {});

    const cardDetails = {
      id: card._id,
      name: card.name,

      description: card.description,
      assignedTo: card.assignedTo,
      createdBy: card.createdBy,
      status: card.status,
      estimatedHours: card.estimatedHours,
      utilizedHours: hoursMap[card._id] || 0,
      uniqueId: card.uniqueId,
      createdDate: moment(card.createdDate)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss"),
      assignDate: moment(card.assignDate)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss"),
      dueDate: moment(card.dueDate)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss"),
      comments: card.comments.map((comment) => ({
        id: comment._id,
        comment: comment.comment,
        commentBy: comment.commentBy,
        createdAt: moment(comment.createdAt)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
      })),
      activities: card.activities.map((activity) => ({
        id: activity._id,
        commentBy: activity.commentBy,
        comment: activity.comment,
        createdAt: moment(activity.createdAt)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
      })),
      taskLogs: card.taskLogs.map((taskLog) => ({
        id: taskLog._id,
        hours: taskLog.hours,
        logDate: moment(taskLog.logDate)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
        loggedBy: {
          id: taskLog.loggedBy._id,
          name: taskLog.loggedBy.name,
          email: taskLog.loggedBy.email,
        },
      })),
    };

    res.status(200).json({ card: cardDetails });
  } catch (error) {
    console.error("Error fetching card:", error);
    res.status(500).json({ message: "Error fetching card" });
  }
});
// Validate email token and store data permanently
app.get("/validate-email", async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, secretKey);
    const { email, userId } = decoded;

    const tempUser = await TempUser.findOne({ _id: userId, email });
    const tempOrganization = await TempOrganization.findOne({
      _id: tempUser.organization,
    });

    if (tempUser && tempOrganization) {
      const newOrganization = new Organization({
        name: tempOrganization.name,
        email: tempOrganization.email,
        projects: tempOrganization.projects,
      });

      await newOrganization.save();

      const newUser = new User({
        name: tempUser.name,
        email: tempUser.email,
        password: tempUser.password,
        organization: newOrganization._id,
        role: tempUser.role,
        status: tempUser.status,
      });

      await newUser.save();

      await TempUser.deleteOne({ _id: userId });
      await TempOrganization.deleteOne({ _id: tempOrganization._id });

      res.status(200).json({ message: "Email validated successfully" });
    } else {
      res.status(400).json({ message: "Invalid token or user does not exist" });
    }
  } catch (error) {
    console.error("Error validating token:", error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

app.get("/api/users/search", authenticateToken, async (req, res) => {
  const { username, fields } = req.query;

  try {
    // Find users by username using regex for partial matches
    const users = await User.find(
      { username: new RegExp(username, "i") }, // case-insensitive match
      fields
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error });
  }
});

//Fetch users for an organization
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ organization: req.user.organizationId });
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});






app.get("/api/cards/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch the user to get the email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userEmail = user.email;

    // Fetch cards assigned to the user by email
    const cards = await Card.find({ assignedTo: userEmail })
      .populate({ path: 'project', select: 'name ' })
      .populate({ path: 'task', select: 'name' })
      .select('name assignDate estimatedHours utilizedTime status project task');

    // Get the card IDs to calculate total utilized hours
    const cardIds = cards.map(card => card._id);

    // Calculate the sum of logged hours for each card
    const logs = await Tasklogs.aggregate([
      { $match: { cardId: { $in: cardIds } } },
      { $group: { _id: "$cardId", totalHours: { $sum: "$hours" } } }
    ]);

    const hoursMap = logs.reduce((map, log) => {
      map[log._id] = log.totalHours;
      return map;
    }, {});

    // Modify the card data to include utilized hours
    const modifiedCards = cards.map(card => ({
      ...card.toObject(),
      utilizedHours: hoursMap[card._id] || 0
    }));

    // Send the response with the modified cards
    res.json(modifiedCards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).send("Server error");
  }
});


// User data name route
app.get("/api/user", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select(
      "name email role employeeId department teamLead username"
    
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // // console.log(user.email);
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.delete("/api/deleteUser/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const userId = req.params.id;

      // Find the user in the database before deleting to get the email or GitHub username
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find the organization associated with the user
      const organization = await Organization.findById(user.organization);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Conditionally make the GitHub API call if user.name is available
      if (user.name) {
        try {
          const githubUsername = user.name; // Assuming 'name' is used for GitHub

          const githubResponse = await axios.delete(
            `https://api.github.com/orgs/${organization.name}/memberships/${githubUsername}`,
            {
              headers: {
                Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          // console.log("GitHub membership deletion response:", githubResponse.data);
        } catch (error) {
          console.error(
            "Error removing user from GitHub organization:",
            error.response ? error.response.data : error.message
          );
          // Optionally proceed with database deletion if GitHub deletion fails
          return res.status(500).json({
            message:
              "User deletion failed on GitHub but proceeded in the database",
          });
        }
      }

      // Delete the user from the database
      await User.findByIdAndDelete(userId);

      res.status(200).json({
        message: "User deleted successfully from both database" +
                 (user.name ? " and GitHub" : ""),
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  }
);


app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find the user by email
    const user = await User.findOne({ email }).populate("organization");

    if (user) {
      // Compare the provided password with the stored hashed password
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        // Generate a JWT token and include user's _id in the payload
        const token = jwt.sign(
          {
            _id: user._id, // Include user ID in the token payload
            email: user.email,
            role: user.role,
            organizationId: user.organization._id,
          },
          secretKey, // Secret key for signing the token
          { expiresIn: "5h" } // Set token expiration to 5 hours
        );

        // Respond with the token
        res.json({ success: true, token });
      } else {
        // If the password is incorrect
        res.status(401).json({ success: false, message: "Invalid email or password" });
      }
    } else {
      // If the user is not found
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET API to fetch a specific timesheet by ID
app.get("/api/timesheets/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const timesheetId = req.params.id;

    // Fetch user information to check role
    const user = await User.findById(userId).select('role'); // Assuming role is stored in the User model

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Determine if the user is an ADMIN
    const isAdmin = user.role === 'ADMIN';

    // Find the timesheet based on the user's role
    const timesheet = isAdmin
      ? await Timesheet.findById(timesheetId)
      : await Timesheet.findOne({ _id: timesheetId, user: userId });

    if (!timesheet) {
      return res.status(404).json({ success: false, message: "Timesheet not found" });
    }

    res.status(200).json({ success: true, timesheet });
  } catch (error) {
    console.error("Error fetching timesheet:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// //submit timesheet
app.post("/api/timesheet/:id/submit", authenticateToken, async (req, res) => {
  try {
    const timesheetId = req.params.id;
    const userId = req.user._id;

    // Find the timesheet by ID and user ID
    const timesheet = await Timesheet.findOne({ _id: timesheetId, user: userId });

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found or you don't have permission to submit it" });
    }

    // Update status to "inprogress"
    timesheet.status = "In Progress";

    // Save the updated timesheet
    const updatedTimesheet = await timesheet.save();

    // Find the submitting user's organization
    const submittingUser = await User.findById(userId).populate("organization");
    if (!submittingUser || !submittingUser.organization) {
      return res.status(400).json({ message: "User or organization not found" });
    }

    // Find all users in the organization with the role 'ADMIN'
    const adminUsers = await User.find({
      organization: submittingUser.organization._id,
      role: "ADMIN"
    });

    // Send notification to each admin user
    const notifications = adminUsers.map((admin) => ({
      userId: admin._id,
      //projectId: timesheet.projectId, // Assuming timesheet has a projectId field
      message: `Timesheet submitted by ${submittingUser.username}`,
      type: "TIMESHEET_SUBMITTED",
      assignedByEmail: submittingUser.username,
      cardId: timesheet._id, // Assuming timesheet is related to a card
    }));

    // Save notifications
    await Notification.insertMany(notifications);

    res.status(200).json({ message: "Timesheet submitted successfully", timesheet: updatedTimesheet });
  } catch (error) {
    console.error("Error submitting timesheet:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// GET API to fetch all timesheets for the authenticated user
app.get("/api/timesheets", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user information to check role
    const user = await User.findById(userId).select('role'); // Assuming role is stored in the User model

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if user is an ADMIN
    if (user.role === 'ADMIN') {
      // Fetch all timesheets
      const timesheets = await Timesheet.find({});
      return res.status(200).json({ success: true, timesheets });
    } else {
      // Fetch timesheets associated with the authenticated user
      const timesheets = await Timesheet.find({ user: userId });
      return res.status(200).json({ success: true, timesheets });
    }
  } catch (error) {
    console.error("Error fetching timesheets:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});
// create timesheet
app.post("/api/timesheet", authenticateToken, async (req, res) => {
  try {
    const { employeeName, employeeID, department, teamLeadName, weekStartDate, weekEndDate, days ,status} = req.body;
    const userId = req.user._id; // Assuming authenticateToken sets the user in req.user

    // Create new timesheet document associated with the authenticated user
    const newTimesheet = new Timesheet({
      user: userId,
      employeeName,
      employeeID,
      department,
      teamLeadName,
      weekStartDate: new Date(weekStartDate),  // Ensure dates are in proper format
      weekEndDate: new Date(weekEndDate),
      status,
      days: days.map(day => ({
        dayOfWeek: day.dayOfWeek,  // This should match the 'day' field in your form data
        tasks: day.tasks.map(task => ({
          taskName: task.taskName,
          taskDescription: task.taskDescription,
          startTime: task.startTime,  // Ensure times are saved as strings or Date objects
          endTime: task.endTime,
          breakHours: task.breakHours,
          totalhoursworked: task.totalhoursworked,  // Ensure consistent field naming (camelCase)
          notes: task.notes
        }))
      }))
    });

    // Save the timesheet document to the database
    const savedTimesheet = await newTimesheet.save();
    res.status(201).json({ message: "Timesheet submitted successfully", timesheet: savedTimesheet });
  } catch (error) {
    console.error("Error submitting timesheet:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

app.put("/api/timesheet/:id", authenticateToken, async (req, res) => {
  try {
    const timesheetId = req.params.id;
    const userId = req.user._id;
    const { employeeName, employeeID, department, teamLeadName, weekStartDate, weekEndDate, days } = req.body;

    // Find the timesheet by ID and user ID
    const timesheet = await Timesheet.findOne({ _id: timesheetId, user: userId });

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found or you don't have permission to update it" });
    }

    // Update timesheet fields
    timesheet.employeeName = employeeName;
    timesheet.employeeID = employeeID;
    timesheet.department = department;
    timesheet.teamLeadName = teamLeadName;
    timesheet.weekStartDate = new Date(weekStartDate);
    timesheet.weekEndDate = new Date(weekEndDate);
    timesheet.days = days.map(day => ({
      dayOfWeek: day.dayOfWeek,
      tasks: day.tasks.map(task => ({
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        startTime: task.startTime,
        endTime: task.endTime,
        breakHours: task.breakHours,
        totalhoursworked: task.totalhoursworked,
        notes: task.notes
      }))
    }));

    // Save the updated timesheet
    const updatedTimesheet = await timesheet.save();
    res.status(200).json({ message: "Timesheet updated successfully", timesheet: updatedTimesheet });
  } catch (error) {
    console.error("Error updating timesheet:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}); 

// Approve timesheet
app.post("/api/timesheet/:id/approve", authenticateToken, async (req, res) => {
  try {
    const timesheetId = req.params.id;
    const userId = req.user._id;

    // Find the timesheet by ID
    const timesheet = await Timesheet.findById(timesheetId);

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    if (timesheet.teamLeadName !== req.user.name && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: "You don't have permission to approve this timesheet" });
    }

    // Update status to "approved"
    timesheet.status = "Approved";

    // Save the updated timesheet
    const updatedTimesheet = await timesheet.save();
    res.status(200).json({ message: "Timesheet approved successfully", timesheet: updatedTimesheet });
  } catch (error) {
    console.error("Error approving timesheet:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


// Update a specific task in the timesheet
app.put("/api/timesheet/:timesheetId/task/:taskId", authenticateToken, async (req, res) => {
  try {
    const { timesheetId, taskId } = req.params;
    const { dayOfWeek, taskName, taskDescription, startTime, endTime, breakHours, totalhoursworked, notes } = req.body;

    // Find the timesheet by ID
    const timesheet = await Timesheet.findById(timesheetId);

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    // Find the day in which the task exists
    const day = timesheet.days.find(day => day.tasks.some(task => task._id.toString() === taskId));

    if (!day) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Find the task and update its details
    const task = day.tasks.id(taskId);
    task.taskName = taskName;
    task.taskDescription = taskDescription;
    task.startTime = startTime;
    task.endTime = endTime;
    task.breakHours = breakHours;
    task.totalhoursworked = totalhoursworked;
    task.notes = notes;

    // Save the updated timesheet
    await timesheet.save();

    res.json({ message: "Task updated successfully", taskId });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

//delete task in timesheet
app.delete("/api/timesheet/:timesheetId/task/:taskId", authenticateToken, async (req, res) => {
  try {
    const { timesheetId, taskId } = req.params;
    const userId = req.user._id;

    // Find the timesheet by ID and user ID
    const timesheet = await Timesheet.findOne({ _id: timesheetId, user: userId });

    if (!timesheet) {
      return res.status(404).json({ message: "Timesheet not found or you don't have permission to delete from it" });
    }

    // Find and remove the task
    const dayToUpdate = timesheet.days.find(day =>
      day.tasks.some(task => task._id.toString() === taskId)
    );

    if (dayToUpdate) {
      dayToUpdate.tasks = dayToUpdate.tasks.filter(task => task._id.toString() !== taskId);
      await timesheet.save();
      return res.status(200).json({ message: "Task deleted successfully" });
    }

    res.status(404).json({ message: "Task not found" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});



// Secret Key for JWT
const secretKey = crypto.randomBytes(32).toString("hex");

// Middleware for authenticating token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
// Middleware for authorizing based on role
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}
// Get user role route
app.get("/api/role", authenticateToken, async (req, res) => {
  try {
    // Step 1: Find the user and get the organization ID
    const user = await User.findOne({ email: req.user.email }).select(
      "email name role username organization "
    );
    // console.log(user)
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Step 2: Find the organization by ID and get the name
    const organization = await Organization.findById(user.organization).select(
      "name"
    );
    if (!organization) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    res.json({
      success: true,
      role: user.role,
      organizationId: user.organization,
      organizationName: organization.name, // Include the organization name in the response
      username: user.username
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/addUser",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    const { name, email, username, employeeId, department, teamLead, role } = req.body;

    try {
      // Validate if required fields (excluding name) are present
      if (!email || !role || !username || !department ) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      // Create a new user object (name is optional)
      const newUser = new User({
        name: name || "", // Default to an empty string if name is not provided
        email,
        username,
        employeeId,
        department,
        teamLead,
        role, // Default to 'USER'
        organization: req.user.organizationId,
        status: "UNVERIFY", // User needs to verify their account
      });

      // Fetch organization details
      const organization = await Organization.findById(req.user.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Save the new user to the database
      await newUser.save();

      // Generate a token for resetting the password
      const token = jwt.sign({ email, role, userId: newUser._id }, secretKey, {
        expiresIn: "3d",
      });
      const resetLink = `${process.env.UI_ADDRESS}/reset-password?token=${token}`;

      // Send reset email with the token
      sendResetEmail(email, resetLink);

      // Conditionally add the user to the GitHub organization if `name` is provided
      if (name) {
        try {
          const githubResponse = await axios.put(
            `https://api.github.com/orgs/${organization.name}/memberships/${name}`,
            {
              role: "member",
            },
            {
              headers: {
                Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.github.v3+json",
              },
            }
          );
          console.log("GitHub membership response:", githubResponse.data);
        } catch (error) {
          console.error(
            "Error adding user to GitHub organization:",
            error.response ? error.response.data : error.message
          );
          return res.status(500).json({
            message: "User added to the organization but not to GitHub",
            user: newUser,
          });
        }
      }

      // Respond with success
      res.status(201).json({
        message: "User added successfully",
        user: newUser,
      });

    } catch (error) {
      console.error("Error adding user:", error);
      res.status(500).json({ message: "Error adding user" });
    }
  }
);



const sendResetEmail = (email, link) => {
  const mailOptions = {
    from: "thinkailabs111@gmail.com",
    to: email,
    subject: "Create password",
    text: `Please click on the following link to create your password: ${link}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      // console.log("Email sent:", info.response);
    }
  });
};
// //reset password

app.post("/resetPassword", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const usedToken = await UsedToken.findOne({ token });
    if (usedToken) {
      return res
        .status(401)
        .json({ message: "This reset link has already been used or expired" });
    }

    const decoded = jwt.verify(token, secretKey);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user already has a password set
    if (user.password) {
      const isMatch = await bcrypt.compare(newPassword, user.password);
      if (isMatch) {
        return res.status(400).json({ message: "New password must be different from the old password" });
      }
    }

    // Hash the new password and update the user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.status = "VERIFIED"; // Update status to 'Verified'
    await user.save();

    const newUsedToken = new UsedToken({ token });
    await newUsedToken.save();

    res.status(200).json({ message: "Password reset successfully", user });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    } else {
      // Improved error logging
      console.error("Error resetting password:", error.message, error.stack);
      return res.status(500).json({ message: "Error resetting password" });
    }
  }
});



app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Generate a JWT token for password reset (valid for 1 hour)
    const resetToken = jwt.sign(
      { email: user.email, userId: user._id },
      secretKey,
      { expiresIn: "1h" }
    );

    // Save the token in the user document (optional, for reference)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();

    // Create the reset link using the JWT token
    const resetLink = `${process.env.UI_ADDRESS}/forgot-password?token=${resetToken}`;

    // Set up email options
    const mailOptions = {
      to: user.email,
      from: 'thinkailabs111@gmail.com',
      subject: "Password Reset",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      ${resetLink}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    // Send the email with the reset link
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error("Error sending email:", err);
        return res.status(500).json({ message: "Error sending email." });
      }
      res.json({ message: "Reset password link sent successfully." });
    });
  } catch (error) {
    console.error("Error during forgot password process:", error);
    res.status(500).json({ message: "Error processing request." });
  }
});

// Update password 
app.post('/api/users/:id/update-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Fetch the user from the database
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the current password (Assuming you are using bcrypt)
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password in the database
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


//projects
// Function to send emails
const sendEmail = (email, subject, text) => {
  const mailOptions = {
    from: "thinkailabs111@gmail.com",
    to: email,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      // console.log("Email sent:", info.response);
    }
  });
};

app.post("/api/projects", async (req, res) => {
  const {
    organizationId,
    name,
    description,
    projectManager,
    startDate,
    createdBy,
    teams,
    bgUrl
  } = req.body;

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const projectManagerUser = await User.findOne({ email: projectManager });
    if (!projectManagerUser) {
      return res.status(404).json({ message: "Project manager not found" });
    }

    const createProjectUser = await User.findOne({ email: createdBy });
    if (!createProjectUser) {
      return res.status(404).json({ message: "Creator not found" });
    }

    // Validate that all team IDs exist and fetch team names
    let teamNames = [];
    if (teams && teams.length > 0) {
      const existingTeams = await Team.find({ _id: { $in: teams } });
      if (existingTeams.length !== teams.length) {
        return res.status(404).json({ message: "Some teams not found" });
      }
      teamNames = existingTeams.map((team) => team.slug); // Using team slug for GitHub API
    }

    // Create the project in MongoDB
    const newProject = new Project({
      name,
      description,
      projectManager,
      projectManagerName: projectManagerUser.username,
      organization: organization._id,
      teams: teams || [],
      tasks: [],
      startDate,
      createdBy,
      bgUrl: bgUrl || null,
      repository: "", // Initialize repository field
      repoName: "",   // Initialize repoName field
    });

    await newProject.save();

    const auditLog = new AuditLog({
      entityType: "Project",
      entityId: newProject._id,
      actionType: "create",
      actionDate: new Date(),
      performedBy: createProjectUser.username,
      changes: [],
    });

    await auditLog.save();

    organization.projects.push(newProject._id);
    await organization.save();

    // Update teams with the new project
    if (teams && teams.length > 0) {
      await Team.updateMany(
        { _id: { $in: teams } },
        { $push: { projects: newProject._id } }
      );
    }

    // Try to create GitHub repository, but continue if it fails
    let githubResponse = null;
    let repoName = `${organization.name}-${newProject.name}-repo`.replace(/\s+/g, "-").toLowerCase();

    try {
      githubResponse = await axios.post(
        `https://api.github.com/orgs/${organization.name}/repos`,
        {
          name: repoName,
          private: true,
          description: `Repository for ${organization.name} project ${newProject.name}`,
        },
        {
          headers: {
            Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update project with repository info if GitHub creation was successful
      newProject.repository = githubResponse.data.html_url;
      newProject.repoName = repoName;
      await newProject.save();
    } catch (error) {
      console.error(
        "GitHub repository creation failed, but project will continue:",
        error.response ? error.response.data : error.message
      );
    }

    // Attempt to assign team(s) to the GitHub repository, if GitHub creation was successful
    if (githubResponse && teamNames.length > 0) {
      for (const teamName of teamNames) {
        try {
          await axios.put(
            `https://api.github.com/orgs/${organization.name}/teams/${teamName}/repos/${organization.name}/${repoName}`,
            { permission: "push" }, // 'push' gives write access
            {
              headers: {
                Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.github.v3+json",
              },
            }
          );
        } catch (error) {
          console.error(
            `Error assigning team ${teamName} to GitHub repository:`,
            error.response ? error.response.data : error.message
          );
        }
      }
    }

    // Send notification email to the project manager
    const token = jwt.sign(
      {
        projectId: newProject._id,
        name: newProject.name,
        description: newProject.description,
        projectManager: newProject.projectManager,
      },
      secretKey,
      { expiresIn: "1h" }
    );

    const link = `${process.env.UI_ADDRESS}/project?token=${token}`;
    const emailText = `Dear Project Manager,\n\nA new project has been created.\n\nProject Name: ${name}\nDescription: ${description}\n\nPlease click the following link to view the project details: ${link}\n\nBest Regards,\nTeam`;

    await sendEmail(projectManager, "New Project Created", emailText);

    res.status(201).json({
      message: "Project created successfully. GitHub creation is optional.",
      project: newProject,
      projectManagerStatus: projectManagerUser.status,
      repository: githubResponse ? githubResponse.data : null, // Include GitHub response only if it exists
      repoName: githubResponse ? repoName : null, // Include repoName only if GitHub was created
      teamNames, // Include team names
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Error creating project", error: error.message });
  }
});




app.put("/api/projects/:projectId/bgImage", authenticateToken,
  async (req, res) => {
    try {
      const projectId = req.params.projectId;

      const { bgUrl } = req.body;

      // const result = await cloudinary.uploader.upload(bgUrl, {
      //   folder: "document",
      // });

      // const cloudinaryUrl = result.secure_url;

      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { bgUrl: bgUrl },
        { new: true }
      );

      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.status(200).json({
        message: "Background image URL updated successfully",
        project: updatedProject,
      });
    } catch (error) {
      console.error("Error updating background image:", error);
      res.status(500).json({ message: "Error updating background image" });
    }
  }
);

// custom image



app.put("/api/projects/:projectId/customImages",
  authenticateToken,
  async (req, res) => {
    try {
      const projectId = req.params.projectId;
      // 
      const { imageUrl } = req.body;

      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { $push: { customImages: imageUrl } },
        { new: true }
      );

      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.status(200).json({
        message: "Custom image URL added successfully",
        project: updatedProject,
      });
    } catch (error) {
      console.error("Error adding custom image:", error);
      res.status(500).json({ message: "Error adding custom image" });
    }
  }
);

//status
app.get("/api/user-status", async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ status: user.status });
  } catch (error) {
    console.error("Error fetching user status:", error);
    res.status(500).json({ message: "Error fetching user status" });
  }
});

app.get("/api/projects/:organizationId",
  authenticateToken,
  async (req, res) => {
    const { organizationId } = req.params;
    const userEmail = req.user.email;
    const userRole = req.user.role;

    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      let projectsQuery;

      if (userRole === "ADMIN") {
        // Admins can see all projects
        projectsQuery = Project.find({ organization: organizationId });
      } else {
        // Find the user
        const user = await User.findOne({ email: userEmail });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Find projects where the user is either the project manager or part of a team
        projectsQuery = Project.find({
          organization: organizationId,
          $or: [
            { projectManager: user.email }, // Use user._id for comparison
            {
              teams: {
                $in: await Team.find({ "users.user": user._id }).distinct(
                  "_id"
                ),
              },
            },
          ],
        });
      }

      // Populate the projectManager field with the username
      const projects = await projectsQuery
        .populate("projectManager", "username") // Populate the projectManager with the username field
        .exec();

      // Transform projects to include projectManagerUsername
      const transformedProjects = projects.map((project) => ({
        ...project._doc,
        projectManagerUsername: project.projectManager
          ? project.projectManager.username // Include the username of the project manager
          : "N/A",
      }));

      res.status(200).json({ projects: transformedProjects });
    } catch (error) {
      console.error("Error retrieving projects:", error);
      res.status(500).json({ message: "Error retrieving projects" });
    }
  }
);


app.put("/api/projects/:projectId", authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { name, description, updatedBy } = req.body;

    // Find the user by email to get their ObjectId and email
    const updatedByUser = await User.findOne({ email: updatedBy });
    if (!updatedByUser) {
      return res.status(404).json({ message: "User not found for updatedBy" });
    }

    // Find the existing project to get the old values
    const oldProject = await Project.findById(projectId);
    if (!oldProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    const organization = await Organization.findById(oldProject.organization);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Check if the project name has changed and update GitHub repository if needed
    if (oldProject.name !== name) {
      const oldRepoName = `${organization.name}-${oldProject.name}-repo`
        .replace(/\s+/g, "-")
        .toLowerCase();
      const newRepoName = `${organization.name}-${name}-repo`
        .replace(/\s+/g, "-")
        .toLowerCase();

      try {
        // Attempt to update the GitHub repository name
        await axios.patch(
          `https://api.github.com/repos/${organization.name}/${oldRepoName}`,
          { name: newRepoName },
          {
            headers: {
              Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        // Update the repository URL in the project document
        oldProject.repository = `https://github.com/${organization.name}/${newRepoName}`;
        oldProject.repoName = newRepoName;
      } catch (error) {
        console.error(
          "Error updating GitHub repository:",
          error.response ? error.response.data : error.message
        );
        // Proceed without stopping project update if GitHub repository update fails
      }
    }

    // Update the project document with new details
    const changes = [];
    
    if (oldProject.name !== name) {
      changes.push({
        field: "name",
        oldValue: oldProject.name,
        newValue: name,
      });
      oldProject.name = name;
    }

    if (oldProject.description !== description) {
      changes.push({
        field: "description",
        oldValue: oldProject.description,
        newValue: description,
      });
      oldProject.description = description;
    }

    oldProject.updatedBy = updatedBy;
    const updatedProject = await oldProject.save();

    // Create an audit log entry to record changes
    if (changes.length > 0) {
      const auditLog = new AuditLog({
        entityType: "Project",
        entityId: projectId,
        actionType: "update",
        actionDate: new Date(),
        performedBy: updatedByUser.username,
        changes: changes,
      });

      await auditLog.save();
    }

    // Send email notification if the project name has changed
    if (changes.some(change => change.field === 'name')) {
      const projectManager = oldProject.projectManager;
      const emailText = `Dear Project Manager,\n\nThe project name has been changed.\n\nOld Project Name: ${oldProject.name}\nNew Project Name: ${name}\n\nBest Regards,\nTeam`;
      sendEmail(projectManager, "Project Name Changed", emailText);
    }

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Error updating project", error: error.message });
  }
});


projectSchema.pre("findOneAndDelete", async function (next) {
  const projectId = this.getQuery()["_id"];

  // Delete related tasks
  await Task.deleteMany({ project: projectId });

  // Delete related cards
  await Card.deleteMany({ project: projectId });

  next();
});

// Delete a project
app.delete("/api/projects/:projectId", authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Find the project to be deleted
    const deletedProject = await Project.findById(projectId);
    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Remove all related cards
    await Card.deleteMany({ project: projectId });

    // Remove all related tasks
    await Task.deleteMany({ project: projectId });

    // Remove the project reference from the organization
    await Organization.updateOne(
      { _id: deletedProject.organization },
      { $pull: { projects: projectId } }
    );

    // Remove the project reference from the teams
    if (deletedProject.teams && deletedProject.teams.length > 0) {
      await Team.updateMany(
        { _id: { $in: deletedProject.teams } },
        { $pull: { projects: projectId } }
      );
    }

    // Delete the project from the database
    await Project.findByIdAndDelete(projectId);

    // Construct the repository name
    const organization = await Organization.findById(deletedProject.organization);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const repoName = `${organization.name}-${deletedProject.name}-repo`
      .replace(/\s+/g, "-")
      .toLowerCase();

    // Attempt to delete the GitHub repository, but continue if it fails
    try {
      await axios.delete(
        `https://api.github.com/repos/${organization.name}/${repoName}`,
        {
          headers: {
            Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      console.log("GitHub repository deleted successfully");
    } catch (error) {
      console.error(
        "GitHub repository deletion failed:",
        error.response ? error.response.data : error.message
      );
      // Proceed with project deletion even if GitHub deletion fails
    }

    res.status(200).json({
      message: "Project deleted successfully. GitHub repository deletion was attempted, if applicable.",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Error deleting project", error: error.message });
  }
});



//tasks
//add task

app.post("/api/projects/:projectId/tasks",
  authenticateToken,
  async (req, res) => {
    const { projectId } = req.params;
    const { name, createdBy, createdDate } = req.body;

    try {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const createdByUser = await User.findOne({ email: createdBy });
      if (!createdByUser) {
        return res
          .status(404)
          .json({ message: "User not found for createdBy" });
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

      // Create a new audit log entry
      const newAuditLog = new AuditLog({
        entityType: "Task",
        entityId: newTask._id,
        actionType: "create",
        actionDate: new Date(),
        taskId: newTask._id,
        performedBy: createdByUser.username,
        projectId,
        changes: [
          {
            field: "name",
            oldValue: null,
            newValue: name,
          },
          {
            field: "project",
            oldValue: null,
            newValue: projectId,
          },
          {
            field: "createdBy",
            oldValue: null,
            newValue: createdBy,
          },
          {
            field: "createdDate",
            oldValue: null,
            newValue: createdDate,
          },
        ],
      });

      await newAuditLog.save();

      // Fetch the updated list of tasks
      const updatedProject = await Project.findById(projectId).populate(
        "tasks"
      );
      const updatedTasks = updatedProject.tasks.map((task) => ({
        id: task._id,
        name: task.name,
        cards: task.cards || [],
      }));

      // Emit event for real-time update with the full updated task list
      io.emit("tasksUpdated", { projectId, tasks: updatedTasks });

      res.status(201).json({
        message: "Task created successfully",
        task: newTask,
        tasks: updatedTasks, // Include the updated task list in the response
      });
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Error creating task" });
    }
  }
);

//get task
app.get("/api/projects/:projectId/tasks",
  authenticateToken,
  async (req, res) => {
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
  }
);
app.put("/api/projects/:projectId/tasks/:taskId/move",
  authenticateToken,
  async (req, res) => {
    const { projectId, taskId } = req.params;
    const { newIndex, movedBy, movedDate } = req.body;

    try {
      const project = await Project.findById(projectId).populate("tasks"); // Ensure tasks are populated
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const taskIndex = project.tasks.findIndex(
        (task) => task._id.toString() === taskId
      );
      if (taskIndex === -1) {
        return res.status(404).json({ message: "Task not found in project" });
      }

      // Get the task name for the old index
      const oldTaskName = project.tasks[taskIndex].name;

      // Get the task name for the new index
      let newTaskName = null;
      if (newIndex < project.tasks.length) {
        newTaskName = project.tasks[newIndex].name;
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
        taskId,
        actionType: "move",
        actionDate: movedDate,
        performedBy: movedByUser.username, // Save the email of the user
        changes: [
          {
            field: "from",
            oldValue: `${taskIndex} (Task: ${oldTaskName})`,
            newValue: `${newIndex} (Task: ${newTaskName ? newTaskName : "N/A"
              })`,
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
  }
);

//delelte column
app.delete("/api/projects/:projectId/tasks/:taskId",
  authenticateToken,
  async (req, res) => {
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

      // Remove the task from the project's task list
      project.tasks.splice(taskIndex, 1);
      await project.save();

      // Mark the task as deleted instead of deleting it
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      task.deletedBy = deletedBy;
      task.deletedDate = deletedDate;
      await task.save();

      // Create a new audit log entry
      const deletedByUser = await User.findOne({ email: deletedBy });
      if (!deletedByUser) {
        return res
          .status(404)
          .json({ message: "User not found for deletedBy" });
      }

      const newAuditLog = new AuditLog({
        projectId: projectId,
        entityType: "Task",
        entityId: taskId,
        taskId,
        actionType: "delete",
        actionDate: deletedDate,
        performedBy: deletedByUser.username, // Save the email of the user
        changes: [
          {
            field: "deletedBy",
            oldValue: null,
            newValue: deletedByUser.name,
          },
          {
            field: "deletedDate",
            oldValue: null,
            newValue: deletedDate,
          },
        ],
      });

      await newAuditLog.save();

      // Emit event for real-time update
      io.emit("taskDeleted", { projectId, taskId });

      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Error deleting task" });
    }
  }
);
// Update (rename) task
app.put("/api/projects/:projectId/tasks/:taskId",
  authenticateToken,
  async (req, res) => {
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

      // Create a new audit log entry
      const updatedByUser = await User.findOne({ email: updatedBy });
      if (!updatedByUser) {
        return res
          .status(404)
          .json({ message: "User not found for updatedBy" });
      }

      const newAuditLog = new AuditLog({
        projectId: projectId,
        entityType: "Task",
        entityId: taskId,
        taskId,
        actionType: "update",
        actionDate: updatedDate,
        performedBy: updatedByUser.username, // Save the email of the user
        changes: [
          {
            field: "name",
            oldValue: oldName,
            newValue: name,
          },
          {
            field: "updatedBy",
            oldValue: null,
            newValue: updatedBy,
          },
          {
            field: "updatedDate",
            oldValue: null,
            newValue: updatedDate,
          },
        ],
      });

      await newAuditLog.save();

      // Emit event for real-time update
      io.emit("taskRenamed", { projectId, taskId, newName: name });

      res.status(200).json({ message: "Task updated successfully", task });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Error updating task" });
    }
  }
);

//Create card



let sequenceNumber = 1000;

function generateUniqueId() {
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  sequenceNumber++;
  const uniquePart = sequenceNumber.toString().padStart(4, '0');
  return timestamp + uniquePart;
}
const uniqueId = generateUniqueId();



app.get('/api/organization/:organizationId/projects', authenticateToken, async (req, res) => {
  const { organizationId } = req.params;

  try {
    const projects = await Project.find({ organization: organizationId });
    if (!projects.length) {
      return res.status(404).json({ message: 'No projects found for this organization' });
    }
    res.status(200).json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

app.get('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    const tasks = await Task.find({ project: projectId });
    if (!tasks.length) {
      return res.status(404).json({ message: 'No tasks found for this project' });
    }
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});



app.post("/api/tasks/:taskId/cards", authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { name, description, assignedTo, assignDate, dueDate, createdBy, estimatedHours } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const uniqueId = generateUniqueId(); // Generate the unique identifier

    const newCard = new Card({
      name,
      description,
      assignedTo,
      createdBy,
      assignDate,
      dueDate,
      estimatedHours,
      task: taskId,

      project: task.project,
      createdDate: new Date(),
      createdBy,
      uniqueId,  // Save the unique ID in the card
    });

    await newCard.save();
    task.card.push(newCard._id);
    await task.save();

    const createdByUser = await User.findOne({ email: createdBy });
    if (!createdByUser) {
      return res.status(404).json({ message: "User not found for createdBy" });
    }

    const newAuditLog = new AuditLog({
      entityType: "Card",
      entityId: newCard._id,
      actionType: "create",
      actionDate: new Date(),
      performedBy: createdByUser.username,
      projectId: task.project,
      taskId: task._id,
      cardId: newCard._id,
      changes: [
        { field: "name", oldValue: null, newValue: name },
        { field: "estimatedHours", oldValue: null, newValue: estimatedHours }, // Log estimatedTime change
        // Add other relevant changes if needed
      ],
    });

    await newAuditLog.save();



    const newActivity = new Activity({
      commentBy: createdByUser.username,
      comment: `Card created by ${createdByUser.username}`,
      card: newCard._id,
    });
    await newActivity.save();

    newCard.activities.push(newActivity._id);
    await newCard.save();

    const assignedUser = await User.findOne({ email: assignedTo });
    if (!assignedUser) {
      return res.status(404).json({ message: "Assigned user not found" });
    }

    const newNotification = new Notification({
      userId: assignedUser._id,
      projectId: task.project,
      message: `is assigned to the "${name}" task on Project "${project.name}"`,
      type: "TASK_ASSIGNED",
      cardId: newCard._id,
      assignedByEmail: createdByUser.username,
    });
    await newNotification.save();

    // Send an email to the assigned user
    const emailSubject = `You have been assigned a new task: "${name}"`;
    const emailText = `Hello ${assignedUser.name},\n\nYou have been assigned to a new card with the task ID ${uniqueId} on the task "${name}" in Project "${project.name}".\n\nBest regards,\nThe Team`;
    sendEmail(assignedTo, emailSubject, emailText);


    io.emit("cardCreated", { taskId, card: newCard });



    res.status(201).json({ message: "Card created successfully", card: newCard });
  } catch (error) {
    console.error("Error creating card:", error);
    res.status(500).json({ message: "Error creating card" });
  }
});




app.post("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;


    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Fetch notifications for the specified userId
    const notifications = await Notification.find({ userId }, "message");


    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

app.patch("/api/notifications/:notificationId",
  authenticateToken,
  async (req, res) => {
    const { notificationId } = req.params;
    const { readStatus } = req.body;

    try {
      // Find the notification by ID
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Update readStatus
      notification.readStatus = readStatus;
      await notification.save();

      res
        .status(200)
        .json({ message: "Notification updated successfully", notification });
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);
app.post("/api/notifications/unread", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const notifications = await Notification.find({
      userId,
      readStatus: false,
    }).sort({ createdAt: -1 }); // Sort notifications by creation date, most recent first

    res.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/api/cards/:cardId/move", authenticateToken, async (req, res) => {
  const { cardId } = req.params;
  const { sourceTaskId, destinationTaskId, sourceIndex, destinationIndex, movedBy, movedDate } = req.body;

  try {
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const sourceTask = await Task.findById(sourceTaskId);
    const destinationTask = await Task.findById(destinationTaskId);
    if (!sourceTask || !destinationTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Remove card from source task
    sourceTask.card.splice(sourceIndex, 1);
    await sourceTask.save();

    // Add card to destination task
    destinationTask.card.splice(destinationIndex, 0, cardId);
    await destinationTask.save();

    // Update card's task reference
    card.task = destinationTaskId;
    card.movedBy.push(movedBy);
    card.movedDate.push(movedDate);
    await card.save();

    // Log activity
    const movedByUser = await User.findOne({ email: movedBy });
    const newActivity = new Activity({
      commentBy: movedByUser.username,
      comment: `Card moved from ${sourceTask.name} to ${destinationTask.name}`,
      card: card._id,
    });
    await newActivity.save();

    // Create audit log
    const newAuditLog = new AuditLog({
      entityType: "Card",
      entityId: cardId,
      actionType: "move",
      actionDate: movedDate,
      performedBy: movedByUser.username,
      projectId: sourceTask.project,
      taskId: sourceTaskId,
      cardId,
      destinationTaskId,
      changes: [
        { field: "task", oldValue: sourceTask.name, newValue: destinationTask.name },
        { field: "movedBy", oldValue: null, newValue: movedBy },
        { field: "movedDate", oldValue: null, newValue: movedDate },
      ],
    });
    await newAuditLog.save();

    // Emit real-time event
    io.emit("cardMoved", { cardId, sourceTaskId, destinationTaskId });

    res.status(200).json({ message: "Card moved successfully", card });
  } catch (error) {
    console.error("Error moving card:", error);
    res.status(500).json({ message: "Error moving card" });
  }
});


app.put("/api/tasks/:taskId/cards/:cardId/reorder", authenticateToken, async (req, res) => {
  const { taskId, cardId } = req.params;
  const { newIndex, oldIndex, movedBy, movedDate } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const cardIndex = task.card.indexOf(cardId);
    if (cardIndex === -1) {
      return res.status(404).json({ message: "Card not found in task" });
    }

    // Remove card from the old index
    task.card.splice(oldIndex, 1);
    // Insert card at the new index
    task.card.splice(newIndex, 0, cardId);
    await task.save();

    // Log activity
    const movedByUser = await User.findOne({ email: movedBy });
    const newActivity = new Activity({
      commentBy: movedByUser.username,
      comment: `Card reordered within ${task.name}`,
      card: cardId,
    });
    await newActivity.save();

    res.status(200).json({ message: "Card reordered successfully", task });
  } catch (error) {
    console.error("Error reordering card:", error);
    res.status(500).json({ message: "Error reordering card" });
  }
});

const handleCardMove = async (card, source, destination) => {
  // Optimistically update the UI
  const updatedBoard = moveCard(boardData, source, destination);
  setBoardData(updatedBoard);

  const movedBy = await fetchUserEmail();

  try {
    // Check if the card is being moved within the same column (reordering)
    if (source.fromColumnId === destination.toColumnId) {
      const response = await axios.put(
        `${server}/api/tasks/${source.fromColumnId}/cards/${card.id}/reorder`,
        {
          oldIndex: source.fromPosition,
          newIndex: destination.toPosition,
          movedBy,
          movedDate: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );

      if (response.status !== 200) {
        throw new Error("Failed to reorder card");
      }
    } else {
      // Moving card to a different column
      const response = await axios.put(
        `${server}/api/cards/${card.id}/move`,
        {
          sourceTaskId: source.fromColumnId,
          destinationTaskId: destination.toColumnId,
          sourceIndex: source.fromPosition,
          destinationIndex: destination.toPosition,
          movedBy,
          movedDate: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );

      if (response.status !== 200) {
        throw new Error("Failed to move card");
      }
    }

    // Refetch the board data to ensure frontend and backend are in sync
    await fetchTasks();
  } catch (error) {
    console.error("Error moving/reordering card:", error);
    // Revert the frontend state if the backend update fails
    setBoardData(boardData);
  }
};

//in page to put comments
app.put("/api/tasks/:taskId/cards/:cardId",
  authenticateToken,
  async (req, res) => {
    const { taskId, cardId } = req.params;
    const { name, description, updatedBy, updatedDate, comment } = req.body;

    try {
      // Find the task by ID
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Find the card by ID
      const card = await Card.findById(cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Track changes
      const changes = [];
      if (name !== undefined && card.name !== name) {
        changes.push({ field: "name", oldValue: card.name, newValue: name });
        card.name = name;
      }
      if (description !== undefined && card.description !== description) {
        changes.push({ field: "description", oldValue: card.description, newValue: description });
        card.description = description;
      }

      // Find the user who updated the card
      const updatedByUser = await User.findOne({ email: updatedBy });
      if (!updatedByUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update updatedBy and updatedDate fields
      if (updatedBy) {
        if (!card.updatedBy) {
          card.updatedBy = [];
        }
        if (!card.updatedBy.includes(updatedBy)) {
          card.updatedBy.push(updatedBy);
        }
      }
      if (updatedDate) {
        if (!card.updatedDate) {
          card.updatedDate = [];
        }
        if (!card.updatedDate.includes(updatedDate)) {
          card.updatedDate.push(updatedDate);
        }
      }

      // Save the card
      await card.save();

      // Create audit log entry for card update if there are changes
      if (changes.length > 0) {
        const newAuditLog = new AuditLog({
          entityType: "Card",
          entityId: cardId,
          actionType: "update",
          actionDate: updatedDate,
          performedBy: updatedByUser.username,
          projectId: task.project,
          taskId: taskId,
          cardId: cardId,
          changes: changes,
        });
        await newAuditLog.save();
      }

      // Save the comment if provided
      if (comment) {
        const newComment = new Comment({
          comment: comment,
          commentBy: updatedByUser.username,
          card: card._id,
        });
        await newComment.save();
        card.comments.push(newComment._id);
        await card.save();
      } else {
        // Create an activity log entry if no specific comment was provided
        const newActivity = new Activity({
          commentBy: updatedByUser.username,
          comment: `Card updated by ${updatedByUser.name}`,
          card: card._id,
        });
        await newActivity.save();
        card.activities.push(newActivity._id);
        await card.save();
      }

      // Create a notification for the assigned user
      const project = await Project.findById(task.project);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const assignedUser = await User.findOne({ email: card.assignedTo });
      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned user not found" });
      }

      const notificationMessage = ` has renamed the task "${card.name}" to "${name}" on Project "${project.name}"`;

      const newNotification = new Notification({
        userId: assignedUser._id,
        projectId: task.project,
        message: notificationMessage,
        type: "TASK_RENAMED",
        cardId: card._id,
        assignedByEmail: updatedByUser.username,
      });

      await newNotification.save();

      // Emit event for real-time update
      io.emit("cardUpdated", {
        taskId,
        cardId,
        newName: name,
        newDescription: description,
      });

      res.status(200).json({ message: "Card updated successfully", card });
    } catch (error) {
      console.error("Error updating card:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);




//sending the comments to through this api
app.post("/api/card/:cardId/comments", authenticateToken, async (req, res) => {
  const { cardId } = req.params;
  const { comment } = req.body;
  const userEmail = req.user.email; // Assuming the token has the user's email

  try {
    // Find the user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the card by ID
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Create a new comment
    const newComment = new Comment({
      comment,
      commentBy: user.username,
      card: card._id,
    });

    // Save the comment
    await newComment.save();

    // Add the comment to the card's comments array
    card.comments.push(newComment._id);
    await card.save();

    res.status(201).json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    console.error("Error saving comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/tasks/:taskId/cards", authenticateToken, async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId).populate({
      path: "card",
      populate: [
        {
          path: "comments",
          model: "Comment",
        },
        {
          path: "activities",
          model: "Activity",

        },
        {
          path: "taskLogs", // Populate task logs for each card
          model: "Tasklogs",
          populate: {
            path: "loggedBy", // Optionally populate loggedBy details
            model: "User",
            select: "name email username", // Fetch only the necessary fields
          },
        },
        {
          path: "project", // Populate the project details
          model: "Project",
          select: "name description projectManager projectManagerName organization", // Fetch only the necessary fields
        },
      ],
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const cardIds = task.card.map((card) => card._id);

    // Calculate the sum of logged hours for each card
    const logs = await Tasklogs.aggregate([
      { $match: { cardId: { $in: cardIds } } },
      { $group: { _id: "$cardId", totalHours: { $sum: "$hours" } } },
    ]);

    // Create a map of cardId to total logged hours
    const hoursMap = logs.reduce((map, log) => {
      map[log._id] = log.totalHours;
      return map;
    }, {});

    // Create a map to store user details (email -> username) to avoid multiple database calls
    const userMap = {};

    // Helper function to get the username by email
    const getUsernameByEmail = async (email) => {
      if (userMap[email]) {
        return userMap[email]; // Use cached username if available
      }
      const user = await User.findOne({ email }, "username"); // Only fetch the username
      if (user) {
        userMap[email] = user.username; // Cache the username
        return user.username;
      }
      return email; // Return email if user is not found
    };

    // Fetch card details along with usernames
    const cards = await Promise.all(
      task.card.map(async (card) => ({
        id: card._id,
        name: card.name,
        description: card.description,
        assignedTo: await getUsernameByEmail(card.assignedTo),
        createdBy: await getUsernameByEmail(card.createdBy),
        status: card.status,
        estimatedHours: card.estimatedHours,
        utilizedHours: hoursMap[card._id] || 0, // Include total logged hours
        uniqueId: card.uniqueId,
        createdDate: moment(card.createdDate)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
        assignDate: moment(card.assignDate)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
        dueDate: moment(card.dueDate)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
        comments: card.comments.map((comment) => ({
          id: comment._id,
          comment: comment.comment,
          commentBy: comment.commentBy,
          createdAt: moment(comment.createdAt)
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
        })),
        activities: card.activities.map((activity) => ({
          id: activity._id,
          commentBy: activity.commentBy,
          comment: activity.comment,
          createdAt: moment(activity.createdAt)
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
        })),
        taskLogs: card.taskLogs.map((taskLog) => ({
          id: taskLog._id,
          hours: taskLog.hours,
          logDate: moment(taskLog.logDate)
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
          loggedBy: {
            id: taskLog.loggedBy._id,
            name: taskLog.loggedBy.username,
            email: taskLog.loggedBy.email,
          },
        })),
        project: {
          id: card.project._id,
          name: card.project.name,
          description: card.project.description,
          projectManager: card.project.projectManager,
          projectManagerName: card.project.projectManagerName,
          organization: card.project.organization,
        }, // Include project details
      }))
    );



    // Include the task name in the response
    res.status(200).json({ taskName: task.name, cards });

  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ message: "Error fetching cards" });
  }
});

app.get("/api/organizations/:orgId/cards", authenticateToken, async (req, res) => {
  const { orgId } = req.params;

  try {
    // Find all projects in the specified organization
    const projects = await Project.find({ organization: orgId });

    if (!projects || projects.length === 0) {
      return res.status(404).json({ message: "No projects found for the organization" });
    }

    // Extract all project IDs
    const projectIds = projects.map((project) => project._id);

    // Find all cards for these projects
    const cards = await Card.find({ project: { $in: projectIds } })
      .populate({
        path: "task", // Assuming 'task' is the reference field in the Card schema
        model: "Task",
        select: "_id name", // Select task ID and name if needed
      })
      .populate({
        path: "comments",
        model: "Comment",
      })
      .populate({
        path: "activities",
        model: "Activity",
      })
      .populate({
        path: "taskLogs",
        model: "Tasklogs",
        populate: {
          path: "loggedBy",
          model: "User",
          select: "name email",
        },
      });

    // Calculate the sum of logged hours for each card
    const cardIds = cards.map((card) => card._id);
    const logs = await Tasklogs.aggregate([
      { $match: { cardId: { $in: cardIds } } },
      { $group: { _id: "$cardId", totalHours: { $sum: "$hours" } } },
    ]);

    // Create a map of cardId to total logged hours
    const hoursMap = logs.reduce((map, log) => {
      map[log._id] = log.totalHours;
      return map;
    }, {});

    // Map and format the card details including taskId
    const formattedCards = cards.map((card) => ({
      id: card._id,
      taskId: card.task ? card.task._id : null, // Include taskId if available
      name: card.name,
      description: card.description,
      assignedTo: card.assignedTo,
      createdBy: card.createdBy,
      status: card.status,
      estimatedHours: card.estimatedHours,
      utilizedHours: hoursMap[card._id] || 0,
      uniqueId: card.uniqueId,
      createdDate: moment(card.createdDate)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss"),
      assignDate: card.assignDate
        ? moment(card.assignDate).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")
        : null,
      dueDate: card.dueDate
        ? moment(card.dueDate).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")
        : null,

      comments: card.comments?.map((comment) => ({
        id: comment._id,
        comment: comment.comment,
        commentBy: comment.commentBy,
        createdAt: moment(comment.createdAt)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
      })) || [],

      activities: card.activities?.map((activity) => ({
        id: activity._id,
        commentBy: activity.commentBy,
        comment: activity.comment,
        createdAt: moment(activity.createdAt)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
      })) || [],

      taskLogs: card.taskLogs?.map((taskLog) => ({
        id: taskLog._id,
        hours: taskLog.hours,
        logDate: moment(taskLog.logDate)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
        loggedBy: taskLog.loggedBy
          ? {
            id: taskLog.loggedBy._id,
            name: taskLog.loggedBy.name,
            email: taskLog.loggedBy.email,
          }
          : null,
      })) || [],

    }));

    res.status(200).json({ cards: formattedCards });
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ message: "Error fetching cards" });
  }
});


// app.get("/api/organizations/:orgId/cards", authenticateToken, async (req, res) => {
//   const { orgId } = req.params;

//   try {
//     // Find all projects in the specified organization
//     const projects = await Project.find({ organization: orgId });

//     if (!projects || projects.length === 0) {
//       return res.status(404).json({ message: "No projects found for the organization" });
//     }

//     // Extract all project IDs
//     const projectIds = projects.map((project) => project._id);

//     // Find all cards for these projects
//     const cards = await Card.find({ project: { $in: projectIds } })
//       .populate({
//         path: "task", // Assuming 'task' is the reference field in the Card schema
//         model: "Task",
//         select: "_id name", // Select task ID and name if needed
//       })
//       .populate({
//         path: "comments",
//         model: "Comment",
//       })
//       .populate({
//         path: "activities",
//         model: "Activity",
//       })
//       .populate({
//         path: "taskLogs",
//         model: "Tasklogs",
//         populate: {
//           path: "loggedBy",
//           model: "User",
//           select: "name email",
//         },
//       });

//     // Calculate the sum of logged hours for each card
//     const cardIds = cards.map((card) => card._id);
//     const logs = await Tasklogs.aggregate([
//       { $match: { cardId: { $in: cardIds } } },
//       { $group: { _id: "$cardId", totalHours: { $sum: "$hours" } } },
//     ]);

//     // Create a map of cardId to total logged hours
//     const hoursMap = logs.reduce((map, log) => {
//       map[log._id] = log.totalHours;
//       return map;
//     }, {});

//     // Map and format the card details including taskId
//     const formattedCards = cards.map((card) => ({
//       id: card._id,
//       taskId: card.task ? card.task._id : null, // Include taskId if available
//       name: card.name,
//       description: card.description,
//       assignedTo: card.assignedTo,
//       createdBy: card.createdBy,
//       status: card.status,
//       estimatedHours: card.estimatedHours,
//       utilizedHours: hoursMap[card._id] || 0,
//       uniqueId: card.uniqueId,
//       createdDate: moment(card.createdDate)
//         .tz("Asia/Kolkata")
//         .format("YYYY-MM-DD HH:mm:ss"),
//       assignDate: moment(card.assignDate)
//         .tz("Asia/Kolkata")
//         .format("YYYY-MM-DD HH:mm:ss"),
//       dueDate: moment(card.dueDate)
//         .tz("Asia/Kolkata")
//         .format("YYYY-MM-DD HH:mm:ss"),
//       comments: card.comments.map((comment) => ({
//         id: comment._id,
//         comment: comment.comment,
//         commentBy: comment.commentBy,
//         createdAt: moment(comment.createdAt)
//           .tz("Asia/Kolkata")
//           .format("YYYY-MM-DD HH:mm:ss"),
//       })),
//       activities: card.activities.map((activity) => ({
//         id: activity._id,
//         commentBy: activity.commentBy,
//         comment: activity.comment,
//         createdAt: moment(activity.createdAt)
//           .tz("Asia/Kolkata")
//           .format("YYYY-MM-DD HH:mm:ss"),
//       })),
//       taskLogs: card.taskLogs.map((taskLog) => ({
//         id: taskLog._id,
//         hours: taskLog.hours,
//         logDate: moment(taskLog.logDate)
//           .tz("Asia/Kolkata")
//           .format("YYYY-MM-DD HH:mm:ss"),
//         loggedBy: {
//           id: taskLog.loggedBy._id,
//           name: taskLog.loggedBy.name,
//           email: taskLog.loggedBy.email,
//         },
//       })),
//     }));

//     res.status(200).json({ cards: formattedCards });
//   } catch (error) {
//     console.error("Error fetching cards:", error);
//     res.status(500).json({ message: "Error fetching cards" });
//   }
// });


// Delete a card from a task

app.delete("/api/tasks/:taskId/cards/:cardId",
  authenticateToken,
  async (req, res) => {
    const { taskId, cardId } = req.params;
    const { deletedBy, deletedDate } = req.body;

    try {
      // Find the task
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Find the card
      const card = await Card.findById(cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Check if the card is part of the task
      const cardIndex = task.card.indexOf(cardId); // Change 'task.card' to 'task.cards'
      if (cardIndex === -1) {
        return res.status(404).json({ message: "Card not found in task" });
      }

      // Find the user who deleted the card
      const deletedByUser = await User.findOne({ email: deletedBy });
      if (!deletedByUser) {
        return res
          .status(404)
          .json({ message: "User not found for deletedBy" });
      }

      // Create audit log entry for card deletion
      const newAuditLog = new AuditLog({
        entityType: "Card",
        entityId: cardId,
        actionType: "delete",
        actionDate: deletedDate,
        performedBy: deletedByUser.username,
        projectId: task.project,
        taskId,
        cardId,
        changes: [
          { field: "deletedBy", oldValue: null, newValue: deletedByUser.name },
          { field: "deletedDate", oldValue: null, newValue: deletedDate },
        ],
      });

      await newAuditLog.save();

      // Remove the card from the task
      task.card.splice(cardIndex, 1);
      await task.save();

      // Delete the card from the database
      await Card.findByIdAndDelete(cardId);

      const assignedUser = await User.findOne({ email: card.assignedTo });
      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned user not found" });
      }

      const project = await Project.findById(task.project);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Create a notification for the card deletion
      // const notification = new Notification({
      //   userId: assignedUser._id,
      //   projectId: task.project,
      //   // message: `Card with ID ${cardId} has been deleted.`,
      //   message: `${deletedByUser.name} has been deleted task "${card.name}" on project "${project.name}".`,
      //   type: 'CARD_DELETED',
      //   assignedByEmail: deletedBy,
      //   cardId,
      //   readStatus: false,
      // });

      // await notification.save();

      // Emit a socket event for card deletion
      io.emit("cardDeleted", { taskId, cardId });

      // Respond with success message
      res.status(200).json({ message: "Card deleted successfully" });
    } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({ message: "Error deleting card" });
    }
  }
);

// Log hours for a specific card
app.post('/api/log-hours', async (req, res) => {
  try {
    const { taskId, cardId, hours, loggedBy, projectId } = req.body;

    // Find the user who is logging the hours
    const loggedByUser = await User.findOne({ email: loggedBy });
    if (!loggedByUser) {
      return res.status(404).json({ message: "User not found for loggedBy" });
    }

    // Find the card by ID
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Check if the card status is 'pending' and update it to 'in progress'
    if (card.status === 'pending') {
      const previousStatus = card.status;
      card.status = 'inprogress';

      // Log status update in activity
      const statusActivity = new Activity({
        comment: `Card status updated from ${previousStatus} to inprogress by ${loggedByUser.username}`,
        commentBy: loggedByUser.username,
        card: card._id,
      });
      await statusActivity.save();
      card.activities.push(statusActivity._id);
    }

    // Save the updated card with the new status if it was changed
    await card.save();

    // Create a new Tasklog entry
    const newLog = new Tasklogs({
      taskId,
      cardId,
      projectId,
      hours,
      loggedBy: loggedByUser._id,
    });

    await newLog.save();

    // Add the new log to the card's taskLogs array
    card.taskLogs.push(newLog._id);
    await card.save();

    res.status(201).json({ message: 'Hours logged successfully', log: newLog, cardStatus: card.status });
  } catch (error) {
    console.error('Error logging hours:', error);
    res.status(500).json({ message: 'Error logging hours' });
  }
});





app.put("/api/cards/:cardId/status", authenticateToken, async (req, res) => {
  const { cardId } = req.params;
  const { status, updatedBy, updatedDate } = req.body;

  try {
    // Find the card by ID
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const oldStatus = card.status;
    card.status = status;

    // Update updatedBy and updatedDate fields
    if (!card.updatedBy) {
      card.updatedBy = [];
    }
    card.updatedBy.push(updatedBy);
    if (!card.updatedDate) {
      card.updatedDate = [];
    }
    card.updatedDate.push(updatedDate);

    // Save the updated card
    await card.save();

    // Find the user who updated the card
    const updatedByUser = await User.findOne({ email: updatedBy });
    if (!updatedByUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a new audit log entry
    const newAuditLog = new AuditLog({
      entityType: "Card",
      entityId: cardId,
      actionType: "update",
      actionDate: updatedDate,
      performedBy: updatedByUser.username,
      projectId: card.project, // Include projectId in the audit log
      taskId: card.task, // Include taskId in the audit log
      cardId,
      changes: [{ field: "status", oldValue: oldStatus, newValue: status }],
    });

    await newAuditLog.save();

    // Create a new activity log entry
    const newActivity = new Activity({
      commentBy: updatedByUser.name,
      comment: `Card status updated from ${oldStatus} to ${status}`,
      card: card._id,
    });

    await newActivity.save();

    // Add the activity to the card's activities
    card.activities.push(newActivity._id);
    await card.save();

    // Emit event for real-time update
    io.emit("cardStatusUpdated", { cardId, newStatus: status });

    res.status(200).json({ message: "Card status updated successfully", card });
  } catch (error) {
    console.error("Error updating card status:", error);
    res.status(500).json({ message: "Error updating card status" });
  }
});






// //teams related apis
app.post("/api/projects/:projectId/teams/addUser", authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { email, teamName, addedBy, addedDate } = req.body; // Removed addedDate since we'll generate it

  try {
    const project = await Project.findById(projectId).populate("teams");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    let team = project.teams.find((team) => team.name === teamName);
    if (!team) {
      team = new Team({
        name: teamName,
        users: [],
        addedBy,
        addedDate: new Date(),
      });
      await team.save();
      // console.log("addedBy", addedBy);

      project.teams.push(team._id);
      await project.save();
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user has an 'ADMIN' role
    if (user.role === "ADMIN") {
      return res
        .status(400)
        .json({ message: "Admin users cannot be added to teams" });
    }

    // Check if the user status is 'unverify'
    if (user.status === "UNVERIFY") {
      return res.status(400).json({
        message:
          "This user email is not verified. Please verify the email before adding into team.",
      });
    }

    const userInTeam = team.users.find(
      (u) => u.user.toString() === user._id.toString()
    );
    if (userInTeam) {
      return res.status(400).json({ message: "User is already in the team" });
    }

    team.users.push({ user: user._id, role: "USER" });
    await team.save();

    res
      .status(200)
      .json({ message: "User added to team successfully", team });
  } catch (error) {
    console.error("Error adding user to team:", error);
    res.status(500).json({ message: "Error adding user to team" });
  }
}
);
// Endpoint to get all users under all teams based on project ID
app.get("/api/projects/:projectId/teams/users", authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findById(projectId).populate({
      path: "teams",
      populate: {
        path: "users.user",
        model: "User",
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const users = [];
    project.teams.forEach((team) => {
      team.users.forEach((user) => {
        users.push({
          name: user.user.name,
          email: user.user.email,
          role: user.role,
          team: team.name,
        });
      });
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching team users:", error);
    res.status(500).json({ message: "Error fetching team users" });
  }
}
);
// Endpoint to get users under a specific team based on project ID and team name
app.get("/api/projects/:projectId/teams/:teamName/users", authenticateToken, async (req, res) => {
  const { projectId, teamName } = req.params;
  try {
    const project = await Project.findById(projectId).populate({
      path: "teams",
      match: { name: teamName },
      populate: {
        path: "users.user",
        model: "User",
      },
    });

    if (!project || project.teams.length === 0) {
      return res.status(404).json({ message: "Team not found" });
    }

    const team = project.teams[0];
    const users = team.users.map((user) => ({
      name: user.user.name,
      email: user.user.email,
      role: user.role,
      team: team.name,
    }));

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching team users:", error);
    res.status(500).json({ message: "Error fetching team users" });
  }
}
);

// Endpoint to delete a user from a team
app.delete("/api/projects/:projectId/teams/:teamName/users",
  authenticateToken,
  async (req, res) => {
    const { projectId, teamName } = req.params;
    const { email, removedBy } = req.body;

    try {
      const project = await Project.findById(projectId).populate("teams");
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const team = project.teams.find((t) => t.name === teamName);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userIndex = team.users.findIndex(
        (u) => u.user.toString() === user._id.toString()
      );
      if (userIndex === -1) {
        return res.status(404).json({ message: "User not found in the team" });
      }

      team.users.splice(userIndex, 1);
      await team.save();

      res
        .status(200)
        .json({ message: "User removed from team successfully", removedBy });
    } catch (error) {
      console.error("Error removing user from team:", error);
      res.status(500).json({ message: "Error removing user from team" });
    }
  }
);

//teams inside organization

// Create a team inside an organization and a GitHub organization

app.post("/api/organizations/:organizationId/teams", authenticateToken, async (req, res) => {
  const { organizationId } = req.params;
  const { teamName, addedBy } = req.body;

  try {
    // Fetch the organization by ID
    const organization = await Organization.findById(organizationId).populate("teams");
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Check if the team with the same name already exists
    let team = organization.teams.find((team) => team.name === teamName);
    if (team) {
      return res.status(400).json({ message: "Team with this name already exists" });
    }

    // Create a new team
    team = new Team({
      name: teamName,
      users: [],
      addedBy,
      addedDate: new Date(),
    });

    // Save the team to get an ID before GitHub slug update
    await team.save();

    // Add the team ID to the organization's teams list and save
    organization.teams.push(team._id);
    await organization.save();

    // Attempt to create the team on GitHub if `teamName` is provided
    if (teamName) {
      try {
        const githubTeamResponse = await axios.post(
          `https://api.github.com/orgs/${organization.name}/teams`,
          {
            name: teamName,
            privacy: "closed",
          },
          {
            headers: {
              Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Update the team with the GitHub slug
        team.slug = githubTeamResponse.data.slug;
        await team.save();

        res.status(200).json({
          message: "Team created successfully, including GitHub team",
          team,
          githubTeam: githubTeamResponse.data,
        });
      } catch (error) {
        console.error("Error creating GitHub team:", error.response ? error.response.data : error.message);

        // Return success for team creation, but with a warning about GitHub failure
        res.status(200).json({
          message: "Team created successfully, but GitHub team creation failed",
          team,
          githubError: error.message,
        });
      }
    } else {
      // If no `teamName` is provided, just create the team without GitHub
      res.status(200).json({
        message: "Team created successfully",
        team,
      });
    }
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Error creating team", error: error.message });
  }
});

app.get("/api/organizations/:organizationId/teams",
  authenticateToken,
  async (req, res) => {
    const { organizationId } = req.params;

    try {
      const organization = await Organization.findById(organizationId).populate(
        "teams"
      );
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const teams = organization.teams;

      res.status(200).json({ teams });
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Error fetching teams" });
    }
  }
);
// Delete team inside organization
// Delete team inside organization
app.delete("/api/organizations/:organizationId/teams/:teamId", authenticateToken, async (req, res) => {
  const { organizationId, teamId } = req.params;

  try {
    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if the team is part of the organization
    const teamIndex = organization.teams.indexOf(teamId);
    if (teamIndex === -1) {
      return res.status(404).json({ message: "Team not found in this organization" });
    }

    // Remove the team from the organization
    organization.teams.splice(teamIndex, 1);
    await organization.save();

    // Delete the team from MongoDB
    await Team.findByIdAndDelete(teamId);

    // Attempt to delete the team from GitHub if team name exists
    if (team.name) {
      const teamSlug = team.name.replace(/\s+/g, '-').toLowerCase();

      try {
        const githubTeamResponse = await axios.delete(
          `https://api.github.com/orgs/${organization.name}/teams/${teamSlug}`,
          {
            headers: {
              Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("GitHub team deleted:", githubTeamResponse.data);
      } catch (error) {
        console.error("Error deleting GitHub team:", error.response ? error.response.data : error.message);
      }
    }

    res.status(200).json({ message: "Team deleted successfully from MongoDB (GitHub deletion attempted if applicable)" });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ message: "Error deleting team", error: error.message });
  }
});

// Edit team inside organization
app.put("/api/organizations/:organizationId/teams/:teamId", authenticateToken, async (req, res) => {
  const { organizationId, teamId } = req.params;
  const { teamName } = req.body;

  try {
    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const oldTeamName = team.name;
    team.name = teamName;
    await team.save();

    // Attempt to update the team on GitHub if team name exists
    if (oldTeamName) {
      const oldTeamSlug = oldTeamName.replace(/\s+/g, '-').toLowerCase();
      const newTeamSlug = teamName.replace(/\s+/g, '-').toLowerCase();

      try {
        const githubTeamResponse = await axios.patch(
          `https://api.github.com/orgs/${organization.name}/teams/${oldTeamSlug}`,
          { name: teamName },
          {
            headers: {
              Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("GitHub team updated:", githubTeamResponse.data);
      } catch (error) {
        console.error("Error updating GitHub team:", error.response ? error.response.data : error.message);
      }
    }

    res.status(200).json({ message: "Team updated successfully in MongoDB (GitHub update attempted if applicable)", team });
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ message: "Error updating team", error: error.message });
  }
});


app.post("/api/organizations/:organizationId/teams/:teamId/users",
  authenticateToken,
  async (req, res) => {
    const { organizationId, teamId } = req.params;
    const { username, role } = req.body;

    try {
      // Find the organization
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Find the team
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if the team belongs to the organization
      if (!organization.teams.includes(team._id)) {
        return res
          .status(400)
          .json({ message: "Team does not belong to this organization" });
      }

      // Find the user
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the user has an 'ADMIN' role
      if (user.role === "ADMIN") {
        return res
          .status(400)
          .json({ message: "Admin users cannot be added to teams" });
      }

      // Check if the user status is 'unverify'
      if (user.status === "UNVERIFY") {
        return res.status(400).json({
          message:
            "This user's email is not verified. Please verify the email before adding to the team.",
        });
      }

      // Check if the user is already in the team
      const userInTeam = team.users.find(
        (u) => u.user.toString() === user._id.toString()
      );
      if (userInTeam) {
        return res.status(400).json({ message: "User is already in the team" });
      }

      // Add the user to the team in MongoDB
      team.users.push({ user: user._id, role: role || "USER" });
      await team.save();

      // Conditionally add the user to the GitHub team if username is provided
      if (user.name) {
        // Format team name for GitHub API
        const teamSlug = team.name.replace(/\s+/g, '-').toLowerCase();

        try {
          // Add the user to the GitHub team
          const githubTeamResponse = await axios.put(
            `https://api.github.com/orgs/${organization.name}/teams/${teamSlug}/memberships/${user.name}`,
            {},
            {
              headers: {
                Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          res.status(200).json({
            message:
              "User added to team successfully in MongoDB and GitHub. Invitation email sent.",
            team,
            githubTeam: githubTeamResponse.data,
          });
        } catch (error) {
          console.error("Error adding user to GitHub team:", error);
          return res.status(500).json({
            message:
              "User added to team in MongoDB but failed to add to GitHub team.",
            error: error.message,
          });
        }
      } else {
        // If no username, skip GitHub team addition and only add to MongoDB
        res.status(200).json({
          message: "User added to team successfully in MongoDB.",
          team,
        });
      }
    } catch (error) {
      console.error("Error adding user to team:", error);
      res
        .status(500)
        .json({ message: "Error adding user to team", error: error.message });
    }
  }
);
app.post("/api/organizations/:organizationId/teams/:teamId/users",
  authenticateToken,
  async (req, res) => {
    const { organizationId, teamId } = req.params;
    const { username, role } = req.body;

    try {
      // Find the organization
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Find the team
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if the team belongs to the organization
      if (!organization.teams.includes(team._id)) {
        return res
          .status(400)
          .json({ message: "Team does not belong to this organization" });
      }

      // Find the user
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the user has an 'ADMIN' role
      if (user.role === "ADMIN") {
        return res
          .status(400)
          .json({ message: "Admin users cannot be added to teams" });
      }

      // Check if the user status is 'unverify'
      if (user.status === "UNVERIFY") {
        return res.status(400).json({
          message:
            "This user's email is not verified. Please verify the email before adding to the team.",
        });
      }

      // Check if the user is already in the team
      const userInTeam = team.users.find(
        (u) => u.user.toString() === user._id.toString()
      );
      if (userInTeam) {
        return res.status(400).json({ message: "User is already in the team" });
      }

      // Add the user to the team in MongoDB
      team.users.push({ user: user._id, role: role || "USER" });
      await team.save();

      // Conditionally add the user to the GitHub team if username is provided
      if (user.name) {
        // Format team name for GitHub API
        const teamSlug = team.name.replace(/\s+/g, '-').toLowerCase();

        try {
          // Add the user to the GitHub team
          const githubTeamResponse = await axios.put(
            `https://api.github.com/orgs/${organization.name}/teams/${teamSlug}/memberships/${user.name}`,
            {},
            {
              headers: {
                Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          res.status(200).json({
            message:
              "User added to team successfully in MongoDB and GitHub. Invitation email sent.",
            team,
            githubTeam: githubTeamResponse.data,
          });
        } catch (error) {
          console.error("Error adding user to GitHub team:", error);
          return res.status(500).json({
            message:
              "User added to team in MongoDB but failed to add to GitHub team.",
            error: error.message,
          });
        }
      } else {
        // If no username, skip GitHub team addition and only add to MongoDB
        res.status(200).json({
          message: "User added to team successfully in MongoDB.",
          team,
        });
      }
    } catch (error) {
      console.error("Error adding user to team:", error);
      res
        .status(500)
        .json({ message: "Error adding user to team", error: error.message });
    }
  }
);

app.get("/api/projects/:projectId/users/search", authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { username } = req.query;

  try {
    const project = await Project.findById(projectId).populate({
      path: "teams",
      populate: {
        path: "users.user",
        model: "User",
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const matchingUsers = [];
    project.teams.forEach((team) => {
      team.users.forEach((user) => {
        if (!username || user.user.username.toLowerCase().includes(username.toLowerCase())) {
          matchingUsers.push({
            name: user.user.name,
            email: user.user.email,
            username: user.user.username,
            role: user.role,
            team: team.name,
          });
        }
      });
    });

    if (matchingUsers.length === 0) {
      return res.status(404).json({
        message: "No users found within the project teams with the given username",
      });
    }

    res.status(200).json({ users: matchingUsers });
  } catch (error) {
    console.error("Error searching project team users:", error);
    res.status(500).json({ message: "Error searching project team users" });
  }
});


app.get("/api/organizations/:organizationId/teams/:teamId/users", authenticateToken,
  async (req, res) => {
    const { organizationId, teamId } = req.params;

    try {
      // Find the organization
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Find the team and populate its users, including username
      const team = await Team.findById(teamId).populate(
        "users.user",
        "name email username status"
      );
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if the team belongs to the organization
      if (!organization.teams.includes(team._id)) {
        return res
          .status(400)
          .json({ message: "Team does not belong to this organization" });
      }

      // Format the user data to include the username
      const users = team.users.map((user) => ({
        id: user.user._id,
        name: user.user.name,
        email: user.user.email,
        username: user.user.username, // Include username in the response
        role: user.role,
        status: user.user.status,
      }));

      res.status(200).json({ teamName: team.name, users });
    } catch (error) {
      console.error("Error fetching team users:", error);
      res.status(500).json({ message: "Error fetching team users" });
    }
  }
);

app.delete("/api/organizations/:organizationId/teams/:teamId/users/:userId",
  authenticateToken,
  async (req, res) => {
    const { organizationId, teamId, userId } = req.params;
    const { removedBy } = req.body;

    try {
      // Find the organization
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Find the team
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if the team belongs to the organization
      if (!organization.teams.includes(team._id)) {
        return res
          .status(400)
          .json({ message: "Team does not belong to this organization" });
      }

      // Find the user in the team
      const userIndex = team.users.findIndex(
        (u) => u.user.toString() === userId
      );
      if (userIndex === -1) {
        return res.status(404).json({ message: "User not found in the team" });
      }

      // Remove the user from the team in MongoDB
      team.users.splice(userIndex, 1);

      // Add removal information
      team.removedBy = removedBy;
      team.removedDate = new Date();
      await team.save();

      // Find the user in MongoDB
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Conditionally make the GitHub API call if user.name is available
      if (user.name) {
        // Format team name for GitHub API (replace spaces with hyphens and make lowercase)
        const teamSlug = team.name.replace(/\s+/g, '-').toLowerCase();

        try {
          // Remove the user from the GitHub team
          const githubTeamResponse = await axios.delete(
            `https://api.github.com/orgs/${organization.name}/teams/${teamSlug}/memberships/${user.name}`,
            {
              headers: {
                Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          // console.log("GitHub team membership deleted:", githubTeamResponse.data);
        } catch (error) {
          console.error(
            "Error removing user from GitHub team:",
            error.response ? error.response.data : error.message
          );
          return res.status(500).json({
            message: "User removed from team in MongoDB but not from GitHub",
            removedBy,
            error: error.message,
          });
        }
      }

      res.status(200).json({
        message: "User removed from team successfully in MongoDB" +
                 (user.name ? " and GitHub" : ""),
        removedBy,
      });
    } catch (error) {
      console.error(
        "Error removing user from team:",
        error.response ? error.response.data : error.message
      );
      res.status(500).json({
        message: "Error removing user from team",
        error: error.message,
      });
    }
  }
);


app.get("/api/projects/:projectId/users/search", authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { email } = req.query;

  try {
    const project = await Project.findById(projectId).populate({
      path: "teams",
      populate: {
        path: "users.user",
        model: "User",
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const matchingUsers = [];
    project.teams.forEach((team) => {
      team.users.forEach((user) => {
        if (!email || user.user.email.toLowerCase().includes(email.toLowerCase())) {
          matchingUsers.push({
            name: user.user.name,
            email: user.user.email,
            username: user.user.username,
            role: user.role,
            team: team.name,
          });
        }
      });
    });

    if (matchingUsers.length === 0) {
      return res.status(404).json({
        message: "No users found within the project teams with the given email",
      });
    }

    res.status(200).json({ users: matchingUsers });
  } catch (error) {
    console.error("Error searching project team users:", error);
    res.status(500).json({ message: "Error searching project team users" });
  }
});



app.get("/api/projects/:projectId/teams",
  authenticateToken,
  async (req, res) => {
    const { projectId } = req.params;
    try {
      const project = await Project.findById(projectId).populate({
        path: "teams",
        populate: {
          path: "users.user",
          select: "email role", // Select only email and role fields
        },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Transform the data to match the frontend requirements
      const teams = project.teams.map((team) => ({
        name: team.name,
        members: team.users.map((user) => ({
          email: user.user.email,
          role: user.role,
        })),
      }));

      res.status(200).json({ teams });
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Error fetching teams" });
    }
  }
);

// Fetch users for an organization
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ organization: req.user.organizationId });
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

app.get("/api/overview/:organizationId",
  authenticateToken,
  async (req, res) => {
    const { organizationId } = req.params;
    const userEmail = req.user.email;
    const userRole = req.user.role;

    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Get user count of the organization
      const userCount = await User.countDocuments({
        organization: organizationId,
      });

      let projects;
      if (userRole === "ADMIN") {
        projects = await Project.find({
          organization: organizationId,
        }).populate("teams");
      } else {
        const user = await User.findOne({ email: userEmail });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const userTeams = await Team.find({ "users.user": user._id });
        projects = await Project.find({
          organization: organizationId,
          $or: [
            { projectManager: userEmail },
            { teams: { $in: userTeams.map((team) => team._id) } },
          ],
        }).populate("teams");
      }

      const totalProjects = projects.length;

      // Get all task IDs for these projects
      const projectIds = projects.map((project) => project._id);
      const tasks = await Task.find({ project: { $in: projectIds } });

      // Get total number of tasks
      const totalTasks = tasks.length;

      // Aggregate cards across all tasks
      const totalCardsResult = await Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $unwind: "$card" },
        {
          $lookup: {
            from: "cards",
            localField: "card",
            foreignField: "_id",
            as: "cards",
          },
        },
        { $unwind: "$cards" },
        { $group: { _id: null, totalCards: { $sum: 1 } } },
      ]);
      const totalCards =
        totalCardsResult.length > 0 ? totalCardsResult[0].totalCards : 0;

      const projectDetails = await Promise.all(
        projects.map(async (project) => {
          const projectTasks = tasks.filter((task) =>
            task.project.equals(project._id)
          );
          const teams = await Team.find({
            _id: { $in: project.teams },
          }).populate("users.user");

          // Calculate total cards and their statuses for this project
          const projectCardsResult = await Task.aggregate([
            { $match: { project: project._id } },
            { $unwind: "$card" },
            {
              $lookup: {
                from: "cards",
                localField: "card",
                foreignField: "_id",
                as: "cards",
              },
            },
            { $unwind: "$cards" },
            {
              $group: {
                _id: "$cards.status",
                count: { $sum: 1 },
              },
            },
          ]);

          // Initialize card counts
          let totalPendingCards = 0;
          let totalInProgressCards = 0;
          let totalCompletedCards = 0;

          projectCardsResult.forEach((card) => {
            if (card._id === "pending") totalPendingCards = card.count;
            if (card._id === "inprogress") totalInProgressCards = card.count;
            if (card._id === "completed") totalCompletedCards = card.count;
          });

          // Calculate in-progress and pending tasks
          const totalInProgressTasks = projectTasks.filter((task) =>
            task.card.some((card) => card.status === "inprogress")
          ).length;
          const totalPendingTasks = projectTasks.filter((task) =>
            task.card.some((card) => card.status === "pending")
          ).length;

          return {
            id: project._id,
            name: project.name,
            projectMembers: teams.flatMap((team) =>
              team.users.map((user) => user.user)
            ),
            totalTasks: projectTasks.length,
            totalInProgressTasks,
            totalPendingTasks,
            totalCards:
              totalPendingCards + totalInProgressCards + totalCompletedCards,
            totalPendingCards,
            totalInProgressCards,
            totalCompletedCards,
          };
        })
      );

      res.json({
        totalProjects,
        totalTasks,
        totalMembers: userCount,
        totalCards,
        projects: projectDetails,
      });
    } catch (error) {
      console.error("Error retrieving overview data:", error);
      res.status(500).json({ message: "Error retrieving overview data" });
    }
  }
);

app.get("/api/calendar/:organizationId", authenticateToken, async (req, res) => {
  const { organizationId } = req.params;
  const userEmail = req.user.email;
  const userRole = req.user.role;

  try {
    let assignedCards;

    if (userRole === "ADMIN") {
      assignedCards = await Card.find()
        .populate({
          path: "project",
          match: { organization: organizationId },
          select: "_id name projectManager",
        })
        .populate("task", "name");
    } else {
      const managedProjects = await Project.find({
        organization: organizationId,
        projectManager: userEmail,
      }).select("_id");

      const managedProjectIds = managedProjects.map((project) => project._id);

      assignedCards = await Card.find({
        $or: [
          { assignedTo: userEmail },
          { project: { $in: managedProjectIds } },
        ],
      })
        .populate({
          path: "project",
          match: { organization: organizationId },
          select: "_id name projectManager",
        })
        .populate("task", "name");
    }

    const cardIds = assignedCards.map((card) => card._id);

    // Calculate the sum of logged hours for each card
    const logs = await Tasklogs.aggregate([
      { $match: { cardId: { $in: cardIds } } },
      { $group: { _id: "$cardId", totalHours: { $sum: "$hours" } } }
    ]);

    // Create a map of cardId to total logged hours
    const hoursMap = logs.reduce((map, log) => {
      map[log._id] = log.totalHours;
      return map;
    }, {});

    // Fetch usernames for assignedTo emails
    const assignedEmails = [...new Set(assignedCards.map(card => card.assignedTo))];
    const users = await User.find({ email: { $in: assignedEmails } }).select('email username');
    const userMap = users.reduce((map, user) => {
      map[user.email] = user.username;
      return map;
    }, {});

    const events = assignedCards
      .filter((card) => card.project && card.task)
      .flatMap((card) => [
        {
          id: `${card._id}-assign`,
          date: card.assignDate,
          projectId: card.project._id,
          projectName: card.project.name,
          taskId: card.task._id,
          taskName: card.task.name,
          cardId: card._id,
          cardName: card.name,
          assignedTo: userMap[card.assignedTo] || card.assignedTo, // Replace email with username
          createdDate: card.createdDate,
          status: card.status,
          type: "Assign Date",
          estimatedHours: card.estimatedHours,
          utilizedHours: hoursMap[card._id] || 0,  // Include total logged hours
          endDate: card.dueDate,
        },
      ])
      .filter((event) => event.date);

    res.json(events);
  } catch (error) {
    console.error("Error retrieving calendar data:", error);
    res.status(500).json({ message: "Error retrieving calendar data" });
  }
});



app.get("/api/projects/:projectId/audit-logs", async (req, res) => {
  try {
    const { projectId } = req.params;
    const auditLogs = await AuditLog.find({
      $or: [
        { projectId }, // Project-related actions
        { entityId: projectId, entityType: "Project" }, // Specific project actions
      ],
    })
      .populate("performedBy", "name email")
      .populate("taskId", "name") // Populate the task name
      .populate("cardId", "name"); // Populate the card name

    if (!auditLogs || auditLogs.length === 0) {
      return res
        .status(404)
        .json({ message: "No audit logs found for this project" });
    }

    res.status(200).json(auditLogs);
    // console.log(auditLogs)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});





app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected endpoint!", user: req.user });
});

// Create a new rule
// Create rule endpoint
app.post("/api/rules", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      trigger,
      triggerCondition,
      listName,
      action,
      actionDetails,
      createdByCondition,
      projectId,
      triggerSentence,
      actionSentence,
    } = req.body;
    const loggedInUserEmail = req.user.email;

    // Find the logged-in user's ID using their email
    const loggedInUser = await User.findOne({ email: loggedInUserEmail });
    if (!loggedInUser) {
      return res.status(400).json({ error: "Invalid logged-in user" });
    }

    let createdBy;
    if (createdByCondition === "by me") {
      createdBy = [loggedInUser._id]; // Store as an array
    } else if (createdByCondition === "by anyone") {
      // Fetch all teams associated with the project and their users
      const project = await Project.findById(projectId).populate({
        path: "teams",
        populate: { path: "users.user", select: "_id" }, // Populate users in each team
      });
      createdBy = project.teams.flatMap((team) =>
        team.users.map((user) => user.user._id)
      );
    } else if (createdByCondition === "by anyone except me") {
      createdBy = [loggedInUser._id];
    }

    const newRule = new Rule({
      name,
      trigger,
      triggerCondition,
      listName,
      action,
      actionDetails,
      createdBy, // Now an array of user IDs
      createdByCondition,
      projectId,
      triggerSentence, // Add triggerSentence here
      actionSentence, // Add actionSentence here
    });

    await newRule.save();
    res.status(201).json(newRule);
  } catch (err) {
    console.error("Error saving rule:", err); // Log error for debugging
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/rules/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const rules = await Rule.find({ projectId });

    if (!rules.length) {
      return res.status(404).json({ error: "No rules found for this project" });
    }

    res.status(200).json(rules);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/rules/:ruleId", authenticateToken, async (req, res) => {
  try {
    const { ruleId } = req.params;
    const result = await Rule.findByIdAndDelete(ruleId);

    if (!result) {
      return res.status(404).json({ error: "Rule not found" });
    }

    res.status(200).json({ message: "Rule deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

taskSchema.post("save", async function (doc) {
  // Trigger rule execution when a Task is saved
  await executeBackgroundJob();
});

taskSchema.post("remove", async function (doc) {
  // Trigger rule execution when a Task is removed
  await executeBackgroundJob();
});

teamSchema.post("save", async function (doc) {
  // Trigger rule execution when a Team is saved
  await executeBackgroundJob();
});

teamSchema.post("remove", async function (doc) {
  // Trigger rule execution when a Team is removed
  await executeBackgroundJob();
});
cardSchema.post("save", async function (doc) {
  // Trigger rule execution when a Card is saved
  await executeBackgroundJob();
});

cardSchema.post("remove", async function (doc) {
  // Trigger rule execution when a Card is removed
  await executeBackgroundJob();
});

cardSchema.post("update", async function (doc) {
  // Trigger rule execution when a Card is removed
  await executeBackgroundJob();
});

const executeBackgroundJob = async () => {
  try {
    // console.log('Running scheduled background job...');
    // console.log('Running scheduled background job...');

    // Find rules related to 'Card Move' that need to be executed
    const rules = await Rule.find({ trigger: 'Card Move' });

    for (const rule of rules) {


      // Fetch the project by ID
      const project = await Project.findById(rule.projectId);
      if (!project) {

        continue;
      }

      // Fetch all cards associated with the project
      let cardsToMove = await Card.find({ project: rule.projectId });

      for (const card of cardsToMove) {
        // Get the user ID based on the updatedBy email
        const user = await User.findOne({ email: card.updatedBy });
        if (!user) {
          // console.error(`User with email ${card.updatedBy} not found.`);
          continue;
        }

        // Check the createdByCondition
        if (rule.createdByCondition === 'by me') {
          if (!rule.createdBy.includes(user._id.toString())) {
            // console.log(`Skipping card ${card._id} as it was not updated by the specified user.`);
            continue;
          }
        } else if (rule.createdByCondition === 'by anyone except me') {
          if (rule.createdBy.includes(user._id.toString())) {
            // console.log(`Skipping card ${card._id} as it was updated by the excluded user.`);
            continue;
          }
        }

        // Fetch the destination list by name
        const destinationList = await Task.findOne({ name: rule.actionDetails.get('moveToList'), project: rule.projectId });
        if (!destinationList) {
          //console.error(`Destination list ${rule.actionDetails.get('moveToList')} not found in project ${rule.projectId}.`);
          continue;
        }

        // Check if the rule applies to this card based on triggerCondition
        if (!rule.triggerCondition || card.status === rule.triggerCondition) {
          // Find the current task (list) of the card
          const currentTask = await Task.findById(card.task);

          // Remove the card from the current list
          if (currentTask) {
            currentTask.card = currentTask.card.filter(cardId => !cardId.equals(card._id));
            await currentTask.save();
          }

          // Add the card to the destination list         
          destinationList.card.push(card._id);
          await destinationList.save();

          // Update the card's task field
          card.task = destinationList._id;
          await card.save();
        }
      }
    }
  } catch (error) {
    console.error('Error running scheduled job:', error);
  }
};

setInterval(executeBackgroundJob, 5000);

server.listen(port, host = "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
