const mongoose = require('mongoose');

const StudyPlanSchema = new mongoose.Schema({
    userId: {
        type: String, // Firebase UID
        ref: 'Users',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subjects',
        required: true
    },
    planName: {
        type: String, // Example: "Midterm Exam Plan"
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    schedule: [
        {
            week: { type: Number, required: true }, // Week number
            topics: [{ type: String }],             // Topics for that week
            completed: { type: Boolean, default: false }
        }
    ],
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('StudyPlans', StudyPlanSchema);
