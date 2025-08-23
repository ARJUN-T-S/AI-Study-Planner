const Plan=require('../Models/Plan');

exports.getCurrentPlan=async(req,res,next)=>{
    const plan=await Plan.findOne(req.userId);
    req.presentPlan=plan;
    res.json({message:"Sucessfully got the Plan!"});
    next();
}