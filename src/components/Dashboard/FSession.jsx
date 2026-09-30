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
  const [timePeriod, setTimePeriod] = useState("Monthly");
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

  // Process data based on time period
  const processedData = useMemo(() => {
    const dataMap = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate last 7 periods
    for (let i = 6; i >= 0; i--) {
      let d = new Date(today);
      let periodKey = '';
      let periodLabel = '';

      if (timePeriod === "Daily") {
        d.setDate(d.getDate() - i);
        periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        periodLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timePeriod === "Weekly") {
        d.setDate(d.getDate() - (i * 7));
        d.setDate(d.getDate() - d.getDay());
        periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        periodLabel = `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else { // Monthly
        d.setMonth(d.getMonth() - i);
        d.setDate(1);
        periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        periodLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      dataMap[periodKey] = {
        key: periodKey,
        month: periodLabel,
        single: 0,
        multi: 0
      };
    }

    if (logbookData && Array.isArray(logbookData)) {
      logbookData.forEach(logbook => {
        if (!logbook.flight_date || !logbook.total_hours) return;

        const date = new Date(logbook.flight_date);
        const totalHours = parseFloat(logbook.total_hours) || 0;
        const aircraftClass = logbook.aircraft_class || '';

        let periodKey = '';

        if (timePeriod === "Daily") {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        } else if (timePeriod === "Weekly") {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        } else { // Monthly
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (dataMap[periodKey]) {
          if (isSingleEngine(aircraftClass)) {
            dataMap[periodKey].single += totalHours;
          } else if (isMultiEngine(aircraftClass)) {
            dataMap[periodKey].multi += totalHours;
          }
        }
      });
    }

    return Object.values(dataMap).sort((a, b) => new Date(a.key) - new Date(b.key));
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
      <div className="mb-5 flex items-center gap-4 overflow-x-auto whitespace-nowrap pb-1">
        <div className="shrink-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Logbook analytics</p>
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

        <label className="relative flex shrink-0 items-center" aria-label="Choose chart time period">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-2.5 h-4 w-4 text-gray-500">
            <path d="M3 5h14M5.5 10h9M8 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="7" cy="5" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12.5" cy="10" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="9" cy="15" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="min-h-10 appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-xs font-medium text-gray-700 outline-none transition hover:bg-gray-50 focus:ring-2 focus:ring-slate-300 sm:text-sm"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute right-2.5 h-4 w-4 text-gray-400">
            <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>
      </div>

      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processedData} barGap={3} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
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

