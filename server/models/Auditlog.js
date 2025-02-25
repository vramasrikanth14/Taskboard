//auditlog schema
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["Project", "Task", "Card", "Team"],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    actionType: {
      type: String,
      enum: ["create", "update", "delete", "move"],
      required: true,
    },
    actionDate: { type: Date, default: Date.now },
    performedBy: { type: String },
    changes: [
      {
        field: { type: String },
        oldValue: { type: mongoose.Schema.Types.Mixed },
        newValue: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: "Card" },
  },
  {
    timestamps: true,
  }
);

<<<<<<< HEAD
module.exports = mongoose.model("AuditLog", auditLogSchema);
=======
module.exports = mongoose.model("AuditLog", auditLogSchema); 
>>>>>>> 8153153255c5360b0a271a54212e5094728a3356
