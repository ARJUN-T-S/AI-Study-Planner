require("dotenv").config();
const fetch = require("node-fetch");
const Plan = require("../Models/Plan");

exports.postplan = async (req, res) => {
  try {
    const {
      syllabus,
      modelq,
      startDate,
      endDate,
      sessionHours,
      leisureTimes,
      presentPlan,
    } = req.body;

    const prompt = `
You are a study planner AI. Based on the syllabus topics, exam date, available study start and end dates,
and user time restrictions (avoid breakfast, lunch, dinner, and blocked times),
create a structured study schedule.

The schedule should be broken down:
1. Day by day
2. Inside each day, provide multiple time slots (like "09:00-10:30", "11:00-12:30", etc.)
3. Each slot should have minimum of 2 topics based on the difficulty.
4. Each slot should include a "mostAskedQuestions" field with at least 5 relevant questions.
5. The schedule should be from start date to end date-1.
6. If there already exists a plan, update it according to the new parameters (session hours, leisure hours, etc.).
⚠️ Return ONLY valid JSON (no markdown, no explanations, no code fences).  

Format:
[
  {
    "day": "YYYY-MM-DD",
    "slots": [
      { 
        "time": "09:00-10:30", 
        "topics": ["Topic 1"],
        "mostAskedQuestions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
      },
      { 
        "time": "11:00-12:30", 
        "topics": ["Topic 2", "Topic 3"],
        "mostAskedQuestions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
      }
    ]
  }
]

The syllabus is ${JSON.stringify(syllabus)}
The modelQuestion is ${JSON.stringify(modelq)}
The startDate is ${startDate}
The endDate is ${endDate}
The session time is ${sessionHours}
The Leisure Hours are ${JSON.stringify(leisureTimes || [])}
The present plan is ${presentPlan ? JSON.stringify(presentPlan) : "none"}
    `;

    // Azure endpoint details from .env
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = process.env.AZURE_VERSION;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;

    // Call Azure OpenAI
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [{ role: "system", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText);
    }

    const data = await response.json();
    let reply = data.choices[0].message.content;

    // 🛠 Sanitize response (remove code fences, extra text)
    reply = reply.replace(/```json|```/g, "").trim();

    // Parse JSON safely
    let aiData;
    try {
      aiData = JSON.parse(reply);
    } catch (e) {
      return res.status(500).json({
        error: "AI response parse failed",
        raw: reply,
      });
    }

    // Transform into the correct format for the schema
    const transformedSchedule = {};
    aiData.forEach((dayObj) => {
      const dayPlan = dayObj.slots.map(slot => ({
        time: slot.time,
        topics: slot.topics,
        mostAskedQuestions: slot.mostAskedQuestions || []
      }));
      
      transformedSchedule[dayObj.day] = [{
        date: dayObj.day,
        slots: dayPlan
      }];
    });

    // Check if we have a presentPlan (update case)
    if (presentPlan && req.userId) {
      // Find existing plan
      const existingPlan = await Plan.findOne({ userId: req.userId });
      
      if (existingPlan) {
        // Update existing plan
        existingPlan.plan = transformedSchedule;
        existingPlan.startDate = startDate;
        existingPlan.endDate = endDate;
        existingPlan.updatedAt = Date.now();
        
        await existingPlan.save();
        
        return res.json({
          message: "Plan updated successfully",
          plan: transformedSchedule,
        });
      }
    }

    // Create new plan (default behavior)
    const newPlan = new Plan({
      userId: req.userId,
      startDate,
      endDate,
      plan: transformedSchedule,
    });

    await newPlan.save();

    res.json({
      message: "Plan saved successfully",
      plan: transformedSchedule,
    });
  } catch (err) {
    console.error("Azure AI call failed:", err.message);
    res.status(500).json({
      error: "Azure AI call failed",
      details: err.message,
    });
  }
};