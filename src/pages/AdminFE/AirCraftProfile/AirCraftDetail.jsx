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





import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiX, FiArrowLeft } from "react-icons/fi";
import ACDetails from "./ACDetails";
import AirCraftTimes from "./AirCraftTimes/AirCraftTimes";
import { calendarService } from "../../../api/services/calendarService";
import { aircraftService } from "../../../api/services/aircraftService";
import { showErrorToast } from "../../../utils/notifications";

const AirCraftDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aircraft, setAircraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [showFindTimeModal, setShowFindTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [duration, setDuration] = useState(60);

  // Fetch aircraft details
  useEffect(() => {
    if (id) {
      fetchAircraftDetails();
    }
  }, [id]);

  const fetchAircraftDetails = async () => {
    setLoading(true);
    try {
      const response = await aircraftService.getAircraftById(id);
      if (response.success) {
        setAircraft(response.data);
      } else {
        showErrorToast('Aircraft not found');
        navigate('/air-craft-profile');
      }
    } catch (err) {
      console.error('Error fetching aircraft:', err);
      showErrorToast('Failed to load aircraft details');
      navigate('/air-craft-profile');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available time slots
  const fetchAvailableSlots = async (aircraftId, date) => {
    if (!aircraftId || !date) return;
    
    setLoadingSlots(true);
    try {
      const response = await calendarService.getAvailableTimeSlots({
        date: date,
        aircraft_id: aircraftId,
        duration: duration
      });
      
      if (response.success) {
        setAvailableSlots(response.data.available_slots || []);
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
      showErrorToast('Failed to fetch available time slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle Find a Time button click
  const handleFindTime = () => {
    if (!aircraft) return;
    setShowFindTimeModal(true);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    fetchAvailableSlots(aircraft.id, new Date().toISOString().split('T')[0]);
  };

  // Handle Book Now button click - navigate to calendar with aircraft pre-selected
  const handleBookNow = () => {
    if (!aircraft) return;
    navigate('/calendar', { 
      state: { 
        preSelectedAircraft: aircraft.id,
        openReservationModal: true 
      } 
    });
  };

  // Handle date change in Find a Time modal
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (aircraft) {
      fetchAvailableSlots(aircraft.id, newDate);
    }
  };

  // Handle duration change
  const handleDurationChange = (e) => {
    const newDuration = parseInt(e.target.value);
    setDuration(newDuration);
    if (aircraft && selectedDate) {
      fetchAvailableSlots(aircraft.id, selectedDate);
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'in_service': 'In Service',
      'not_in_service': 'Not In Service',
      'maintenance': 'Maintenance'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="md:mt-5 mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!aircraft) {
    return (
      <div className="md:mt-5 mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-6 text-center">
          <h2 className="text-lg text-red-600 font-medium">Aircraft not found</h2>
          <button
            onClick={() => navigate('/air-craft-profile')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Aircraft List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/air-craft-profile')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">{aircraft.name}</h2>
              {aircraft.model && (
                <p className="text-sm text-gray-500 mt-1">{aircraft.model}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleFindTime}
              className="text-sm text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition"
            >
              Find a Time
            </button>
            <button 
              onClick={handleBookNow}
              className="text-sm text-white bg-blue-600 rounded-lg px-4 py-2 hover:bg-blue-700 transition"
            >
              Book Now
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "details"
                ? "text-blue-600 border-blue-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Aircraft Details
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "times"
                ? "text-blue-600 border-blue-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("times")}
          >
            Aircraft Times
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "details" && <ACDetails aircraft={aircraft} />}
          {activeTab === "times" && <AirCraftTimes aircraftId={aircraft.id} />}
        </div>
      </div>

      {/* Find a Time Modal */}
      {showFindTimeModal && aircraft && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Find a Time</h3>
                <p className="text-sm text-gray-600 mt-1">Available time slots for {aircraft.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowFindTimeModal(false);
                  setAvailableSlots([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Date and Duration Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <select
                    value={duration}
                    onChange={handleDurationChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
              </div>

              {/* Available Time Slots */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Available Time Slots ({availableSlots.length} available)
                </h4>
                
                {loadingSlots ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading available slots...</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          // Navigate to calendar with pre-selected time and aircraft
                          navigate('/calendar', {
                            state: {
                              preSelectedAircraft: aircraft.id,
                              preSelectedDate: selectedDate,
                              preSelectedTime: slot.time,
                              preSelectedDuration: duration,
                              openReservationModal: true
                            }
                          });
                        }}
                        className="px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition text-center"
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-gray-200 rounded-lg">
                    <p className="text-gray-600">No available time slots for this date and duration.</p>
                    <p className="text-sm text-gray-500 mt-2">Try selecting a different date or duration.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowFindTimeModal(false);
                  setAvailableSlots([]);
                }}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={handleBookNow}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirCraftDetail;


