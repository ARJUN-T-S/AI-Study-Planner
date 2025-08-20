const verifyToken=require('../MiddleWare/authMiddleWare');
const express=require('express');
const planController=require('../Controllers/planController');
const router=express.Router();

router.post('/postPlans',planController.postplan);

module.exports=router;