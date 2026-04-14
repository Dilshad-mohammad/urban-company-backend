const mongoose = require("mongoose");

const MediaImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    folder: {
      type: String,
      default: "general"
    },
    altText: {
      type: String,
      default: ""
    },
    width: Number,
    height: Number,
    format: String,
    sizeInBytes: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MediaImage", MediaImageSchema);
