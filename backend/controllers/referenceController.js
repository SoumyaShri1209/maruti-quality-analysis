const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const ReferenceRule = require('../models/ReferenceRule');

// ---------- Determine correct operator ----------
const getOperator = (param) => {
  const p = param.toUpperCase();
  if (p === 'POL') return '>';
  if (p === 'D_VALUE') return '>=';
  if (p === 'DOI' || p === 'GLOSS_60') return '>';      // strictly greater
  if (p === 'DELTA_E_LIMIT' || p === 'PANEL_DE' || p === 'BODY_DE') return '<';
  return '<=';   // default for LW_H, SW_H, etc.
};

// ---------- Map category to data entry Color_Type value ----------
const mapColorCategory = (cat) => {
  const mapping = {
    'light colors': 'Light',
    'dark colors': 'Dark',
    'solid color': 'Solid',
    'metallic color': 'Metallic',
    'all colors': null,   // applies to every vehicle
  };
  return mapping[cat.toLowerCase()] || cat;
};

// ---------- Parse a single Excel buffer ----------
const parseSheet = (buffer, fileName, userId, batchId) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (data.length === 0) return [];

  const headers = Object.keys(data[0]).map(h => h.trim());
  const rules = [];

  // ---- A. Colour Limits (Category, Parameter, Threshold) ----
  const catCol = headers.find(h => ['category', 'color_type'].includes(h.toLowerCase().replace(/\s/g, '')));
  const paramCol = headers.find(h => h.toLowerCase().replace(/\s/g, '') === 'parameter');
  const thresholdCol = headers.find(h => h.toLowerCase().replace(/\s/g, '') === 'threshold');

  if (catCol && paramCol && thresholdCol) {
    data.forEach(row => {
      let cat = String(row[catCol] || '').trim();
      let param = String(row[paramCol] || '').trim();
      const value = parseFloat(row[thresholdCol]);
      if (!cat || !param || isNaN(value)) return;

      // ✅ Normalise hyphens → underscores (e.g., LW-H → LW_H)
      param = param.replace(/-/g, '_');

      const mappedCat = mapColorCategory(cat);
      const operator = getOperator(param);

      const conditions = [];
      if (mappedCat) {
        conditions.push({ field: 'Color_Type', value: mappedCat });
      }

      // Delta_E_Limit must check both Panel_DE and Body_DE
      if (param.toUpperCase() === 'DELTA_E_LIMIT') {
        ['Panel_DE', 'Body_DE'].forEach(col => {
          rules.push({
            user: userId, batchId, ruleCategory: 'Color_Limit',
            conditions,
            checks: [{ parameter: col, operator, value }],
            fileName,
          });
        });
      } else {
        rules.push({
          user: userId, batchId, ruleCategory: 'Color_Limit',
          conditions,
          checks: [{ parameter: param, operator, value }],
          fileName,
        });
      }
    });
    return rules;
  }

  // ---- B. Process Limits (DFT Ranges & Tolerances) ----
  const ruleCatCol = headers.find(h => h.toLowerCase().replace(/\s/g, '') === 'rule_category');
  const layerTypeCol = headers.find(h => h.toLowerCase().replace(/\s/g, '') === 'layer_type');
  const configCol = headers.find(h => h.toLowerCase().replace(/\s/g, '') === 'config');
  const minCol = headers.find(h => h.toLowerCase().replace(/\s/g, '') === 'spec_min_um');
  const maxCol = headers.find(h => h.toLowerCase().replace(/\s/g, '') === 'spec_max_um');

  if (ruleCatCol && layerTypeCol && configCol && minCol && maxCol) {
    data.forEach(row => {
      const ruleCat = String(row[ruleCatCol] || '').trim();
      const layerType = String(row[layerTypeCol] || '').trim();
      const config = String(row[configCol] || '').trim();
      const min = parseFloat(row[minCol]);
      const max = parseFloat(row[maxCol]);
      if (!ruleCat || isNaN(min) || isNaN(max)) return;

      if (['IC DFT', 'BC DFT', 'CC DFT', 'Total DFT'].includes(ruleCat)) {
        const paramMap = {
          'IC': 'IC_DFT_Avg',
          'BC': 'BC_DFT_Avg',
          'CC': 'CC_DFT_Avg',
          'Total': 'Total_DFT_Avg',
        };
        const param = paramMap[layerType];
        if (!param) return;
        rules.push({
          user: userId, batchId, ruleCategory: 'DFT_Range',
          conditions: [{ field: 'Layer_Type', value: config }],
          checks: [{ parameter: param, operator: 'range', min, max }],
          fileName,
        });
      } else if (ruleCat === 'Condition 6') {
        const paramMap = {
          'IC': 'IC_DFT_Avg',
          'BC': 'BC_DFT_Avg',
          'CC': 'CC_DFT_Avg',
        };
        const param = paramMap[layerType];
        if (!param) return;
        rules.push({
          user: userId, batchId, ruleCategory: 'Tolerance',
          conditions: [{ field: 'Condition_Group', value: config }],
          checks: [{ parameter: param, operator: 'tolerance', target: min, tolerance: max, offset: 0 }],
          fileName,
        });
      }
    });
    return rules;
  }

  return [];
};

// ---------- POST /api/reference/upload ----------
const uploadReference = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one Excel file' });
    }

    const batchId = uuidv4();
    let allRules = [];

    for (const file of req.files) {
      const rules = parseSheet(file.buffer, file.originalname, req.user._id, batchId);
      allRules = allRules.concat(rules);
    }

    if (allRules.length === 0) {
      return res.status(400).json({ message: 'No valid rules found in the uploaded files.' });
    }

    await ReferenceRule.insertMany(allRules);

    res.status(201).json({
      message: 'Reference rules uploaded successfully',
      batchId,
      rulesCount: allRules.length,
      ruleCategories: [...new Set(allRules.map(r => r.ruleCategory))],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while processing files' });
  }
};

// ---------- GET /api/reference/history ----------
const getAllReferences = async (req, res) => {
  try {
    const batches = await ReferenceRule.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$batchId',
          fileNames: { $addToSet: '$fileName' },
          createdAt: { $min: '$createdAt' },
          ruleCount: { $sum: 1 },
          categories: { $addToSet: '$ruleCategory' },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET /api/reference/latest ----------
const getLatestReference = async (req, res) => {
  try {
    const latest = await ReferenceRule.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$batchId', createdAt: { $max: '$createdAt' } } },
      { $sort: { createdAt: -1 } },
      { $limit: 1 },
    ]);
    if (!latest.length) return res.status(404).json({ message: 'No reference batch found' });
    const rules = await ReferenceRule.find({ batchId: latest[0]._id });
    res.json({ batchId: latest[0]._id, rules });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- DELETE /api/reference/:id ----------
const deleteReference = async (req, res) => {
  try {
    const batchId = req.params.id;
    const rules = await ReferenceRule.find({ batchId, user: req.user._id });
    if (!rules.length) return res.status(404).json({ message: 'Batch not found' });
    await ReferenceRule.deleteMany({ batchId, user: req.user._id });
    res.json({ message: 'Reference batch removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadReference, getAllReferences, getLatestReference, deleteReference };