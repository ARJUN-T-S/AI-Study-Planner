const mongoose = require("mongoose");

const StudyTimeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: "Users"
  },
  sessionHrs: {
    type: Number,
    required: true,
    default: 3
  },
  leisureHrs: {
    breakfast: {
      start_time: {
        type: String, // store as string
        required: true,
        default: "08:00 AM"
      },
      end_time: {
        type: String,
        required: true,
        default: "08:30 AM"
      }
    },
    lunch: {
      start_time: {
        type: String,
        required: true,
        default: "01:00 PM"
      },
      end_time: {
        type: String,
        required: true,
        default: "01:30 PM"
      }
    },
    dinner: {
      start_time: {
        type: String,
        required: true,
        default: "08:00 PM"
      },
      end_time: {
        type: String,
        required: true,
        default: "08:30 PM"
      }
    }
  },
  otherLeisure: {
    start_time: {
      type: String,
      required: true,
      default: "05:00 PM"
    },
    end_time: {
      type: String,
      required: true,
      default: "06:00 PM"
    }
  }
}, { timestamps: true });

module.exports = mongoose.model("StudyTime", StudyTimeSchema);
