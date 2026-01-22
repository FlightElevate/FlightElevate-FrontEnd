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

const TotalRevenue = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [timePeriod, setTimePeriod] = useState("Weekly");
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(false);

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
    let filtered = revenueData.filter(item => {
      return item.fullDate >= startDate && item.fullDate <= endDate;
    });

    if (timePeriod === "Daily") {
      return filtered;
    } else if (timePeriod === "Weekly") {
      const weeklyData = {};
      filtered.forEach(item => {
        const date = new Date(item.fullDate);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); 
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            date: `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            fullDate: weekKey,
            revenue: 0
          };
        }
        weeklyData[weekKey].revenue += item.revenue;
      });
      return Object.values(weeklyData).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    } else if (timePeriod === "Monthly") {
      const monthlyData = {};
      filtered.forEach(item => {
        const date = new Date(item.fullDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            fullDate: `${monthKey}-01`,
            revenue: 0
          };
        }
        monthlyData[monthKey].revenue += item.revenue;
      });
      return Object.values(monthlyData).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    }

    return filtered;
  }, [revenueData, startDate, endDate, timePeriod]);

  
  const avgRevenue = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const sum = filteredData.reduce((acc, item) => acc + item.revenue, 0);
    return Math.round(sum / filteredData.length);
  }, [filteredData]);

  // Export function
  const handleExport = async () => {
    try {
      const response = await logbookService.exportEntries({
        start_date: startDate,
        end_date: endDate
      });

      if (response && response.data) {
        // Create blob and download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `revenue-report-${startDate}-to-${endDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showSuccessToast('Report exported successfully');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      showErrorToast('Failed to export report');
    }
  };
  return (
    <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6 border border-gray-100">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Total Revenue
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          {}
          <div className="flex flex-col sm:flex-row gap-3 flex-1 sm:flex-initial">
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
          
          {}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 sm:flex-initial border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
            <span className="text-gray-500 text-sm whitespace-nowrap">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="flex-1 sm:flex-initial border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>
          
          {}
          <button 
            onClick={handleExport}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium min-h-[44px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Export Report'}
          </button>
        </div>
      </div>

      {}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-gray-400"></div>
          <span className="text-sm text-gray-600">
            {avgRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
            <span className="text-gray-500 ml-1">avg</span>
          </span>
        </div>
      </div>

      {}
      <div className="w-full relative" style={{ height: '320px', minWidth: '300px', minHeight: '320px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={320}>
          <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0}/>
              </linearGradient>
              {}
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
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
            {}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="none"
              fill="url(#colorRevenue)"
            />
            {}
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#1D4ED8"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                const isCurrent = payload.fullDate === currentFullDate || payload.date === currentDate;
                return (
                  <g>
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
        {}
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
