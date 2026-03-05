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
  // blankForm covers every Figma column + architecture requirements
  const blankForm = {
    aircraft_model: '',        // Aircraft model
    aircraft_make: '',         // Aircraft Make
    aircraft_registration: '', // Aircraft Ident
    aircraft_category: '',
    aircraft_class: '',
    simulator_device_type: '',
    student_id: '',
    instructor_id: '',
    flight_date: '',
    route_from: '',
    route_to: '',
    route_via: '',
    total_hours: 0,        // Figma: Total Flight Time (block time – sole source of truth)
    takeoffs_day: 0,
    takeoffs_night: 0,
    landings_day: 0,
    landings_night: 0,
    asel_hours: 0,         // Figma: Airplane Single Engine Land
    ases_hours: 0,         // Figma: Airplane Single Engine Sea
    amel_hours: 0,         // Figma: Airplane Multi Engine Land
    helicopter_hours: 0,   // Figma: Rotorcraft Helicopter
    turbine_hours: 0,      // Figma: Turbine
    ames_hours: 0,         // Figma: Airplane Multi Engine Sea
    tailwheel_hours: 0,    // Figma: Tailwheel
    glider_hours: 0,       // Figma: Glider
    night_hours: 0,        // Figma: Night
    actual_instrument_hours: 0,     // Figma: Actual Instrument
    simulated_instrument_hours: 0,  // Figma: Simulated Instrument
    flight_simulator_hours: 0,      // Figma: Flight Simulator
    cross_country_hours: 0,  // Figma: Cross Country
    solo_hours: 0,           // Figma: Solo
    pic_hours: 0,            // Figma: Pilot in Command
    sic_hours: 0,            // Figma: Second in Command
    dual_hours: 0,           // Figma: Dual Received
    dual_given_hours: 0,     // Figma: Dual Given
    notes: '',               // Figma: Remarks
    approach_type: [],       // B7: kept in form & export
    approach_count: 0,
  };
  const [editForm, setEditForm] = useState(blankForm);

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
      // By default (no date filter): do not send start_date/end_date — backend returns all logbook entries and all-time stats
      // When user applies Month or Start/End date: send date params — backend filters list and stats by that range
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
      aircraft_model: logbook.aircraft_model || '',
      aircraft_make: logbook.aircraft_make || '',
      aircraft_registration: logbook.aircraft_registration || '',
      aircraft_category: logbook.aircraft_category || '',
      aircraft_class: logbook.aircraft_class || '',
      simulator_device_type: logbook.simulator_device_type || '',
      student_id: logbook.student_id || '',
      instructor_id: logbook.instructor_id || user?.id || '',
      flight_date: logbook.flight_date || '',
      route_from: logbook.route_from || '',
      route_to: logbook.route_to || '',
      route_via: logbook.route_via || '',
      takeoffs_day: logbook.takeoffs_day ?? 0,
      takeoffs_night: logbook.takeoffs_night ?? 0,
      landings_day: logbook.landings_day ?? 0,
      landings_night: logbook.landings_night ?? 0,
      total_hours: logbook.total_hours || 0,
      asel_hours: logbook.asel_hours || 0,
      ases_hours: logbook.ases_hours || 0,
      amel_hours: logbook.amel_hours || 0,
      helicopter_hours: logbook.helicopter_hours || 0,
      turbine_hours: logbook.turbine_hours || 0,
      ames_hours: logbook.ames_hours || 0,
      tailwheel_hours: logbook.tailwheel_hours || 0,
      glider_hours: logbook.glider_hours || 0,
      night_hours: logbook.night_hours || 0,
      actual_instrument_hours: logbook.actual_instrument_hours || 0,
      simulated_instrument_hours: logbook.simulated_instrument_hours || 0,
      flight_simulator_hours: logbook.flight_simulator_hours || 0,
      cross_country_hours: logbook.cross_country_hours || 0,
      solo_hours: logbook.solo_hours || 0,
      pic_hours: logbook.pic_hours || 0,
      sic_hours: logbook.sic_hours || 0,
      dual_hours: logbook.dual_hours || 0,
      dual_given_hours: logbook.dual_given_hours || 0,
      notes: logbook.notes || '',
      approach_type: Array.isArray(logbook.approach_type)
        ? logbook.approach_type
        : (logbook.approach_type ? [logbook.approach_type] : []),
      // If existing entry has types but count is 0, default count to number of types
      approach_count: (() => {
        const types = Array.isArray(logbook.approach_type)
          ? logbook.approach_type
          : (logbook.approach_type ? [logbook.approach_type] : []);
        const count = parseInt(logbook.approach_count, 10) || 0;
        return types.length > 0 && count === 0 ? types.length : count;
      })(),
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
      setEditForm(prev => ({ ...prev, aircraft_model: prev.aircraft_model }));
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
      // Normalize approach fields before sending: if types selected but count is 0, default count
      const payload = { ...editForm };
      const approachTypes = Array.isArray(payload.approach_type) ? payload.approach_type : [];
      const approachCount = parseInt(payload.approach_count, 10) || 0;
      if (approachTypes.length > 0 && approachCount === 0) {
        payload.approach_count = approachTypes.length;
      }
      if (approachTypes.length === 0) {
        payload.approach_count = 0;
      }

      let response;
      if (editingLogbook) {
        response = await logbookService.updateEntry(editingLogbook.id, payload);
      } else {
        response = await logbookService.createEntry(payload);
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
      ...blankForm,
      flight_date: new Date().toISOString().split('T')[0],
      instructor_id: user?.id || '',
    });
    setAvailableModels([]);
    setAvailableClasses([]);
    setShowEditModal(true);
  };

  // Build CSV from list data – same API as table (getEntries), so export matches list exactly
  const buildCsvFromListData = (rows) => {
    // Admin export includes Student & Instructor after Date
    const headers = [
      'Date',
      ...(isAdminView ? ['Pilot', 'Instructor'] : []),
      'Aircraft model', 'Aircraft Make', 'Aircraft Ident',
      'From', 'To', 'Via', 'Total Flight Time',
      'Airplane Single Engine Land', 'Airplane Single Engine Sea',
      'Airplane Multi Engine Land', 'Rotorcraft Helicopter',
      'Turbine', 'Airplane Multi Engine Sea', 'Tailwheel', 'Glider',
      'Night', 'Actual Instrument', 'Simulated Instrument', 'Flight Simulator',
      'Cross Country', 'Solo', 'Pilot in Command', 'Second in Command',
      'Dual Received', 'Dual Given',
      'No. of Approaches', 'Approach Types',
      'Takeoffs (Day)', 'Takeoffs (Night)', 'Landings (Day)', 'Landings (Night)',
      'Remarks',
    ];
    const escapeCsv = (v) => {
      if (v == null || v === '') return '';
      const s = String(v);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    // Always output YYYY-MM-DD; use UTC for ISO strings so Excel/local TZ doesn't shift the day
    const toDateStr = (row) => {
      const d = row.flight_date ?? row.flight_date_formatted ?? '';
      if (!d) return '';
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      try {
        const date = new Date(d);
        if (!Number.isNaN(date.getTime())) {
          // Use UTC to avoid wrong day when API sends "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss.sssZ"
          const y = date.getUTCFullYear();
          const m = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        }
      } catch (_) {}
      return String(d);
    };
    // Excel: prefix with tab so the cell is treated as text and date displays as YYYY-MM-DD (no auto-parse/serial)
    const excelDate = (row) => {
      const s = toDateStr(row);
      return s ? `\t${s}` : '';
    };
    const lines = [headers.map(escapeCsv).join(',')];
    rows.forEach((row) => {
      const approachTypeStr = Array.isArray(row.approach_type) && row.approach_type.length
        ? row.approach_type.join(',')
        : (row.approach_type ?? '');
      lines.push([
        excelDate(row),
        ...(isAdminView ? [row.student ?? '', row.instructor ?? ''] : []),
        row.aircraft_model ?? row.aircraft ?? '',
        row.aircraft_make ?? '',
        row.aircraft_registration ?? '',
        row.route_from ?? '',
        row.route_to ?? '',
        row.route_via ?? '',
        parseFloat(row.total_hours ?? 0),
        parseFloat(row.asel_hours ?? 0),
        parseFloat(row.ases_hours ?? 0),
        parseFloat(row.amel_hours ?? 0),
        parseFloat(row.helicopter_hours ?? 0),
        parseFloat(row.turbine_hours ?? 0),
        parseFloat(row.ames_hours ?? 0),
        parseFloat(row.tailwheel_hours ?? 0),
        parseFloat(row.glider_hours ?? 0),
        parseFloat(row.night_hours ?? 0),
        parseFloat(row.actual_instrument_hours ?? 0),
        parseFloat(row.simulated_instrument_hours ?? 0),
        parseFloat(row.flight_simulator_hours ?? 0),
        parseFloat(row.cross_country_hours ?? 0),
        parseFloat(row.solo_hours ?? 0),
        parseFloat(row.pic_hours ?? 0),
        parseFloat(row.sic_hours ?? 0),
        parseFloat(row.dual_hours ?? 0),
        parseFloat(row.dual_given_hours ?? 0),
        row.approach_count ?? 0,
        approachTypeStr,
        row.takeoffs_day ?? 0,
        row.takeoffs_night ?? 0,
        row.landings_day ?? 0,
        row.landings_night ?? 0,
        (row.notes ?? row.summary ?? '').replace(/\n/g, ' '),
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

      {/* Stats — completed reservation/lesson flights only, no manual entries, no double count */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Flight Hours</div>
          <div className="text-3xl font-bold text-blue-600">{Number(stats.total_hours).toFixed(1)}</div>
          <div className="text-xs text-gray-400 mt-1">From completed reservations</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Flights</div>
          <div className="text-3xl font-bold text-gray-900">{totalItems}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">This Month</div>
          <div className="text-3xl font-bold text-gray-900">{stats.this_month_count}</div>
          <div className="text-xs text-gray-400 mt-1">Completed reservations</div>
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
            {isAdminView && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilot</label>
                <select
                  value={filterStudentId}
                  onChange={(e) => { setFilterStudentId(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Pilots</option>
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
            )}
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
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                  {isAdminView && (
                    <>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Pilot</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Instructor</th>
                    </>
                  )}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aircraft model</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aircraft Make</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aircraft Ident</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">From</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">To</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Via</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Total Flight Time</th>
                  {/* Figma cols 8–15: category hours */}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Airplane Single Engine Land</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Airplane Single Engine Sea</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Airplane Multi Engine Land</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Rotorcraft Helicopter</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Turbine</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Airplane Multi Engine Sea</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tailwheel</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Glider</th>
                  {/* Figma cols 16–19: condition hours */}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Night</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actual Instrument</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Simulated Instrument</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Flight Simulator</th>
                  {/* Figma cols 20–25: role hours */}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Cross Country</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Solo</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Pilot in Command</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Second in Command</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Dual Received</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Dual Given</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">No. of Approaches</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Approach Types</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Takeoffs (D)</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Takeoffs (N)</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Landings (D)</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Landings (N)</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Remarks</th>
                  {!isAdminView && (
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logbooks.map((logbook) => {
                  const hr = (v) => parseFloat(v ?? 0);
                  const disp = (v) => hr(v) > 0 ? hr(v).toFixed(1) : '--';
                  return (
                  <tr key={logbook.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(logbook.flight_date).toLocaleDateString()}
                    </td>
                    {isAdminView && (
                      <>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                          {safeDisplay(logbook.student) || '--'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                          {safeDisplay(logbook.instructor) || '--'}
                        </td>
                      </>
                    )}
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {safeDisplay(logbook.aircraft_model) || safeDisplay(logbook.aircraft) || '--'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {safeDisplay(logbook.aircraft_make) || '--'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {safeDisplay(logbook.aircraft_registration) || '--'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {safeDisplay(logbook.route_from) || '--'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {safeDisplay(logbook.route_to) || '--'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {safeDisplay(logbook.route_via) || '--'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-blue-700">
                      {hr(logbook.total_hours) > 0 ? hr(logbook.total_hours).toFixed(1) : '--'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.asel_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.ases_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.amel_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.helicopter_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.turbine_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.ames_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.tailwheel_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.glider_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.night_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.actual_instrument_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.simulated_instrument_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.flight_simulator_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.cross_country_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.solo_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.pic_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.sic_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.dual_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{disp(logbook.dual_given_hours)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{logbook.approach_count ?? 0}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 max-w-[120px] truncate" title={Array.isArray(logbook.approach_type) ? logbook.approach_type.join(', ') : (logbook.approach_type || '--')}>
                      {Array.isArray(logbook.approach_type) && logbook.approach_type.length ? logbook.approach_type.join(', ') : '--'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{logbook.takeoffs_day ?? '--'}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{logbook.takeoffs_night ?? '--'}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{logbook.landings_day ?? '--'}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{logbook.landings_night ?? '--'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 max-w-[160px]">
                      <span
                        title={logbook.notes || logbook.summary || ''}
                        className="block truncate"
                      >
                        {logbook.notes || logbook.summary || '--'}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm relative">
                      {!isAdminView && (
                        <>
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
                        </>
                      )}
                    </td>
                  </tr>
                  );
                })}
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

              {/* ── Section 1: Aircraft (Figma cols 2-4) ── */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 pb-1 border-b">Aircraft</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Aircraft model *</label>
                    <input type="text" required value={editForm.aircraft_model}
                      onChange={(e) => handleFormChange('aircraft_model', e.target.value)}
                      placeholder="C172, PA-28…"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Aircraft Make *</label>
                    <input type="text" list="makes-list" required value={editForm.aircraft_make}
                      onChange={(e) => handleFormChange('aircraft_make', e.target.value)}
                      placeholder="Cessna, Piper…"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <datalist id="makes-list">{availableMakes.map(m => <option key={m} value={m} />)}</datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Aircraft Ident (N-Number) *</label>
                    <input type="text" required value={editForm.aircraft_registration}
                      onChange={(e) => handleFormChange('aircraft_registration', e.target.value)}
                      placeholder="N12345"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                    <input type="text" list="categories-list" required value={editForm.aircraft_category}
                      onChange={(e) => handleFormChange('aircraft_category', e.target.value)}
                      placeholder="Airplane, Rotorcraft…"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <datalist id="categories-list">
                      {(availableCategories.length > 0 ? availableCategories : aircraftCategories).map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Class *</label>
                    <input type="text" list="classes-list" required value={editForm.aircraft_class}
                      onChange={(e) => handleFormChange('aircraft_class', e.target.value)}
                      placeholder="ASEL, AMEL…"
                      disabled={!editForm.aircraft_category}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                    <datalist id="classes-list">{availableClasses.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                  {editForm.aircraft_category === 'Simulator' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Simulator Type</label>
                      <input type="text" list="sim-types-list" value={editForm.simulator_device_type}
                        onChange={(e) => handleFormChange('simulator_device_type', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <datalist id="sim-types-list">{simulatorTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</datalist>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Section 2: Flight Info (Figma cols 1, 5, 6, 7) ── */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 pb-1 border-b">Flight Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pilot *</label>
                    <select required value={editForm.student_id}
                      onChange={(e) => handleFormChange('student_id', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Pilot</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Instructor *</label>
                    <select required value={editForm.instructor_id}
                      onChange={(e) => handleFormChange('instructor_id', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Instructor</option>
                      {isAdminView
                        ? instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)
                        : <option value={user?.id || ''}>{user?.name || 'Current User'}</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                    <input type="date" required value={editForm.flight_date}
                      onChange={(e) => handleFormChange('flight_date', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                    <input type="text" value={editForm.route_from}
                      onChange={(e) => handleFormChange('route_from', e.target.value)} placeholder="KMQS"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                    <input type="text" value={editForm.route_to}
                      onChange={(e) => handleFormChange('route_to', e.target.value)} placeholder="KATL"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Via</label>
                    <input type="text" value={editForm.route_via}
                      onChange={(e) => handleFormChange('route_via', e.target.value)} placeholder="e.g. Ahmedabad (optional)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Flight Time * (block hours)</label>
                    <input type="number" step="0.1" min="0" required value={editForm.total_hours}
                      onChange={(e) => handleFormChange('total_hours', e.target.value)} placeholder="1.5"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Takeoffs & Landings (regulatory)</label>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Takeoffs (Day)</label>
                        <input type="number" min="0" value={editForm.takeoffs_day}
                          onChange={(e) => handleFormChange('takeoffs_day', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Takeoffs (Night)</label>
                        <input type="number" min="0" value={editForm.takeoffs_night}
                          onChange={(e) => handleFormChange('takeoffs_night', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Landings (Day)</label>
                        <input type="number" min="0" value={editForm.landings_day}
                          onChange={(e) => handleFormChange('landings_day', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Landings (Night)</label>
                        <input type="number" min="0" value={editForm.landings_night}
                          onChange={(e) => handleFormChange('landings_night', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 3: Category Hours (Figma cols 8-15) ── */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 pb-1 border-b">Aircraft Category Hours</h3>
                <p className="text-xs text-gray-500 mb-3">Enter time for the category flown; leave others at 0. Each is a subset of Total Flight Time.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    ['asel_hours',       'Airplane Single Engine Land'],
                    ['ases_hours',       'Airplane Single Engine Sea'],
                    ['amel_hours',       'Airplane Multi Engine Land'],
                    ['helicopter_hours', 'Rotorcraft Helicopter'],
                    ['turbine_hours',    'Turbine'],
                    ['ames_hours',       'Airplane Multi Engine Sea'],
                    ['tailwheel_hours',  'Tailwheel'],
                    ['glider_hours',     'Glider'],
                  ].map(([field, label]) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input type="number" step="0.1" min="0" value={editForm[field]}
                        onChange={(e) => handleFormChange(field, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Section 4: Condition / Environment Hours (Figma cols 16-19) ── */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 pb-1 border-b">Condition Hours</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    ['night_hours',               'Night'],
                    ['actual_instrument_hours',   'Actual Instrument'],
                    ['simulated_instrument_hours','Simulated Instrument (Hood)'],
                    ['flight_simulator_hours',    'Flight Simulator'],
                  ].map(([field, label]) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input type="number" step="0.1" min="0" value={editForm[field]}
                        onChange={(e) => handleFormChange(field, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Section 5: Role Hours (Figma cols 20-25) ── */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 pb-1 border-b">Role Hours</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    ['cross_country_hours', 'Cross Country'],
                    ['solo_hours',          'Solo'],
                    ['pic_hours',           'Pilot in Command'],
                    ['sic_hours',           'Second in Command'],
                    ['dual_hours',          'Dual Received'],
                    ['dual_given_hours',    'Dual Given'],
                  ].map(([field, label]) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input type="number" step="0.1" min="0" value={editForm[field]}
                        onChange={(e) => handleFormChange(field, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Section 6: Approaches (B7) ── */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 pb-1 border-b">Approaches</h3>
                <div className="space-y-4">
                  {/* Approach Types – toggle chips (tap to select/deselect, multiple allowed) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Approach Types <span className="text-gray-400 font-normal">(optional – tap to select multiple)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['ILS','LPV','LNAV','RNAV','VOR','LOC','NDB','Visual'].map((type) => {
                        const isSelected = Array.isArray(editForm.approach_type) && editForm.approach_type.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              const current = Array.isArray(editForm.approach_type) ? editForm.approach_type : [];
                              const updated = isSelected
                                ? current.filter(t => t !== type)
                                : [...current, type];
                              setEditForm(prev => ({
                                ...prev,
                                approach_type: updated,
                                approach_count: updated.length > 0 && (prev.approach_count === 0 || prev.approach_count === '0')
                                  ? updated.length
                                  : (updated.length === 0 ? 0 : prev.approach_count),
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                    {Array.isArray(editForm.approach_type) && editForm.approach_type.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        Selected: {editForm.approach_type.join(', ')}
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, approach_type: [], approach_count: 0 }))}
                          className="ml-2 text-gray-400 hover:text-red-500 underline"
                        >
                          Clear all
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Approach Count – required when types are selected */}
                  <div className="max-w-xs">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Approach Count
                      {editForm.approach_type?.length > 0 && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.approach_count}
                      onChange={(e) => handleFormChange('approach_count', e.target.value)}
                      placeholder={editForm.approach_type?.length > 0 ? 'Enter count (required)' : '0'}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        editForm.approach_type?.length > 0 && (editForm.approach_count === 0 || editForm.approach_count === '0')
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-300'
                      }`}
                    />
                    {editForm.approach_type?.length > 0 && (editForm.approach_count === 0 || editForm.approach_count === '0') && (
                      <p className="text-xs text-red-500 mt-1">Required when approach types are selected</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Section 7: Remarks (Figma col 26) ── */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 pb-1 border-b">Remarks</h3>
                <textarea rows="3" value={editForm.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Flight notes, maneuvers, remarks…"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
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
