import React, { createContext, useState, useContext } from 'react';

const InspectionContext = createContext();

export const useInspection = () => useContext(InspectionContext);

export const InspectionProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [result, setResult] = useState(null);

 const clearInspection = () => {
  console.log('clearInspection called!');
  setVehicles([]);
  setResult(null);
};

  // Populate manual entry from history record (edit)
  const loadVehiclesFromRecord = (record) => {
    if (!record || !record.vehicles) return;
    const rows = record.vehicles.map(veh => {
      const row = {
        vehicleNumber: veh.vehicleNumber,
        ...veh.rowData,                // all original columns
      };
      return row;
    });
    setVehicles(rows);
    setResult(null);                   // clear old result so new comparison can be done
  };

  return (
    <InspectionContext.Provider
      value={{
        vehicles,
        setVehicles,
        result,
        setResult,
        clearInspection,
        loadVehiclesFromRecord,
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
};