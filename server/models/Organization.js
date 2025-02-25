//organizationschema
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
});

module.exports = mongoose.model("Organization", organizationSchema);