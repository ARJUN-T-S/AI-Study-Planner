const mongoose = require("mongoose");

const progressItemSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g., "09:00-10:30"
  isCompleted: { type: Boolean, default: false }, // checkbox
  fromPlan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" } // reference to the plan it came from
});

const progressSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "User" }, // can be Firebase UID
  progressItems: [progressItemSchema]
}, { timestamps: true });

module.exports = mongoose.model("Progress", progressSchema);
