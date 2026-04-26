import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiTrash2, FiAlertTriangle, FiCheckCircle,
  FiClock, FiMapPin, FiUser, FiTool, FiFileText, FiDollarSign,
  FiBook, FiSend, FiRefreshCw, FiLoader, FiPrinter, FiCalendar,
} from 'react-icons/fi';
import { reservationService } from '../api/services/reservationService';
import { useAuth } from '../context/AuthContext';

// ─── Status badge helper ──────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  requested: 'bg-blue-100 text-blue-700 border-blue-200',
  dispatched: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
    {status?.charAt(0).toUpperCase() + status?.slice(1)}
  </span>
);

// ─── Field row (label + value) ────────────────────────────────────────────────
const Field = ({ label, value, className = '' }) => (
  <div className={`flex flex-col gap-0.5 ${className}`}>
    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
    <span className="text-sm text-gray-800 font-semibold">{value ?? '—'}</span>
  </div>
);

// ─── Section card ─────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-4">
    <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
      {Icon && <Icon size={16} className="text-gray-500" />}
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── Input helper ─────────────────────────────────────────────────────────────
const Input = ({ label, type = 'text', value, onChange, required, placeholder, min, step, disabled }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      min={min}
      step={step}
      disabled={disabled}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
    />
  </div>
);

