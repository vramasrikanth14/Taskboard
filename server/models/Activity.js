//activity schema
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    commentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("Activity", activitySchema);

module.exports = mongoose.model("Activity", activitySchema);

module.exports = mongoose.model("Activity", activitySchema);







