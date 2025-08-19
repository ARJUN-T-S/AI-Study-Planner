const verifyToken=require('../MiddleWare/authMiddleWare');
const cloudinaryMiddleWare=require('../MiddleWare/cloudinaryMiddleWare');
const upload=require('../config/multer');
const express=require('express');
const subjectController=require('../Controllers/subjectController');
const router=express.Router();

router.post('/uploadWithoutImage',verifyToken,subjectController.addSubjectWithoutImage);
router.post('/uploadWithImage',verifyToken,upload.single("image"),cloudinaryMiddleWare.uploadImage,subjectController.addSubjectWithImage);

module.exports=router;