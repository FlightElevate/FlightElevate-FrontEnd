import React from "react";

const ACDetails = ({ aircraft }) => {
  return (
    <div className="flex flex-col gap-7.5  p-3">
      <div>
        <img
          src={aircraft.image}
          alt={aircraft.name}
          className="rounded-lg w-[223px] h-[223px] object-cover"
        />
      </div>

      <div className="md:col-span-2 text-sm gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-3">
          <div className="flex flex-col gap-3">
            <p className="text-[#101828] text-base fw6">Registration Number</p>
            <p className="fw4 text-[#3D3D3D]">N5D7HH</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[#101828] text-base fw6">Type</p>
            <p className="fw4 text-[#3D3D3D]">PA-28</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[#101828] text-base fw6">Category</p>
            <p className="fw4 text-[#3D3D3D]">Single Engine</p>
          </div>
        </div>

        <h3 className="text-blue-600 font-semibold mt-4">Meters (current)</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-3">
          <div className="flex flex-col gap-3">
            <p className="text-[#101828] text-base fw6">Hobbs</p>
            <p className="fw4 text-[#3D3D3D]">0.8</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[#101828] text-base fw6">Heater Hobbs</p>
            <p className="fw4 text-[#3D3D3D]">114.8</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[#101828] text-base fw6">Engine 1 Tach</p>
            <p className="fw4 text-[#3D3D3D]">8,234</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[#101828] text-base fw6">Engine Tach 2</p>
            <p className="fw4 text-[#3D3D3D]">8,234</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[#101828] text-base fw6">Next Maintenance Due</p>
            <p className="fw4 text-[#3D3D3D]">2 Feb 2025 | 22:05</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ACDetails;
