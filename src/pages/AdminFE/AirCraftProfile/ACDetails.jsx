import React from "react";

const ACDetails = ({ aircraft }) => {
  if (!aircraft) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No aircraft data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aircraft Image */}
      <div className="flex justify-center sm:justify-start">
        <div className="w-64 h-64 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={aircraft.image || 'https://via.placeholder.com/400x400?text=No+Image'}
            alt={aircraft.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
            }}
          />
        </div>
      </div>

      {/* Basic Information */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-500">Registration Number</p>
            <p className="text-base text-gray-800">{aircraft.serial_number || 'N/A'}</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-500">Model</p>
            <p className="text-base text-gray-800">{aircraft.model || 'N/A'}</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-500">Status</p>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              aircraft.status === 'in_service' 
                ? 'bg-green-100 text-green-800' 
                : aircraft.status === 'maintenance'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {aircraft.status === 'in_service' ? 'In Service' : 
               aircraft.status === 'maintenance' ? 'Maintenance' : 
               'Not In Service'}
            </span>
          </div>
        </div>
      </div>

      {/* Flight Hours & Cycles */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Flight Hours & Cycles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-500">Total Hours</p>
            <p className="text-base text-gray-800 font-semibold">
              {aircraft.total_hours != null && !isNaN(parseFloat(aircraft.total_hours))
                ? parseFloat(aircraft.total_hours).toFixed(2)
                : '0.00'} hrs
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-500">Total Cycles</p>
            <p className="text-base text-gray-800 font-semibold">
              {aircraft.total_cycles != null && !isNaN(parseInt(aircraft.total_cycles))
                ? parseInt(aircraft.total_cycles)
                : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Organization */}
      {aircraft.organization && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Organization</h3>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-500">Organization Name</p>
            <p className="text-base text-gray-800">{aircraft.organization.name || 'N/A'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ACDetails;
