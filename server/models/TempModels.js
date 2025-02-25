const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Temporary Organization Schema
const tempOrganizationSchema = new Schema({
  name: String,
  email: String,
  projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
});

// Temporary User Schema
const tempUserSchema = new Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String },
  organization: { type: Schema.Types.ObjectId, ref: "TempOrganization" },
  status: { type: String },
});

// Create models
const TempOrganization = mongoose.model("TempOrganization", tempOrganizationSchema);
const TempUser = mongoose.model("TempUser", tempUserSchema);

module.exports = {
  TempOrganization,
  TempUser
};