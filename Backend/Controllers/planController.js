require("dotenv").config();
const fetch = require("node-fetch");
const Plan = require("../Models/Plan");

exports.getplan = async (req, res) => {
  try {
    const userId = req.userId;

    const plan = await Plan.findOne({ userId });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    return res.status(200).json({ plan });
  } catch (err) {
    console.error("Error fetching plan:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

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

    // Get userId from the authenticated request
    const userId = req.userId;

    // If startDate or endDate is missing, try to get them from existing plan
    let finalStartDate = startDate;
    let finalEndDate = endDate;

    // If dates are missing, try to get them from existing plan
    if (!finalStartDate || !finalEndDate) {
      try {
        const existingPlan = await Plan.findOne({ userId });
        if (existingPlan) {
          finalStartDate = finalStartDate || existingPlan.startDate;
          finalEndDate = finalEndDate || existingPlan.endDate;
        }
      } catch (err) {
        console.log("Could not fetch existing plan for dates:", err.message);
      }
    }

    // If dates are still missing, return error
    if (!finalStartDate || !finalEndDate) {
      return res.status(400).json({
        error: "startDate and endDate are required",
        details: "Please provide both start and end dates for your study plan"
      });
    }

    const prompt = `
You are a study planner AI. Based on the syllabus topics, exam date, available study start and end dates,
and user time restrictions (avoid breakfast, lunch, dinner, and blocked times),
create a structured study schedule.

The schedule should be broken down:
1. Day by day
2.The schedule allocation should be neatly distributed across the start and end-date-1 and also consideration of the presentplan's date if present plan is given should also be taken care of and neatly distributed!
2. Inside each day, provide multiple time slots (like "09:00-10:30", "11:00-12:30", etc.)
3. Each slot should have minimum of 2 topics based on the difficulty.
4. Each slot should include a "mostAskedQuestions" field with at least 5 relevant questions.
5. The schedule should be from start date to end date-1.
6. If there already exists a plan, update it according to the new parameters (session hours, leisure hours, etc.).
7. Even if some parameters are missing just autofill it with respect to the presentplan! Please give it in the asked format no field should be left missing that i have mentioned!
8.If a plan is already there compare with the fields that i sent you again,make that as your new data and change with respect to that!Because it is the new data that you have edit.(ONly do if there is a present plan)
9.If a new subject is added there will be new startDate and endDate it should integrate well with the existing plan
⚠️ Return ONLY valid JSON (no markdown, no explanations, no code fences).  

Format:
[
  {
    "day": "YYYY-MM-DD",
    "slots": [
      { 
        "time": "09:00-10:30", (Not exactly this give with regards to the sessionHrs and leisureTimes)
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
The startDate is ${finalStartDate}
The endDate is ${finalEndDate}
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

    // Check if we have an existing plan to update
    const existingPlan = await Plan.findOne({ userId });
    
    if (existingPlan) {
      // Update existing plan
      existingPlan.plan = transformedSchedule;
      existingPlan.startDate = finalStartDate;
      existingPlan.endDate = finalEndDate;
      existingPlan.updatedAt = Date.now();
      
      await existingPlan.save();
      console.log(existingPlan.plan);
      return res.json({
        message: "Plan updated successfully",
        plan: transformedSchedule,
      });
    }

    // Create new plan (default behavior)
    const newPlan = new Plan({
      userId: userId,
      startDate: finalStartDate,
      endDate: finalEndDate,
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