import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FiSearch, FiMoreVertical, FiCalendar, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { reservationService } from "../../api/services/reservationService";
 
const MAX_ROWS = 5;
const FETCH_SIZE = 100;
const MENU_WIDTH = 192;
const MENU_HEIGHT = 130;
const INACTIVE_STATUSES = ["cancelled", "canceled", "completed", "no_show", "no-show"];
 
/* ---------- helpers ---------- */
 
const fullName = (p) => {
  if (!p) return "";
  if (typeof p === "string") return p.trim();
  if (p.name) return String(p.name).trim();
  return `${p.first_name || ""} ${p.last_name || ""}`.trim();
};
 
const joinNames = (list) => {
  const names = list.map(fullName).filter(Boolean);
  if (names.length === 0) return "—";
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
};
 
const pick = (obj, keys) => {
  for (const k of keys) if (obj?.[k] != null && obj[k] !== "") return obj[k];
  return null;
};
 
const isFullDateTime = (v) => typeof v === "string" && /\d{4}-\d{2}-\d{2}/.test(v);
const isTimeOnly = (v) => typeof v === "string" && /^\d{1,2}:\d{2}/.test(v);
 
/**
 * Local Date for the slot start. Tries the common field names; handles
 * full ISO datetimes, date + "HH:mm[:ss]" pairs, and date-only values.
 * (Avoids new Date("YYYY-MM-DD"), which parses as UTC and can show the previous day.)
 */
const parseSlotStart = (item) => {
  const start = pick(item, ["start_time", "start_at", "starts_at", "scheduled_at", "start", "start_datetime"]);
  const date = pick(item, ["reservation_date", "date", "start_date", "scheduled_date"]);
 
  if (isFullDateTime(start)) {
    const d = new Date(start.replace(" ", "T"));
    if (!isNaN(d)) return { date: d, hasTime: true };
  }
  if (date) {
    const day = String(date).slice(0, 10);
    if (isTimeOnly(start)) {
      const [h, m] = start.split(":");
      const d = new Date(`${day}T${h.padStart(2, "0")}:${m.slice(0, 2)}:00`);
      if (!isNaN(d)) return { date: d, hasTime: true };
    }
    if (isFullDateTime(date) && String(date).length > 10 && !/T00:00:00/.test(String(date))) {
      const d = new Date(String(date).replace(" ", "T"));
      if (!isNaN(d)) return { date: d, hasTime: true };
    }
    const d = new Date(`${day}T00:00:00`);
    if (!isNaN(d)) return { date: d, hasTime: false };
  }
  return null;
};
 
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
 
const formatDayLabel = (d) => {
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - startOfToday().getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};
 
const formatTime = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
 
const normalize = (item) => {
  const slot = parseSlotStart(item);
  if (!slot) return null;
 
  const students = item.students?.length ? item.students : item.student ? [item.student] : [];
  const instructors = item.instructors?.length ? item.instructors : item.instructor ? [item.instructor] : [];
  const studentFallback = pick(item, ["student_name"]);
  const instructorFallback = pick(item, ["instructor_name", "cfi_name"]);
 
  const aircraftObj = item.aircraft;
  const aircraft =
    pick(aircraftObj || {}, ["registration", "tail_number", "serial_number", "name", "model"]) ||
    pick(item, ["aircraft_registration", "aircraft_name", "tail_number"]) ||
    "—";
 
  const dayLabel = formatDayLabel(slot.date);
  return {
    id: item.id,
    status: String(item.status || "").toLowerCase(),
    startsAt: slot.date,
    dayLabel,
    isToday: dayLabel === "Today",
    time: slot.hasTime ? formatTime(slot.date) : "—",
    student: students.length ? joinNames(students) : studentFallback || "—",
    instructor: instructors.length ? joinNames(instructors) : instructorFallback || "—",
    aircraft,
    flightType: pick(item, ["flight_type", "type", "lesson_type"]) || "Flight",
  };
};
 
const extractList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.reservations)) return response.reservations;
  return [];
};
 
/* ---------- component ---------- */
 
