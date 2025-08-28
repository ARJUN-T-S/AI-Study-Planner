const mongoose = require("mongoose");

const ProgressSlotSchema = new mongoose.Schema({
  time: { type: String, required: true },           // e.g., "09:00-10:30"
  completedTopics: { type: [String], default: [] }, // topics marked completed
  pendingTopics: { type: [String], default: [] },   // topics still pending
  status: { 
    type: String, 
    enum: ["pending", "in-progress", "completed"], 
    default: "pending" 
  }
}, { _id: false });

const ProgressDaySchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  slots: [ProgressSlotSchema]
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "User" }, // link to Plan
  progress: [ProgressDaySchema],
  updatedAt: { type: Date, default: Date.now }
});

// Auto update timestamps
ProgressSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Progress", ProgressSchema);
