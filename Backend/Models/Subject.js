const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  userId: { type: String, ref: "Users", required: true },
  subjectName: { type: String, required: true },
  image: [{ type: String, required: false }],
  syllabusText: { type: String },
  extractedTopics: [{ type: String }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Subjects', SubjectSchema);