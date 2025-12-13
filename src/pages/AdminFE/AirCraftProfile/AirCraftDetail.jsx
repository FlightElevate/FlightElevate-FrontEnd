// import React, { useState } from "react";
// import { useParams } from "react-router-dom";

// const aircraftsData = [
//   {
//     id: 1,
//     name: "Cessna 600",
//     image:
//       "https://images.pexels.com/photos/358220/pexels-photo-358220.jpeg?auto=compress&cs=tinysrgb&w=800",
//     status: "In Service",
//   },
//   {
//     id: 2,
//     name: "Piperx 100",
//     image:
//       "https://images.pexels.com/photos/912050/pexels-photo-912050.jpeg?auto=compress&cs=tinysrgb&w=800",
//     status: "Not In Service",
//   },
//   {
//     id: 3,
//     name: "Cessna 600",
//     image:
//       "https://images.pexels.com/photos/46148/aircraft-landing-gear-tires-airplane-46148.jpeg?auto=compress&cs=tinysrgb&w=800",
//     status: "Not In Service",
//   },
//   {
//     id: 4,
//     name: "Piperx 100",
//     image:
//       "https://images.pexels.com/photos/163771/airport-airplane-landing-jet-163771.jpeg?auto=compress&cs=tinysrgb&w=800",
//     status: "Not In Service",
//   },
//   {
//     id: 5,
//     name: "Cessna 600",
//     image:
//       "https://images.pexels.com/photos/358220/pexels-photo-358220.jpeg?auto=compress&cs=tinysrgb&w=800",
//     status: "Not In Service",
//   },
//   {
//     id: 6,
//     name: "Piperx 100",
//     image:
//       "https://images.pexels.com/photos/912050/pexels-photo-912050.jpeg?auto=compress&cs=tinysrgb&w=800",
//     status: "Not In Service",
//   },
//   {
//     id: 7,
//     name: "Piperx 100",
//     image:
//       "https://images.pexels.com/photos/163771/airport-airplane-landing-jet-163771.jpeg?auto=compress&cs=tinysrgb&w=800",
//     status: "Not In Service",
//   },
//   {
//     id: 8,
//     name: "Cessna 600",
//     image:
//       "https://images.pexels.com/photos/358220/pexels-photo-358220.jpeg?auto=compress&cs=tinysrgb&w=800",
//     status: "In Service",
//   },
// ];

// const AirCraftDetail = () => {
//   const { id } = useParams();
//   const [activeTab, setActiveTab] = useState("details");

//   // ✅ Find the selected aircraft
//   const aircraft = aircraftsData.find((item) => item.id === parseInt(id));

//   if (!aircraft) {
//     return (
//       <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm  p-6 text-center">
//         <h2 className="text-lg text-red-600 font-medium">Aircraft not found</h2>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto bg-white rounded-lg mt-6 p-6">
//       {/* Header */}
//       <div className="flex items-center justify-between max-w-6xl mx-auto  border border-[#F3F4F6] py-5 px-4 bg-[#FFFFFF]">
//         <h1 className="text-xl font-semibold text-gray-800">{aircraft.name}</h1>
//         <div className="flex items-center gap-2">
//           <button className="text-sm text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-100">
//             Find a Time
//           </button>
//           <button className="text-sm text-white bg-blue-600 rounded-md px-3 py-1.5 hover:bg-blue-700">
//             Book Now
//           </button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex border border-[#F3F4F6] py-3 px-4 gap-4 bg-[#FFFFFF]">
//         <button
//           className={`px-4 py-2 text-sm font-medium ${
//             activeTab === "details"
//               ? " text-[#3D3D3D]  bg-[#F6F6F6]"
//               : "text-[#8A8A8A]  bg-[#FFFFFF]"
//           }`}
//           onClick={() => setActiveTab("details")}
//         >
//           Aircraft Details
//         </button>
//         <button
//           className={`px-4 py-2 text-sm font-medium ${
//             activeTab === "times"
//               ? " text-[#3D3D3D]  bg-[#F6F6F6]"
//               : "text-[#8A8A8A]  bg-[#FFFFFF]"
//           }`}
//           onClick={() => setActiveTab("times")}
//         >
//           Aircraft Times
//         </button>
//       </div>

