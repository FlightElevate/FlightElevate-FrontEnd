import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { lessonService } from "../../api/services/lessonService";
import { useAuth } from "../../context/AuthContext";

const StudentFlightSession = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlightData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await lessonService.getUserLessons(user.id, {
          per_page: 100, 
          type: 'student',
        });

        if (response.success) {
          const lessons = response.data || [];
          
          
          const monthlyData = {};
          
          lessons.forEach((lesson) => {
            if (!lesson.date && !lesson.full_date && !lesson.lesson_date) return;
            
            const dateStr = lesson.date || lesson.full_date || lesson.lesson_date;
            let date;
            
            try {
              
              date = new Date(dateStr);
              
              if (isNaN(date.getTime())) {
                return; 
              }
            } catch (e) {
              return; 
            }
            
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                month: monthKey,
                hours: 0,
                flights: 0,
              };
            }
            
            
            const hours = (parseInt(lesson.duration_minutes) || 0) / 60;
            monthlyData[monthKey].hours += hours;
            monthlyData[monthKey].flights += 1;
          });

          
          const sortedData = Object.values(monthlyData).sort((a, b) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months.indexOf(a.month) - months.indexOf(b.month);
          });

          
          const formattedData = sortedData.map(item => ({
            ...item,
            hours: Math.round(item.hours * 10) / 10,
            flights: item.flights,
          }));

          setChartData(formattedData);
        }
      } catch (err) {
        console.error('Error fetching flight session data:', err);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlightData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Flight Session Summary
        </h2>
        <div className="flex items-center gap-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Monthly</option>
            <option>Weekly</option>
            <option>Daily</option>
          </select>
        </div>
      </div>

      {}
      <div className="flex items-center justify-end gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-600">Total Hours Spent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          <span className="text-sm text-gray-600">Flights Logged</span>
        </div>
      </div>

      {}
      <div className="w-full" style={{ height: '320px', minWidth: '300px', minHeight: '320px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={320}>
          <LineChart data={chartData}>
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
            <Tooltip 
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              formatter={(value, name) => {
                if (name === 'Total Hours Spent') {
                  return [`${value} hours`, name];
                }
                return [value, name];
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={10}
            />
            <Line
              type="monotone"
              dataKey="hours"
              name="Total Hours Spent"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="flights"
              name="Flights Logged"
              stroke="#9CA3AF"
              strokeWidth={2}
              dot={{ fill: "#9CA3AF", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StudentFlightSession;

