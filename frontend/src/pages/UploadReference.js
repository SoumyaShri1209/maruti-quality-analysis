// // frontend/src/pages/UploadReference.js
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import toast from 'react-hot-toast';

// const UploadReference = () => {
//   const [files, setFiles] = useState([]);
//   const [uploading, setUploading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [loadingHistory, setLoadingHistory] = useState(true);

//   const fetchHistory = async () => {
//     try {
//       const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/reference/history`);
//       setHistory(res.data);
//     } catch (err) {
//       toast.error('Failed to load reference history');
//     } finally {
//       setLoadingHistory(false);
//     }
//   };

//   useEffect(() => {
//     fetchHistory();
//   }, []);

//   const handleFileChange = (e) => {
//     setFiles([...e.target.files]);
//   };

//   const handleUpload = async () => {
//     if (files.length === 0) {
//       toast.error('No files selected');
//       return;
//     }
//     const formData = new FormData();
//     files.forEach(f => formData.append('files', f));
//     setUploading(true);
//     try {
//       const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/reference/upload`, formData);
//       setResult(res.data);
//       toast.success('Reference rules uploaded!');
//       setFiles([]);
//       fetchHistory();
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Upload failed');
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleDelete = async (batchId, fileName) => {
//     if (!window.confirm(`Delete batch "${fileName}"?`)) return;
//     try {
//       await axios.delete(`${process.env.REACT_APP_API_URL}/api/reference/${id}`);
//       toast.success('Batch deleted');
//       fetchHistory();
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Delete failed');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-12 px-4">
//       <div className="max-w-4xl mx-auto">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8">📊 Reference Rules Upload</h1>

//         {/* Upload Card */}
//         <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
//           <p className="text-gray-600 mb-4">
//             Select <strong>one or more</strong> threshold Excel files (Color Limits, DFT Ranges, Tolerances).
//           </p>
//           <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center">
//             <input
//               type="file"
//               accept=".xlsx,.xls"
//               multiple
//               onChange={handleFileChange}
//               className="hidden"
//               id="fileInput"
//             />
//             <label htmlFor="fileInput" className="cursor-pointer">
//               <div className="text-5xl mb-4">📁</div>
//               <p className="text-lg font-semibold text-gray-700">
//                 {files.length > 0
//                   ? `${files.length} file(s) selected`
//                   : 'Click to select Excel files'}
//               </p>
//               <p className="text-sm text-gray-400 mt-2">
//                 Hold Ctrl/Cmd to select multiple files
//               </p>
//             </label>
//           </div>
//           {files.length > 0 && (
//             <ul className="mt-4 text-sm text-gray-600">
//               {Array.from(files).map((f, i) => (
//                 <li key={i}>📄 {f.name}</li>
//               ))}
//             </ul>
//           )}
//           <button
//             onClick={handleUpload}
//             disabled={files.length === 0 || uploading}
//             className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
//           >
//             {uploading ? 'Uploading...' : 'Upload All Files'}
//           </button>
//         </div>

//         {/* Upload Result (latest batch) */}
//         {result && (
//           <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
//             <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Upload Successful</h2>
//             <p>
//               Batch: <span className="font-mono text-purple-700">{result.batchId}</span>
//             </p>
//             <p>
//               {result.rulesCount} rules ({result.ruleCategories.join(', ')})
//             </p>
//           </div>
//         )}

//         {/* History Section */}
//         <div className="bg-white rounded-2xl shadow-lg p-8">
//           <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Previous Uploads</h2>
//           {loadingHistory ? (
//             <p className="text-gray-500">Loading...</p>
//           ) : history.length === 0 ? (
//             <p className="text-gray-500">No reference batches yet.</p>
//           ) : (
//             <div className="space-y-4">
//               {history.map((batch) => (
//                 <div
//                   key={batch._id}
//                   className="flex justify-between items-center border rounded-lg p-4"
//                 >
//                   <div>
//                     <p className="font-semibold">
//                       {/* Show all file names, or fallback to old format */}
//                       {batch.fileNames
//                         ? batch.fileNames.join(', ')
//                         : batch.fileName || 'Batch'}
//                     </p>
//                     <p className="text-sm text-gray-500">
//                       {new Date(batch.createdAt).toLocaleString()} – {batch.ruleCount} rules (
//                       {batch.categories?.join(', ')})
//                     </p>
//                   </div>
//                   <button
//                     onClick={() =>
//                       handleDelete(
//                         batch._id,
//                         batch.fileNames?.[0] || batch.fileName || 'Batch'
//                       )
//                     }
//                     className="text-red-500 hover:text-red-700"
//                   >
//                     🗑️
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UploadReference;












import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '';

const UploadReference = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/reference/history`);
      setHistory(res.data);
    } catch (err) {
      toast.error('Failed to load reference history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('No files selected');
      return;
    }
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    setUploading(true);
    try {
      const res = await axios.post(`${API}/api/reference/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success('Reference rules uploaded!');
      setFiles([]);
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (batchId, fileName) => {
    if (!window.confirm(`Delete batch "${fileName}"?`)) return;
    try {
      await axios.delete(`${API}/api/reference/${batchId}`);
      toast.success('Batch deleted');
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">📊 Reference Rules Upload</h1>

        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <p className="text-gray-600 mb-4">
            Select <strong>one or more</strong> threshold Excel files (Color Limits, DFT Ranges, Tolerances).
          </p>
          <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer">
              <div className="text-5xl mb-4">📁</div>
              <p className="text-lg font-semibold text-gray-700">
                {files.length > 0
                  ? `${files.length} file(s) selected`
                  : 'Click to select Excel files'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Hold Ctrl/Cmd to select multiple files
              </p>
            </label>
          </div>
          {files.length > 0 && (
            <ul className="mt-4 text-sm text-gray-600">
              {Array.from(files).map((f, i) => (
                <li key={i}>📄 {f.name}</li>
              ))}
            </ul>
          )}
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload All Files'}
          </button>
        </div>

        {/* Upload Result (latest batch) */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Upload Successful</h2>
            <p>
              Batch: <span className="font-mono text-purple-700">{result.batchId}</span>
            </p>
            <p>
              {result.rulesCount} rules ({result.ruleCategories.join(', ')})
            </p>
          </div>
        )}

        {/* History Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Previous Uploads</h2>
          {loadingHistory ? (
            <p className="text-gray-500">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500">No reference batches yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((batch) => (
                <div
                  key={batch._id}
                  className="flex justify-between items-center border rounded-lg p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {batch.fileNames
                        ? batch.fileNames.join(', ')
                        : batch.fileName || 'Batch'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(batch.createdAt).toLocaleString()} – {batch.ruleCount} rules (
                      {batch.categories?.join(', ')})
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleDelete(
                        batch._id,
                        batch.fileNames?.[0] || batch.fileName || 'Batch'
                      )
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadReference;