import React, { useState, useMemo } from "react";
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


const allData = [
  { month: "June", single: 200, multi: 330, location: "All Locations" },
  { month: "July", single: 230, multi: 320, location: "All Locations" },
  { month: "Aug", single: 190, multi: 270, location: "All Locations" },
  { month: "Sep", single: 160, multi: 230, location: "All Locations" },
  { month: "Oct", single: 290, multi: 420, location: "All Locations" },
  { month: "Nov", single: 370, multi: 250, location: "All Locations" },
  { month: "Dec", single: 323, multi: 324, location: "All Locations" },
  
  { month: "June", single: 100, multi: 150, location: "Location 1" },
  { month: "July", single: 120, multi: 160, location: "Location 1" },
  { month: "Aug", single: 90, multi: 130, location: "Location 1" },
  { month: "Sep", single: 80, multi: 110, location: "Location 1" },
  { month: "Oct", single: 140, multi: 200, location: "Location 1" },
  { month: "Nov", single: 180, multi: 120, location: "Location 1" },
  { month: "Dec", single: 160, multi: 160, location: "Location 1" },
  
  { month: "June", single: 100, multi: 180, location: "Location 2" },
  { month: "July", single: 110, multi: 160, location: "Location 2" },
  { month: "Aug", single: 100, multi: 140, location: "Location 2" },
  { month: "Sep", single: 80, multi: 120, location: "Location 2" },
  { month: "Oct", single: 150, multi: 220, location: "Location 2" },
  { month: "Nov", single: 190, multi: 130, location: "Location 2" },
  { month: "Dec", single: 163, multi: 164, location: "Location 2" },
];


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
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [timePeriod, setTimePeriod] = useState("Monthly");

  
  const filteredData = useMemo(() => {
    let locationFiltered = allData;
    
    if (selectedLocation !== "All Locations") {
      locationFiltered = allData.filter(item => item.location === selectedLocation);
    } else {
      
      const aggregated = {};
      allData.forEach(item => {
        if (!aggregated[item.month]) {
          aggregated[item.month] = { month: item.month, single: 0, multi: 0 };
        }
        aggregated[item.month].single += item.single;
        aggregated[item.month].multi += item.multi;
      });
      locationFiltered = Object.values(aggregated);
    }

    
    
    return locationFiltered;
  }, [selectedLocation, timePeriod]);

  
  const summary = useMemo(() => {
    const totalSingle = filteredData.reduce((sum, item) => sum + (item.single || 0), 0);
    const totalMulti = filteredData.reduce((sum, item) => sum + (item.multi || 0), 0);
    return { totalSingle, totalMulti };
  }, [filteredData]);

  return (
    <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Flight Session Summary
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <select 
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          >
            <option value="All Locations">All Locations</option>
            <option value="Location 1">Location 1</option>
            <option value="Location 2">Location 2</option>
          </select>
          <select 
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          >
            <option value="Monthly">Monthly</option>
            <option value="Weekly">Weekly</option>
            <option value="Daily">Daily</option>
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
      <div className="w-full" style={{ height: '320px', minWidth: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} barGap={3}>
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
