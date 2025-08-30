const express=require('express');
const router=express.Router();
const ModelQController=require('../Controllers/ModelQController');
const verifyToken=require('../MiddleWare/authMiddleWare');
const upload=require('../config/multer');

router.post('/postModelQ',verifyToken,upload.single("pdf"),ModelQController.uploadPDF); 
router.delete('/:subjectId',verifyToken,ModelQController.deleteModelQ);
module.exports=router;