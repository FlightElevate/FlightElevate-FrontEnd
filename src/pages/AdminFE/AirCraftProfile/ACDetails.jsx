import React from "react";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=600&auto=format&fit=crop";

const getStatusStyles = (status) => {
  switch (status) {
    case "in_service":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/70";
    case "maintenance":
      return "bg-amber-50 text-amber-700 border-amber-200/70";
    default:
      return "bg-rose-50 text-rose-700 border-rose-200/70";
  }
};

const getStatusLabel = (status) => {
  const statusMap = {
    in_service: "In Service",
    maintenance: "Maintenance",
    not_in_service: "Not In Service",
  };
  return statusMap[status] || status;
};

// One label/value pair. Labels sit right-aligned next to the value on
// tablet+, and stay left-aligned on phones.
const Row = ({ label, mono, children }) => (
  <div className="grid grid-cols-2 sm:grid-cols-[170px_1fr] gap-x-4 items-baseline py-1.5">
    <dt className="text-sm text-slate-500 sm:text-right">{label}</dt>
    <dd className={`text-sm font-medium text-slate-800 break-words ${mono ? "font-num" : ""}`}>{children}</dd>
  </div>
);

const toFixed = (value, digits) =>
  value != null && !isNaN(parseFloat(value)) ? parseFloat(value).toFixed(digits) : (0).toFixed(digits);

const ACDetails = ({ aircraft }) => {
  if (!aircraft) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 font-medium">No aircraft data available</p>
      </div>
    );
  }

  const isMulti = aircraft.aircraft_class?.includes("Multi");
  const extraAttributes = Object.entries(aircraft.additional_attributes || {});

  return (
    <div className="bg-slate-50 p-5 md:p-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5 md:gap-8">
      {/* Photo */}
      <div>
        <div className="relative rounded-xl overflow-hidden bg-slate-200 border border-slate-200 aspect-[4/3] max-w-md md:max-w-none">
          <img
            src={aircraft.image || FALLBACK_IMAGE}
            alt={aircraft.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = FALLBACK_IMAGE;
            }}
          />
          <span
            className={`absolute top-3 right-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${getStatusStyles(
              aircraft.status
            )}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
            {getStatusLabel(aircraft.status)}
          </span>
        </div>
      </div>

      {/* Fields */}
      <div className="min-w-0">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-10 gap-y-2">
          <dl>
            <Row label="Registration Number">
              <span className="font-num bg-blue-50 text-blue-700 font-semibold px-2.5 py-0.5 rounded-lg">
                {aircraft.serial_number || "N/A"}
              </span>
            </Row>
            <Row label="Model">{aircraft.model || "N/A"}</Row>
            <Row label="Category">{aircraft.category || "N/A"}</Row>
            {aircraft.organization && (
              <Row label="Fleet Operator">{aircraft.organization.name || "N/A"}</Row>
            )}
          </dl>

          <dl>
            <Row label="Current Hobbs" mono>{toFixed(aircraft.current_hobbs, 1)} hrs</Row>
            <Row label={isMulti ? "Tach 1" : "Current Tach"} mono>{toFixed(aircraft.current_tach, 1)} hrs</Row>
            {isMulti && <Row label="Tach 2" mono>{toFixed(aircraft.current_tach_2, 1)} hrs</Row>}
            <Row label="Total Airframe Hours" mono>{toFixed(aircraft.total_hours, 2)} hrs</Row>
            <Row label="Flight Cycles" mono>
              {aircraft.total_cycles != null && !isNaN(parseInt(aircraft.total_cycles))
                ? parseInt(aircraft.total_cycles)
                : 0}
            </Row>
            {isMulti && (
              <>
                <Row label="Engine 1 Cycles" mono>{aircraft.engine_1_cycles != null ? aircraft.engine_1_cycles : "N/A"}</Row>
                <Row label="Engine 2 Cycles" mono>{aircraft.engine_2_cycles != null ? aircraft.engine_2_cycles : "N/A"}</Row>
              </>
            )}
          </dl>
        </div>

        {extraAttributes.length > 0 && (
          <dl className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 xl:grid-cols-2 gap-x-10">
            {extraAttributes.map(([key, value]) => (
              <Row key={key} label={<span className="capitalize">{key.replace(/_/g, " ")}</span>}>
                {value || "N/A"}
              </Row>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
};

export default ACDetails;

