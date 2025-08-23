const mongoose = require("mongoose");

const SlotSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  topics: {
    type: [String],
    required: true
  },
  mostAskedQuestions: {
    type: [String],
    default: []
  }
});

const DayPlanSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  slots: [SlotSchema]
});

const PlanSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: "User"
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  plan: {
    type: Map,
    of: [DayPlanSchema]
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Plan", PlanSchema);