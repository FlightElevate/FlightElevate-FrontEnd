import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FiSearch, FiMoreVertical, FiCalendar, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { reservationService } from "../../api/services/reservationService";

const MAX_ROWS = 5;
const FETCH_SIZE = 50; // fetch more than we show so past/cancelled rows can't starve the list
const MENU_WIDTH = 192;
const MENU_HEIGHT = 130;
const INACTIVE_STATUSES = ["cancelled", "canceled", "completed", "no_show", "no-show"];

/* ---------- helpers ---------- */

const fullName = (p) => {
  if (!p) return "";
  if (p.name) return p.name.trim();
  return `${p.first_name || ""} ${p.last_name || ""}`.trim();
};

const joinNames = (list) => {
  const names = list.map(fullName).filter(Boolean);
  if (names.length === 0) return "—";
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
};

/**
 * Builds a local Date for the slot start.
 * Handles: full ISO start_time, "HH:mm[:ss]" start_time + reservation_date, or date only.
 * Avoids `new Date("YYYY-MM-DD")`, which parses as UTC and shows the previous day west of UTC.
 */
const parseSlotStart = (item) => {
  const start = item.start_time;
  const date = item.reservation_date || item.date;

  if (start && /\d{4}-\d{2}-\d{2}/.test(start)) {
    const d = new Date(start.replace(" ", "T"));
    return isNaN(d) ? null : { date: d, hasTime: true };
  }
  if (date) {
    const day = String(date).slice(0, 10);
    if (start && /^\d{1,2}:\d{2}/.test(start)) {
      const d = new Date(`${day}T${start.padStart(start.length === 4 ? 5 : start.length, "0")}`);
      return isNaN(d) ? null : { date: d, hasTime: true };
    }
    const d = new Date(`${day}T00:00:00`);
    return isNaN(d) ? null : { date: d, hasTime: false };
  }
  return null;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDayLabel = (d) => {
  const today = startOfToday();
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (d) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const normalize = (item) => {
  const slot = parseSlotStart(item);
  if (!slot) return null;

  const students = item.students?.length ? item.students : item.student ? [item.student] : [];
  const instructors = item.instructors?.length
    ? item.instructors
    : item.instructor
    ? [item.instructor]
    : [];

  return {
    id: item.id,
    status: String(item.status || "").toLowerCase(),
    startsAt: slot.date,
    dayLabel: formatDayLabel(slot.date),
    isToday: formatDayLabel(slot.date) === "Today",
    time: slot.hasTime ? formatTime(slot.date) : "—",
    student: joinNames(students),
    instructor: joinNames(instructors),
    aircraft:
      item.aircraft?.registration ||
      item.aircraft?.serial_number ||
      item.aircraft?.name ||
      item.aircraft?.model ||
      "—",
    flightType: item.flight_type || item.type || item.lesson_type || "Flight",
  };
};

/* ---------- component ---------- */

const UpcomingBookings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menu, setMenu] = useState(null); // { id, top, left }
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;

      // NOTE: adjust param names to whatever your reservations API expects.
      const response = await reservationService.getReservations({
        per_page: FETCH_SIZE,
        from_date: isoToday,
        sort: "reservation_date",
        order: "asc",
      });

      if (!response?.success) throw new Error(response?.message || "Could not load bookings");

      const list = Array.isArray(response.data) ? response.data : response.data?.data || [];

      // Server filter is a hint; enforce the rule client-side so it always holds.
      const cutoff = startOfToday();
      const upcoming = list
        .map(normalize)
        .filter(Boolean)
        .filter((b) => b.startsAt >= cutoff && !INACTIVE_STATUSES.includes(b.status))
        .sort((a, b) => a.startsAt - b.startsAt);

      setBookings(upcoming);
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

  // Close menu on outside click, Escape, scroll, or resize.
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
          [b.student, b.instructor, b.aircraft, b.dayLabel, b.flightType, b.time]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : bookings;
    return filtered.slice(0, MAX_ROWS);
  }, [bookings, searchTerm]);

  // Fixed-position menu so the table's overflow container can't clip it.
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
      // If deleteReservation uses axios.delete, the body must be sent as { data: {...} }
      // inside the service, otherwise cancel_reason is silently dropped.
      const res = await reservationService.deleteReservation(bookingId, {
        cancel_reason: reason.trim(),
      });
      if (res && res.success === false) throw new Error(res.message);

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      Swal.fire("Cancelled", "The booking has been cancelled.", "success");
    } catch (err) {
      console.error("Cancellation error:", err);
      Swal.fire("Error", err?.message || "Failed to cancel the booking. Please try again.", "error");
    }
  };

  const activeBooking = menu ? bookings.find((b) => b.id === menu.id) : null;

  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-100">
      {/* Header */}
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

      {/* Table */}
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
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!loading && !error && bookings.length > MAX_ROWS && !searchTerm && (
        <div className="px-6 py-3 border-t border-gray-100 text-right">
          <button onClick={() => navigate("/reservations")} className="text-sm font-medium text-blue-700 hover:underline">
            View all {bookings.length} bookings
          </button>
        </div>
      )}

      {/* Action menu (fixed so table overflow never clips it) */}
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
