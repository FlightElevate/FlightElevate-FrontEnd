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
      <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Flight Session Summary
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <select 
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
      </div>

      {}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 mb-6">
        <div>
          <p className="text-sm text-gray-500">Single Engine</p>
          <h3 className="text-2xl font-semibold text-gray-900">
            {summary.totalSingle.toLocaleString()}{" "}
            <span className="text-sm text-green-600 font-normal">Hours</span>
          </h3>
        </div>
        <div>
          <p className="text-sm text-gray-500">Multi Engine</p>
          <h3 className="text-2xl font-semibold text-gray-900">
            {summary.totalMulti.toLocaleString()}{" "}
            <span className="text-sm text-green-600 font-normal">Hours</span>
          </h3>
        </div>
      </div>

      {}
      <div className="w-full" style={{ height: '320px', minWidth: '300px', minHeight: '320px' }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={processedData} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={10}
            />

            {}
            <Bar
              dataKey="single"
              name="Single Engine"
              fill="#A5F3FC"
              shape={<CustomBarShape />}
            />

            {}
            <Bar
              dataKey="multi"
              name="Multi Engine"
              fill="#1D4ED8"
              shape={<CustomBarShape />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FSession;
