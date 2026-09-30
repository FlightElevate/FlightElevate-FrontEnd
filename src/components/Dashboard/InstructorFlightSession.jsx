import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { logbookService } from "../../api/services/logbookService";

const RANGES = [
  { id: "24h", label: "24 hours" },
  { id: "30d", label: "30 days" },
  { id: "6m", label: "6 months" },
  { id: "1y", label: "1 year" },
];

const SINGLE_ENGINE_FIELDS = ["asel_hours", "ases_hours"];
const MULTI_ENGINE_FIELDS = ["amel_hours", "ames_hours"];

const toHours = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getEntries = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.entries)) return data.entries;
  if (Array.isArray(response?.entries)) return response.entries;
  return [];
};

const getPageInfo = (response) => {
  const data = response?.data;
  return response?.pagination || response?.meta || data?.pagination || data?.meta || {};
};

const fetchAllLogbookEntries = async (userId) => {
  const perPage = 500;
  const allEntries = [];
  const seenPages = new Set();
  let page = 1;

  // Continue until the service says there are no more pages, or a short page
  // indicates the end when pagination metadata is not included in the response.
  while (page <= 1000) {
    const response = await logbookService.getUserEntries(userId, {
      page,
      per_page: perPage,
    });
    if (response?.success === false) {
      throw new Error(response.message || "Could not load logbook entries.");
    }

    const pageEntries = getEntries(response);
    if (!pageEntries.length) break;

    // Avoid an infinite loop if the endpoint ignores the page parameter.
    const signature = pageEntries.map((entry) => entry?.id ?? `${entry?.flight_date}-${entry?.created_at}`).join("|");
    if (seenPages.has(signature)) break;
    seenPages.add(signature);
    allEntries.push(...pageEntries);

    const info = getPageInfo(response);
    const currentPage = Number(info.current_page ?? info.page ?? page);
    const lastPage = Number(info.last_page ?? info.total_pages ?? info.lastPage);
    const total = Number(info.total ?? info.total_count ?? info.count);

    if (Number.isFinite(lastPage) && lastPage > 0) {
      if (currentPage >= lastPage) break;
    } else if (Number.isFinite(total) && total >= 0) {
      if (allEntries.length >= total) break;
    } else if (pageEntries.length < perPage) {
      break;
    }
    page += 1;
  }

  return allEntries;
};

const getEngineHours = (entry) => {
  const single = SINGLE_ENGINE_FIELDS.reduce((sum, field) => sum + toHours(entry?.[field]), 0);
  const multi = MULTI_ENGINE_FIELDS.reduce((sum, field) => sum + toHours(entry?.[field]), 0);
  if (single || multi) return { single, multi };

  const total = toHours(entry?.total_hours);
  const aircraftClass = `${entry?.aircraft_class || ""} ${entry?.aircraft_category || ""}`.toLowerCase();
  if (aircraftClass.includes("multi") || aircraftClass.includes("amel") || aircraftClass.includes("ames")) {
    return { single: 0, multi: total };
  }
  if (aircraftClass.includes("single") || aircraftClass.includes("asel") || aircraftClass.includes("ases")) {
    return { single: total, multi: 0 };
  }
  return { single: 0, multi: 0 };
};

const getEntryDate = (entry) => {
  const value = entry?.flight_date || entry?.date || entry?.created_at;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (entry?.flight_date && entry?.flight_time) {
    const [hours, minutes] = String(entry.flight_time).split(":").map(Number);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) date.setHours(hours, minutes, 0, 0);
  }
  return date;
};

const rounded = (value) => Math.round(value * 10) / 10;

const getWindowStart = (range, now) => {
  const start = new Date(now);
  if (range === "24h") start.setHours(start.getHours() - 24);
  if (range === "30d") start.setDate(start.getDate() - 30);
  if (range === "6m") start.setMonth(start.getMonth() - 6);
  if (range === "1y") start.setFullYear(start.getFullYear() - 1);
  return start;
};

const getBucket = (date, range) => {
  if (range === "24h") {
    const hour = new Date(date);
    hour.setMinutes(0, 0, 0);
    return { key: hour.toISOString(), label: hour.toLocaleTimeString([], { hour: "numeric" }) };
  }
  if (range === "30d") {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    return { key: day.toISOString(), label: day.toLocaleDateString([], { month: "short", day: "numeric" }) };
  }
  const month = new Date(date.getFullYear(), date.getMonth(), 1);
  return {
    key: month.toISOString(),
    label: month.toLocaleDateString([], { month: "short", year: range === "1y" ? "2-digit" : undefined }),
  };
};

