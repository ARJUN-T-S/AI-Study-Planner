const Progress = require("../Models/Progress");
const Plan = require("../Models/Plan");

/**
 * PUT - Update entire plan while retaining progress checkboxes where possible
 */
exports.updateEntirePlanWithProgress = async (req, res) => {
  try {
    const { planId, newPlan } = req.body; // newPlan = AI generated updated plan object
    const userId = req.userId;

    // 1. Fetch old plan & progress
    const oldPlan = await Plan.findById(planId);
    if (!oldPlan) return res.status(404).json({ error: "Old plan not found" });

    const progressDoc = await Progress.findOne({ userId, planId });
    if (!progressDoc) return res.status(404).json({ error: "Progress not found" });

    // 2. Update Plan in DB
    oldPlan.plan = newPlan;
    await oldPlan.save();

    // 3. Build new progress based on updated plan
    const updatedProgress = [];

    for (let [date, dayPlans] of oldPlan.plan.entries()) {
      dayPlans.forEach((dayPlan) => {
        const newSlots = [];

        dayPlan.slots.forEach((slot) => {
          // Check if progress already exists for this slot
          const oldDayProgress = progressDoc.progress.find((d) => d.date === dayPlan.date);
          const oldSlotProgress = oldDayProgress
            ? oldDayProgress.slots.find((s) => s.time === slot.time)
            : null;

          if (oldSlotProgress) {
            // ✅ Slot existed before → retain progress if topics unchanged
            if (
              JSON.stringify([...slot.topics].sort()) ===
              JSON.stringify([...oldSlotProgress.pendingTopics, ...oldSlotProgress.completedTopics].sort())
            ) {
              newSlots.push({
                time: slot.time,
                completedTopics: oldSlotProgress.completedTopics,
                pendingTopics: oldSlotProgress.pendingTopics,
                status: oldSlotProgress.status,
              });
            } else {
              // ❌ Topics changed → reset
              newSlots.push({
                time: slot.time,
                completedTopics: [],
                pendingTopics: slot.topics,
                status: "pending",
              });
            }
          } else {
            // 🆕 New slot → fresh entry
            newSlots.push({
              time: slot.time,
              completedTopics: [],
              pendingTopics: slot.topics,
              status: "pending",
            });
          }
        });

        updatedProgress.push({ date: dayPlan.date, slots: newSlots });
      });
    }

    // 4. Save updated progress
    progressDoc.progress = updatedProgress;
    await progressDoc.save();

    res.json({
      message: "Plan and progress updated successfully",
      plan: oldPlan,
      progress: progressDoc,
    });
  } catch (err) {
    console.error("Update entire plan failed:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Initialize progress for a plan
exports.progressPost= async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.userId;

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    // Convert plan into progress format
    const progressData = [];
    for (let [date, dayPlans] of plan.plan.entries()) {
      dayPlans.forEach((dayPlan) => {
        const slots = dayPlan.slots.map((slot) => ({
          time: slot.time,
          completedTopics: [],
          pendingTopics: slot.topics,
          status: "pending"
        }));
        progressData.push({ date: dayPlan.date, slots });
      });
    }

    const newProgress = new Progress({
      userId,
      planId,
      progress: progressData
    });

    await newProgress.save();
    res.json({ message: "Progress initialized", progress: newProgress });
  } catch (err) {
    console.error("Init progress failed:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update progress (mark topics done for a slot)
exports.updateProgress = async (req, res) => {
  try {
    const { planId, date, time, completedTopics } = req.body;
    const userId = req.userId;

    const progressDoc = await Progress.findOne({ userId, planId });
    if (!progressDoc) return res.status(404).json({ error: "Progress not found" });

    const dayProgress = progressDoc.progress.find((d) => d.date === date);
    if (!dayProgress) return res.status(404).json({ error: "Day not found" });

    const slotProgress = dayProgress.slots.find((s) => s.time === time);
    if (!slotProgress) return res.status(404).json({ error: "Slot not found" });

    // Move completed topics
    completedTopics.forEach((topic) => {
      if (slotProgress.pendingTopics.includes(topic)) {
        slotProgress.pendingTopics = slotProgress.pendingTopics.filter((t) => t !== topic);
        slotProgress.completedTopics.push(topic);
      }
    });

    // Update status
    if (slotProgress.pendingTopics.length === 0) {
      slotProgress.status = "completed";
    } else if (slotProgress.completedTopics.length > 0) {
      slotProgress.status = "in-progress";
    }

    await progressDoc.save();
    res.json({ message: "Progress updated", progress: progressDoc });
  } catch (err) {
    console.error("Update progress failed:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get progress for a plan
exports.getProgress = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.userId;

    const progressDoc = await Progress.findOne({ userId, planId });
    if (!progressDoc) return res.status(404).json({ error: "Progress not found" });

    res.json({ progress: progressDoc });
  } catch (err) {
    console.error("Get progress failed:", err.message);
    res.status(500).json({ error: err.message });
  }
};
