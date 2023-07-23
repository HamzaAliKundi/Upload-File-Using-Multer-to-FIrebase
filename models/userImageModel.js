const mongoose = require('mongoose');

const imageSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fileName: { type: String },
    filePath:{ type: String},
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Image', imageSchema);