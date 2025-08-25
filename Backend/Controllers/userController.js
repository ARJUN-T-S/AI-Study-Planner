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
// In your backend route file
exports.setStudyTime = async (req, res) => {
  try {
    console.log('Received setStudyTime request:', req.body);
    
    const userId = req.userId; // Make sure this is being set by your auth middleware
    const { sessionHrs, leisureHrs, otherLeisure } = req.body;

    // Validate required fields
    if (!sessionHrs || !leisureHrs) {
      return res.status(400).json({ 
        message: "Missing required fields: sessionHrs and leisureHrs are required" 
      });
    }

    // Validate leisureHrs structure
    if (!leisureHrs.breakfast || !leisureHrs.lunch || !leisureHrs.dinner) {
      return res.status(400).json({ 
        message: "leisureHrs must contain breakfast, lunch, and dinner objects" 
      });
    }

    const newStudyTime = new StudyTime({
      userId,
      sessionHrs,
      leisureHrs,
      otherLeisure: otherLeisure || {},
    });

    await newStudyTime.save();
    console.log('StudyTime saved successfully for user:', userId);
    res.status(201).json({ message: "StudyTime set successfully", data: newStudyTime });
  } catch (err) {
    console.error('Error in setStudyTime:', err);
    res.status(500).json({ 
      message: "Try again later", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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
    
    // Call the updateplans endpoint after successfully updating study time
    try {
      const internalRequest = {
        method: 'POST',
        url: 'http://localhost:5000/plans/updateplans',
        headers: {
          'Authorization': req.headers['authorization'],
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      };
      
      // Make internal HTTP request to update plans
      const response = await fetch(internalRequest.url, {
        method: internalRequest.method,
        headers: internalRequest.headers,
        body: internalRequest.body
      });
      
      if (!response.ok) {
        console.error('Failed to update plans:', response.statusText);
        // We don't want to fail the main request if plan update fails
        console.log('Study time updated but plan update failed');
      } else {
        console.log('Plans updated successfully after study time change');
      }
    } catch (planError) {
      console.error('Error calling updateplans:', planError.message);
      // Continue with the response even if plan update fails
    }
    
    res.status(200).json({
      message: "Study Time updated successfully",
      studyTime: updateStudyTime,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};