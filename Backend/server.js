// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const admin=require('./config/firebase')
const SubjectRoutes=require('./Routes/subjectRoutes');
const ModelQRoutes=require('./Routes/ModelQRoutes');
const planRoutes=require('./Routes/planRoutes');
dotenv.config();
const app = express();
app.use(express.json());
const cors=require("cors");
app.use(cors());

// Import models
const UserRoutes=require('./Routes/UserRoutes');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected via Mongoose"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Test route
app.use('/users',UserRoutes);
app.use('/subject',SubjectRoutes);
app.use('/modelQ',ModelQRoutes)
app.use('/plans',planRoutes)
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
