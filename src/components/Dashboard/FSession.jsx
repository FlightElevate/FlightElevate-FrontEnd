import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import { logbookService } from "../../api/services/logbookService";


const CustomBarShape = (props) => {
  const { x, y, width, height, fill, value } = props;

  
  if (value === "" || value === null || value === undefined) {
    return (
      <Rectangle
        x={x}
        y={y - 2} 
        width={width}
        height={height + 2}
        stroke="#9CA3AF"
        strokeDasharray="4 2"
        fill="transparent"
        radius={[6, 6, 0, 0]}
      />
    );
  }

  
  return (
    <Rectangle x={x} y={y} width={width} height={height} fill={fill} radius={[6, 6, 0, 0]} />
  );
};

const FSession = () => {
  const [timePeriod, setTimePeriod] = useState("30d");
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);
  const [logbookData, setLogbookData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch logbook data
  useEffect(() => {
    const fetchLogbookData = async () => {
      setLoading(true);
      try {
        const response = await logbookService.getEntries({
          per_page: 1000 // Get all entries for accurate calculation
        });

        if (response.success) {
          const logbooks = Array.isArray(response.data) ? response.data : [];
          setLogbookData(logbooks);
        }
      } catch (error) {
        console.error('Error fetching logbook data:', error);
        setLogbookData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogbookData();
  }, []);

  // Helper function to determine if aircraft is single or multi engine
  const isSingleEngine = (aircraftClass) => {
    if (!aircraftClass) return null;
    const classLower = aircraftClass.toLowerCase();
    // ASEL = Airplane Single Engine Land, ASES = Airplane Single Engine Sea
    return classLower.includes('asel') || classLower.includes('ases');
  };

  const isMultiEngine = (aircraftClass) => {
    if (!aircraftClass) return null;
    const classLower = aircraftClass.toLowerCase();
    // AMEL = Airplane Multi Engine Land, AMES = Airplane Multi Engine Sea
    return classLower.includes('amel') || classLower.includes('ames');
  };

  // Build buckets for the selected window, keeping the organization-wide logbook data.
  const processedData = useMemo(() => {
    const dataMap = {};
    const now = new Date();
    const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (timePeriod === "24h") {
      const start = new Date(now);
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() - 23);
      for (let i = 0; i < 24; i += 1) {
        const date = new Date(start);
        date.setHours(start.getHours() + i);
        const key = `${dateKey(date)}-${String(date.getHours()).padStart(2, '0')}`;
        dataMap[key] = { key, month: date.toLocaleTimeString('en-US', { hour: 'numeric' }), single: 0, multi: 0 };
      }
    } else if (timePeriod === "30d") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 29);
      for (let i = 0; i < 30; i += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const key = dateKey(date);
        dataMap[key] = { key, month: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), single: 0, multi: 0 };
      }
    } else {
      const count = timePeriod === "6m" ? 6 : 12;
      const start = new Date(now.getFullYear(), now.getMonth() - count + 1, 1);
      for (let i = 0; i < count; i += 1) {
        const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const key = monthKey(date);
        dataMap[key] = { key, month: date.toLocaleDateString('en-US', { month: 'short', ...(timePeriod === '1y' ? { year: '2-digit' } : {}) }), single: 0, multi: 0 };
      }
    }

    logbookData.forEach((logbook) => {
      if (!logbook.flight_date) return;
      const date = new Date(logbook.flight_date);
      if (Number.isNaN(date.getTime()) || date > now) return;
      const key = timePeriod === '24h'
        ? `${dateKey(date)}-${String(date.getHours()).padStart(2, '0')}`
        : timePeriod === '30d' ? dateKey(date) : monthKey(date);
      const bucket = dataMap[key];
      if (!bucket) return;
      const totalHours = Number.parseFloat(logbook.total_hours) || 0;
      const aircraftClass = `${logbook.aircraft_class || ''} ${logbook.aircraft_category || ''}`;
      if (isSingleEngine(aircraftClass)) bucket.single += totalHours;
      else if (isMultiEngine(aircraftClass)) bucket.multi += totalHours;
    });

    return Object.values(dataMap);
  }, [logbookData, timePeriod]);

  // Calculate summary totals
  const summary = useMemo(() => {
    const totalSingle = processedData.reduce((sum, item) => sum + (item.single || 0), 0);
    const totalMulti = processedData.reduce((sum, item) => sum + (item.multi || 0), 0);
    return { 
      totalSingle: Math.round(totalSingle * 10) / 10, 
      totalMulti: Math.round(totalMulti * 10) / 10 
    };
  }, [processedData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="relative z-20 mb-5 flex flex-wrap items-center gap-4 pb-1 sm:flex-nowrap">
        <div className="shrink-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Organization-wide summary</p>
          <h2 className="font-heading mt-1 text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">Flight session summary</h2>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
          <div className="flex shrink-0 flex-col items-start gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Single engine</span>
            <span className="font-num text-xl font-semibold leading-none tracking-tight text-gray-900 sm:text-2xl">
              {summary.totalSingle.toLocaleString()}<span className="ml-1 text-xs font-medium text-gray-500">hrs</span>
            </span>
          </div>
          <div className="h-9 w-px bg-gray-200" aria-hidden="true" />
          <div className="flex shrink-0 flex-col items-start gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Multi engine</span>
            <span className="font-num text-xl font-semibold leading-none tracking-tight text-gray-900 sm:text-2xl">
              {summary.totalMulti.toLocaleString()}<span className="ml-1 text-xs font-medium text-gray-500">hrs</span>
            </span>
          </div>
        </div>

        <div className="relative z-30 ml-auto shrink-0">
          <button
            type="button"
            onClick={() => setRangeMenuOpen((open) => !open)}
            aria-expanded={rangeMenuOpen}
            aria-haspopup="menu"
            aria-label={`Filter period: ${{ '24h': '24 hours', '30d': '30 days', '6m': '6 months', '1y': '1 year' }[timePeriod]}`}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-gray-500">
              <path d="M3 5h14M5.5 10h9M8 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="7" cy="5" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12.5" cy="10" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="9" cy="15" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>{{ '24h': '24 hours', '30d': '30 days', '6m': '6 months', '1y': '1 year' }[timePeriod]}</span>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-gray-400">
              <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {rangeMenuOpen && (
            <>
              <button className="fixed inset-0 z-10 cursor-default" aria-label="Close period menu" onClick={() => setRangeMenuOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-lg" role="menu" aria-label="Flight summary period">
                {[
                  { id: '24h', label: '24 hours' },
                  { id: '30d', label: '30 days' },
                  { id: '6m', label: '6 months' },
                  { id: '1y', label: '1 year' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={timePeriod === item.id}
                    onClick={() => { setTimePeriod(item.id); setRangeMenuOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${timePeriod === item.id ? 'bg-slate-100 font-medium text-slate-900' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {item.label}
                    {timePeriod === item.id && <span aria-hidden="true" className="text-slate-600">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processedData} barGap={3} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="month" interval={timePeriod === "24h" ? 3 : timePeriod === "30d" ? 4 : 0} tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
            <Tooltip
              cursor={{ fill: "#F9FAFB" }}
              contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 8px 24px rgba(15,23,42,.08)" }}
              formatter={(value, name) => [`${Number(value || 0).toLocaleString()} hrs`, name]}
            />
            <Bar dataKey="single" name="Single engine" fill="#10B981" shape={<CustomBarShape />} radius={[5, 5, 0, 0]} maxBarSize={32} />
            <Bar dataKey="multi" name="Multi engine" fill="#3B82F6" shape={<CustomBarShape />} radius={[5, 5, 0, 0]} maxBarSize={32} />
            <Legend wrapperStyle={{ paddingTop: 6, fontSize: 12 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default FSession;


