const mongoose=require('mongoose');

const SubjectSchema = new mongoose.Schema({
  userId: { type: String, ref: "Users", required: true },
  subjectName: { type: String, required: true },
  image:[{type:String,required:false}],
  syllabusText: { type: String },   
  extractedTopics: [{ type: String }],
   // Firebase storage URLs
}, { timestamps: true });


module.exports=mongoose.model('Subjects',SubjectSchema);