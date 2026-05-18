import React from "react";
import { FiInfo, FiClock, FiActivity, FiBriefcase, FiTag } from "react-icons/fi";

const ACDetails = ({ aircraft }) => {
  if (!aircraft) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 font-medium">No aircraft data available</p>
      </div>
    );
  }

  const getStatusStyles = (status) => {
    switch (status) {
      case 'in_service':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'maintenance':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'in_service': 'In Service',
      'maintenance': 'Maintenance',
      'not_in_service': 'Not In Service'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left side: Premium Image & Live Dashboard Counters */}
      <div className="lg:col-span-4 space-y-6">
        {/* Aircraft Image Card */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md group">
          <img
            src={aircraft.image || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=600&auto=format&fit=crop'}
            alt={aircraft.name}
            className="w-full h-64 object-cover group-hover:scale-105 transition duration-500"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=600&auto=format&fit=crop';
            }}
          />
          {/* Status Badge overlay */}
          <div className="absolute top-4 right-4">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm backdrop-blur-md ${getStatusStyles(aircraft.status)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
              {getStatusLabel(aircraft.status)}
            </span>
          </div>
        </div>

        {/* Live Gauges/Dashboard Counters */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FiActivity size={14} className="text-blue-600" />
            Quick Metrics
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Hobbs Gauge */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Current Hobbs</span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {aircraft.current_hobbs != null ? parseFloat(aircraft.current_hobbs).toFixed(1) : '0.0'}
              </p>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-2 inline-block">Hours</span>
            </div>

            {/* Tach Gauge */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                {aircraft.aircraft_class?.includes('Multi') ? 'Tach 1' : 'Current Tach'}
              </span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {aircraft.current_tach != null ? parseFloat(aircraft.current_tach).toFixed(1) : '0.0'}
              </p>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">Hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Detailed Aircraft Specifications */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Basic Information Section */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2.5">
            <FiInfo className="text-blue-600 w-4 h-4" />
            Basic Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registration Number</p>
              <p className="text-sm font-extrabold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 inline-block">{aircraft.serial_number || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Model</p>
              <p className="text-sm font-semibold text-slate-700">{aircraft.model || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category</p>
              <p className="text-sm font-semibold text-slate-700">{aircraft.category || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Flight Hours & Lifespan details */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2.5">
            <FiClock className="text-blue-600 w-4 h-4" />
            Flight Hours & Lifespan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Airframe Hours</p>
              <p className="text-sm font-semibold text-slate-700">
                {aircraft.total_hours != null && !isNaN(parseFloat(aircraft.total_hours))
                  ? parseFloat(aircraft.total_hours).toFixed(2)
                  : '0.00'}{' '}
                hrs
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Cycles</p>
              <p className="text-sm font-semibold text-slate-700">
                {aircraft.total_cycles != null && !isNaN(parseInt(aircraft.total_cycles))
                  ? parseInt(aircraft.total_cycles)
                  : 0}
              </p>
            </div>
            {aircraft.aircraft_class?.includes('Multi') && (
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Tach 2</p>
                <p className="text-sm font-semibold text-slate-700">
                  {aircraft.current_tach_2 != null ? parseFloat(aircraft.current_tach_2).toFixed(1) : '0.0'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Attributes Section */}
        {aircraft.additional_attributes && Object.keys(aircraft.additional_attributes).length > 0 && (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2.5">
              <FiTag className="text-blue-600 w-4 h-4" />
              Additional Attributes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Object.entries(aircraft.additional_attributes).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{value || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organization / Fleet details */}
        {aircraft.organization && (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2.5">
              <FiBriefcase className="text-blue-600 w-4 h-4" />
              Organization & Fleet
            </h3>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fleet Operator</p>
              <p className="text-sm font-bold text-slate-800">{aircraft.organization.name || 'N/A'}</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ACDetails;
