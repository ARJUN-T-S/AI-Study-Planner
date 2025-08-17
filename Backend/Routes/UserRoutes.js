const express=require('express');
const router=express.Router();
const UserController=require('../Controllers/userController');
const verifyToken=require('../MiddleWare/authMiddleWare');
router.get('/',verifyToken,UserController.getUser);
router.post('/signup',verifyToken,UserController.createUser);
router.post('/login',verifyToken,UserController.loginUser);
router.get('/getStudyTime',verifyToken,UserController.getStudyTime);
router.post('/setStudyTime',verifyToken,UserController.setStudyTime);
router.patch('/patchStudyTime',verifyToken,UserController.patchStudyTime);

module.exports=router;