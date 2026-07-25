const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
  field: String,
  value: String,
}, { _id: false });

const checkSchema = new mongoose.Schema({
  parameter: String,
  operator: { type: String, enum: ['<=', '>=', '<', '>', '=', 'range', 'tolerance'] },
  value: Number,
  min: Number,
  max: Number,
  target: Number,
  tolerance: Number,
  offset: { type: Number, default: 0 },
}, { _id: false });

const referenceRuleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    batchId: { type: String, required: true },
    ruleCategory: String,
    conditions: [conditionSchema],
    checks: [checkSchema],
    fileName: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReferenceRule', referenceRuleSchema);