//       {activeTab === "details" && (
//         <div className=" flex flex-col gap-7.5  border border-[#F3F4F6] p-4 bg-[#FFFFFF]  ">
//           <div className="">
//             <img
//               src={aircraft.image}
//               alt={aircraft.name}
//               className="rounded-lg w-[223px] h-[223px] object-cover"
//             />
//           </div>
//           <div className="md:col-span-2 text-sm  gap-2 ">
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-3 ">
//               <div className="flex flex-col gap-3">
//                 <p className="text-[#101828] text-base fw6 leading-[100%] tracking-[0px]">
//                   Registration Number
//                 </p>
//                 <p className="fw4 text-[#3D3D3D] leading-6">N5D7HH</p>
//               </div>
//               <div className="flex flex-col gap-3">
//                 <p className="text-[#101828] text-base fw6 leading-[100%] tracking-[0px]">
//                   Type
//                 </p>
//                 <p className="fw4 text-[#3D3D3D] leading-6">PA-28</p>
//               </div>
//               <div className="flex flex-col gap-3">
//                 <p className="text-[#101828] text-base fw6 leading-[100%] tracking-[0px]">
//                   Category
//                 </p>
//                 <p className="fw4 text-[#3D3D3D] leading-6">Single Engine</p>
//               </div>
//             </div>

//             <h3 className="text-blue-600 font-semibold mt-4">
//               Meters (current)
//             </h3>

//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-3">
//               <div className="flex flex-col gap-3">
//                 <p className="text-[#101828] text-base fw6 leading-[100%] tracking-[0px]">
//                   Hobbs
//                 </p>
//                 <p className="fw4 text-[#3D3D3D] leading-6">0.8</p>
//               </div>
//               <div className="flex flex-col gap-3">
//                 <p className="text-[#101828] text-base fw6 leading-[100%] tracking-[0px]">
//                   Heater Hobbs
//                 </p>
//                 <p className="fw4 text-[#3D3D3D] leading-6">114.8</p>
//               </div>
//               <div className="flex flex-col gap-3">
//                 <p className="text-[#101828] text-base fw6 leading-[100%] tracking-[0px]">
//                   Engine 1 Tach
//                 </p>
//                 <p className="fw4 text-[#3D3D3D] leading-6">8,234</p>
//               </div>
//               <div className="flex flex-col gap-3">
//                 <p className="text-[#101828] text-base fw6 leading-[100%] tracking-[0px]">
//                   Engine Tach 2
//                 </p>
//                 <p className="fw4 text-[#3D3D3D] leading-6">8,234</p>
//               </div>
//               <div className="flex flex-col gap-3">
//                 <p className="text-[#101828] text-base fw6 leading-[100%] tracking-[0px]">
//                   Next Maintenance Due
//                 </p>
//                 <p className="fw4 text-[#3D3D3D] leading-6 gap-2">
//                   2 Feb 2025 | 22:05
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//       {activeTab === "times" && (
//         <div className="text-gray-600 text-sm mt-4">
//           <p>No aircraft time logs available yet.</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AirCraftDetail;





import React, { useState } from "react";
import ACDetails from "./ACDetails";
import AirCraftTimes from "./AirCraftTimes/AirCraftTimes";

const aircraftsData = [
  {
    id: 1,
    name: "Cessna 600",
    image:
      "https://images.pexels.com/photos/358220/pexels-photo-358220.jpeg?auto=compress&cs=tinysrgb&w=800",
    status: "In Service",
  },

];

const AirCraftDetail = () => {
  // ✅ Filter only aircrafts that are in service
  const inServiceAircrafts = aircraftsData.filter(
    (item) => item.status === "In Service"
  );

  if (inServiceAircrafts.length === 0)
    return (
      <div className="max-w-6xl mx-auto bg-white  p-6 text-center">
        <h2 className="text-lg text-red-600 font-medium">
          No aircrafts in service
        </h2>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto   mt-6 p-6 space-y-6">
      {inServiceAircrafts.map((aircraft) => {
        const [activeTab, setActiveTab] = useState("details");

        return (
          <div
            key={aircraft.id}
            className="bg-white  rounded-lg"
          >
            <div className="flex items-center justify-between py-5 px-4 border border-[#F3F4F6] bg-[#FFFFFF]">
              <h1 className="text-xl font-semibold text-gray-800">
                {aircraft.name}
              </h1>
              <div className="flex items-center gap-2">
                <button className="text-sm text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-100">
                  Find a Time
                </button>
                <button className="text-sm text-white bg-blue-600 rounded-md px-3 py-1.5 hover:bg-blue-700">
                  Book Now
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border border-[#F3F4F6] py-3 px-4 gap-4 bg-[#FFFFFF]">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "details"
                    ? "text-[#3D3D3D] bg-[#F6F6F6]"
                    : "text-[#8A8A8A] bg-[#FFFFFF]"
                }`}
                onClick={() => setActiveTab("details")}
              >
                Aircraft Details
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "times"
                    ? "text-[#3D3D3D] bg-[#F6F6F6]"
                    : "text-[#8A8A8A] bg-[#FFFFFF]"
                }`}
                onClick={() => setActiveTab("times")}
              >
                Aircraft Times
              </button>
            </div>

            <div className="border border-[#F3F4F6] ">
              {activeTab === "details" && <ACDetails aircraft={aircraft} />}
              {activeTab === "times" && <AirCraftTimes />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AirCraftDetail;


