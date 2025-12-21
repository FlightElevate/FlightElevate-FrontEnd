import React from "react";
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

const data = [
  { month: "June", single: 200, multi: 330 },
  { month: "July", single: 230, multi: 320 },
  { month: "Aug", single: 190, multi: 270 },
  { month: "Sep", single: 160, multi: 230 },
  { month: "Oct", single: 290, multi: 420 },
  { month: "Nov", single: 370, multi: 250 },
  { month: "Dec", single: 323 , multi: 324 },
];

// ✅ Custom Bar Shape — outlines if no value
const CustomBarShape = (props) => {
  const { x, y, width, height, fill, value } = props;

  // If value missing or empty, draw border only
  if (value === "" || value === null || value === undefined) {
    return (
      <Rectangle
        x={x}
        y={y - 2} // small offset
        width={width}
        height={height + 2}
        stroke="#9CA3AF"
        strokeDasharray="4 2"
        fill="transparent"
        radius={[6, 6, 0, 0]}
      />
    );
  }

  // Otherwise draw normal filled bar
  return (
    <Rectangle x={x} y={y} width={width} height={height} fill={fill} radius={[6, 6, 0, 0]} />
  );
};

const FSession = () => {
  return (
    <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Flight Session Summary
        </h2>
        <div className="flex items-center gap-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Locations</option>
            <option>All Locations</option>
            <option>Location 1</option>
            <option>Location 2</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Monthly</option>
            <option>Weekly</option>
            <option>Daily</option>
          </select>
        </div>
      </div>

      {/* Summary numbers */}
      <div className="flex items-center gap-10 mb-6">
        <div>
          <p className="text-sm text-gray-500">Single Engine</p>
          <h3 className="text-2xl font-semibold text-gray-900">
            1500{" "}
            <span className="text-sm text-green-600 font-normal">Hours</span>
          </h3>
        </div>
        <div>
          <p className="text-sm text-gray-500">Multi Engine</p>
          <h3 className="text-2xl font-semibold text-gray-900">
            2300{" "}
            <span className="text-sm text-green-600 font-normal">Hours</span>
          </h3>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={3}>
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

            {/* Single Engine Bars */}
            <Bar
              dataKey="single"
              name="Single Engine"
              fill="#A5F3FC"
              shape={<CustomBarShape />}
            />

            {/* Multi Engine Bars */}
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
