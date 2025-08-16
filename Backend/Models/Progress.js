const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
    userId: {
        type: String, // Firebase UID
        ref: 'Users',
        required: true
    },
    studyPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyPlans',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    completedTasks: [
        {
            week: { type: Number, required: true },
            topic: { type: String, required: true },
            status: {
                type: String,
                enum: ['pending', 'in-progress', 'completed'],
                default: 'pending'
            }
        }
    ],
    overallProgress: {
        type: Number, // percentage: e.g., 65 means 65% done
        default: 0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Progress', ProgressSchema);
