const mongoose = require('mongoose');

const ModelPaperSchema = new mongoose.Schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subjects',   // Linking to the Subject schema
        required: true
    },
    userId: {
        type: String,  // Firebase UID
        ref: 'Users',
        required: true
    },
    extractedQuestions: [{
        type: String   // Store extracted questions/topics
    }],
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ModelPapers', ModelPaperSchema);
