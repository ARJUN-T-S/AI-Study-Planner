const Plan=require('../Models/Plan');
exports.getCurrentPlan = async (req, res, next) => {
  try {
    const userId = req.userId; // ✅ fixed typo
    const plan = await Plan.findOne({ userId });

    if (!plan) {
      return res.status(404).json({ message: "No plan found for this user." });
    }

    req.presentPlan = plan; // attach plan for next middleware
    next(); // ✅ move to next middleware or controller
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching current plan." });
  }
};
