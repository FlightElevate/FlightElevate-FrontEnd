import React from "react";

const Detail = ({ label, children }) => (
  <div className="min-w-0 border-b border-slate-100 py-2.5">
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-1 break-words text-sm font-semibold text-slate-800">
      {children ?? "N/A"}
    </p>
  </div>
);

const ACDetails = ({ aircraft }) => {
  if (!aircraft) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">No aircraft data available</p>
      </div>
    );
  }

  const multiEngine = aircraft.aircraft_class?.includes("Multi");
  const statusLabels = {
    in_service: "In Service",
    maintenance: "Maintenance",
    not_in_service: "Not In Service",
  };
  const statusColors = {
    in_service: "bg-green-100 text-green-800",
    maintenance: "bg-yellow-100 text-yellow-800",
    not_in_service: "bg-red-100 text-red-800",
  };
  const status = aircraft.status || "not_in_service";
  const attributes = aircraft.additional_attributes;

  const number = (value, digits = 0, fallback = "N/A") =>
    value !== null && value !== undefined && value !== "" && !Number.isNaN(Number(value))
      ? Number(value).toFixed(digits)
      : fallback;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-1 gap-5 p-4 md:grid-cols-[minmax(220px,0.38fr)_minmax(0,1fr)] md:p-5">
        <div className="relative flex aspect-[4/3] min-h-[220px] items-center justify-center overflow-hidden rounded-xl bg-slate-100">
          <img
            src={aircraft.image || "https://via.placeholder.com/600x450"}
            alt={aircraft.name || aircraft.serial_number || "Aircraft"}
            className="h-full w-full object-contain"
            onError={(event) => {
              event.currentTarget.src = "https://via.placeholder.com/600x450";
            }}
          />
          <span
            className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold ${
              statusColors[status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {statusLabels[status] || status}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="mb-2 text-lg font-bold text-slate-900">
            Aircraft Overview
          </h3>

          <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2 xl:grid-cols-3">
            {aircraft.organization && (
              <Detail label="Fleet Operator">
                {aircraft.organization.name || "N/A"}
              </Detail>
            )}
            <Detail label="Registration Number">{aircraft.serial_number || "N/A"}</Detail>
            <Detail label="Model">{aircraft.model || "N/A"}</Detail>
            <Detail label="Category">{aircraft.category || "N/A"}</Detail>
            <Detail label="Aircraft Class">{aircraft.aircraft_class || "N/A"}</Detail>
            <Detail label="Current Hobbs">{number(aircraft.current_hobbs, 1, "0.0")} hrs</Detail>
            <Detail label={multiEngine ? "Tach 1" : "Current Tach"}>
              {number(aircraft.current_tach, 1, "0.0")} hrs
            </Detail>

            {multiEngine && (
              <>
                <Detail label="Tach 2">
                  {number(aircraft.current_tach_2, 1, "0.0")} hrs
                </Detail>
                <Detail label="Engine 1 Cycles">
                  {aircraft.engine_1_cycles ?? "N/A"}
                </Detail>
                <Detail label="Engine 2 Cycles">
                  {aircraft.engine_2_cycles ?? "N/A"}
                </Detail>
              </>
            )}

            <Detail label="Total Airframe Hours">
              {number(aircraft.total_hours, 2, "0.00")} hrs
            </Detail>
            <Detail label="Flight Cycles">
              {number(aircraft.total_cycles, 0, "0")}
            </Detail>

            {attributes &&
              typeof attributes === "object" &&
              Object.entries(attributes).map(([key, value]) => (
                <Detail key={key} label={key.replace(/_/g, " ")}>
                  {value || "N/A"}
                </Detail>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ACDetails;