const UpcomingBookings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null); // why rows were dropped, shown when the list is empty
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menu, setMenu] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
 
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Only per_page, like the original request, so an unsupported filter can't empty the result.
      const response = await reservationService.getReservations({ per_page: FETCH_SIZE });
 
      if (response?.success === false) throw new Error(response?.message || "Could not load bookings");
 
      const list = extractList(response);
      if (process.env.NODE_ENV !== "production") {
        console.log("[UpcomingBookings] response:", response);
        console.log("[UpcomingBookings] first record:", list[0]);
      }
 
      const cutoff = startOfToday();
      const counts = { raw: list.length, noDate: 0, past: 0, inactive: 0 };
      const upcoming = [];
 
      for (const item of list) {
        const b = normalize(item);
        if (!b) counts.noDate++;
        else if (b.startsAt < cutoff) counts.past++;
        else if (INACTIVE_STATUSES.includes(b.status)) counts.inactive++;
        else upcoming.push(b);
      }
 
      upcoming.sort((a, b) => a.startsAt - b.startsAt);
      setBookings(upcoming);
      setStats(counts);
    } catch (err) {
      console.error("Error fetching upcoming bookings", err);
      setError(err?.message || "Could not load bookings");
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
 
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);
 
  const visibleBookings = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = q
      ? bookings.filter((b) =>
          [b.student, b.instructor, b.aircraft, b.dayLabel, b.flightType, b.time].join(" ").toLowerCase().includes(q)
        )
      : bookings;
    return filtered.slice(0, MAX_ROWS);
  }, [bookings, searchTerm]);
 
  const handleMenuToggle = (e, id) => {
    e.stopPropagation();
    if (menu?.id === id) return setMenu(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const openUp = rect.bottom + MENU_HEIGHT + 8 > window.innerHeight;
    setMenu({
      id,
      top: openUp ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
  };
 
  const handleCancelBooking = async (bookingId) => {
    setMenu(null);
 
    const { value: reason } = await Swal.fire({
      title: "Cancel booking",
      input: "textarea",
      inputLabel: "Reason for cancellation",
      inputPlaceholder: "Type your reason here...",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Continue",
      inputValidator: (value) => (!value || !value.trim() ? "You need to provide a reason" : undefined),
    });
    if (!reason) return;
 
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "You are about to cancel this booking permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it",
    });
    if (!confirmResult.isConfirmed) return;
 
    try {
      const res = await reservationService.deleteReservation(bookingId, { cancel_reason: reason.trim() });
      if (res && res.success === false) throw new Error(res.message);
 
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      Swal.fire("Cancelled", "The booking has been cancelled.", "success");
    } catch (err) {
      console.error("Cancellation error:", err);
      Swal.fire("Error", err?.message || "Failed to cancel the booking. Please try again.", "error");
    }
  };
 
  const activeBooking = menu ? bookings.find((b) => b.id === menu.id) : null;
 
  const emptyHint =
    stats && stats.raw > 0 && bookings.length === 0
      ? `${stats.raw} loaded: ${stats.noDate} without a readable date, ${stats.past} in the past, ${stats.inactive} cancelled/completed`
      : stats && stats.raw === 0
      ? "The reservations API returned no records"
      : null;
 
  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Upcoming bookings</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Loading…" : `${bookings.length} scheduled from today onward`}
          </p>
        </div>
        <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400 sm:w-[260px]">
          <FiSearch className="text-gray-400 mr-2 shrink-0" size={16} aria-hidden="true" />
          <input
            type="text"
            aria-label="Search bookings"
            placeholder="Search student, instructor, aircraft"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
          />
        </div>
      </div>
 
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-y border-gray-200 bg-gray-50/60">
              {["Date", "Start time", "Student", "Instructor", "Aircraft", "Flight type"].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-600 whitespace-nowrap">
                  {h}
                </th>
              ))}
              <th className="py-3 px-4 w-12">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="py-4 px-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan="7" className="text-center py-10">
                  <p className="text-sm text-red-600 mb-3">{error}</p>
                  <button
                    onClick={fetchBookings}
                    className="inline-flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
                  >
                    <FiRefreshCw size={14} /> Try again
                  </button>
                </td>
              </tr>
            ) : visibleBookings.length > 0 ? (
              visibleBookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-sm whitespace-nowrap">
                    <span className={b.isToday ? "font-semibold text-blue-700" : "text-gray-700"}>{b.dayLabel}</span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900 font-medium whitespace-nowrap tabular-nums">{b.time}</td>
                  <td className="py-4 px-4 text-sm text-gray-700">{b.student}</td>
                  <td className="py-4 px-4 text-sm text-gray-700">{b.instructor}</td>
                  <td className="py-4 px-4 text-sm text-gray-700 whitespace-nowrap">{b.aircraft}</td>
                  <td className="py-4 px-4 text-sm">
                    <span className="inline-block rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-xs capitalize whitespace-nowrap">
                      {String(b.flightType).replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={(e) => handleMenuToggle(e, b.id)}
                      aria-label="Booking actions"
                      aria-haspopup="menu"
                      aria-expanded={menu?.id === b.id}
                      className="p-1.5 hover:bg-gray-100 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    >
                      <FiMoreVertical className="text-gray-600" size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-12">
                  <FiCalendar className="mx-auto text-gray-300 mb-2" size={28} aria-hidden="true" />
                  <p className="text-sm text-gray-500">
                    {searchTerm ? "No bookings match your search" : "No upcoming bookings"}
                  </p>
                  {!searchTerm && emptyHint && <p className="text-xs text-gray-400 mt-1">{emptyHint}</p>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
 
      {!loading && !error && bookings.length > MAX_ROWS && !searchTerm && (
        <div className="px-6 py-3 border-t border-gray-100 text-right">
          <button onClick={() => navigate("/reservations")} className="text-sm font-medium text-blue-700 hover:underline">
            View all {bookings.length} bookings
          </button>
        </div>
      )}
 
      {menu && activeBooking && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: menu.top, left: menu.left, width: MENU_WIDTH }}
          className="bg-white rounded-lg shadow-lg border border-gray-200 z-50"
        >
          <button
            role="menuitem"
            onClick={() => navigate(`/reservations/${activeBooking.id}`)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
          >
            View details
          </button>
          <button
            role="menuitem"
            onClick={() => navigate(`/calendar?edit=${activeBooking.id}`)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit in calendar
          </button>
          <button
            role="menuitem"
            onClick={() => handleCancelBooking(activeBooking.id)}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg font-medium"
          >
            Cancel booking
          </button>
        </div>
      )}
    </div>
  );
};
 
export default UpcomingBookings;
 

