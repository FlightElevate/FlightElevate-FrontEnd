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

// Column heading
const ColumnTitle = ({ children }) => (
  <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
    {children}
  </h4>
);

// One label/value pair: label on the left, value on the right.
// Works at any column width, so it holds up in a narrow third column.
const Row = ({ label, mono, children }) => (
  <div className="flex items-baseline justify-between gap-4 py-2">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className={`text-sm font-medium text-slate-800 text-right break-words min-w-0 ${mono ? "font-num" : ""}`}>
      {children}
    </dd>
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
    // Photo on the left from `lg`; on smaller screens it sits on top.
    // The field columns auto-fit: as many ~210px columns as the width allows.
    <div className="bg-slate-50 p-5 md:p-6 grid grid-cols-1 lg:grid-cols-[minmax(200px,240px)_1fr] gap-x-8 gap-y-6">
      {/* Photo */}
      <div>
        <div className="relative rounded-xl overflow-hidden bg-slate-200 border border-slate-200 aspect-[4/3] max-w-sm lg:max-w-none">
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
        <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-x-8 gap-y-5 items-start">
          {/* Aircraft */}
          <div className="min-w-0">
            <ColumnTitle>Aircraft</ColumnTitle>
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
          </div>

          {/* Meters */}
          <div className="min-w-0">
            <ColumnTitle>Meters</ColumnTitle>
            <dl>
              <Row label="Current Hobbs" mono>{toFixed(aircraft.current_hobbs, 1)} hrs</Row>
              <Row label={isMulti ? "Tach 1" : "Current Tach"} mono>{toFixed(aircraft.current_tach, 1)} hrs</Row>
              {isMulti && <Row label="Tach 2" mono>{toFixed(aircraft.current_tach_2, 1)} hrs</Row>}
            </dl>
          </div>

          {/* Lifespan */}
          <div className="min-w-0">
            <ColumnTitle>Lifespan</ColumnTitle>
            <dl>
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
        </div>

        {/* Additional attributes */}
        {extraAttributes.length > 0 && (
          <div className="mt-6">
            <ColumnTitle>Additional Attributes</ColumnTitle>
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-x-8">
              {extraAttributes.map(([key, value]) => (
                <Row key={key} label={<span className="capitalize">{key.replace(/_/g, " ")}</span>}>
                  {value || "N/A"}
                </Row>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};

export default ACDetails;


