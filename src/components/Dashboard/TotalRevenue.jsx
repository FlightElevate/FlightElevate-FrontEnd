import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { logbookService } from "../../api/services/logbookService";
import { showSuccessToast, showErrorToast } from "../../utils/notifications";
import { API_BASE_URL } from "../../api/config";


const allRevenueData = [
  { date: "Feb 20", revenue: 48000, fullDate: "2024-02-20" },
  { date: "Feb 21", revenue: 51000, fullDate: "2024-02-21" },
  { date: "Feb 22", revenue: 49000, fullDate: "2024-02-22" },
  { date: "Feb 23", revenue: 55000, fullDate: "2024-02-23" },
  { date: "Feb 24", revenue: 52600, fullDate: "2024-02-24" },
  { date: "Feb 25", revenue: 58000, fullDate: "2024-02-25" },
  { date: "Feb 26", revenue: 62000, fullDate: "2024-02-26" },
  { date: "Feb 27", revenue: 59000, fullDate: "2024-02-27" },
  { date: "Feb 28", revenue: 61000, fullDate: "2024-02-28" },
  { date: "Mar 1", revenue: 65000, fullDate: "2024-03-01" },
  { date: "Mar 2", revenue: 68000, fullDate: "2024-03-02" },
  { date: "Mar 3", revenue: 70000, fullDate: "2024-03-03" },
];


const getCurrentDate = () => {
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'short' });
  const day = today.getDate();
  return `${month} ${day}`;
};

const getCurrentFullDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Side labels: $0, $250, $500 ... $1k, $1.25k. Small values stay in dollars so labels never repeat.
const formatAxisValue = (value) => {
  if (value >= 1000000) return `$${parseFloat((value / 1000000).toFixed(2))}M`;
  if (value >= 1000) return `$${parseFloat((value / 1000).toFixed(2))}k`;
  return `$${Math.round(value)}`;
};

// Evenly spaced, round tick values that scale with the data (about 4 steps from $0 to the top).
const buildAxis = (maxValue) => {
  const max = Math.max(maxValue, 100);
  const raw = max / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const base = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  const step = base * pow;
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { ticks, top };
};

