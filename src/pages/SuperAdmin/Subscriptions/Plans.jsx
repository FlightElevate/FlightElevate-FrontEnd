import React from "react";
import { useParams, useLocation } from "react-router-dom";

const Plans = () => {
  const { planId } = useParams();
  const { state } = useLocation();
  const plan = state?.plan;

  return (
    <div className="sm:flex-row items-start inset-shadow-sm shadow-xl rounded-xl justify-between">
      <div className="bg-white mt-3 px-4 py-5">
        <h2 className="text-xl font-semibold text-gray-800 mt-2 mb-2 pb-5 border-b border-[#F3F4F6]">
          Edit Subscription Plan
        </h2>
      </div>
      <div className="px-4 py-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm mb-2">
              Plan Name
            </label>
            <input
              defaultValue={plan?.title}
              placeholder="Enter..."
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-2">
              Aircraft Limit
            </label>
            <input
              defaultValue={plan?.aircraft}
              placeholder="Enter..."
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm mb-2">
              Price per Month
            </label>
            <input
              defaultValue={plan?.price}
              placeholder="Enter..."
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-2">
              One-time Setup Fee
            </label>
            <input
              defaultValue={plan?.setupFee}
              placeholder="Enter..."
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none"
            />
          </div>
        </div>

        <div className="md:mb-4">
          <label className="block text-gray-700 font-inter text-sm mt-3 mb-2 gap-1">
            Plan Notes
          </label>
          <input
            defaultValue={plan?.para}
            placeholder="Enter..."
            className="w-full border border-gray-300 rounded-md px-2 pt-2 pb-26 focus:outline-none"
          />
        </div>

        <div className="flex justify-end space-x-2 px-5 py-4 border-b border-[#F3F4F6]">
          <button className="space-x-2 px-4 py-2 bg-[#F6F6F6] text-black rounded-lg">
            Cancel
          </button>
          <button className="space-x-2 px-4 py-2 bg-[#1376CD] text-black rounded-lg">
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default Plans;
