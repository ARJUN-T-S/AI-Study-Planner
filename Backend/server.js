// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const admin=require('./config/firebase')
const verifyToken=require('./MiddleWare/authMiddleWare');
dotenv.config();
const app = express();
app.use(express.json());

// Import models
const User = require("./Models/User");
const Syllabus = require("./Models/Subject");
const ModelPaper = require("./Models/ModelPaper");
const StudyPlan = require("./Models/Plan");
const Progress = require("./Models/Progress");

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected via Mongoose"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Test route
app.post("/signup", verifyToken, async (req, res) => {
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
});
// Example route to check users (optional)
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
