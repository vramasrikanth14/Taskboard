//project schemma
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    description: String,
    projectManager: String,
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    rules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Rule" }],
    createdBy: String,
    updatedBy: String,
    deletedBy: String,
    startDate: { type: Date },
    bgUrl: { type: String },
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

module.exports = mongoose.model("Project", projectSchema);