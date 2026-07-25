import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useInspection } from '../context/InspectionContext';

const MEASUREMENT_PARAMS = [
  'TC_DFT_um', 'BC_DFT_um', 'CC_DFT_um', 'Avg_DFT_um',
  'Delta_E', 'Delta_L', 'Delta_a', 'Delta_b',
  '1W_H', '1W_V', '5W_H', '5W_V', 'POL', 'D_Val',
];

const InspectionHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [detailMap, setDetailMap] = useState({});  // id -> full record
  const [loadingDetails, setLoadingDetails] = useState({});
  const { loadVehiclesFromRecord } = useInspection();
  const navigate = useNavigate();

  const fetchRecords = async () => {
    try {
     const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/inspection/history`);
      setRecords(res.data);
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const fetchDetail = async (id) => {
    if (detailMap[id]) return;
    setLoadingDetails(prev => ({ ...prev, [id]: true }));
    try {
     const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/inspection/${id}`);
      setDetailMap(prev => ({ ...prev, [id]: res.data }));
    } catch (err) {
      toast.error('Failed to load details');
    } finally {
      setLoadingDetails(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleExpand = (id) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      fetchDetail(id);
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Delete this inspection?')) return;
    try {
    await axios.delete(`${process.env.REACT_APP_API_URL}/api/inspection/${id}`);
      toast.success('Deleted');
      setExpanded(null);
      setDetailMap(prev => { const { [id]: _, ...rest } = prev; return rest; });
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleEdit = (id) => {
    const record = detailMap[id];
    if (!record) {
      toast.error('Please expand the record first');
      return;
    }
    loadVehiclesFromRecord(record);
    navigate('/inspection');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">📜 Inspection History</h1>
        {loading ? <p>Loading...</p> : records.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow text-center text-gray-500">No inspections yet.</div>
        ) : (
          <div className="space-y-6">
            {records.map(rec => (
              <div key={rec._id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(rec._id)}>
                  <div>
                    <p className="text-lg font-semibold">{rec.referenceFileName || 'Inspection'}</p>
                    <p className="text-sm text-gray-500">{new Date(rec.createdAt).toLocaleString()} — {rec.totalVehicles} vehicles</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">{rec.passedVehicles} OK</span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">{rec.failedVehicles} Fail</span>
                    <span className="text-purple-600 text-sm">{expanded === rec._id ? '▲ Hide' : '▼ Details'}</span>
                  </div>
                </div>
                {expanded === rec._id && (
                  <div className="border-t px-6 py-4">
                    {loadingDetails[rec._id] ? (
                      <p>Loading details...</p>
                    ) : detailMap[rec._id] ? (
                      <>
                        <div className="flex gap-4 mb-4">
                          <button onClick={() => handleEdit(rec._id)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">✏️ Edit & Re-check</button>
                          <button onClick={() => deleteRecord(rec._id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">🗑️ Delete</button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="py-2 px-2 text-left text-purple-600">Vehicle Number</th>
                                <th className="py-2 px-2 text-left text-purple-600">Batch ID</th>
                                <th className="py-2 px-2 text-left text-purple-600">Part Category</th>
                                <th className="py-2 px-2 text-left text-purple-600">Body Location</th>
                                <th className="py-2 px-2 text-left text-purple-600">Layer Type</th>
                                <th className="py-2 px-2 text-left text-purple-600">Color Type</th>
                                {MEASUREMENT_PARAMS.map(p => <th key={p} className="py-2 px-2 text-left text-purple-600">{p}</th>)}
                                <th className="py-2 px-2 text-left text-purple-600">Status</th>
                                <th className="py-2 px-2 text-left text-purple-600">Failure Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailMap[rec._id].vehicles.map((veh, idx) => (
                                <tr key={idx} className="border-b hover:bg-purple-50">
                                  <td className="py-2 px-2">{veh.vehicleNumber}</td>
                                  <td className="py-2 px-2">{veh.rowData?.Batch_ID || ''}</td>
                                  <td className="py-2 px-2">{veh.rowData?.Part_Category || ''}</td>
                                  <td className="py-2 px-2">{veh.rowData?.Body_Location || ''}</td>
                                  <td className="py-2 px-2">{veh.rowData?.Layer_Type || ''}</td>
                                  <td className="py-2 px-2">{veh.rowData?.Color_Type || ''}</td>
                                  {MEASUREMENT_PARAMS.map(p => <td key={p} className="py-2 px-2">{veh.rowData?.[p] !== undefined ? veh.rowData[p] : ''}</td>)}
                                  <td className="py-2 px-2">
                                    <span className={`px-2 py-1 rounded-full text-sm font-semibold ${veh.status === 'OK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{veh.status}</span>
                                  </td>
                                  <td className="py-2 px-2">
                                    {veh.status === 'Not OK' ? (
                                      <details className="text-purple-600 cursor-pointer">
                                        <summary>View ({veh.failures.length})</summary>
                                        <ul className="mt-1 space-y-1 text-sm text-gray-700">
                                          {veh.failures.map((f, i) => <li key={i} className="bg-red-50 p-1 rounded"><strong>{f.parameter}</strong>: {f.currentValue} (expected {f.expected})</li>)}
                                        </ul>
                                      </details>
                                    ) : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <p className="text-red-500">Could not load details.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionHistory;