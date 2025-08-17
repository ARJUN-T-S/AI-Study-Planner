const User=require('../Models/User');
const StudyTime=require('../Models/StudyTime')

exports.createUser=async(req,res)=>{
    try {
        const { name, email } = req.body;
        const userId = req.userId; 
    
        let existingUser = await User.findOne({ userId });
        if (existingUser) {
          return res.status(400).json({ error: "User already exists" });
        }
    
        const newUser = new User({ userId, name, email });
        await newUser.save();
    
        res.status(201).json({
          message: "New Account Created",
          user: newUser,
        });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Error in creating an account! Please try again later" });
      }
}

exports.loginUser=async(req,res)=>{
    try{
        const userId=req.userId;
        let existingUser=User.findOne({userId});
        if(!existingUser){
            return res.status(401).json({message:"Unauthorized User"});
        }
        return res.status(200).json({message:"User authorized"});
    }
    catch{
        return res.status(500).json({message:"Internal Server Error!Try again after sometime"});
    }
}

exports.getUser=async(req,res)=>{
    try{
        const userId=req.userId;
        let existingUser=await User.findOne({userId});
        console.log(existingUser.name);
    }
    catch(err){
        return res.status(500).json({message:"Try Again Later"});
    }
}



// POST - Set study time
exports.setStudyTime = async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionHrs, leisureHrs, otherLeisure } = req.body;

    const newStudyTime = new StudyTime({
      userId,
      sessionHrs,
      leisureHrs,
      otherLeisure,
    });

    await newStudyTime.save();
    res.status(201).json({ message: "StudyTime set successfully" });
  } catch (err) {
    res.status(500).json({ message: "Try again later", error: err.message });
  }
};

// GET - Get study time in readable format
exports.getStudyTime = async (req, res) => {
  try {
    const userId = req.userId;
    const studyTime = await StudyTime.findOne({ userId });

    if (!studyTime) {
      return res.status(404).json({ message: "No study time found for user" });
    }

    // Already stored as string → no conversion needed
    const formattedResponse = {
      sessionHrs: studyTime.sessionHrs,
      breakfast: studyTime.leisureHrs?.breakfast
        ? `${studyTime.leisureHrs.breakfast.start_time} to ${studyTime.leisureHrs.breakfast.end_time}`
        : null,
      lunch: studyTime.leisureHrs?.lunch
        ? `${studyTime.leisureHrs.lunch.start_time} to ${studyTime.leisureHrs.lunch.end_time}`
        : null,
      dinner: studyTime.leisureHrs?.dinner
        ? `${studyTime.leisureHrs.dinner.start_time} to ${studyTime.leisureHrs.dinner.end_time}`
        : null,
      otherLeisure: studyTime.otherLeisure
        ? `${studyTime.otherLeisure.start_time} to ${studyTime.otherLeisure.end_time}`
        : null,
    };

    res.status(200).json(formattedResponse);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// PATCH - Update specific fields
exports.patchStudyTime = async (req, res) => {
  try {
    const userId = req.userId;
    const updates = req.body; // directly take fields instead of wrapping in {updates}

    const updateStudyTime = await StudyTime.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true }
    );

    if (!updateStudyTime) {
      return res.status(404).json({ message: "Record Not found" });
    }

    res.status(200).json({
      message: "Study Time updated successfully",
      studyTime: updateStudyTime,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
