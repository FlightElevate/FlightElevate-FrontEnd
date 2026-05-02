export const FLIGHT_TYPES = [
  "Dual Local",
  "Dual Cross-Country",
  "Solo",
  "Solo Cross-Country",
  "Rental",
  "Ground Training (no aircraft required)",
  "Discovery Flight",
  "Checkride",
  "Stage Check",
  "Flight Review / IPC",
  "Simulator / FTD / AATD / FFS",
  "Observation Flight",
  "Ferry Flight",
  "Reposition Flight",
  "Company Flight",
  "Other"
];

export const isCustomFlightType = (type) => {
  return type && !FLIGHT_TYPES.filter(t => t !== 'Other').includes(type);
};
