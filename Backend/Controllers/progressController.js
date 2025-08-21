const Progress = require("../Models/Progress"); // your Progress model
const Plan = require("../Models/Plan"); // your Plan model

exports.progressPost = async (req, res) => {
  try {
    const { planId } = req.body;

    // 1️⃣ Fetch the saved plan
    const planDoc = await Plan.findById(planId);
    if (!planDoc) return res.status(404).json({ message: "Plan not found" });

    const userId = planDoc.userId;
    const plan = planDoc.plan;
    const today = new Date();

    // 2️⃣ Fetch existing progress for user
    let progressDoc = await Progress.findOne({ userId });
    if (!progressDoc) {
      // create new if none exists
      progressDoc = new Progress({ userId, progressItems: [] });
    }

    // 3️⃣ Build progress entries from the plan
    const newItems = [];
    for (const date in plan) {
      const planDate = new Date(date);
      if (planDate < today) continue; // skip past dates

      for (const time in plan[date]) {
        const topics = plan[date][time];
        topics.forEach(topic => {
          const exists = progressDoc.progressItems.find(
            p => p.date.toISOString().startsWith(date) && p.time === time && p.topic === topic
          );
          if (!exists) {
            newItems.push({
              topic,
              date,
              time,
              isCompleted: false,
              fromPlan: planId
            });
          }
        });
      }
    }

    // 4️⃣ Remove obsolete future items that are no longer in plan
    progressDoc.progressItems = progressDoc.progressItems.filter(p => {
      const planTopics = plan[p.date.toISOString()]?.[p.time];
      if (!planTopics) return new Date(p.date) < today; // keep past items
      return planTopics.includes(p.topic) || new Date(p.date) < today;
    });

    // 5️⃣ Add new items
    progressDoc.progressItems.push(...newItems);

    // 6️⃣ Save progress
    await progressDoc.save();

    res.status(200).json({ message: "Progress synced successfully", progress: progressDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to sync progress", error: err.message });
  }
};
