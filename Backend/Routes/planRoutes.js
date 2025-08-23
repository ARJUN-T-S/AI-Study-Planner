const verifyToken=require('../MiddleWare/authMiddleWare');
const express=require('express');
const planController=require('../Controllers/planController');
const progressController=require('../Controllers/progressController')
const planMiddleWare=require('../MiddleWare/planMiddleWare');
const router=express.Router();

router.post('/updateplans',verifyToken,planMiddleWare.getCurrentPlan,planController.postplan);
router.post('/postPlans',verifyToken,planController.postplan);
router.post('/progresspost',verifyToken,progressController.progressPost);
router.put('/putprogress',verifyToken,progressController.updateProgress);
module.exports=router;