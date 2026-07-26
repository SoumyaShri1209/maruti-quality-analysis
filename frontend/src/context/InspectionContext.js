import React, { createContext, useState, useContext, useCallback } from 'react';

const InspectionContext = createContext();

export const useInspection = () => useContext(InspectionContext);

export const InspectionProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [result, setResult] = useState(null);

  // ✅ Wrapped in useCallback so the function reference never changes
  const clearInspection = useCallback(() => {
    console.log('clearInspection called!');   // you can remove this line later
    setVehicles([]);
    setResult(null);
  }, []);   // no dependencies → stable forever

  // Populate manual entry from history record (edit)
  const loadVehiclesFromRecord = (record) => {
    if (!record || !record.vehicles) return;
    const rows = record.vehicles.map(veh => ({
      vehicleNumber: veh.vehicleNumber,
      ...veh.rowData,                // all original columns
    }));
    setVehicles(rows);
    setResult(null);                 // clear old result so new comparison can be done
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