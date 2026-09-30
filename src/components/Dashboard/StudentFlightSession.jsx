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
import { lessonService } from "../../api/services/lessonService";

const RANGES = [
  { id: "24h", label: "24 hours" },
  { id: "30d", label: "30 days" },
  { id: "6m", label: "6 months" },
  { id: "1y", label: "1 year" },
];

const HOUR_FIELDS = [
  "flight_dual_hours",
  "flight_solo_hours",
  "flight_cross_country_dual_hours",
  "flight_cross_country_solo_hours",
];

const toHours = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getLessons = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.lessons)) return data.lessons;
  if (Array.isArray(response?.lessons)) return response.lessons;
  return [];
};

const getPageInfo = (response) => {
  const data = response?.data;
  return response?.pagination || response?.meta || data?.pagination || data?.meta || {};
};

const fetchAllLessons = async (userId) => {
  const perPage = 500;
  const allLessons = [];
  const seenPages = new Set();
  let page = 1;

  // Continue until the service says there are no more pages, or a short page
  // indicates the end when pagination metadata is not included in the response.
  while (page <= 1000) {
    const response = await lessonService.getUserLessons(userId, {
      type: "student",
      page,
      per_page: perPage,
    });
    if (response?.success === false) {
      throw new Error(response.message || "Could not load flight sessions.");
    }

    const pageLessons = getLessons(response);
    if (!pageLessons.length) break;

    // Avoid an infinite loop if the endpoint ignores the page parameter.
    const signature = pageLessons.map((lesson) => lesson?.id ?? `${lesson?.lesson_date}-${lesson?.full_date}`).join("|");
    if (seenPages.has(signature)) break;
    seenPages.add(signature);
    allLessons.push(...pageLessons);

    const info = getPageInfo(response);
    const currentPage = Number(info.current_page ?? info.page ?? page);
    const lastPage = Number(info.last_page ?? info.total_pages ?? info.lastPage);
    const total = Number(info.total ?? info.total_count ?? info.count);

    if (Number.isFinite(lastPage) && lastPage > 0) {
      if (currentPage >= lastPage) break;
    } else if (Number.isFinite(total) && total >= 0) {
      if (allLessons.length >= total) break;
    } else if (pageLessons.length < perPage) {
      break;
    }
    page += 1;
  }

  return allLessons;
};

const getLessonHours = (lesson) => HOUR_FIELDS.reduce((sum, field) => sum + toHours(lesson?.[field]), 0);

const getLessonDate = (lesson) => {
  const value = lesson?.full_date || lesson?.lesson_date || lesson?.date || lesson?.created_at;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isMultiEngine = (lesson) =>
  `${lesson?.aircraft_category || ""} ${lesson?.flight_type || ""}`.toLowerCase().includes("multi");

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

const StudentFlightSession = () => {
  const { user } = useAuth();
  const [range, setRange] = useState("30d");
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchLessons = async () => {
      if (!user?.id) {
        setLessons([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const allLessons = await fetchAllLessons(user.id);
        if (active) setLessons(allLessons);
      } catch (err) {
        if (active) {
          setLessons([]);
          setError(err?.message || "Could not load flight sessions.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchLessons();
    return () => { active = false; };
  }, [user?.id]);

  const { chartData, summary } = useMemo(() => {
    const now = new Date();
    const start = getWindowStart(range, now);
    const buckets = makeEmptyBuckets(range, now, start);
    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    let singleEngine = 0;
    let multiEngine = 0;

    lessons.forEach((lesson) => {
      const date = getLessonDate(lesson);
      if (!date || date < start || date > now) return;
      const bucket = bucketMap.get(getBucket(date, range).key);
      if (!bucket) return;
      const hours = getLessonHours(lesson);
      if (isMultiEngine(lesson)) {
        bucket.multi += hours;
        multiEngine += hours;
      } else {
        bucket.single += hours;
        singleEngine += hours;
      }
    });

    return {
      chartData: buckets,
      summary: { singleEngine: rounded(singleEngine), multiEngine: rounded(multiEngine) },
    };
  }, [lessons, range]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="flight-session-title">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Flight analytics</p>
          <h3 id="flight-session-title" className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
            Flight session summary
          </h3>
          <p className="mt-1 text-sm text-gray-500">Logged hours by aircraft category</p>
        </div>
        <div className="flex w-full gap-1 rounded-xl bg-gray-100 p-1 sm:w-auto" role="group" aria-label="Select flight summary period">
          {RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              aria-pressed={range === item.id}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:flex-none ${
                range === item.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Single engine
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.singleEngine}<span className="ml-1 text-sm font-medium text-gray-500">hrs</span></p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Multi engine
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.multiEngine}<span className="ml-1 text-sm font-medium text-gray-500">hrs</span></p>
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

export default StudentFlightSession;
