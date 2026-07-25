const mongoose = require('mongoose');

const failureSchema = new mongoose.Schema({
  parameter: String,
  currentValue: mongoose.Schema.Types.Mixed,
  expected: String,
}, { _id: false });

const vehicleResultSchema = new mongoose.Schema({
  vehicleNumber: String,
  rowIndex: Number,                     // original Excel row
  status: { type: String, enum: ['OK', 'Not OK'] },
  failures: [failureSchema],
    rowData: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const inspectionRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referenceBatchId: { type: String, required: true },
    referenceFileName: String,
    totalVehicles: Number,
    passedVehicles: Number,
    failedVehicles: Number,
    vehicles: [vehicleResultSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('InspectionRecord', inspectionRecordSchema);