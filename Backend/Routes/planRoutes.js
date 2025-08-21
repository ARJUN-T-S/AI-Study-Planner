const verifyToken=require('../MiddleWare/authMiddleWare');
const express=require('express');
const planController=require('../Controllers/planController');
const progressController=require('../Controllers/progressController')
const router=express.Router();

router.post('/postPlans',verifyToken,planController.postplan);
router.post('/progresspost',verifyToken,progressController.progressPost);
module.exports=router;