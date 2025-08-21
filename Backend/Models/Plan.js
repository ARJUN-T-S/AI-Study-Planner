const mongoose = require("mongoose");
const planSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Firebase UID or Mongo ObjectId
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  plan: {
    type: Object, // plain object instead of Map
    required: true,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model("Plan", planSchema);