// ─── Confirm dialog ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ title, message, onConfirm, onCancel, danger }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
      <div className="flex items-start gap-3 mb-4">
        <FiAlertTriangle size={22} className={danger ? 'text-red-500 mt-0.5' : 'text-yellow-500 mt-0.5'} />
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>Confirm</button>
      </div>
    </div>
  </div>
);

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: FiFileText },
  { id: 'dispatch', label: 'Dispatch', icon: FiSend },
  { id: 'checkin', label: 'Check-In', icon: FiCheckCircle },
  { id: 'invoice', label: 'Invoice', icon: FiDollarSign },
  { id: 'logsession', label: 'Log Session', icon: FiBook },
  { id: 'delete', label: 'Delete', icon: FiTrash2 },
  { id: 'calendar', label: 'Calendar Sync', icon: FiCalendar },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const ReservationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [metarStation, setMetarStation] = useState('KMQJ');
  const [metarLoading, setMetarLoading] = useState(false);
  const [metarDisplay, setMetarDisplay] = useState('');
  const [stripePaymentMethodId, setStripePaymentMethodId] = useState('');

  // Editing states
  const [isEditingDispatch, setIsEditingDispatch] = useState(false);
  const [isEditingCheckin, setIsEditingCheckin] = useState(false);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);

  const isAdmin = user?.roles?.some(r => ['Admin', 'Super Admin'].includes(r.name ?? r));
  const isInstructor = user?.roles?.some(r => (r.name ?? r) === 'Instructor');
  const canManage = isAdmin || isInstructor;

  // ── Load reservation detail ──
  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reservationService.getReservationDetail(id);
      const data = res?.data?.data ?? res?.data ?? res;
      setReservation(data);
      if (data?.invoice) setInvoice(data.invoice);
    } catch (err) {
      setError(err?.message ?? err?.response?.data?.message ?? 'Failed to load reservation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  useEffect(() => {
    if (activeTab !== 'dispatch' || reservation?.dispatched_at) return;
    let cancelled = false;
    (async () => {
      setMetarLoading(true);
      try {
        const res = await reservationService.fetchMetar(metarStation);
        const d = res?.data?.data ?? res?.data ?? res;
        if (!cancelled) {
          const raw = d?.raw;
          if (raw) {
            setMetarDisplay(raw);
            setDispatchForm((f) => (f.dispatch_weather_briefing ? f : { ...f, dispatch_weather_briefing: raw }));
          } else {
            setMetarDisplay('No METAR returned for this station.');
          }
        }
      } catch {
        if (!cancelled) setMetarDisplay('Unable to load METAR. Enter briefing manually.');
      } finally {
        if (!cancelled) setMetarLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab, metarStation, reservation?.dispatched_at]);

  useEffect(() => {
    if (!reservation?.aircraft || reservation.dispatched_at) return;
    setDispatchForm((f) => {
      if (f.hobbs_out || f.tach_out) return f;
      const h = reservation.aircraft.current_hobbs;
      const t = reservation.aircraft.current_tach;
      const t2 = reservation.aircraft.current_tach_2;
      if (h == null && t == null && t2 == null) return f;
      return {
        ...f,
        hobbs_out: h != null ? String(h) : f.hobbs_out,
        tach_out: t != null ? String(t) : f.tach_out,
        tach_2_out: t2 != null ? String(t2) : f.tach_2_out,
      };
    });
  }, [reservation?.id, reservation?.dispatched_at, reservation?.aircraft?.current_hobbs, reservation?.aircraft?.current_tach]);

  // ── Load invoice separately when tab opened ──
  useEffect(() => {
    if (activeTab === 'invoice' && reservation && !invoice) {
      reservationService.getInvoice(id)
        .then(res => setInvoice(res?.data?.data ?? res?.data ?? res))
        .catch(() => {});
    }
  }, [activeTab, reservation, invoice, id]);

  const showSuccess = (msg) => { setActionSuccess(msg); setTimeout(() => setActionSuccess(null), 4000); };
  const showError = (msg) => { setActionError(msg); setTimeout(() => setActionError(null), 5000); };

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setConfirmDelete(false);
    setDeleteConfirmText('');
    setActionLoading(true);
    try {
      await reservationService.deleteReservation(id);
      navigate('/calendar', { replace: true });
    } catch (err) {
      showError(err?.message ?? err?.response?.data?.message ?? 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DISPATCH
  // ─────────────────────────────────────────────────────────────────────────
  const [dispatchForm, setDispatchForm] = useState({
    hobbs_out: '',
    tach_out: '',
    tach_2_out: '',
    dispatch_weather_briefing: '',
    dispatch_weather_acknowledged: false,
    dispatch_notes: '',
    aircraft_rate_per_hour: '',
    instructor_rate_per_hour: '',
  });

  const handleDispatch = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await reservationService.dispatchReservation(id, {
        hobbs_out: parseFloat(dispatchForm.hobbs_out),
        tach_out: parseFloat(dispatchForm.tach_out),
        tach_2_out: dispatchForm.tach_2_out ? parseFloat(dispatchForm.tach_2_out) : null,
        dispatch_weather_briefing: dispatchForm.dispatch_weather_briefing || null,
        dispatch_weather_acknowledged: !!dispatchForm.dispatch_weather_acknowledged,
        dispatch_notes: dispatchForm.dispatch_notes || null,
        aircraft_rate_per_hour: dispatchForm.aircraft_rate_per_hour ? parseFloat(dispatchForm.aircraft_rate_per_hour) : null,
        instructor_rate_per_hour: dispatchForm.instructor_rate_per_hour ? parseFloat(dispatchForm.instructor_rate_per_hour) : null,
      });
      const data = res?.data?.data ?? res?.data ?? res;
      setReservation(data);
      showSuccess('Reservation dispatched successfully!');
      setActiveTab('checkin');
    } catch (err) {
      showError(err?.message ?? err?.response?.data?.message ?? 'Dispatch failed');
    } finally {
      setActionLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK-IN
  // ─────────────────────────────────────────────────────────────────────────
  const [checkinForm, setCheckinForm] = useState({
    hobbs_in: '',
    tach_in: '',
    tach_2_in: '',
    instruction_dual_hours: '',
    instruction_ground_hours: '',
    instruction_multi_engine_hours: '',
    instruction_solo_hours: '',
    instruction_xc_hours: '',
    instruction_night_hours: '',
    instruction_instrument_hours: '',
    instruction_cirrus_flight_tyq_hours: '',
    instruction_cirrus_ground_tyq_hours: '',
    checkin_notes: '',
    squawks_text: '',
  });

  const handleCheckin = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const squawks = (checkinForm.squawks_text || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await reservationService.checkinReservation(id, {
        hobbs_in: parseFloat(checkinForm.hobbs_in),
        tach_in: parseFloat(checkinForm.tach_in),
        tach_2_in: checkinForm.tach_2_in ? parseFloat(checkinForm.tach_2_in) : null,
        instruction_dual_hours: checkinForm.instruction_dual_hours ? parseFloat(checkinForm.instruction_dual_hours) : null,
        instruction_ground_hours: checkinForm.instruction_ground_hours ? parseFloat(checkinForm.instruction_ground_hours) : null,
        instruction_multi_engine_hours: checkinForm.instruction_multi_engine_hours ? parseFloat(checkinForm.instruction_multi_engine_hours) : null,
        instruction_solo_hours: checkinForm.instruction_solo_hours ? parseFloat(checkinForm.instruction_solo_hours) : null,
        instruction_xc_hours: checkinForm.instruction_xc_hours ? parseFloat(checkinForm.instruction_xc_hours) : null,
        instruction_night_hours: checkinForm.instruction_night_hours ? parseFloat(checkinForm.instruction_night_hours) : null,
        instruction_instrument_hours: checkinForm.instruction_instrument_hours ? parseFloat(checkinForm.instruction_instrument_hours) : null,
        instruction_cirrus_flight_tyq_hours: checkinForm.instruction_cirrus_flight_tyq_hours ? parseFloat(checkinForm.instruction_cirrus_flight_tyq_hours) : null,
        instruction_cirrus_ground_tyq_hours: checkinForm.instruction_cirrus_ground_tyq_hours ? parseFloat(checkinForm.instruction_cirrus_ground_tyq_hours) : null,
        checkin_notes: checkinForm.checkin_notes || null,
        squawks: squawks.length ? squawks : undefined,
      });
      const data = res?.data?.data ?? res?.data ?? res;
      setReservation(data);
      if (data?.invoice) setInvoice(data.invoice);
      showSuccess('Check-in complete! Logbook & invoice auto-generated.');
      setActiveTab('invoice');
    } catch (err) {
      showError(err?.message ?? err?.response?.data?.message ?? 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // INVOICE
  // ─────────────────────────────────────────────────────────────────────────
  const [invoiceForm, setInvoiceForm] = useState({ aircraft_rate: '', instruction_dual_hours: '', instruction_ground_hours: '', instructor_rate: '', tax_percent: '', notes: '' });
  const [chargeMethod, setChargeMethod] = useState('card');
  const [refundForm, setRefundForm] = useState({ refund_amount: '', refund_reason: '' });
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showChargeDialog, setShowChargeDialog] = useState(false);

  useEffect(() => {
    if (invoice) {
      setInvoiceForm({
        aircraft_rate: invoice.aircraft_rate ?? '',
        instruction_dual_hours: invoice.instruction_dual_hours ?? '',
        instruction_ground_hours: invoice.instruction_ground_hours ?? '',
        instructor_rate: invoice.instructor_rate ?? '',
        tax_percent: invoice.tax_percent ?? '',
        notes: invoice.notes ?? '',
      });
    }
  }, [invoice]);

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await reservationService.createInvoice(id, {
        aircraft_rate: invoiceForm.aircraft_rate ? parseFloat(invoiceForm.aircraft_rate) : null,
        instruction_dual_hours: invoiceForm.instruction_dual_hours ? parseFloat(invoiceForm.instruction_dual_hours) : null,
        instruction_ground_hours: invoiceForm.instruction_ground_hours ? parseFloat(invoiceForm.instruction_ground_hours) : null,
        instructor_rate: invoiceForm.instructor_rate ? parseFloat(invoiceForm.instructor_rate) : null,
        tax_percent: invoiceForm.tax_percent ? parseFloat(invoiceForm.tax_percent) : null,
        notes: invoiceForm.notes || null,
      });
      const data = res?.data?.data ?? res?.data ?? res;
      setInvoice(data);
      showSuccess('Invoice saved!');
    } catch (err) {
      showError(err?.message ?? err?.response?.data?.message ?? 'Save failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChargeInvoice = async () => {
    setShowChargeDialog(false);
    setActionLoading(true);
    try {
      const payload = { charge_method: chargeMethod };
      if (chargeMethod === 'card' && stripePaymentMethodId.trim()) {
        payload.stripe_payment_method_id = stripePaymentMethodId.trim();
      }
      const res = await reservationService.chargeInvoice(id, payload);
      const data = res?.data?.data ?? res?.data ?? res;
      setInvoice(data);
      showSuccess(`Payment charged via ${chargeMethod}!`);
    } catch (err) {
      showError(err?.message ?? err?.response?.data?.message ?? 'Charge failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    setShowRefundDialog(false);
    setActionLoading(true);
    try {
      const res = await reservationService.refundInvoice(id, {
        refund_amount: parseFloat(refundForm.refund_amount),
        refund_reason: refundForm.refund_reason || null,
      });
      const data = res?.data?.data ?? res?.data ?? res;
      setInvoice(data);
      showSuccess('Refund issued successfully!');
    } catch (err) {
      showError(err?.message ?? err?.response?.data?.message ?? 'Refund failed');
    } finally {
      setActionLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiLoader size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <FiAlertTriangle size={40} className="text-red-400" />
        <p className="text-gray-600">{error ?? 'Reservation not found'}</p>
        <button onClick={() => navigate(-1)} className="text-blue-500 hover:underline text-sm">Go Back</button>
      </div>
    );
  }

  const status = reservation.status;
  const isDispatched = status === 'dispatched';
  const isCompleted = status === 'completed';
  const canDispatch = canManage && ['pending', 'requested'].includes(status);
  const canCheckin = canManage && isDispatched;
  const canInvoice = isAdmin && isCompleted;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confirm dialogs */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Reservation"
          message={`Permanently delete reservation #${reservation.reservation_no}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => { setConfirmDelete(false); setDeleteConfirmText(''); }}
          danger
        />
      )}
      {showChargeDialog && (
        <ConfirmDialog
          title="Charge Invoice"
          message={`Charge $${invoice?.total?.toFixed(2) ?? '0.00'} via ${chargeMethod}?`}
          onConfirm={handleChargeInvoice}
          onCancel={() => setShowChargeDialog(false)}
        />
      )}
      {showRefundDialog && (
        <ConfirmDialog
          title="Issue Refund"
          message={`Issue refund of $${refundForm.refund_amount || '0.00'}? Reason: ${refundForm.refund_reason || 'N/A'}`}
          onConfirm={handleRefund}
          onCancel={() => setShowRefundDialog(false)}
          danger
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
              <FiArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900">{reservation.reservation_no}</h1>
              <p className="text-xs text-gray-500">{reservation.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Toast messages */}
        {actionSuccess && (
          <div className="max-w-5xl mx-auto px-4 pb-2">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm">
              <FiCheckCircle size={14} /> {actionSuccess}
            </div>
          </div>
        )}
        {actionError && (
          <div className="max-w-5xl mx-auto px-4 pb-2">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <FiAlertTriangle size={14} /> {actionError}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.filter((tab) => tab.id !== 'delete' || isAdmin).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div>
            <Section title="Reservation Info" icon={FiFileText}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Reservation No" value={reservation.reservation_no} />
                <Field label="Flight Type" value={reservation.flight_type} />
                <Field label="Date" value={reservation.lesson_date} />
                <Field label="Time" value={reservation.lesson_time ? `${reservation.lesson_time} – ${reservation.end_time}` : null} />
                <Field label="Duration" value={reservation.duration_minutes ? `${reservation.duration_minutes} min` : null} />
                <Field label="Status" value={<StatusBadge status={status} />} />
                <Field label="Location" value={reservation.location?.name} />
                <Field label="Lesson Plan" value={reservation.lesson_number ?? reservation.title} />
              </div>
            </Section>

            <Section title="People" icon={FiUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Students</p>
                  {reservation.students?.length ? reservation.students.map(s => (
                    <div key={s.id} className="flex items-center gap-2 py-1.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-800">{s.name}</span>
                      {s.certificate_level && <span className="text-xs text-gray-500">({s.certificate_level})</span>}
                    </div>
                  )) : <p className="text-sm text-gray-400">No students assigned</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Instructors</p>
                  {reservation.instructors?.length ? reservation.instructors.map(i => (
                    <div key={i.id} className="flex items-center gap-2 py-1.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">
                        {i.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-800">{i.name}</span>
                    </div>
                  )) : <p className="text-sm text-gray-400">No instructors assigned</p>}
                </div>
              </div>
            </Section>

            <Section title="Aircraft" icon={FiTool}>
              {reservation.aircraft ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Aircraft" value={reservation.aircraft.name} />
                  <Field label="Model" value={reservation.aircraft.model} />
                  <Field label="Registration" value={reservation.aircraft.registration} />
                </div>
              ) : <p className="text-sm text-gray-400">No aircraft assigned</p>}
            </Section>

            {reservation.notes && (
              <Section title="Notes" icon={FiFileText}>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reservation.notes}</p>
              </Section>
            )}

            {/* Status progression */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Flight Progress</h3>
              <div className="flex items-center gap-2 overflow-x-auto">
                {[
                  { key: 'reserved', label: 'Reserved', done: true },
                  { key: 'dispatched', label: 'Dispatched', done: ['dispatched', 'completed'].includes(status), time: reservation.dispatched_at },
                  { key: 'completed', label: 'Checked In', done: status === 'completed', time: reservation.checked_in_at },
                  { key: 'invoiced', label: 'Invoiced', done: invoice?.status === 'paid' },
                ].map((step, idx, arr) => (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center min-w-[80px] text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1
                        ${step.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {step.done ? '✓' : idx + 1}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{step.label}</span>
                      {step.time && <span className="text-xs text-gray-400">{new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                    {idx < arr.length - 1 && <div className={`flex-1 h-0.5 min-w-[20px] ${step.done ? 'bg-green-400' : 'bg-gray-200'}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DISPATCH TAB ── */}
        {activeTab === 'dispatch' && (
          <div>
            {(reservation.dispatched_at && !isEditingDispatch) ? (
              // Already dispatched – show readonly summary
              <Section title="Dispatch Info" icon={FiSend}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm w-full md:w-auto">
                    <FiCheckCircle size={14} /> Dispatched at {new Date(reservation.dispatched_at).toLocaleString()}
                  </div>
                  {canManage && (
                    <button
                      onClick={() => {
                        setDispatchForm({
                          hobbs_out: reservation.hobbs_out != null ? String(reservation.hobbs_out) : '',
                          tach_out: reservation.tach_out != null ? String(reservation.tach_out) : '',
                          tach_2_out: reservation.tach_2_out != null ? String(reservation.tach_2_out) : '',
                          dispatch_weather_briefing: reservation.dispatch_weather_briefing || '',
                          dispatch_weather_acknowledged: !!reservation.dispatch_weather_acknowledged,
                          dispatch_notes: reservation.dispatch_notes || '',
                          aircraft_rate_per_hour: reservation.aircraft_rate_per_hour != null ? String(reservation.aircraft_rate_per_hour) : '',
                          instructor_rate_per_hour: reservation.instructor_rate_per_hour != null ? String(reservation.instructor_rate_per_hour) : '',
                        });
                        setIsEditingDispatch(true);
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      Edit Dispatch
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Hobbs Out" value={reservation.hobbs_out} />
                  <Field label="Engine 1 Tach Out" value={reservation.tach_out} />
                  {reservation.tach_2_out != null && <Field label="Engine 2 Tach Out" value={reservation.tach_2_out} />}
                  <Field label="Weather Briefing" value={reservation.dispatch_weather_briefing} />
                  <Field label="Weather Acknowledged" value={reservation.dispatch_weather_acknowledged ? 'Yes' : 'No'} />
                  <Field label="Aircraft Rate/hr" value={reservation.aircraft_rate_per_hour ? `$${reservation.aircraft_rate_per_hour}` : null} />
                  <Field label="Instructor Rate/hr" value={reservation.instructor_rate_per_hour ? `$${reservation.instructor_rate_per_hour}` : null} />
                </div>
                {reservation.dispatch_notes && <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-lg p-3">{reservation.dispatch_notes}</p>}
              </Section>
            ) : canDispatch || isEditingDispatch ? (
              // Dispatch form
              <Section title={isEditingDispatch ? "Edit Dispatch Info" : "Dispatch Aircraft"} icon={FiSend}>
                <p className="text-sm text-gray-500 mb-4">{isEditingDispatch ? "Correct pre-flight readings below." : "Record pre-flight readings before the student departs."}</p>
                <form onSubmit={async (e) => {
                  await handleDispatch(e);
                  setIsEditingDispatch(false);
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Hobbs Out" type="number" step="0.1" min="0" value={dispatchForm.hobbs_out} onChange={e => setDispatchForm(f => ({ ...f, hobbs_out: e.target.value }))} required placeholder="e.g. 1234.5" />
                    <Input label="Engine 1 Tach Out" type="number" step="0.1" min="0" value={dispatchForm.tach_out} onChange={e => setDispatchForm(f => ({ ...f, tach_out: e.target.value }))} required placeholder="e.g. 1234.5" />
                    <Input label="Engine 2 Tach Out" type="number" step="0.1" min="0" value={dispatchForm.tach_2_out} onChange={e => setDispatchForm(f => ({ ...f, tach_2_out: e.target.value }))} placeholder="e.g. 1234.5 (Optional)" />
                    <Input label="Aircraft Rate / hr ($)" type="number" step="0.01" min="0" value={dispatchForm.aircraft_rate_per_hour} onChange={e => setDispatchForm(f => ({ ...f, aircraft_rate_per_hour: e.target.value }))} placeholder="e.g. 120.00" />
                    <Input label="Instructor Rate / hr ($)" type="number" step="0.01" min="0" value={dispatchForm.instructor_rate_per_hour} onChange={e => setDispatchForm(f => ({ ...f, instructor_rate_per_hour: e.target.value }))} placeholder="e.g. 45.00" />
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-slate-50 space-y-2">
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                        <label className="text-xs font-medium text-gray-600 uppercase">METAR station</label>
                        <input
                          type="text"
                          value={metarStation}
                          onChange={(e) => setMetarStation(e.target.value.toUpperCase())}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
                          maxLength={8}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-words min-h-[2.5rem]">
                      {metarLoading ? 'Loading METAR…' : (metarDisplay || '—')}
                    </div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Weather briefing (editable)</label>
                    <textarea
                      rows={3}
                      value={dispatchForm.dispatch_weather_briefing}
                      onChange={(e) => setDispatchForm((f) => ({ ...f, dispatch_weather_briefing: e.target.value }))}
                      placeholder="METAR text or other briefing notes"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!dispatchForm.dispatch_weather_acknowledged}
                        onChange={(e) => setDispatchForm((f) => ({ ...f, dispatch_weather_acknowledged: e.target.checked }))}
                        className="mt-1 rounded border-gray-300"
                      />
                      <span>I have reviewed the weather briefing <span className="text-red-500">*</span></span>
                    </label>
                  </div>

                  {reservation.aircraft?.maintenance_reminders?.length > 0 && (
                    <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                      <p className="text-xs font-semibold text-amber-900 uppercase mb-2">Maintenance reminders</p>
                      <ul className="space-y-2 text-sm text-amber-900">
                        {reservation.aircraft.maintenance_reminders.map((m) => (
                          <li key={m.id} className="border-b border-amber-100 pb-2 last:border-0">
                            <span className="font-medium">{m.template_name || 'Maintenance'}</span>
                            {m.status && <span className="text-amber-700"> — {m.status}</span>}
                            {m.hours_remaining != null && <span className="block text-xs text-amber-800">Hours remaining: {m.hours_remaining}</span>}
                            {m.days_remaining != null && <span className="block text-xs text-amber-800">Days remaining: {m.days_remaining}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Weight &amp; Balance</p>
                    <button type="button" disabled className="text-sm text-gray-400 cursor-not-allowed px-4 py-2 rounded-lg bg-gray-200">
                      Coming soon
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Dispatch Notes</label>
                    <textarea
                      rows={3}
                      value={dispatchForm.dispatch_notes}
                      onChange={e => setDispatchForm(f => ({ ...f, dispatch_notes: e.target.value }))}
                      placeholder="Any additional notes..."
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    {isEditingDispatch && (
                      <button
                        type="button"
                        onClick={() => setIsEditingDispatch(false)}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {actionLoading ? <FiLoader size={14} className="animate-spin" /> : <FiSend size={14} />}
                      {isEditingDispatch ? 'Update Dispatch' : 'Dispatch'}
                    </button>
                  </div>
                </form>
              </Section>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <FiClock size={32} className="text-yellow-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">
                  {status === 'completed' ? 'This reservation has already been completed.' : 'Dispatch is not available for this reservation status.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── CHECK-IN TAB ── */}
        {activeTab === 'checkin' && (
          <div>
            {(reservation.checked_in_at && !isEditingCheckin) ? (
              // Already checked in
              <Section title="Check-In Info" icon={FiCheckCircle}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm w-full md:w-auto">
                    <FiCheckCircle size={14} /> Checked in at {new Date(reservation.checked_in_at).toLocaleString()}
                  </div>
                  {canManage && (
                    <button
                      onClick={() => {
                        setCheckinForm({
                          hobbs_in: reservation.hobbs_in != null ? String(reservation.hobbs_in) : '',
                          tach_in: reservation.tach_in != null ? String(reservation.tach_in) : '',
                          tach_2_in: reservation.tach_2_in != null ? String(reservation.tach_2_in) : '',
                          instruction_dual_hours: reservation.instruction_dual_hours != null ? String(reservation.instruction_dual_hours) : '',
                          instruction_ground_hours: reservation.instruction_ground_hours != null ? String(reservation.instruction_ground_hours) : '',
                          instruction_multi_engine_hours: reservation.instruction_multi_engine_hours != null ? String(reservation.instruction_multi_engine_hours) : '',
                          instruction_solo_hours: reservation.instruction_solo_hours != null ? String(reservation.instruction_solo_hours) : '',
                          instruction_xc_hours: reservation.instruction_xc_hours != null ? String(reservation.instruction_xc_hours) : '',
                          instruction_night_hours: reservation.instruction_night_hours != null ? String(reservation.instruction_night_hours) : '',
                          instruction_instrument_hours: reservation.instruction_instrument_hours != null ? String(reservation.instruction_instrument_hours) : '',
                          instruction_cirrus_flight_tyq_hours: reservation.instruction_cirrus_flight_tyq_hours != null ? String(reservation.instruction_cirrus_flight_tyq_hours) : '',
                          instruction_cirrus_ground_tyq_hours: reservation.instruction_cirrus_ground_tyq_hours != null ? String(reservation.instruction_cirrus_ground_tyq_hours) : '',
                          checkin_notes: reservation.checkin_notes || '',
                          squawks_text: reservation.squawks?.map(s => s.squawk ?? s).join('\n') || '',
                        });
                        setIsEditingCheckin(true);
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      Edit Check-in
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Hobbs Out" value={reservation.hobbs_out} />
                  <Field label="Hobbs In" value={reservation.hobbs_in} />
                  <Field label="Hobbs Block Time" value={reservation.hobbs_block_time ? `${reservation.hobbs_block_time} hrs` : null} />
                  <Field label="Engine 1 Tach Out" value={reservation.tach_out} />
                  <Field label="Engine 1 Tach In" value={reservation.tach_in} />
                  <Field label="Engine 1 Tach Time" value={reservation.tach_block_time ? `${reservation.tach_block_time} hrs` : null} />
                  {reservation.tach_2_out != null && <Field label="Engine 2 Tach Out" value={reservation.tach_2_out} />}
                  {reservation.tach_2_in != null && <Field label="Engine 2 Tach In" value={reservation.tach_2_in} />}
                  <Field label="Dual Instruction Hours" value={reservation.instruction_dual_hours ? `${reservation.instruction_dual_hours} hrs` : null} />
                  <Field label="Ground Instruction Hours" value={reservation.instruction_ground_hours ? `${reservation.instruction_ground_hours} hrs` : null} />
                  <Field label="Multi-Engine Hours" value={reservation.instruction_multi_engine_hours ? `${reservation.instruction_multi_engine_hours} hrs` : null} />
                  <Field label="Solo" value={reservation.instruction_solo_hours ? `${reservation.instruction_solo_hours} hrs` : null} />
                  <Field label="Cross Country" value={reservation.instruction_xc_hours ? `${reservation.instruction_xc_hours} hrs` : null} />
                  <Field label="Night" value={reservation.instruction_night_hours ? `${reservation.instruction_night_hours} hrs` : null} />
                  <Field label="Instrument" value={reservation.instruction_instrument_hours ? `${reservation.instruction_instrument_hours} hrs` : null} />
                  <Field label="Cirrus Flight TYQ" value={reservation.instruction_cirrus_flight_tyq_hours ? `${reservation.instruction_cirrus_flight_tyq_hours} hrs` : null} />
                  <Field label="Cirrus Ground TYQ" value={reservation.instruction_cirrus_ground_tyq_hours ? `${reservation.instruction_cirrus_ground_tyq_hours} hrs` : null} />
                </div>
                {reservation.checkin_notes && <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-lg p-3">{reservation.checkin_notes}</p>}
                <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <FiBook size={14} /> Logbook entries auto-generated for student and instructor.
                </div>
              </Section>
            ) : canCheckin || isEditingCheckin ? (
              // Check-in form
              <Section title={isEditingCheckin ? "Edit Check-In Info" : "Check-In After Flight"} icon={FiCheckCircle}>
                <p className="text-sm text-gray-500 mb-4">{isEditingCheckin ? "Correct post-flight readings below." : "Record post-flight readings. Logbook and invoice will be auto-generated."}</p>
                {reservation.hobbs_out && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div><span className="text-xs text-blue-600 font-medium">Hobbs Out: </span><span className="text-sm font-bold">{reservation.hobbs_out}</span></div>
                    <div><span className="text-xs text-blue-600 font-medium">Engine 1 Tach Out: </span><span className="text-sm font-bold">{reservation.tach_out}</span></div>
                    {reservation.tach_2_out != null && <div><span className="text-xs text-blue-600 font-medium">Engine 2 Tach Out: </span><span className="text-sm font-bold">{reservation.tach_2_out}</span></div>}
                  </div>
                )}
                <form onSubmit={async (e) => {
                  await handleCheckin(e);
                  setIsEditingCheckin(false);
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Hobbs In" type="number" step="0.1" min={reservation.hobbs_out ?? 0} value={checkinForm.hobbs_in} onChange={e => setCheckinForm(f => ({ ...f, hobbs_in: e.target.value }))} required placeholder={`>= ${reservation.hobbs_out ?? 0}`} />
                    <Input label="Engine 1 Tach In" type="number" step="0.1" min={reservation.tach_out ?? 0} value={checkinForm.tach_in} onChange={e => setCheckinForm(f => ({ ...f, tach_in: e.target.value }))} required placeholder={`>= ${reservation.tach_out ?? 0}`} />
                    {reservation.tach_2_out != null && (
                      <Input label="Engine 2 Tach In" type="number" step="0.1" min={reservation.tach_2_out ?? 0} value={checkinForm.tach_2_in} onChange={e => setCheckinForm(f => ({ ...f, tach_2_in: e.target.value }))} placeholder={`>= ${reservation.tach_2_out ?? 0}`} />
                    )}
                    <Input label="Dual Instruction Hours" type="number" step="0.1" min="0" value={checkinForm.instruction_dual_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_dual_hours: e.target.value }))} placeholder="e.g. 1.5" />
                    <Input label="Ground Instruction Hours" type="number" step="0.1" min="0" value={checkinForm.instruction_ground_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_ground_hours: e.target.value }))} placeholder="e.g. 0.5" />
                    <Input label="Multi-Engine Hours" type="number" step="0.1" min="0" value={checkinForm.instruction_multi_engine_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_multi_engine_hours: e.target.value }))} placeholder="e.g. 0.0" />
                    <Input label="Solo Flight" type="number" step="0.1" min="0" value={checkinForm.instruction_solo_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_solo_hours: e.target.value }))} placeholder="0" />
                    <Input label="Cross Country" type="number" step="0.1" min="0" value={checkinForm.instruction_xc_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_xc_hours: e.target.value }))} placeholder="0" />
                    <Input label="Night" type="number" step="0.1" min="0" value={checkinForm.instruction_night_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_night_hours: e.target.value }))} placeholder="0" />
                    <Input label="Instrument" type="number" step="0.1" min="0" value={checkinForm.instruction_instrument_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_instrument_hours: e.target.value }))} placeholder="0" />
                    <Input label="Cirrus Flight TYQ" type="number" step="0.1" min="0" value={checkinForm.instruction_cirrus_flight_tyq_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_cirrus_flight_tyq_hours: e.target.value }))} placeholder="0" />
                    <Input label="Cirrus Ground TYQ" type="number" step="0.1" min="0" value={checkinForm.instruction_cirrus_ground_tyq_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_cirrus_ground_tyq_hours: e.target.value }))} placeholder="0" />
                  </div>
                  {/* Live block time preview */}
                  {checkinForm.hobbs_in && reservation.hobbs_out && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                      <span className="text-gray-500">Hobbs Block Time: </span>
                      <span className="font-bold text-gray-900">
                        {Math.max(0, parseFloat(checkinForm.hobbs_in) - parseFloat(reservation.hobbs_out)).toFixed(1)} hrs
                      </span>
                    </div>
                  )}
                  {checkinForm.tach_in && reservation.tach_out != null && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                      <span className="text-gray-500">Engine 1 Tach Block Time: </span>
                      <span className="font-bold text-gray-900">
                        {Math.max(0, parseFloat(checkinForm.tach_in) - parseFloat(reservation.tach_out)).toFixed(1)} hrs
                      </span>
                    </div>
                  )}
                  {checkinForm.tach_2_in && reservation.tach_2_out != null && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                      <span className="text-gray-500">Engine 2 Tach Block Time: </span>
                      <span className="font-bold text-gray-900">
                        {Math.max(0, parseFloat(checkinForm.tach_2_in) - parseFloat(reservation.tach_2_out)).toFixed(1)} hrs
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Squawks (one per line)</label>
                    <textarea
                      rows={3}
                      value={checkinForm.squawks_text}
                      onChange={(e) => setCheckinForm((f) => ({ ...f, squawks_text: e.target.value }))}
                      placeholder="Describe any aircraft squawks…"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Check-In Notes</label>
                    <textarea
                      rows={3}
                      value={checkinForm.checkin_notes}
                      onChange={e => setCheckinForm(f => ({ ...f, checkin_notes: e.target.value }))}
                      placeholder="Any post-flight notes..."
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    {isEditingCheckin && (
                      <button
                        type="button"
                        onClick={() => setIsEditingCheckin(false)}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                      {actionLoading ? <FiLoader size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
                      {isEditingCheckin ? 'Update Check-In' : 'Complete Check-In'}
                    </button>
                  </div>
                </form>
              </Section>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <FiClock size={32} className="text-yellow-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">
                  {status === 'pending' || status === 'requested'
                    ? 'Please dispatch the reservation first before checking in.'
                    : 'Check-in is not available for this reservation status.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── INVOICE TAB ── */}
        {activeTab === 'invoice' && (
          <div>
            {!invoice ? (
              <div className="bg-gray-100 border border-gray-200 rounded-xl p-12 text-center">
                <FiDollarSign size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Invoice Found</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">This reservation doesn't have an invoice yet. Invoices are created after check-in.</p>
                {canInvoice && (
                  <button onClick={handleSaveInvoice} disabled={actionLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                    Create Invoice
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* --- PAID SUMMARY --- */}
                {(invoice.status === 'paid' && !isEditingInvoice) && (
                  <Section title="Invoice Details" icon={FiDollarSign}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                        <FiCheckCircle size={14} /> Paid via {invoice.payment_method} on {new Date(invoice.updated_at).toLocaleString()}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setIsEditingInvoice(true)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                        >
                          Edit Invoice
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-gray-100">
                      <Field label="Aircraft Rate" value={`$${invoice.aircraft_rate}`} />
                      <Field label="Dual Instruction" value={`${invoice.instruction_dual_hours} hrs`} />
                      <Field label="Ground Instruction" value={`${invoice.instruction_ground_hours} hrs`} />
                      <Field label="Instructor Rate" value={`$${invoice.instructor_rate}`} />
                      <Field label="Tax" value={`${invoice.tax_percent}%`} />
                    </div>
                    <div className="pt-4 flex flex-col items-end gap-1">
                      <div className="text-sm text-gray-500">Total Charged</div>
                      <div className="text-2xl font-bold text-gray-900">${invoice.total?.toFixed(2)}</div>
                    </div>
                    {invoice.notes && <p className="text-sm text-gray-600 mt-4 bg-gray-50 rounded-lg p-3">{invoice.notes}</p>}
                    
                    {invoice.is_refunded && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-xs font-bold text-red-600 uppercase mb-1">Refund Issued</p>
                        <p className="text-sm text-red-700">Amount: ${Number(invoice.refund_amount).toFixed(2)} — Reason: {invoice.refund_reason || 'N/A'}</p>
                      </div>
                    )}
                  </Section>
                )}

                {/* --- EDIT / DRAFT FORM --- */}
                {(invoice.status !== 'paid' || isEditingInvoice) && (
                  <Section title={isEditingInvoice ? "Edit Invoice Details" : "Invoice Draft"} icon={FiDollarSign}>
                    <p className="text-sm text-gray-500 mb-4">Adjust rates and hours as needed. The total will be recalculated.</p>
                    <form onSubmit={async (e) => {
                      await handleSaveInvoice(e);
                      setIsEditingInvoice(false);
                    }} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Aircraft Rate / hr ($)" type="number" step="0.01" min="0" value={invoiceForm.aircraft_rate} onChange={e => setInvoiceForm(f => ({ ...f, aircraft_rate: e.target.value }))} />
                        <Input label="Dual Instruction (hrs)" type="number" step="0.1" min="0" value={invoiceForm.instruction_dual_hours} onChange={e => setInvoiceForm(f => ({ ...f, instruction_dual_hours: e.target.value }))} />
                        <Input label="Ground Instruction (hrs)" type="number" step="0.1" min="0" value={invoiceForm.instruction_ground_hours} onChange={e => setInvoiceForm(f => ({ ...f, instruction_ground_hours: e.target.value }))} />
                        <Input label="Instructor Rate / hr ($)" type="number" step="0.01" min="0" value={invoiceForm.instructor_rate} onChange={e => setInvoiceForm(f => ({ ...f, instructor_rate: e.target.value }))} />
                        <Input label="Tax %" type="number" step="0.01" min="0" max="100" value={invoiceForm.tax_percent} onChange={e => setInvoiceForm(f => ({ ...f, tax_percent: e.target.value }))} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Invoice Notes</label>
                        <textarea rows={2} value={invoiceForm.notes} onChange={e => setInvoiceForm(f => ({ ...f, notes: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Internal notes or customer visible comments..." />
                      </div>
                      <div className="flex justify-between items-center bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <div>
                          <div className="text-xs text-blue-600 font-medium uppercase">Estimated Total</div>
                          <div className="text-xl font-bold text-blue-900">${((parseFloat(invoiceForm.aircraft_rate || 0) * (reservation.hobbs_block_time || 0)) + (parseFloat(invoiceForm.instruction_dual_hours || 0) * parseFloat(invoiceForm.instructor_rate || 0)) + (parseFloat(invoiceForm.instruction_ground_hours || 0) * parseFloat(invoiceForm.instructor_rate || 0))).toFixed(2)}</div>
                        </div>
                        <div className="flex gap-3">
                          {(isEditingInvoice || invoice.status === 'draft') && invoice.id && (
                            <button type="button" onClick={() => setIsEditingInvoice(false)} className="px-5 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">Cancel</button>
                          )}
                          <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
                            {actionLoading ? <FiLoader className="animate-spin" /> : <FiDollarSign size={14} />}
                            {isEditingInvoice ? 'Update Invoice' : 'Save Invoice Draft'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </Section>
                )}
                
                {/* --- PAYMENT OPTIONS (only if not paid) --- */}
                {invoice.status !== 'paid' && !isEditingInvoice && (
                  <Section title="Issue Payment" icon={FiDollarSign}>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-gray-700">Method:</label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {['card', 'cash', 'check', 'account'].map(m => (
                              <button key={m} onClick={() => setChargeMethod(m)} className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-all ${chargeMethod === m ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                        {chargeMethod === 'card' && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Stripe Payment Method ID</label>
                            <input type="text" value={stripePaymentMethodId} onChange={e => setStripePaymentMethodId(e.target.value)} placeholder="pm_..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="md:w-64 bg-gray-900 rounded-xl p-6 text-white text-center flex flex-col justify-center shadow-lg border border-gray-800">
                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Total to Charge</div>
                        <div className="text-3xl font-bold mb-4">${invoice.total?.toFixed(2)}</div>
                        <button onClick={() => setShowChargeDialog(true)} disabled={actionLoading} className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50">
                          {actionLoading ? <FiLoader className="animate-spin mx-auto" /> : 'Charge Customer'}
                        </button>
                      </div>
                    </div>
                  </Section>
                )}

                {/* --- REFUND (Admin only, already paid) --- */}
                {isAdmin && invoice.status === 'paid' && !invoice.is_refunded && !isEditingInvoice && (
                  <Section title="Issue Refund" icon={FiRefreshCw}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input label="Refund Amount ($)" type="number" step="0.01" min="0" max={invoice.total} value={refundForm.refund_amount} onChange={e => setRefundForm(f => ({ ...f, refund_amount: e.target.value }))} />
                      <Input label="Reason for Refund" value={refundForm.refund_reason} onChange={e => setRefundForm(f => ({ ...f, refund_reason: e.target.value }))} placeholder="e.g., Error in hours, Customer request" />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => setShowRefundDialog(true)} disabled={actionLoading || !refundForm.refund_amount} className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50">
                        <FiRefreshCw size={14} className={actionLoading ? 'animate-spin' : ''} />
                        Process Refund
                      </button>
                    </div>
                  </Section>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── LOG SESSION TAB ── */}
        {activeTab === 'logsession' && (
          <div>
            <Section title="Lesson Plan" icon={FiBook}>
              {reservation.lesson_content?.length ? (
                <div className="space-y-2">
                  {reservation.lesson_content.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{idx + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{item.task ?? item.title ?? item.name ?? JSON.stringify(item)}</p>
                        {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                        {item.status && (
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No lesson plan linked to this reservation.</p>
              )}
            </Section>

            {reservation.lesson_template_id && (
              <div className="mt-2">
                <button
                  onClick={() => navigate(`/lessons/${reservation.lesson_template_id}`)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <FiBook size={14} /> Open Full Lesson Plan →
                </button>
              </div>
            )}

            <Section title="Logbook" icon={FiBook}>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {isCompleted ? (
                  <>
                    <FiCheckCircle size={14} className="text-green-500" />
                    Logbook entries were auto-generated when this reservation was checked in.
                    <button onClick={() => navigate('/logbook')} className="text-blue-500 hover:underline ml-1">View Logbook →</button>
                  </>
                ) : (
                  <>
                    <FiClock size={14} className="text-gray-400" />
                    Logbook will be auto-generated after check-in is complete.
                  </>
                )}
              </div>
            </Section>

            {reservation.notes && (
              <Section title="Instructor Notes / Feedback" icon={FiFileText}>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reservation.notes}</p>
                {reservation.feedback && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">Feedback</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{reservation.feedback}</p>
                  </div>
                )}
              </Section>
            )}
          </div>
        )}

        {activeTab === 'delete' && isAdmin && (
          <Section title="Delete reservation" icon={FiTrash2}>
            <p className="text-sm text-gray-600 mb-4">
              To confirm, type <span className="font-mono font-bold">DELETE</span> below, then confirm in the dialog.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 font-mono"
              placeholder="DELETE"
            />
            <button
              type="button"
              disabled={deleteConfirmText !== 'DELETE' || actionLoading}
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete reservation…
            </button>
          </Section>
        )}

        {activeTab === 'calendar' && (
          <Section title="Calendar sync" icon={FiCalendar}>
            <p className="text-sm text-gray-600 mb-3">
              Sync this reservation to Google Calendar, Outlook, or Apple Calendar. Integration is configured under{' '}
              <span className="font-medium">Settings → Integrations</span>.
            </p>
            <p className="text-xs text-gray-500 mb-4">Last synced: not tracked yet.</p>
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-500 text-sm cursor-not-allowed"
            >
              Sync now (configure integration first)
            </button>
          </Section>
        )}

      </div>
    </div>
  );
};

export default ReservationDetail;
