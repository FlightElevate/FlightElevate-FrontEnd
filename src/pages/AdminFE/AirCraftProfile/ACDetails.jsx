import React from "react";
import { FiBriefcase, FiInfo } from "react-icons/fi";
import AirCraftTimes from "./AirCraftTimes";

const statusStyles = {
  in_service: "bg-emerald-50 text-emerald-700 border-emerald-200",
  maintenance: "bg-amber-50 text-amber-700 border-amber-200",
  not_in_service: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabels = {
  in_service: "In Service",
  maintenance: "Maintenance",
  not_in_service: "Not In Service",
};

const valueOr = (value, fallback = "N/A") =>
  value === null || value === undefined || value === "" ? fallback : value;

const formatNumber = (value, digits = 0, fallback = "N/A") => {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
    return fallback;
  }
  return Number(value).toFixed(digits);
};

const Detail = ({ label, children }) => (
  <div className="min-w-0 border-b border-slate-100 py-2.5">
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 break-words text-sm font-semibold text-slate-800">{children ?? "N/A"}</p>
  </div>
);

const ACDetails = ({ aircraft }) => {
  if (!aircraft) {
    return (
      <div className="py-12 text-center">
        <p className="font-medium text-gray-500">No aircraft data available</p>
      </div>
    );
  }

  const isMultiEngine = aircraft.aircraft_class?.includes("Multi");
  const fallbackImage =
    "https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=900&auto=format&fit=crop";
  const attributes = aircraft.additional_attributes;
  const statusLabel = statusLabels[aircraft.status] || aircraft.status || "Unknown";
  const badgeStyle = statusStyles[aircraft.status] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="grid grid-cols-1 gap-5 p-4 md:grid-cols-[minmax(230px,0.38fr)_minmax(0,1fr)] md:p-5">
        {/* Contain the image inside a stable frame so it never stretches or crops. */}
        <div className="relative flex aspect-[4/3] min-h-[220px] items-center justify-center overflow-hidden rounded-xl bg-slate-100">
          <img
            src={aircraft.image || fallbackImage}
            alt={aircraft.name || aircraft.serial_number || "Aircraft"}
            className="h-full w-full object-contain"
            onError={(event) => {
              if (event.currentTarget.src !== fallbackImage) event.currentTarget.src = fallbackImage;
            }}
          />
          <span className={`absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border bg-white/95 px-3 py-1.5 text-xs font-bold ${badgeStyle}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {statusLabel}
          </span>
        </div>

        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <FiInfo className="shrink-0 text-blue-600" size={16} />
            <h2 className="text-lg font-bold text-slate-900">Aircraft Overview</h2>
          </div>
          <p className="mb-2 text-xs text-slate-500">
            {aircraft.name || aircraft.model || "Aircraft specifications and current readings"}
          </p>

          <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2 xl:grid-cols-3">
            {/* Fleet operator is intentionally the first field. */}
            {aircraft.organization && (
              <Detail label="Fleet Operator">{valueOr(aircraft.organization.name)}</Detail>
            )}
            <Detail label="Registration Number">{valueOr(aircraft.serial_number)}</Detail>
            <Detail label="Model">{valueOr(aircraft.model)}</Detail>
            <Detail label="Category">{valueOr(aircraft.category)}</Detail>
            <Detail label="Current Hobbs">{formatNumber(aircraft.current_hobbs, 1, "0.0")} hrs</Detail>
            <Detail label={isMultiEngine ? "Tach 1" : "Current Tach"}>
              {formatNumber(aircraft.current_tach, 1, "0.0")} hrs
            </Detail>
            {isMultiEngine && (
              <Detail label="Current Tach 2">{formatNumber(aircraft.current_tach_2, 1, "0.0")} hrs</Detail>
            )}
            <Detail label="Total Airframe Hours">{formatNumber(aircraft.total_hours, 2, "0.00")} hrs</Detail>
            <Detail label="Flight Cycles">{formatNumber(aircraft.total_cycles, 0, "0")}</Detail>
            {isMultiEngine && (
              <>
                <Detail label="Engine 1 Cycles">{valueOr(aircraft.engine_1_cycles)}</Detail>
                <Detail label="Engine 2 Cycles">{valueOr(aircraft.engine_2_cycles)}</Detail>
              </>
            )}
            {attributes && typeof attributes === "object" &&
              Object.entries(attributes).map(([key, value]) => (
                <Detail key={key} label={key.replace(/_/g, " ")}>
                  {valueOr(value)}
                </Detail>
              ))}
          </div>

          {aircraft.aircraft_class && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <FiBriefcase size={14} />
              <span>{aircraft.aircraft_class}</span>
            </div>
          )}
        </div>
      </div>
      </section>

      <section aria-label="Aircraft Times" className="min-w-0">
        <AirCraftTimes aircraftId={aircraft.id} />
      </section>
    </div>
  );
};

export default ACDetails;
