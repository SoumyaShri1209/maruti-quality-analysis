









const XLSX = require('xlsx');
const ReferenceRule = require('../models/ReferenceRule');
const InspectionRecord = require('../models/InspectionRecord');

// ---------- Global flag to ensure the SW_V migration runs only ONCE ----------
let swvMigrationRun = false;

// ---------- Helper: normalize row keys (trim whitespace, avoid silent NaN skips) ----------
const normalizeRow = (row) => {
  const clean = {};
  for (const key of Object.keys(row)) {
    clean[key.trim()] = row[key];
  }
  return clean;
};

// ---------- Helper: Color_Type matching ----------
const normalizeColorLabel = (val) =>
  String(val).trim().toLowerCase().replace(/\s*colors?$/i, '');

const COLOR_TYPE_FALLBACK = {
  metallic: 'light',
  solid: 'dark',
};

const colorTypeConditionMatches = (ruleValue, rowValue) => {
  const ruleColor = normalizeColorLabel(ruleValue);
  if (ruleColor === 'all') return true; // "All Colors" wildcard

  const rowColor = normalizeColorLabel(rowValue);
  if (rowColor === ruleColor) return true;

  const mapped = COLOR_TYPE_FALLBACK[rowColor];
  return mapped === ruleColor;
};

const conditionMatches = (cond, row) => {
  const rowValue = row[cond.field];
  if (rowValue === undefined) return false;

  if (cond.field === 'Color_Type') {
    return colorTypeConditionMatches(cond.value, rowValue);
  }

  return String(rowValue).trim() === String(cond.value).trim();
};

// ---------- Helper: Compare a single row ----------
const compareRow = (rawRow, rules) => {
  const row = normalizeRow(rawRow);
  const failures = [];
  const evaluatedParams = new Set(); // params that had at least one matching rule

  for (const rule of rules) {
    const allConditionsMet = rule.conditions.every(cond => conditionMatches(cond, row));
    if (!allConditionsMet) continue;

    for (const check of rule.checks) {
      const param = check.parameter;
      evaluatedParams.add(param);

      const measured = parseFloat(row[param]);
      if (isNaN(measured)) {
        console.warn(`[compareRow] Parameter "${param}" is NaN/missing on row`, row);
        continue;
      }

      let pass = true;
      let expected = '';

      switch (check.operator) {
        case '<=':
          pass = measured <= check.value;
          expected = `<= ${check.value}`;
          break;
        case '>=':
          pass = measured >= check.value;
          expected = `>= ${check.value}`;
          break;
        case '<':
          pass = measured < check.value;
          expected = `< ${check.value}`;
          break;
        case '>':
          pass = measured > check.value;
          expected = `> ${check.value}`;
          break;
        case 'range':
          pass = measured >= check.min && measured <= check.max;
          expected = `${check.min} – ${check.max}`;
          break;
        case 'tolerance': {
          const lower = check.target - check.tolerance + check.offset;
          const upper = check.target + check.tolerance + check.offset;
          pass = measured >= lower && measured <= upper;
          expected = `${lower} – ${upper} (target ${check.target} ± ${check.tolerance})`;
          break;
        }
        default:
          console.warn(`[compareRow] Unknown operator "${check.operator}" for param "${param}"`);
          continue;
      }

      if (!pass) {
        failures.push({ parameter: param, currentValue: measured, expected });
      }
    }
  }

  // Any numeric-looking field in the row that never got evaluated by any rule.
  const unmatchedParams = Object.keys(row).filter((key) => {
    if (evaluatedParams.has(key)) return false;
    const val = parseFloat(row[key]);
    return !isNaN(val);
  });

  return { failures, unmatchedParams };
};

// ---------- POST /api/inspection/process ----------
const processVehicles = async (req, res) => {
  try {
    // -------------------- SW_V STRICT LESS-THAN DATABASE FIX --------------------
    // We run this ONLY ONCE when the server starts (or the first processVehicles request hits).
    if (!swvMigrationRun) {
      swvMigrationRun = true;
      console.log('[Migration] Checking and fixing SW_V strict "<" operator in DB...');
      await ReferenceRule.updateMany(
        { 'checks.parameter': 'SW_V' },
        { $set: { 'checks.$[elem].operator': '<' } },
        { arrayFilters: [{ 'elem.parameter': 'SW_V' }] }
      );
      console.log('[Migration] SW_V strict "<" operator fixed successfully.');
    }
    // ---------------------------------------------------------------------------

    const latestBatch = await ReferenceRule.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$batchId', createdAt: { $max: '$createdAt' } } },
      { $sort: { createdAt: -1 } },
      { $limit: 1 },
    ]);
    if (!latestBatch.length) {
      return res.status(400).json({ message: 'No reference rules found. Please upload threshold sheets first.' });
    }

    const batchId = latestBatch[0]._id;
    const rules = await ReferenceRule.find({ batchId });

    let rows = [];

    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      rows = req.body.vehicles || [];
    }

    if (!rows.length) {
      return res.status(400).json({ message: 'No vehicle data provided' });
    }

    const results = [];
    let passed = 0, failed = 0;

    rows.forEach((row, index) => {
      const vehicleNumber = String(row['Vehicle_Number'] || row['vehicleNumber'] || `Row_${index + 1}`).trim();
      const { failures, unmatchedParams } = compareRow(row, rules);
      const status = failures.length === 0 ? 'OK' : 'Not OK';

      if (unmatchedParams.length) {
        // !!! THIS IS CRITICAL FOR YOUR 6 MISSING FAILURES !!!
        // If your console shows this warning with "Gloss_60, DOI, LW_H, LW_V, D_Value", 
        // your Reference Rules Excel sheets are missing the conditions for those metrics.
        console.warn(
          `[processVehicles] Row ${index + 1} (${vehicleNumber}): no rule matched for params:`,
          unmatchedParams
        );
      }

      const rowData = { ...row };
      delete rowData.DFT_Judgement;
      delete rowData.Color_Judgement;
      delete rowData.Final_Result;
      delete rowData.Judgement_O_X;
      delete rowData.vehicleNumber;

      results.push({
        vehicleNumber,
        rowIndex: index + 1,
        status,
        failures,
        unmatchedParams, // expose to frontend so it can flag "not evaluated" params
        rowData,
      });

      status === 'OK' ? passed++ : failed++;
    });

    const record = await InspectionRecord.create({
      user: req.user._id,
      referenceBatchId: batchId,
      referenceFileName: req.file ? req.file.originalname : 'Manual Entry',
      totalVehicles: rows.length,
      passedVehicles: passed,
      failedVehicles: failed,
      vehicles: results,
    });

    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while processing vehicles' });
  }
};

// ---------- GET /api/inspection/history ----------
const getInspectionHistory = async (req, res) => {
  try {
    const history = await InspectionRecord.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('referenceFileName totalVehicles passedVehicles failedVehicles createdAt');
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET /api/inspection/:id ----------
const getInspectionById = async (req, res) => {
  try {
    const record = await InspectionRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- DELETE /api/inspection/:id ----------
const deleteInspection = async (req, res) => {
  try {
    const record = await InspectionRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await record.deleteOne();
    res.json({ message: 'Inspection deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { processVehicles, getInspectionHistory, getInspectionById, deleteInspection };