const express = require('express');
const router = express.Router();
const {
  processVehicles,
  getInspectionHistory,
  getInspectionById,
  deleteInspection,
} = require('../controllers/inspectionController');
const protect = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/upload');   // single file upload for data entry

router.post('/process', protect, uploadSingle, processVehicles);
router.get('/history', protect, getInspectionHistory);
router.get('/:id', protect, getInspectionById);
router.delete('/:id', protect, deleteInspection);

module.exports = router;