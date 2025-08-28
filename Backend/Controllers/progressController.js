const Progress = require("../Models/Progress");
const Plan = require("../Models/Plan");

/**
 * PUT - Update entire plan while retaining progress checkboxes where possible
 */
exports.syncProgressWithUpdatedPlan = async (req, res) => {
  try {
    const userId = req.userId;
    const { date, time } = req.body; // frontend will send date & time of slot(s) to sync

    if (!date || !time) {
      return res.status(400).json({ error: "date and time are required" });
    }

    // 1️⃣ Get the new plan (already updated in Plan table)
    const plan = await Plan.findOne({ userId });
    if (!plan) {
      return res.status(404).json({ error: "Plan not found for this user" });
    }
    const planId = plan._id;

    // 2️⃣ Get the old progress
    const progressDoc = await Progress.findOne({ userId, planId });
    if (!progressDoc) {
      return res.status(404).json({ error: "Progress not found for this plan" });
    }

    // 3️⃣ Build updated progress
    const updatedProgress = [];

    for (let [planDate, dayPlans] of plan.plan.entries()) {
      dayPlans.forEach((dayPlan) => {
        const newSlots = [];

        dayPlan.slots.forEach((slot) => {
          // Only compare/update for the given date & time
          if (dayPlan.date === date && slot.time === time) {
            const oldDayProgress = progressDoc.progress.find((d) => d.date === date);
            const oldSlotProgress = oldDayProgress
              ? oldDayProgress.slots.find((s) => s.time === time)
              : null;

            if (oldSlotProgress) {
              // ✅ Slot existed before
              const oldTopics = [...oldSlotProgress.pendingTopics, ...oldSlotProgress.completedTopics].sort();
              const newTopics = [...slot.topics].sort();

              if (JSON.stringify(newTopics) === JSON.stringify(oldTopics)) {
                // Keep old progress
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
          } else {
            // Leave other slots as-is (copy from old progress if available)
            const oldDayProgress = progressDoc.progress.find((d) => d.date === dayPlan.date);
            const oldSlotProgress = oldDayProgress
              ? oldDayProgress.slots.find((s) => s.time === slot.time)
              : null;

            if (oldSlotProgress) {
              newSlots.push(oldSlotProgress);
            } else {
              newSlots.push({
                time: slot.time,
                completedTopics: [],
                pendingTopics: slot.topics,
                status: "pending",
              });
            }
          }
        });

        updatedProgress.push({ date: dayPlan.date, slots: newSlots });
      });
    }

    // 4️⃣ Save updated progress
    progressDoc.progress = updatedProgress;
    await progressDoc.save();

    res.json({
      message: "Progress synced with updated plan successfully",
      progress: progressDoc,
    });
  } catch (err) {
    console.error("Sync progress failed:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Initialize progress for a plan
exports.progressPost= async (req, res) => {
  try {
    
    const userId = req.userId;

    const plan = await Plan.findOne({userId});
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
    const userId = req.userId;

    const progressDoc = await Progress.findOne({ userId });
    if (!progressDoc) return res.status(200).json({ error: "Progress not found" });

    res.json({ progress: progressDoc });
  } catch (err) {
    console.error("Get progress failed:", err.message);
    res.status(500).json({ error: err.message });
  }
};