const TotalRevenue = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [timePeriod, setTimePeriod] = useState("Last 30 days");
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auto-update dates when period changes (except Custom)
  useEffect(() => {
    if (timePeriod === 'Custom') return;
    
    const end = new Date();
    const start = new Date();
    
    switch (timePeriod) {
      case 'Last 30 days':
        start.setDate(end.getDate() - 30);
        break;
      case 'Last 3 months':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'Last 6 months':
        start.setMonth(end.getMonth() - 6);
        break;
      case 'Last year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'All time':
        start.setFullYear(2020);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, [timePeriod]);

  // Memoize current date to prevent re-renders (fixes React error #310)
  const currentDate = useMemo(() => getCurrentDate(), []);
  const currentFullDate = useMemo(() => getCurrentFullDate(), []);

  // Fetch revenue data from logbooks
  useEffect(() => {
    const fetchRevenueData = async () => {
      setLoading(true);
      try {
        const response = await logbookService.getEntries({
          start_date: startDate,
          end_date: endDate,
          per_page: 1000
        });

        if (response.success) {
          const logbooks = Array.isArray(response.data) ? response.data : [];
          
          // Group by date and calculate revenue (assuming revenue = total_hours * hourly_rate)
          // For now, we'll use a simple calculation: revenue = total_hours * 100
          const revenueByDate = {};
          
          logbooks.forEach(logbook => {
            const date = logbook.flight_date || logbook.created_at?.split('T')[0];
            if (date) {
              const revenue = (logbook.total_hours || 0) * 100; // $100 per hour
              
              if (!revenueByDate[date]) {
                revenueByDate[date] = {
                  date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  fullDate: date,
                  revenue: 0
                };
              }
              revenueByDate[date].revenue += revenue;
            }
          });

          // Convert to array and sort by date
          const data = Object.values(revenueByDate).sort((a, b) => 
            new Date(a.fullDate) - new Date(b.fullDate)
          );
          
          setRevenueData(data);
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        showErrorToast('Failed to fetch revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [startDate, endDate]);

  
  const filteredData = useMemo(() => {
    const [sy, sm, sd] = startDate.split('-');
    const start = new Date(sy, sm - 1, sd);
    
    const [ey, em, ed] = endDate.split('-');
    const end = new Date(ey, em - 1, ed);
    
    // Determine grouping based on date range
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    let grouping = 'Monthly';
    if (diffDays <= 35) grouping = 'Daily';
    else if (diffDays <= 120) grouping = 'Weekly';

    // Helper to format Date based on grouping
    const getPeriodKeyAndLabel = (dateObj) => {
      let periodKey = '';
      let periodLabel = '';
      
      if (grouping === "Daily") {
        periodKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        periodLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (grouping === "Weekly") {
        const weekStart = new Date(dateObj);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        periodKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        periodLabel = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else { // Monthly
        periodKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        periodLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      return { periodKey, periodLabel };
    };

    const dataMap = {};
    
    // Dates are already parsed at the top of the memo

    // Populate dataMap with all intervals initialized to 0
    let current = new Date(start);
    while (current <= end) {
      const { periodKey, periodLabel } = getPeriodKeyAndLabel(current);
      if (!dataMap[periodKey]) {
        dataMap[periodKey] = {
          date: periodLabel,
          fullDate: periodKey,
          revenue: 0
        };
      }
      current.setDate(current.getDate() + 1);
    }

    // Now accumulate the actual revenueData
    revenueData.forEach(item => {
      if (item.fullDate >= startDate && item.fullDate <= endDate) {
        const [y, m, d] = item.fullDate.split('-');
        const itemDate = new Date(y, m - 1, d);
        const { periodKey } = getPeriodKeyAndLabel(itemDate);
        if (dataMap[periodKey]) {
          dataMap[periodKey].revenue += item.revenue;
        }
      }
    });

    return Object.values(dataMap).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  }, [revenueData, startDate, endDate, timePeriod]);

  
  const avgRevenue = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const sum = filteredData.reduce((acc, item) => acc + item.revenue, 0);
    return Math.round(sum / filteredData.length);
  }, [filteredData]);

  const yAxisScale = useMemo(
    () => buildAxis(filteredData.reduce((max, item) => Math.max(max, item.revenue), 0)),
    [filteredData]
  );

  // Export function
  const handleExport = () => {
    if (filteredData.length === 0) {
      showErrorToast('No data to export');
      return;
    }
    
    try {
      const csvRows = [];
      csvRows.push(['Date', 'Revenue'].join(','));
      
      filteredData.forEach(row => {
        csvRows.push([`"${row.date}"`, row.revenue].join(','));
      });
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `revenue-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccessToast('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      showErrorToast('Failed to export report');
    }
  };
  return (
    <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6 border border-gray-100 h-full flex flex-col">
      {/* Title on the left; period, custom dates and export on the right of the same line */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-semibold text-gray-800">
          Total Revenue
        </h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
          <select 
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="flex-1 sm:flex-none min-w-[140px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
          >
            <option value="Last 30 days">Last 30 days</option>
            <option value="Last 3 months">Last 3 months</option>
            <option value="Last 6 months">Last 6 months</option>
            <option value="Last year">Last year</option>
            <option value="All time">All time</option>
            <option value="Custom">Custom</option>
          </select>

          {/* Date range pickers (only visible if Custom is selected) */}
          {timePeriod === 'Custom' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 sm:flex-initial min-w-0 border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
              />
              <span className="text-gray-500 text-sm whitespace-nowrap">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="flex-1 sm:flex-initial min-w-0 border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
              />
            </div>
          )}

          <button 
            onClick={handleExport}
            disabled={loading}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium min-h-[40px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Export Report'}
          </button>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-gray-400"></div>
          <span className="text-sm text-gray-600">
            {avgRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
            <span className="text-gray-500 ml-1">avg</span>
          </span>
        </div>
      </div>

      {/* The chart fills whatever height is left in the card, so it lines up with the tile beside it */}
      <div className="w-full relative flex-1 min-h-[280px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0}/>
                </linearGradient>
                <pattern id="currentDatePattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="20" y2="20" stroke="#1D4ED8" strokeWidth="1" opacity="0.1"/>
                </pattern>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={(props) => {
                  const { x, y, payload } = props;
                  const isCurrent = payload.fullDate === currentFullDate || payload.date === currentDate;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={16}
                        textAnchor="middle"
                        fill={isCurrent ? "#1D4ED8" : "#6B7280"}
                        fontSize={12}
                        fontWeight={isCurrent ? "600" : "400"}
                      >
                        {payload.value}
                      </text>
                    </g>
                  );
                }}
              />
              <YAxis
                width={52}
                domain={[0, yAxisScale.top]}
                ticks={yAxisScale.ticks}
                interval={0}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAxisValue}
              />
              <Tooltip
                cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
                formatter={(value) => [
                  `$${value.toLocaleString()}`,
                  "Revenue"
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="none"
                fill="url(#colorRevenue)"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#1D4ED8"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload, key } = props;
                  const isCurrent = payload.fullDate === currentFullDate || payload.date === currentDate;
                  return (
                    <g key={key || `dot-${cx}-${cy}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isCurrent ? 7 : 4}
                        fill={isCurrent ? "#1D4ED8" : "#1D4ED8"}
                        stroke={isCurrent ? "#FFFFFF" : "none"}
                        strokeWidth={isCurrent ? 2 : 0}
                      />
                    </g>
                  );
                }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {filteredData.some(item => item.fullDate === currentFullDate || item.date === currentDate) && (
          <div 
            className="absolute top-0 right-0 w-32 h-full pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(29, 78, 216, 0.05) 10px, rgba(29, 78, 216, 0.05) 20px)',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TotalRevenue;
