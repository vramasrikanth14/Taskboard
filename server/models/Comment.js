//commentschema
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    comment: { type: String, required: true },
    commentBy: { type: String, required: true },
    card: { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Comment", commentSchema);