const makeEmptyBuckets = (range, now, start) => {
  const buckets = [];
  if (range === "24h") {
    for (let offset = 23; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setMinutes(0, 0, 0);
      date.setHours(date.getHours() - offset);
      buckets.push({ ...getBucket(date, range), single: 0, multi: 0 });
    }
  } else if (range === "30d") {
    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      buckets.push({ ...getBucket(date, range), single: 0, multi: 0 });
    }
  } else {
    const count = range === "6m" ? 6 : 12;
    for (let offset = count - 1; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      if (date >= new Date(start.getFullYear(), start.getMonth(), 1)) {
        buckets.push({ ...getBucket(date, range), single: 0, multi: 0 });
      }
    }
  }
  return buckets;
};

const InstructorFlightSession = () => {
  const { user } = useAuth();
  const [range, setRange] = useState("30d");
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchEntries = async () => {
      if (!user?.id) {
        setLogbookEntries([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const entries = await fetchAllLogbookEntries(user.id);
        if (active) setLogbookEntries(entries);
      } catch (err) {
        if (active) {
          setLogbookEntries([]);
          setError(err?.message || "Could not load logbook entries.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchEntries();
    return () => { active = false; };
  }, [user?.id]);

  const { chartData, summary } = useMemo(() => {
    const now = new Date();
    const start = getWindowStart(range, now);
    const buckets = makeEmptyBuckets(range, now, start);
    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    let singleEngine = 0;
    let multiEngine = 0;

    logbookEntries.forEach((entry) => {
      const date = getEntryDate(entry);
      if (!date || date < start || date > now) return;
      const bucket = bucketMap.get(getBucket(date, range).key);
      if (!bucket) return;
      const hours = getEngineHours(entry);
      bucket.single += hours.single;
      bucket.multi += hours.multi;
      singleEngine += hours.single;
      multiEngine += hours.multi;
    });

    return {
      chartData: buckets,
      summary: { singleEngine: rounded(singleEngine), multiEngine: rounded(multiEngine) },
    };
  }, [logbookEntries, range]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="flight-session-title">
      <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap pb-1">
        <div className="min-w-fit shrink-0">
          <p className="text-xs font-medium text-gray-500 sm:text-sm">Flight analytics</p>
          <h3 id="flight-session-title" className="font-heading mt-1 text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
            Flight session summary
          </h3>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
          <div className="flex shrink-0 flex-col items-start gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Single engine</span>
            <span className="font-num text-xl font-semibold leading-none tracking-tight text-gray-900 sm:text-2xl">{summary.singleEngine}<span className="ml-1 text-xs font-medium text-gray-500">hrs</span></span>
          </div>
          <div className="h-9 w-px bg-gray-200" aria-hidden="true" />
          <div className="flex shrink-0 flex-col items-start gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Multi engine</span>
            <span className="font-num text-xl font-semibold leading-none tracking-tight text-gray-900 sm:text-2xl">{summary.multiEngine}<span className="ml-1 text-xs font-medium text-gray-500">hrs</span></span>
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setRangeMenuOpen((open) => !open)}
            aria-expanded={rangeMenuOpen}
            aria-haspopup="menu"
            aria-label={`Filter period: ${RANGES.find((item) => item.id === range)?.label}`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M3 5h14M5.5 10h9M8 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="7" cy="5" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12.5" cy="10" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="9" cy="15" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>{RANGES.find((item) => item.id === range)?.label}</span>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-gray-400">
              <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {rangeMenuOpen && (
            <>
              <button className="fixed inset-0 z-10 cursor-default" aria-label="Close period menu" onClick={() => setRangeMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-lg" role="menu" aria-label="Flight summary period">
                {RANGES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={range === item.id}
                    onClick={() => { setRange(item.id); setRangeMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      range === item.id ? "bg-emerald-50 font-medium text-emerald-800" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                    {range === item.id && <span aria-hidden="true" className="text-emerald-600">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 h-72 w-full" role="img" aria-label={`Flight hours for the last ${RANGES.find((item) => item.id === range)?.label}`}>
        {loading ? (
          <div className="h-full animate-pulse rounded-xl bg-gray-100" />
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 px-4 text-center text-sm text-gray-500">{error}</div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">No flight sessions in this period.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="4 4" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} interval={range === "24h" ? 3 : range === "30d" ? 4 : 0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} width={42} allowDecimals />
              <Tooltip
                cursor={{ fill: "#F9FAFB" }}
                contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 8px 24px rgba(15,23,42,.08)" }}
                formatter={(value, name) => [`${rounded(Number(value) || 0)} hrs`, name]}
                labelFormatter={(label) => label}
              />
              <Bar dataKey="single" name="Single engine" fill="#10B981" radius={[5, 5, 0, 0]} maxBarSize={32} />
              <Bar dataKey="multi" name="Multi engine" fill="#3B82F6" radius={[5, 5, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};

export default InstructorFlightSession;



