<<<<<<< HEAD
<<<<<<< HEAD

=======
>>>>>>> e2080dec6c5ef2d42c0feb4e3c203f5c14403dfe
=======
>>>>>>> 8153153255c5360b0a271a54212e5094728a3356
//rule schema
const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  projectId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
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
  actionSentence: { type: String }
});

module.exports = mongoose.model("Rule", ruleSchema);