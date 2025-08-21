// controllers/azureController.js
require("dotenv").config();
const fetch = require("node-fetch");
const Plan = require("../Models/Plan"); // import your Plan model

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
4. The schedule should be from start date to end date-1.
5. If there already exist a plan just change the plan according to the parameter which is new for example sessionHrs should be change only with respect to the date they are updating,similarly to leisureHrs etc..
⚠️ Return ONLY valid JSON (no markdown, no explanations, no code fences).  

Format:
[
  {
    "day": "YYYY-MM-DD",
    "slots": [
      { "time": "09:00-10:30", "topics": ["Topic 1"] },
      { "time": "11:00-12:30", "topics": ["Topic 2", "Topic 3"] }
    ]
  }
]

The syllabus is ${syllabus}
The modelQuestion is ${modelq}
The startDate is ${startDate}
The endDate is ${endDate}
The session time is ${sessionHours}
The Leisure Hours are ${leisureTimes}
The present plan is ${presentPlan}
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
        max_tokens: 1500,
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

    // Transform into { date: { time: [topics] } }
    const transformedSchedule = {};
    aiData.forEach((dayObj) => {
      const { day, slots } = dayObj;
      transformedSchedule[day] = {};
      slots.forEach((slot) => {
        transformedSchedule[day][slot.time] = slot.topics;
      });
    });

    // ✅ Save into MongoDB
    const newPlan = new Plan({
      userId: req.userId, // assuming userId is added by middleware after auth
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
