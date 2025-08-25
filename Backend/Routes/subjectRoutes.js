const verifyToken = require('../MiddleWare/authMiddleWare');
const cloudinaryMiddleWare = require('../MiddleWare/cloudinaryMiddleWare');
const upload = require('../config/multer');
const express = require('express');
const subjectController = require('../Controllers/subjectController');
const router = express.Router();

// Get all subjects for the authenticated user
router.get('/', verifyToken, subjectController.getSubjects);

// Add subject without image
router.post('/uploadWithoutImage', verifyToken, subjectController.addSubjectWithoutImage);

// Add subject with image (OCR processing)
router.post('/uploadWithImage', verifyToken, upload.single("image"), cloudinaryMiddleWare.uploadImage, subjectController.addSubjectWithImage);

// Delete a subject
router.delete('/:subjectId', verifyToken, subjectController.deleteSubject);

module.exports = router;