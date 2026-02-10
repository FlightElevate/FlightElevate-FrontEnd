import React, { useState, useRef, useEffect } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { FiSearch, FiEdit2, FiTrash2, FiX, FiPlus, FiDownload, FiFilter } from "react-icons/fi";
import Pagination from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";
import { useRole } from "../../hooks/useRole";
import { logbookService } from "../../api/services/logbookService";
import { userService } from "../../api/services/userService";
import { aircraftService } from "../../api/services/aircraftService";
import { lessonService } from "../../api/services/lessonService";
import { showSuccessToast, showErrorToast, showDeleteConfirm } from "../../utils/notifications";
import { safeDisplay } from "../../utils/safeDisplay";
import { aircraftCategories, getClassesForCategory, simulatorTypes } from "../../data/aircraftMakesModels";

const Logbook = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin } = useRole();
  const isAdminView = isAdmin() || isSuperAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("Newest");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({ total_hours: 0, this_month_count: 0 });
  const [instructorStats, setInstructorStats] = useState(null);

  // Filter states
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterInstructorId, setFilterInstructorId] = useState("");
  const [filterMonth, setFilterMonth] = useState(""); // YYYY-MM for monthly filter
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLogbook, setEditingLogbook] = useState(null);
  const [editForm, setEditForm] = useState({
    // Aircraft Identification
    aircraft_make: '',
    aircraft_model: '',
    // Aircraft Classification (FAA)
    aircraft_category: '',
    aircraft_class: '',
    simulator_device_type: '',
    // Basic Info
    student_id: '',
    instructor_id: '',
    flight_date: '',
    flight_time: '',
    // Time Fields
    dual_hours: 0,
    dual_given_hours: 0,
    solo_hours: 0,
    pic_hours: 0,
    sic_hours: 0,
    total_hours: 0,
    // FAA Time Breakdown
    cross_country_hours: 0,
    instrument_hours: 0,
    actual_instrument_hours: 0,
    simulated_instrument_hours: 0,
    flight_simulator_hours: 0,
    approach_type: [],
    approach_count: 0,
    night_hours: 0,
    turbine_hours: 0,
    // Additional Details
    aircraft_registration: '',
    route_from: '',
    route_to: '',
    number_of_flights: 1,
    takeoffs_day: 0,
    takeoffs_night: 0,
    landings_day: 0,
    landings_night: 0,
    notes: '',
    summary: '',
    lesson_type: '',
    lesson_reference: '',
  });

  const [availableModels, setAvailableModels] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableMakes, setAvailableMakes] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  const menuRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    fetchLogbooks();
  }, [currentPage, itemsPerPage, sortBy, filterStudentId, filterInstructorId, filterMonth, filterStartDate, filterEndDate, searchTerm]);

  useEffect(() => {
    fetchStudents();
    if (isAdminView) fetchInstructors();
    fetchAircraft();
  }, [isAdminView]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLogbooks = async () => {
    setLoading(true);
    try {
      let start_date = filterStartDate;
      let end_date = filterEndDate;
      if (filterMonth) {
        const [y, m] = filterMonth.split("-").map(Number);
        start_date = `${y}-${String(m).padStart(2, "0")}-01`;
        const lastDay = new Date(y, m, 0);
        end_date = `${y}-${String(m).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
      }
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        ...(searchTerm ? { search: searchTerm } : {}),
        ...(filterStudentId ? { student_id: filterStudentId } : {}),
        ...(filterInstructorId ? { instructor_id: filterInstructorId } : {}),
        ...(start_date ? { start_date } : {}),
        ...(end_date ? { end_date } : {}),
      };

      const response = await logbookService.getEntries(params);
      
      if (response.success) {
        setLogbooks(Array.isArray(response.data) ? response.data : []);
        setTotalItems(response.meta?.total || 0);
        setStats({
          total_hours: response.meta?.total_hours ?? 0,
          this_month_count: response.meta?.this_month_count ?? 0,
        });
        setInstructorStats(response.meta?.instructor_stats ?? null);
      }
    } catch (error) {
      console.error('Error fetching logbooks:', error);
      showErrorToast('Failed to fetch logbook entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await userService.getUsers({ role: 'Student', per_page: 1000 });
      if (response.success) {
        const studentsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showErrorToast('Failed to fetch students');
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await userService.getUsers({ role: 'Instructor', per_page: 1000 });
      if (response.success) {
        const instructorsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setInstructors(instructorsData);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
      showErrorToast('Failed to fetch instructors');
    }
  };

  const fetchAircraft = async () => {
    try {
      // Fetch both aircraft and reservations to get all makes/models/categories used
      const [aircraftResponse, reservationsResponse] = await Promise.all([
        aircraftService.getAircraft(),
        lessonService.getReservations({ per_page: 1000 }) // Get all reservations
      ]);

      const aircraftList = aircraftResponse.success ? (aircraftResponse.data.data || []) : [];
      const reservations = reservationsResponse.success ? (reservationsResponse.data.data || []) : [];
      
      setAircraft(aircraftList);

      // Extract makes/models/categories from both aircraft and reservations
      const makesFromAircraft = aircraftList.map(a => a.make).filter(Boolean);
      const makesFromReservations = reservations
        .map(r => r.aircraft?.make || r.aircraft?.name?.split(' ')[0])
        .filter(Boolean);
      
      const modelsFromAircraft = aircraftList.map(a => a.model).filter(Boolean);
      const modelsFromReservations = reservations
        .map(r => r.aircraft?.model || r.aircraft?.name?.split(' ').slice(1).join(' '))
        .filter(Boolean);
      
      const categoriesFromAircraft = aircraftList.map(a => a.category).filter(Boolean);
      const categoriesFromReservations = reservations
        .map(r => r.aircraft?.category)
        .filter(Boolean);

      // Combine and get unique values
      const uniqueMakes = [...new Set([...makesFromAircraft, ...makesFromReservations])];
      const uniqueModels = [...new Set([...modelsFromAircraft, ...modelsFromReservations])];
      const uniqueCategories = [...new Set([...categoriesFromAircraft, ...categoriesFromReservations])];

      setAvailableMakes(uniqueMakes);
      // Store unique models and categories for later use
      setAvailableModels(uniqueModels);
      setAvailableCategories(uniqueCategories.length > 0 ? uniqueCategories : aircraftCategories);
      setAvailableClasses(getClassesForCategory(editForm.aircraft_category || 'Airplane'));
    } catch (error) {
      console.error('Error fetching aircraft:', error);
    }
  };

  const handleEdit = (logbook) => {
    setEditingLogbook(logbook);
    setEditForm({
      aircraft_make: logbook.aircraft_make || '',
      aircraft_model: logbook.aircraft_model || '',
      aircraft_category: logbook.aircraft_category || '',
      aircraft_class: logbook.aircraft_class || '',
      simulator_device_type: logbook.simulator_device_type || '',
      student_id: logbook.student_id || '',
      instructor_id: logbook.instructor_id || user?.id || '',
      flight_date: logbook.flight_date || '',
      flight_time: logbook.flight_time || '',
      dual_hours: logbook.dual_hours || 0,
      dual_given_hours: logbook.dual_given_hours || 0,
      solo_hours: logbook.solo_hours || 0,
      pic_hours: logbook.pic_hours || 0,
      sic_hours: logbook.sic_hours || 0,
      total_hours: logbook.total_hours || 0,
      cross_country_hours: logbook.cross_country_hours || 0,
      instrument_hours: logbook.instrument_hours || 0,
      actual_instrument_hours: logbook.actual_instrument_hours || 0,
      simulated_instrument_hours: logbook.simulated_instrument_hours || 0,
      flight_simulator_hours: logbook.flight_simulator_hours || 0,
      approach_type: Array.isArray(logbook.approach_type) ? logbook.approach_type : (logbook.approach_type ? [logbook.approach_type] : []),
      approach_count: logbook.approach_count || 0,
      night_hours: logbook.night_hours || 0,
      turbine_hours: logbook.turbine_hours || 0,
      aircraft_registration: logbook.aircraft_registration || '',
      route_from: logbook.route_from || '',
      route_to: logbook.route_to || '',
      number_of_flights: logbook.number_of_flights || 1,
      takeoffs_day: logbook.takeoffs_day || 0,
      takeoffs_night: logbook.takeoffs_night || 0,
      landings_day: logbook.landings_day || 0,
      landings_night: logbook.landings_night || 0,
      notes: logbook.notes || '',
      summary: logbook.summary || '',
      lesson_type: logbook.lesson_type || '',
      lesson_reference: logbook.lesson_reference || '',
    });
    
    // Set available models based on selected make from organization's aircraft
    if (logbook.aircraft_make) {
      const models = aircraft
        .filter(a => a.make === logbook.aircraft_make)
        .map(a => a.model)
        .filter((v, i, a) => a.indexOf(v) === i); // unique
      setAvailableModels(models);
    }
    
    if (logbook.aircraft_category) {
      setAvailableClasses(getClassesForCategory(logbook.aircraft_category));
    }
    
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id) => {
    const confirmed = await showDeleteConfirm('Are you sure you want to delete this logbook entry?');
    if (!confirmed) return;

    try {
      const response = await logbookService.deleteEntry(id);
      if (response.success) {
        showSuccessToast('Logbook entry deleted successfully');
        fetchLogbooks();
      }
    } catch (error) {
      showErrorToast('Failed to delete logbook entry');
    }
    setOpenMenuId(null);
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));

    // Update available models when make changes (from organization's aircraft)
    if (field === 'aircraft_make') {
      const models = aircraft
        .filter(a => a.make === value)
        .map(a => a.model)
        .filter((v, i, a) => a.indexOf(v) === i && v); // unique and truthy
      setAvailableModels(models);
      setEditForm(prev => ({ ...prev, aircraft_model: '' }));
    }

    // Update available classes when category changes
    if (field === 'aircraft_category') {
      setAvailableClasses(getClassesForCategory(value));
      setEditForm(prev => ({ ...prev, aircraft_class: '' }));
    }

    // Total = Block Time only. Do NOT auto-sum PIC + Dual + SIC; those are subsets of total.
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingLogbook) {
        response = await logbookService.updateEntry(editingLogbook.id, editForm);
      } else {
        response = await logbookService.createEntry(editForm);
      }

      if (response.success) {
        showSuccessToast(editingLogbook ? 'Logbook updated successfully' : 'Logbook entry created successfully');
        setShowEditModal(false);
        setEditingLogbook(null);
        fetchLogbooks();
      }
    } catch (error) {
      showErrorToast(error.message || 'Failed to save logbook entry');
    }
  };

  const handleAddNew = () => {
    setEditingLogbook(null);
    setEditForm({
      aircraft_make: '',
      aircraft_model: '',
      aircraft_category: '',
      aircraft_class: '',
      simulator_device_type: '',
      student_id: '',
      instructor_id: user?.id || '',
      flight_date: new Date().toISOString().split('T')[0],
      flight_time: '',
      dual_hours: 0,
      dual_given_hours: 0,
      solo_hours: 0,
      pic_hours: 0,
      sic_hours: 0,
      total_hours: 0,
      cross_country_hours: 0,
      instrument_hours: 0,
      night_hours: 0,
      turbine_hours: 0,
      aircraft_registration: '',
      route_from: '',
      route_to: '',
      number_of_flights: 1,
      takeoffs_day: 0,
      takeoffs_night: 0,
      landings_day: 0,
      landings_night: 0,
      notes: '',
      summary: '',
      lesson_type: '',
      lesson_reference: '',
    });
    setAvailableModels([]);
    setAvailableClasses([]);
    setShowEditModal(true);
  };

  // Build CSV from list data – same API as table (getEntries), so export matches list exactly
  const buildCsvFromListData = (rows) => {
    const headers = [
      'Date', 'Aircraft Make', 'Aircraft Model', 'Category', 'Class', 'Registration',
      'Student', 'Instructor', 'Route From', 'Route To',
      'Total (Block)', 'PIC', 'SIC', 'Dual Received', 'Solo', 'Dual Given',
      'Cross-Country', 'Instrument', 'Actual Instrument', 'Simulated Instrument (Hood)', 'Flight Simulator',
      'Approach Type', 'Approach Count', 'Night', 'Turbine',
      'Day Takeoffs', 'Night Takeoffs', 'Day Landings', 'Night Landings',
      'Notes', 'Summary'
    ];
    const escapeCsv = (v) => {
      if (v == null || v === '') return '';
      const s = String(v);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const toDateStr = (row) => {
      const d = row.flight_date ?? row.flight_date_formatted ?? '';
      if (!d) return '';
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      try {
        const date = new Date(d);
        if (!Number.isNaN(date.getTime())) {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        }
      } catch (_) {}
      return String(d);
    };
    const lines = [headers.map(escapeCsv).join(',')];
    rows.forEach((row) => {
      const approachTypeStr = Array.isArray(row.approach_type) && row.approach_type.length
        ? row.approach_type.join(',')
        : (row.approach_type ?? '');
      lines.push([
        toDateStr(row),
        row.aircraft_make ?? '',
        row.aircraft_model ?? '',
        row.aircraft_category ?? '',
        row.aircraft_class ?? '',
        row.aircraft_registration ?? '',
        row.student ?? 'N/A',
        row.instructor ?? 'N/A',
        row.route_from ?? '',
        row.route_to ?? '',
        parseFloat(row.total_hours ?? 0),
        parseFloat(row.pic_hours ?? 0),
        parseFloat(row.sic_hours ?? 0),
        parseFloat(row.dual_hours ?? 0),
        parseFloat(row.solo_hours ?? 0),
        parseFloat(row.dual_given_hours ?? 0),
        parseFloat(row.cross_country_hours ?? 0),
        parseFloat(row.instrument_hours ?? 0),
        parseFloat(row.actual_instrument_hours ?? 0),
        parseFloat(row.simulated_instrument_hours ?? 0),
        parseFloat(row.flight_simulator_hours ?? 0),
        approachTypeStr,
        row.approach_count ?? 0,
        parseFloat(row.night_hours ?? 0),
        parseFloat(row.turbine_hours ?? 0),
        row.takeoffs_day ?? 0,
        row.takeoffs_night ?? 0,
        row.landings_day ?? 0,
        row.landings_night ?? 0,
        (row.notes ?? '').replace(/\n/g, ' '),
        (row.summary ?? '').replace(/\n/g, ' '),
      ].map(escapeCsv).join(','));
    });
    return '\uFEFF' + lines.join('\r\n'); // UTF-8 BOM for Excel
  };

  const handleExport = async () => {
    try {
      let start_date = filterStartDate;
      let end_date = filterEndDate;
      if (filterMonth) {
        const [y, m] = filterMonth.split("-").map(Number);
        start_date = `${y}-${String(m).padStart(2, "0")}-01`;
        const lastDay = new Date(y, m, 0);
        end_date = `${y}-${String(m).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
      }
      const params = {
        per_page: 99999,
        page: 1,
        ...(searchTerm ? { search: searchTerm } : {}),
        ...(filterStudentId ? { student_id: filterStudentId } : {}),
        ...(filterInstructorId ? { instructor_id: filterInstructorId } : {}),
        ...(start_date ? { start_date } : {}),
        ...(end_date ? { end_date } : {}),
      };
      const response = await logbookService.getEntries(params);

      if (!response.success || !Array.isArray(response.data)) {
        showErrorToast(response?.message || 'No data to export');
        return;
      }
      const rows = response.data;
      const csv = buildCsvFromListData(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logbook_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessToast(rows.length ? `Logbook exported (${rows.length} entries)` : 'Logbook exported (no entries)');
    } catch (error) {
      showErrorToast(error?.message || 'Failed to export logbook');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flight Logbook</h1>
          <p className="text-gray-600 mt-1">Track and manage flight instruction hours</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <FiDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats - filter ke mutabiq backend se aate hain */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Flight Hours</div>
          <div className="text-3xl font-bold text-blue-600">{Number(stats.total_hours).toFixed(1)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Flights</div>
          <div className="text-3xl font-bold text-gray-900">{totalItems}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">This Month</div>
          <div className="text-3xl font-bold text-gray-900">{stats.this_month_count}</div>
        </div>
      </div>

      {/* Instructor stats - when instructor filter is selected (admin) */}
      {isAdminView && filterInstructorId && instructorStats && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-indigo-800 mb-3">
            Instructor stats {instructors.find(i => String(i.id) === filterInstructorId)?.name && `– ${instructors.find(i => String(i.id) === filterInstructorId).name}`}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-indigo-600">Dual Given (hrs)</div>
              <div className="text-xl font-bold text-indigo-900">{Number(instructorStats.instructor_total_dual_given ?? 0).toFixed(1)}</div>
            </div>
            <div>
              <div className="text-xs text-indigo-600">Total Flights</div>
              <div className="text-xl font-bold text-indigo-900">{instructorStats.instructor_total_flights ?? 0}</div>
            </div>
            <div>
              <div className="text-xs text-indigo-600">This Month</div>
              <div className="text-xl font-bold text-indigo-900">{instructorStats.instructor_this_month_count ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters - list ke upar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center text-sm font-medium text-gray-700"
          >
            <FiFilter className="mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMonth("");
              setFilterStudentId("");
              setFilterInstructorId("");
              setFilterStartDate("");
              setFilterEndDate("");
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition"
          >
            Clear all
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}
                max={new Date().toISOString().slice(0, 7)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filterMonth && (
                <button
                  type="button"
                  onClick={() => { setFilterMonth(""); setCurrentPage(1); }}
                  className="mt-1 text-xs text-blue-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select
                value={filterStudentId}
                onChange={(e) => { setFilterStudentId(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Students</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
              {filterStudentId && (
                <button
                  type="button"
                  onClick={() => { setFilterStudentId(""); setCurrentPage(1); }}
                  className="mt-1 text-xs text-blue-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            {isAdminView && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                <select
                  value={filterInstructorId}
                  onChange={(e) => { setFilterInstructorId(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Instructors</option>
                  {instructors.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
                {filterInstructorId && (
                  <button
                    type="button"
                    onClick={() => { setFilterInstructorId(""); setCurrentPage(1); }}
                    className="mt-1 text-xs text-blue-600 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => { setFilterStartDate(e.target.value); setFilterMonth(""); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filterStartDate && (
                <button
                  type="button"
                  onClick={() => { setFilterStartDate(""); setCurrentPage(1); }}
                  className="mt-1 text-xs text-blue-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => { setFilterEndDate(e.target.value); setFilterMonth(""); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filterEndDate && (
                <button
                  type="button"
                  onClick={() => { setFilterEndDate(""); setCurrentPage(1); }}
                  className="mt-1 text-xs text-blue-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student, aircraft, or notes..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logbook Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading logbook entries...</p>
          </div>
        ) : logbooks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No logbook entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aircraft</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category/Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total (Block)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PIC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dual Rec</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dual Given</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">X-C</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Night</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Act. Inst</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sim Inst</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approach</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logbooks.map((logbook) => (
                  <tr key={logbook.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(logbook.flight_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-gray-900">
                          {[logbook.aircraft_make, logbook.aircraft_model].filter(Boolean).join(' ') || safeDisplay(logbook.aircraft)}
                      </div>
                      <div className="text-xs text-gray-500">{safeDisplay(logbook.aircraft_registration)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {[safeDisplay(logbook.aircraft_category, ''), safeDisplay(logbook.aircraft_class, '')].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {safeDisplay(logbook.student)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {safeDisplay(logbook.route_from)} → {safeDisplay(logbook.route_to)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {parseFloat(logbook.total_hours || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parseFloat(logbook.pic_hours || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parseFloat(logbook.dual_hours || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parseFloat(logbook.dual_given_hours || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parseFloat(logbook.cross_country_hours || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parseFloat(logbook.night_hours || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parseFloat(logbook.actual_instrument_hours || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parseFloat(logbook.simulated_instrument_hours || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {logbook.approach_count ?? 0}
                      {Array.isArray(logbook.approach_type) && logbook.approach_type.length
                        ? ` (${logbook.approach_type.join(',')})`
                        : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === logbook.id ? null : logbook.id)}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                      >
                        <HiDotsVertical />
                      </button>
                      
                      {openMenuId === logbook.id && (
                        <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                          <button
                            onClick={() => handleEdit(logbook)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <FiEdit2 className="mr-2" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(logbook.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <FiTrash2 className="mr-2" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalItems > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Edit/Add Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingLogbook ? 'Edit Logbook Entry' : 'Add Logbook Entry'}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Aircraft Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Aircraft Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                    <input
                      type="text"
                      list="makes-list"
                      required
                      value={editForm.aircraft_make}
                      onChange={(e) => handleFormChange('aircraft_make', e.target.value)}
                      placeholder="Select or type aircraft make"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <datalist id="makes-list">
                      {availableMakes.map(make => (
                        <option key={make} value={make} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                    <input
                      type="text"
                      list="models-list"
                      required
                      value={editForm.aircraft_model}
                      onChange={(e) => handleFormChange('aircraft_model', e.target.value)}
                      placeholder="Select or type aircraft model"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <datalist id="models-list">
                      {availableModels.map(model => (
                        <option key={model} value={model} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <input
                      type="text"
                      list="categories-list"
                      required
                      value={editForm.aircraft_category}
                      onChange={(e) => handleFormChange('aircraft_category', e.target.value)}
                      placeholder="Select or type category"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <datalist id="categories-list">
                      {availableCategories.length > 0 ? availableCategories.map(cat => (
                        <option key={cat} value={cat} />
                      )) : aircraftCategories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                    <input
                      type="text"
                      list="classes-list"
                      required
                      value={editForm.aircraft_class}
                      onChange={(e) => handleFormChange('aircraft_class', e.target.value)}
                      placeholder="Select or type aircraft class"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!editForm.aircraft_category}
                    />
                    <datalist id="classes-list">
                      {availableClasses.map(cls => (
                        <option key={cls} value={cls} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration (N-Number)</label>
                    <input
                      type="text"
                      value={editForm.aircraft_registration}
                      onChange={(e) => handleFormChange('aircraft_registration', e.target.value)}
                      placeholder="N12345"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {editForm.aircraft_category === 'Simulator' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Simulator Type</label>
                      <input
                        type="text"
                        list="simulator-types-list"
                        value={editForm.simulator_device_type}
                        onChange={(e) => handleFormChange('simulator_device_type', e.target.value)}
                        placeholder="Select or type simulator type"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <datalist id="simulator-types-list">
                        {simulatorTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </datalist>
                    </div>
                  )}
                </div>
              </div>

              {/* Flight Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Flight Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                    <select
                      required
                      value={editForm.student_id}
                      onChange={(e) => handleFormChange('student_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Student</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>{student.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Flight Date *</label>
                    <input
                      type="date"
                      required
                      value={editForm.flight_date}
                      onChange={(e) => handleFormChange('flight_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From (Departure)</label>
                    <input
                      type="text"
                      value={editForm.route_from}
                      onChange={(e) => handleFormChange('route_from', e.target.value)}
                      placeholder="KPDK"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To (Arrival)</label>
                    <input
                      type="text"
                      value={editForm.route_to}
                      onChange={(e) => handleFormChange('route_to', e.target.value)}
                      placeholder="KATL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Flight Hours: Total = Block Time only. PIC/Dual/SIC are subsets. */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Flight Hours (Total = Block Time)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total (Block)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editForm.total_hours}
                      onChange={(e) => handleFormChange('total_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Block time"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PIC</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.pic_hours}
                      onChange={(e) => handleFormChange('pic_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SIC</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.sic_hours}
                      onChange={(e) => handleFormChange('sic_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dual Received</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.dual_hours}
                      onChange={(e) => handleFormChange('dual_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Solo</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.solo_hours}
                      onChange={(e) => handleFormChange('solo_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dual Given</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.dual_given_hours}
                      onChange={(e) => handleFormChange('dual_given_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cross-Country</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.cross_country_hours}
                      onChange={(e) => handleFormChange('cross_country_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instrument</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.instrument_hours}
                      onChange={(e) => handleFormChange('instrument_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Instrument</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.actual_instrument_hours}
                      onChange={(e) => handleFormChange('actual_instrument_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Simulated Instrument (Hood)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.simulated_instrument_hours}
                      onChange={(e) => handleFormChange('simulated_instrument_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Flight Simulator</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.flight_simulator_hours}
                      onChange={(e) => handleFormChange('flight_simulator_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approach Count</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.approach_count}
                      onChange={(e) => handleFormChange('approach_count', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approach Type (optional, multi)</label>
                    <select
                      multiple
                      value={editForm.approach_type}
                      onChange={(e) => setEditForm(prev => ({ ...prev, approach_type: [...e.target.selectedOptions].map(o => o.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {['ILS', 'LPV', 'LNAV', 'RNAV', 'VOR', 'LOC', 'NDB', 'Visual'].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Night</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.night_hours}
                      onChange={(e) => handleFormChange('night_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turbine</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.turbine_hours}
                      onChange={(e) => handleFormChange('turbine_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Takeoffs and Landings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Takeoffs & Landings</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day Takeoffs</label>
                    <input
                      type="number"
                      value={editForm.takeoffs_day}
                      onChange={(e) => handleFormChange('takeoffs_day', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Night Takeoffs</label>
                    <input
                      type="number"
                      value={editForm.takeoffs_night}
                      onChange={(e) => handleFormChange('takeoffs_night', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day Landings</label>
                    <input
                      type="number"
                      value={editForm.landings_day}
                      onChange={(e) => handleFormChange('landings_day', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Night Landings</label>
                    <input
                      type="number"
                      value={editForm.landings_night}
                      onChange={(e) => handleFormChange('landings_night', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows="3"
                      value={editForm.notes}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Flight notes, remarks, maneuvers practiced, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                    <textarea
                      rows="2"
                      value={editForm.summary}
                      onChange={(e) => handleFormChange('summary', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief summary of the flight"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingLogbook ? 'Update Entry' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logbook;
