const express = require('express');
const router = express.Router();
const {
  uploadReference,
  getLatestReference,
  getAllReferences,
  deleteReference,
} = require('../controllers/referenceController');
const protect = require('../middleware/authMiddleware');
const { uploadArray } = require('../middleware/upload');

router.post('/upload', protect, uploadArray, uploadReference);
router.get('/latest', protect, getLatestReference);
router.get('/history', protect, getAllReferences);
router.delete('/:id', protect, deleteReference);

module.exports = router;