import React from "react";
import { HiDotsVertical } from "react-icons/hi";
import { maintenanceData } from "../../../../data/MaintenanceData";

const getStatusStyle = (status) => {
  switch (status) {
    case "Ongoing":
      return "bg-[#EBF0FB] text-[#113B98]";
    case "Open":
      return "bg-[#E1FAEA] text-[#016626]";
    case "Closed":
      return "bg-[#FFE3E3] text-[#961616]";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const Maintenance = ({ searchTerm, sortBy}) => {
  const filteredData = maintenanceData.filter((item) =>
    [item.aircraftNumber, item.status, item.templateName, item.referenceNo]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  filteredData.sort((a, b) =>
    sortBy === "Newest" ? b.id - a.id : a.id - b.id
  );


  return (
    <div className="overflow-x-auto">
      <table className="text-sm text-[#3D3D3D] border-collapse w-full">
        <thead className="bg-[#FAFAFA] text-left">
          <tr>
            <th className="py-2 px-3 border border-gray-300">Aircraft Number</th>
            <th className="py-2 px-3 border border-gray-300">Status</th>
            <th className="py-2 px-3 border border-gray-300">Template Name</th>
            <th className="py-2 px-3 border border-gray-300">Days Remaining</th>
            <th className="py-2 px-3 border border-gray-300">Hours Remaining</th>
            <th className="py-2 px-3 border border-gray-300">Cycles Remaining</th>
            <th className="py-2 px-3 border border-gray-300">Reference No.</th>
            <th className="py-2 px-3 border border-gray-300">Last Resolved</th>
            <th className="py-2 px-3 border border-gray-300 text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 bg-white">
                <td className="py-2 px-3 border border-gray-300">{item.aircraftNumber}</td>
                <td className="py-2 px-3 border border-gray-300">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyle(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="py-2 px-3 border border-gray-300">{item.templateName}</td>
                <td className="py-2 px-3 border border-gray-300">{item.daysRemaining}</td>
                <td
                  className={`py-2 px-3 border border-gray-300 ${
                    item.hoursRemaining.includes("hour") ? "text-[#CF0000] font-medium" : ""
                  }`}
                >
                  {item.hoursRemaining}
                </td>
                <td className="py-2 px-3 border border-gray-300">{item.cyclesRemaining}</td>
                <td className="py-2 px-3 border border-gray-300">{item.referenceNo}</td>
                <td className="py-2 px-3 border border-gray-300">{item.lastResolved}</td>
                <td className="py-2 px-3 border border-gray-300 text-center">
                  <HiDotsVertical className="inline text-gray-500 cursor-pointer" />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center py-4 text-gray-500">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Maintenance;
