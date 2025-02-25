//team schema
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    slug: { type: String },
    users: [
      { user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, role: String },
    ],
    addedBy: String,
    removedBy: String,
  },
  {
    timestamps: { addedDate: "addedDate", removedDate: "removedDate" },
  }
);

<<<<<<< HEAD
module.exports = mongoose.model("Team", teamSchema);
=======
module.exports = mongoose.model("Team", teamSchema);
>>>>>>> 8153153255c5360b0a271a54212e5094728a3356
