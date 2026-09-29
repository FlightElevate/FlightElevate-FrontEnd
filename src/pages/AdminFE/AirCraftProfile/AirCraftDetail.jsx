import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiX, FiArrowLeft } from "react-icons/fi";
import ACDetails from "./ACDetails";
import AirCraftTimes from "./AirCraftTimes/AirCraftTimes";
import { calendarService } from "../../../api/services/calendarService";
import { aircraftService } from "../../../api/services/aircraftService";
import { showSuccessToast, showErrorToast, showConfirmDialog } from "../../../utils/notifications";

const AirCraftDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aircraft, setAircraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFindTimeModal, setShowFindTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [duration, setDuration] = useState(60);

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
        showErrorToast("Aircraft not found");
        navigate("/air-craft-profile");
      }
    } catch (err) {
      console.error("Error fetching aircraft:", err);
      showErrorToast("Failed to load aircraft details");
      navigate("/air-craft-profile");
    } finally {
      setLoading(false);
    }
  };

  // Duration is passed explicitly so a just-changed value isn't read from stale state
  const fetchAvailableSlots = async (aircraftId, date, dur = duration) => {
    if (!aircraftId || !date) return;

    setLoadingSlots(true);
    try {
      const response = await calendarService.getAvailableTimeSlots({
        date: date,
        aircraft_id: aircraftId,
        duration: dur,
      });

      if (response.success) {
        setAvailableSlots(response.data.available_slots || []);
      }
    } catch (err) {
      console.error("Error fetching available slots:", err);
      showErrorToast("Failed to fetch available time slots");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleFindTime = () => {
    if (!aircraft) return;
    const today = new Date().toISOString().split("T")[0];
    setShowFindTimeModal(true);
    setSelectedDate(today);
    fetchAvailableSlots(aircraft.id, today);
  };

  const handleBookNow = () => {
    if (!aircraft) return;
    navigate("/calendar", {
      state: {
        preSelectedAircraft: aircraft.id,
        openReservationModal: true,
      },
    });
  };

  const handleToggleService = async () => {
    if (!aircraft) return;
    const newStatus = aircraft.status === "in_service" ? "not_in_service" : "in_service";
    const actionText = newStatus === "in_service" ? "Return to Service" : "Take Out of Service";

    const confirmed = await showConfirmDialog(
      actionText,
      `Are you sure you want to ${actionText.toLowerCase()}?`,
      `Yes, ${actionText}`
    );
    if (!confirmed) return;

    try {
      const response = await aircraftService.updateAircraft(aircraft.id, { status: newStatus });
      if (response.success) {
        showSuccessToast(`Aircraft is now ${newStatus === "in_service" ? "in service" : "out of service"}`);
        fetchAircraftDetails();
      }
    } catch (err) {
      console.error("Error toggling service status:", err);
      showErrorToast(`Failed to ${actionText.toLowerCase()}`);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (aircraft) {
      fetchAvailableSlots(aircraft.id, newDate);
    }
  };

  const handleDurationChange = (e) => {
    const newDuration = parseInt(e.target.value);
    setDuration(newDuration);
    if (aircraft && selectedDate) {
      fetchAvailableSlots(aircraft.id, selectedDate, newDuration);
    }
  };

  const closeModal = () => {
    setShowFindTimeModal(false);
    setAvailableSlots([]);
  };

  if (loading) {
    return (
      <div className="md:mt-5 mx-auto">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12">
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
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-center">
          <h2 className="text-lg text-red-600 font-medium">Aircraft not found</h2>
          <button
            onClick={() => navigate("/air-craft-profile")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Aircraft List
          </button>
        </div>
      </div>
    );
  }

  const displayName = aircraft.serial_number || aircraft.name;

  return (
    <div className="md:mt-5 mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/air-craft-profile")}
              className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl transition"
              aria-label="Back to aircraft list"
            >
              <FiArrowLeft size={18} className="text-slate-600" />
            </button>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{displayName}</h2>
              {aircraft.model && (
                <p className="text-sm text-slate-500 mt-0.5">{aircraft.model}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {aircraft.status !== "in_service" && (
              <button
                onClick={handleToggleService}
                className="text-sm font-medium text-white bg-green-600 rounded-xl px-4 py-2.5 hover:bg-green-700 transition"
              >
                Return to Service
              </button>
            )}
            <button
              onClick={handleFindTime}
              className="text-sm font-medium text-slate-700 border border-slate-200 rounded-xl px-4 py-2.5 hover:bg-slate-50 transition"
            >
              Find a Time
            </button>
            <button
              onClick={handleBookNow}
              className="text-sm font-medium text-white bg-blue-600 rounded-xl px-4 py-2.5 hover:bg-blue-700 transition"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Aircraft details */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 md:p-6">
        <ACDetails aircraft={aircraft} />
      </div>

      {/* Aircraft times (maintenance schedule + squawks), stacked below */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 md:p-6">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-4">Aircraft Times</h3>
        <AirCraftTimes aircraftId={aircraft.id} />
      </div>

      {/* Find a Time modal */}
      {showFindTimeModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Find a Time</h3>
                <p className="text-sm text-slate-500 mt-1">Available time slots for {displayName}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
                  <select
                    value={duration}
                    onChange={handleDurationChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">
                  Available Time Slots ({availableSlots.length} available)
                </h4>

                {loadingSlots ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-2">Loading available slots...</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto p-2 border border-slate-200 rounded-xl">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          navigate("/calendar", {
                            state: {
                              preSelectedAircraft: aircraft.id,
                              preSelectedDate: selectedDate,
                              preSelectedTime: slot.time,
                              preSelectedDuration: duration,
                              openReservationModal: true,
                            },
                          });
                        }}
                        className="px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition text-center"
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-slate-200 rounded-xl">
                    <p className="text-slate-600">No available time slots for this date and duration.</p>
                    <p className="text-sm text-slate-500 mt-2">Try selecting a different date or duration.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-slate-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                onClick={handleBookNow}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
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

