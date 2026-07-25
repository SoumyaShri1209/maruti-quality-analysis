


import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useInspection } from '../context/InspectionContext';

const API = process.env.REACT_APP_API_URL || '';

const MEASUREMENT_PARAMS = [
  'IC_DFT_Avg', 'BC_DFT_Avg', 'CC_DFT_Avg', 'Total_DFT_Avg',
  'Gloss_60', 'DOI',
  'LW_H', 'LW_V', 'SW_H', 'SW_V',
  'Panel_DE', 'Body_DE',
  'D_Value'
];

const VehicleInspection = () => {
  const { vehicles, setVehicles, result, setResult } = useInspection();
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const addVehicleRow = () => {
    const newRow = {
      vehicleNumber: '',
      Part_Area: '',
      Layer_Type: '',
      Color_Type: '',
    };
    MEASUREMENT_PARAMS.forEach(p => { newRow[p] = ''; });
    setVehicles([...vehicles, newRow]);
  };

  const removeVehicleRow = (index) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const handleManualChange = (index, field, value) => {
    const updated = [...vehicles];
    updated[index][field] = value;
    setVehicles(updated);
  };

  const submitManual = async () => {
    if (vehicles.length === 0) { toast.error('Add at least one vehicle'); return; }
    const payload = vehicles.map(v => ({
      ...v,
      Vehicle_Number: v.vehicleNumber,
    }));
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/api/inspection/process`, { vehicles: payload });
      setResult(res.data);
      toast.success('Comparison complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (
      selected.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      selected.type === 'application/vnd.ms-excel' ||
      selected.type === 'application/octet-stream'
    )) {
      setFile(selected);
    } else {
      toast.error('Invalid file');
    }
  };

  const handleExcelUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await axios.post(`${API}/api/inspection/process`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success('Excel processed!');
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteInspection = async () => {
    if (!result) return;
    if (!window.confirm('Delete this inspection record?')) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/api/inspection/${result._id}`);
      toast.success('Inspection deleted');
      setResult(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-full mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🔍 Vehicle Inspection</h1>

        {/* Manual Entry */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">✍️ Manual Vehicle Entry</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-2 text-left text-purple-600">Vehicle Number</th>
                  <th className="py-2 px-2 text-left text-purple-600">Part Area</th>
                  <th className="py-2 px-2 text-left text-purple-600">Layer Type</th>
                  <th className="py-2 px-2 text-left text-purple-600">Color Type</th>
                  {MEASUREMENT_PARAMS.map(p => (
                    <th key={p} className="py-2 px-2 text-left text-purple-600">{p}</th>
                  ))}
                  <th className="py-2 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((veh, idx) => (
                  <tr key={idx} className="border-b hover:bg-purple-50">
                    <td className="py-2 px-2">
                      <input type="text" value={veh.vehicleNumber}
                        onChange={(e) => handleManualChange(idx, 'vehicleNumber', e.target.value)}
                        className="w-24 border rounded px-2 py-1" placeholder="VIN-001" required />
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={veh.Part_Area}
                        onChange={(e) => handleManualChange(idx, 'Part_Area', e.target.value)}
                        className="w-24 border rounded px-2 py-1" placeholder="RR Fender" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={veh.Layer_Type}
                        onChange={(e) => handleManualChange(idx, 'Layer_Type', e.target.value)}
                        className="w-16 border rounded px-2 py-1" placeholder="3C2B" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={veh.Color_Type}
                        onChange={(e) => handleManualChange(idx, 'Color_Type', e.target.value)}
                        className="w-16 border rounded px-2 py-1" placeholder="Light" />
                    </td>
                    {MEASUREMENT_PARAMS.map(p => (
                      <td key={p} className="py-2 px-2">
                        <input type="number" step="any" value={veh[p]}
                          onChange={(e) => handleManualChange(idx, p, e.target.value)}
                          className="w-16 border rounded px-2 py-1" placeholder="0.0" />
                      </td>
                    ))}
                    <td className="py-2 px-2">
                      <button onClick={() => removeVehicleRow(idx)} className="text-red-500 hover:underline">❌</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-4">
            <button onClick={addVehicleRow} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
              + Add Vehicle
            </button>
            <button onClick={submitManual} disabled={vehicles.length === 0 || submitting}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-semibold disabled:opacity-50">
              {submitting ? 'Processing...' : 'Submit Manual Entries'}
            </button>
          </div>
        </div>

        {/* Excel Upload */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📤 Upload Data Entry Excel</h2>
          <p className="text-gray-600 mb-2">
            The file must contain <strong>Vehicle_Number</strong>, <strong>Color_Type</strong>, <strong>Layer_Type</strong> and measurement columns.
          </p>
          <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center">
            <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="dataFile" />
            <label htmlFor="dataFile" className="cursor-pointer">
              <div className="text-5xl mb-4">📁</div>
              <p className="text-lg font-semibold">{file ? file.name : 'Click to select Excel file'}</p>
            </label>
          </div>
          <button onClick={handleExcelUpload} disabled={!file || uploading}
            className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
            {uploading ? 'Processing...' : 'Upload & Compare'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">📋 Inspection Results</h2>
              <button onClick={deleteInspection} disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
                {deleting ? 'Deleting...' : '🗑️ Delete Inspection'}
              </button>
            </div>
            <div className="flex gap-6 mb-6">
              <div className="bg-green-100 rounded-lg p-4 flex-1 text-center">
                <p className="text-2xl font-bold text-green-700">{result.passedVehicles}</p>
                <p className="text-green-600">Passed</p>
              </div>
              <div className="bg-red-100 rounded-lg p-4 flex-1 text-center">
                <p className="text-2xl font-bold text-red-700">{result.failedVehicles}</p>
                <p className="text-red-600">Failed</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 flex-1 text-center">
                <p className="text-2xl font-bold text-gray-700">{result.totalVehicles}</p>
                <p className="text-gray-600">Total</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2 text-left text-purple-600">Vehicle Number</th>
                    <th className="py-2 px-2 text-left text-purple-600">Part Area</th>
                    <th className="py-2 px-2 text-left text-purple-600">Layer Type</th>
                    <th className="py-2 px-2 text-left text-purple-600">Color Type</th>
                    {MEASUREMENT_PARAMS.map(p => (
                      <th key={p} className="py-2 px-2 text-left text-purple-600">{p}</th>
                    ))}
                    <th className="py-2 px-2 text-left text-purple-600">Status</th>
                    <th className="py-2 px-2 text-left text-purple-600">Failure Details</th>
                  </tr>
                </thead>
                <tbody>
                  {result.vehicles.map((veh, idx) => (
                    <tr key={idx} className="border-b hover:bg-purple-50">
                      <td className="py-2 px-2 font-medium">{veh.vehicleNumber}</td>
                      <td className="py-2 px-2">{veh.rowData?.Part_Area || ''}</td>
                      <td className="py-2 px-2">{veh.rowData?.Layer_Type || ''}</td>
                      <td className="py-2 px-2">{veh.rowData?.Color_Type || ''}</td>
                      {MEASUREMENT_PARAMS.map(p => (
                        <td key={p} className="py-2 px-2">{veh.rowData?.[p] !== undefined ? veh.rowData[p] : ''}</td>
                      ))}
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                          veh.status === 'OK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {veh.status}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        {veh.status === 'Not OK' ? (
                          <details className="text-purple-600 cursor-pointer">
                            <summary>View Failures ({veh.failures.length})</summary>
                            <ul className="mt-2 space-y-1 text-sm text-gray-700">
                              {veh.failures.map((f, i) => (
                                <li key={i} className="bg-red-50 p-2 rounded">
                                  <strong>{f.parameter}</strong>: measured {f.currentValue} (expected {f.expected})
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          <span className="text-green-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleInspection;