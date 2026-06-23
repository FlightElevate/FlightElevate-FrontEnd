import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft, FiTrash2, FiAlertTriangle, FiCheckCircle,
  FiClock, FiMapPin, FiUser, FiTool, FiFileText, FiDollarSign,
  FiBook, FiSend, FiRefreshCw, FiLoader, FiPrinter, FiCalendar, FiCreditCard, FiX,
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
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('overview');
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [metarStation, setMetarStation] = useState('KMQJ');
  const [metarLoading, setMetarLoading] = useState(false);
  const [metarDisplay, setMetarDisplay] = useState('');
  const [stripePaymentMethodId, setStripePaymentMethodId] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
    const tab = searchParams.get('tab');
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkPaymentSuccess = async () => {
      const success = searchParams.get('payment_success') === 'true';
      const sessionId = searchParams.get('session_id');
      if (success && sessionId) {
        setActionLoading(true);
        try {
          await reservationService.confirmPayment(id, { session_id: sessionId });
          showSuccess('Payment processed successfully!');
          // Remove query params from browser URL bar without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
          // Reload details
          loadDetail();
        } catch (err) {
          showError(err?.message ?? err?.response?.data?.message ?? 'Payment verification failed');
        } finally {
          setActionLoading(false);
        }
      }
    };
    checkPaymentSuccess();
  }, [searchParams, id, loadDetail]);

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
  const showError = (err) => { 
    let msg = 'An error occurred';
    if (typeof err === 'string') {
      msg = err;
    } else {
      if (err?.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        msg = Array.isArray(firstError) ? firstError[0] : firstError;
      } else {
        msg = err?.message ?? err?.response?.data?.message ?? 'An error occurred';
      }
    }
    setActionError(msg); 
    setTimeout(() => setActionError(null), 5000); 
  };

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
      showError(err);
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

  const proceedDispatch = async () => {
    setShowAttentionModal(false);
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
      showError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    const hasReminders = reservation?.aircraft?.maintenance_reminders?.length > 0;
    const hasSquawks = reservation?.aircraft?.squawks?.length > 0;
    const notInService = reservation?.aircraft?.status && reservation.aircraft.status !== 'in_service';

    if (hasReminders || hasSquawks || notInService) {
      setShowAttentionModal(true);
    } else {
      await proceedDispatch();
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
    route_from: '',
    route_to: '',
    landings_day: '',
    landings_night: '',
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
        route_from: checkinForm.route_from || null,
        route_to: checkinForm.route_to || null,
        landings_day: checkinForm.landings_day ? parseInt(checkinForm.landings_day) : 0,
        landings_night: checkinForm.landings_night ? parseInt(checkinForm.landings_night) : 0,
        checkin_notes: checkinForm.checkin_notes || null,
        squawks: squawks.length ? squawks : undefined,
      });
      const data = res?.data?.data ?? res?.data ?? res;
      setReservation(data);
      if (data?.invoice) setInvoice(data.invoice);
      showSuccess('Check-in complete! Logbook entries have been generated.');
      setActiveTab('overview');
    } catch (err) {
      showError(err);
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

  const getBlockTime = () => {
    if (!reservation) return 0;
    const hobbsBlock = parseFloat(reservation.hobbs_block_time) || 0;
    const tachBlock = parseFloat(reservation.tach_block_time) || 0;
    if (hobbsBlock > 0) return hobbsBlock;
    if (tachBlock > 0) return tachBlock;
    return (parseFloat(reservation.duration_minutes) || 60) / 60;
  };

  const calculateEstimatedTotal = () => {
    const aircraftRate = parseFloat(invoiceForm.aircraft_rate) || 0;
    const blockTime = getBlockTime();
    const aircraftCharge = blockTime * aircraftRate;

    const dualHours = parseFloat(invoiceForm.instruction_dual_hours) || 0;
    const groundHours = parseFloat(invoiceForm.instruction_ground_hours) || 0;
    const instructorRate = parseFloat(invoiceForm.instructor_rate) || 0;
    const instructorCharge = (dualHours + groundHours) * instructorRate;

    const subtotal = aircraftCharge + instructorCharge;
    const taxPercent = parseFloat(invoiceForm.tax_percent) || 0;
    const taxAmount = subtotal * taxPercent / 100;
    return subtotal + taxAmount;
  };

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
      showError(err);
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
      if (data?.checkout_url) {
        showSuccess('Redirecting to Stripe checkout...');
        setTimeout(() => {
          window.location.href = data.checkout_url;
        }, 1000);
        return;
      }
      setInvoice(data);
      showSuccess(`Payment charged via ${chargeMethod}!`);
    } catch (err) {
      showError(err);
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
      showError(err);
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
          <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800 scrollbar-none">
            {TABS.filter((tab) => !tab.hidden && (tab.id !== 'delete' || isAdmin)).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-[1px] whitespace-nowrap transition-colors
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

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div>
            <Section title="Reservation Info" icon={FiFileText}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 gap-y-6">
                <Field label="Reservation No" value={reservation.reservation_no} />
                <Field label="Flight Type" value={reservation.flight_type} />
                <Field label="Flight Date" value={reservation.lesson_date} />
                <Field label="Flight Time" value={reservation.lesson_time ? `${reservation.lesson_time} – ${reservation.end_time}` : null} />
                
                <Field label="Duration" value={reservation.duration_minutes ? `${reservation.duration_minutes} min` : null} />
                <Field label="Status" value={<StatusBadge status={status} />} />
                <Field label="Location" value={reservation.location?.name} />
                <Field label="Lesson Plan" value={reservation.lesson_number ?? reservation.title} />

                <Field label="Student Name" value={reservation.students?.map(s => s.name).join(', ') || '—'} />
                <Field label="Instructor Name" value={reservation.instructors?.map(i => i.name).join(', ') || '—'} />
                <Field label="Aircraft Reg No" value={reservation.aircraft?.registration ?? 'No aircraft assigned'} />
                <Field label="Route (Departure → Arrival)" value={reservation.route_from || reservation.route_to ? `${reservation.route_from ?? '—'} → ${reservation.route_to ?? '—'}` : 'Not checked in yet'} />
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
                  // { key: 'invoiced', label: 'Invoiced', done: invoice?.status === 'paid' },
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
                          route_from: reservation.route_from || '',
                          route_to: reservation.route_to || '',
                          landings_day: reservation.landings_day != null ? String(reservation.landings_day) : '',
                          landings_night: reservation.landings_night != null ? String(reservation.landings_night) : '',
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
                  <Field label="From" value={reservation.route_from} />
                  <Field label="To" value={reservation.route_to} />
                  <Field label="Day Landings" value={reservation.landings_day} />
                  <Field label="Night Landings" value={reservation.landings_night} />
                </div>
                {reservation.checkin_notes && <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-lg p-3">{reservation.checkin_notes}</p>}
                <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <FiBook size={14} /> Logbook entries auto-generated for student and instructor.
                </div>
              </Section>
            ) : canCheckin || isEditingCheckin ? (
              // Check-in form
              <Section title={isEditingCheckin ? "Edit Check-In Info" : "Check-In After Flight"} icon={FiCheckCircle}>
                <p className="text-sm text-gray-500 mb-6">{isEditingCheckin ? "Correct post-flight readings below." : "Record post-flight readings. Logbook and invoice will be auto-generated."}</p>
                
                {/* Visual Block Time Widgets */}
                {((checkinForm.hobbs_in && reservation.hobbs_out) || 
                  (checkinForm.tach_in && reservation.tach_out != null) || 
                  (checkinForm.tach_2_in && reservation.tach_2_out != null)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {checkinForm.hobbs_in && reservation.hobbs_out && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-blue-500 text-white rounded-xl">
                          <FiClock size={20} />
                        </div>
                        <div>
                          <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Hobbs Block Time</div>
                          <div className="text-2xl font-black text-blue-900 mt-0.5">
                            {Math.max(0, parseFloat(checkinForm.hobbs_in) - parseFloat(reservation.hobbs_out)).toFixed(1)} <span className="text-sm font-bold">hrs</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {checkinForm.tach_in && reservation.tach_out != null && (
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-emerald-500 text-white rounded-xl">
                          <FiTool size={20} />
                        </div>
                        <div>
                          <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Engine 1 Tach</div>
                          <div className="text-2xl font-black text-emerald-900 mt-0.5">
                            {Math.max(0, parseFloat(checkinForm.tach_in) - parseFloat(reservation.tach_out)).toFixed(1)} <span className="text-sm font-bold">hrs</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {checkinForm.tach_2_in && reservation.tach_2_out != null && (
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-purple-500 text-white rounded-xl">
                          <FiTool size={20} />
                        </div>
                        <div>
                          <div className="text-xs text-purple-600 font-semibold uppercase tracking-wider">Engine 2 Tach</div>
                          <div className="text-2xl font-black text-purple-900 mt-0.5">
                            {Math.max(0, parseFloat(checkinForm.tach_2_in) - parseFloat(reservation.tach_2_out)).toFixed(1)} <span className="text-sm font-bold">hrs</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={async (e) => {
                  await handleCheckin(e);
                  setIsEditingCheckin(false);
                }} className="space-y-6">
                  {/* Group 1: Meter Readings */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                      <FiClock size={14} className="text-blue-500" /> 1. Meter Readings (Hobbs / Tach)
                    </h4>
                    {reservation.hobbs_out && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs text-slate-600">
                        <div><span className="font-semibold text-slate-500">Hobbs Out: </span><span className="font-bold text-slate-800">{reservation.hobbs_out}</span></div>
                        <div><span className="font-semibold text-slate-500">Engine 1 Tach Out: </span><span className="font-bold text-slate-800">{reservation.tach_out}</span></div>
                        {reservation.tach_2_out != null && <div><span className="font-semibold text-slate-500">Engine 2 Tach Out: </span><span className="font-bold text-slate-800">{reservation.tach_2_out}</span></div>}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input label="Hobbs In" type="number" step="0.1" min={reservation.hobbs_out ?? 0} value={checkinForm.hobbs_in} onChange={e => setCheckinForm(f => ({ ...f, hobbs_in: e.target.value }))} required placeholder={`>= ${reservation.hobbs_out ?? 0}`} />
                      <Input label="Engine 1 Tach In" type="number" step="0.1" min={reservation.tach_out ?? 0} value={checkinForm.tach_in} onChange={e => setCheckinForm(f => ({ ...f, tach_in: e.target.value }))} required placeholder={`>= ${reservation.tach_out ?? 0}`} />
                      {reservation.tach_2_out != null && (
                        <Input label="Engine 2 Tach In" type="number" step="0.1" min={reservation.tach_2_out ?? 0} value={checkinForm.tach_2_in} onChange={e => setCheckinForm(f => ({ ...f, tach_2_in: e.target.value }))} placeholder={`>= ${reservation.tach_2_out ?? 0}`} />
                      )}
                    </div>
                  </div>

                  {/* Group 2: Instruction & Flight Logbook Hours */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                      <FiBook size={14} className="text-purple-500" /> 2. Instruction & Flight Logbook Hours
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Input label="Dual Hours" type="number" step="0.1" min="0" value={checkinForm.instruction_dual_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_dual_hours: e.target.value }))} placeholder="e.g. 1.5" />
                      <Input label="Ground Hours" type="number" step="0.1" min="0" value={checkinForm.instruction_ground_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_ground_hours: e.target.value }))} placeholder="e.g. 0.5" />
                      <Input label="Multi-Engine" type="number" step="0.1" min="0" value={checkinForm.instruction_multi_engine_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_multi_engine_hours: e.target.value }))} placeholder="e.g. 0.0" />
                      <Input label="Solo Flight" type="number" step="0.1" min="0" value={checkinForm.instruction_solo_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_solo_hours: e.target.value }))} placeholder="0" />
                      <Input label="Cross Country" type="number" step="0.1" min="0" value={checkinForm.instruction_xc_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_xc_hours: e.target.value }))} placeholder="0" />
                      <Input label="Night" type="number" step="0.1" min="0" value={checkinForm.instruction_night_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_night_hours: e.target.value }))} placeholder="0" />
                      <Input label="Instrument" type="number" step="0.1" min="0" value={checkinForm.instruction_instrument_hours} onChange={e => setCheckinForm(f => ({ ...f, instruction_instrument_hours: e.target.value }))} placeholder="0" />
                    </div>
                  </div>

                  {/* Group 3: Route & Landings */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                      <FiMapPin size={14} className="text-emerald-500" /> 3. Route & Landings
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Input label="From" type="text" value={checkinForm.route_from} onChange={e => setCheckinForm(f => ({ ...f, route_from: e.target.value }))} placeholder="e.g. KJFK" />
                      <Input label="To" type="text" value={checkinForm.route_to} onChange={e => setCheckinForm(f => ({ ...f, route_to: e.target.value }))} placeholder="e.g. KLAX" />
                      <Input label="Day Landings" type="number" min="0" value={checkinForm.landings_day} onChange={e => setCheckinForm(f => ({ ...f, landings_day: e.target.value }))} placeholder="0" />
                      <Input label="Night Landings" type="number" min="0" value={checkinForm.landings_night} onChange={e => setCheckinForm(f => ({ ...f, landings_night: e.target.value }))} placeholder="0" />
                    </div>
                  </div>

                  {/* Group 4: Squawks & Notes */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                      <FiFileText size={14} className="text-amber-500" /> 4. Squawks & Flight Notes
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    {isEditingCheckin && (
                      <button
                        type="button"
                        onClick={() => setIsEditingCheckin(false)}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
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
          <div className="space-y-6">
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.print()}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                            >
                              <FiPrinter size={14} /> Print
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setIsEditingInvoice(true)}
                                className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                              >
                                Edit Invoice
                              </button>
                            )}
                          </div>
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
                              <div className="text-xl font-bold text-blue-900">${calculateEstimatedTotal().toFixed(2)}</div>
                            </div>
                            <div className="flex gap-3">
                              {(isEditingInvoice || invoice.status === 'draft') && invoice.id && (
                                <button type="button" onClick={() => setIsEditingInvoice(false)} className="px-5 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">Cancel</button>
                              )}
                              <button 
                                type="button" 
                                onClick={() => setShowPreviewModal(true)} 
                                className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-medium"
                              >
                                <FiFileText size={14} /> Preview Invoice
                              </button>
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
                      <Section title="Payment Type" icon={FiDollarSign}>
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-6">
                            <div className="flex flex-col gap-3">
                              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Select Payment Method</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                  { id: 'card', label: 'Terminal', desc: 'Pay with card terminal', icon: FiCreditCard, color: 'from-blue-500/10 to-indigo-500/10 border-blue-500 text-blue-700' },
                                  { id: 'cash', label: 'Cash', desc: 'Physical cash received', icon: FiDollarSign, color: 'from-green-500/10 to-emerald-500/10 border-green-500 text-green-700' },
                                  { id: 'check', label: 'Check', desc: 'Physical check payment', icon: FiFileText, color: 'from-amber-500/10 to-orange-500/10 border-amber-500 text-amber-700' },
                                  { id: 'account', label: 'Wallet', desc: 'Debit student wallet balance', icon: FiUser, color: 'from-purple-500/10 to-fuchsia-500/10 border-purple-500 text-purple-700' }
                                ].map(m => {
                                  const isSelected = chargeMethod === m.id;
                                  const Icon = m.icon;
                                  return (
                                    <button 
                                      key={m.id} 
                                      type="button"
                                      onClick={() => setChargeMethod(m.id)} 
                                      className={`relative flex flex-col text-left p-5 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-0.5 ${
                                        isSelected 
                                          ? `border-slate-800 bg-gradient-to-br ${m.color.split(' ')[0]} shadow-md` 
                                          : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300 hover:shadow-sm'
                                      }`}
                                    >
                                      <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${isSelected ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500'}`}>
                                        <Icon size={20} />
                                      </div>
                                      <span className="font-bold text-slate-800 text-sm leading-snug">{m.label}</span>
                                      <span className="text-xs text-slate-400 mt-1 leading-tight">{m.desc}</span>
                                      {isSelected && (
                                        <span className="absolute top-4 right-4 flex h-3.5 w-3.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-slate-800"></span>
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {chargeMethod === 'account' && reservation.students?.length > 0 && (
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Wallet Balance Details</span>
                                {reservation.students.map(student => (
                                  <div key={student.id} className="flex justify-between items-center text-sm text-slate-700 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-xs">
                                    <span className="font-bold text-slate-850">{student.name} — Wallet Balance</span>
                                    <span className="font-black font-mono text-base text-green-600">${Number(student.account_balance || 0).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="md:w-72 bg-gradient-to-br from-slate-900 to-slate-850 rounded-2xl p-6 text-white text-center flex flex-col justify-center shadow-xl border border-slate-700/50">
                            <div className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Due</div>
                            <div className="text-4xl font-black mb-6 tracking-tight text-white">${Number(invoice.total || 0).toFixed(2)}</div>
                            <button onClick={() => setShowChargeDialog(true)} disabled={actionLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                              {actionLoading ? <FiLoader className="animate-spin" /> : <FiCheckCircle size={18} />}
                              Confirm Payment
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

        {showAttentionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-red-50 rounded-full text-red-600 flex-shrink-0">
                  <FiAlertTriangle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900">Aircraft Attention Required</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This aircraft has active maintenance items, squawks, or status constraints. Please review before proceeding:
                  </p>

                  {/* Status alert if not in service */}
                  {reservation?.aircraft?.status && reservation.aircraft.status !== 'in_service' && (
                    <div className="mt-3 bg-red-50 border border-red-200 text-red-800 text-xs px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 animate-pulse">
                      <span>Status:</span>
                      <span className="capitalize font-semibold">{reservation.aircraft.status.replace(/_/g, ' ')}</span>
                    </div>
                  )}

                  {/* Squawks */}
                  {reservation?.aircraft?.squawks?.length > 0 && (
                    <div className="mt-4 border border-red-100 rounded-xl p-4 bg-red-50/50">
                      <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Active Squawks / Issues</p>
                      <ul className="space-y-2 text-sm text-red-950">
                        {reservation.aircraft.squawks.map((s) => (
                          <li key={s.id} className="border-b border-red-100/50 pb-2 last:border-0 last:pb-0">
                            <span className="font-semibold block">{s.squawk}</span>
                            {s.description && <span className="block text-xs text-red-800/80 mt-0.5">{s.description}</span>}
                            {s.ground_aircraft && (
                              <span className="inline-flex bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 border border-red-200">
                                GROUNDS AIRCRAFT
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Maintenance Reminders */}
                  {reservation?.aircraft?.maintenance_reminders?.length > 0 && (
                    <div className="mt-4 border border-amber-100 rounded-xl p-4 bg-amber-50/50">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Maintenance Reminders</p>
                      <ul className="space-y-2 text-sm text-amber-950">
                        {reservation.aircraft.maintenance_reminders.map((m) => (
                          <li key={m.id} className="border-b border-amber-100/50 pb-2 last:border-0 last:pb-0">
                            <span className="font-semibold block">{m.template_name || 'Maintenance Task'}</span>
                            <div className="flex gap-4 mt-1 text-xs text-amber-800/90">
                              {m.hours_remaining != null && <span>Hours left: <strong className="text-amber-900">{parseFloat(m.hours_remaining).toFixed(1)} hrs</strong></span>}
                              {m.days_remaining != null && <span>Days left: <strong className="text-amber-900">{m.days_remaining} days</strong></span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAttentionModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel &amp; Check Plane
                </button>
                <button
                  type="button"
                  onClick={() => proceedDispatch()}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium bg-red-600 hover:bg-red-700 shadow-sm transition-colors"
                >
                  Proceed with Dispatch
                </button>
              </div>
            </div>
          </div>
        )}

        {showPreviewModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] border border-slate-100">
              {/* Modal Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FiDollarSign className="text-blue-400 animate-pulse" size={20} />
                  <h3 className="font-bold text-base sm:text-lg">Invoice Preview</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowPreviewModal(false)} 
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 flex-1 space-y-4 sm:space-y-6">
                {/* Invoice Sheet */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-8 space-y-6 text-[#2D3748]">
                  {/* Header: Logo + Invoice ID */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-8 h-8 text-[#2B4C8C]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5L21 16z"/>
                      </svg>
                      <span className="text-xl font-bold tracking-tight text-[#1A365D]">FlightElevate</span>
                    </div>
                    <div className="text-right text-xs sm:text-sm text-slate-500">
                      Invoice # <span className="font-bold text-slate-800">FE-{reservation?.id + 2000 || '2029'}</span>
                    </div>
                  </div>

                  {/* Title & Date */}
                  <div className="flex justify-between items-end">
                    <div>
                      <h1 className="text-3xl font-extrabold text-[#1A365D] tracking-tight">INVOICE</h1>
                    </div>
                    <div className="text-right text-xs sm:text-sm space-y-0.5">
                      <div><span className="text-slate-400">Ref. No </span><span className="font-bold text-slate-850">#{reservation?.reservation_no}</span></div>
                      <div><span className="text-slate-400">Invoice Date: </span><span className="font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                    </div>
                  </div>

                  {/* Metadata Box with light gray background and dividing vertical line */}
                  <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-50 border border-slate-200/60 rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs sm:text-sm">
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between"><span className="text-slate-400">Reference Number:</span> <span className="font-bold text-slate-700">{reservation?.reservation_no}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Invoice Date:</span> <span className="font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Pilot:</span> <span className="font-bold text-slate-750">{reservation?.students?.[0]?.name || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Location:</span> <span className="font-bold text-slate-700">{reservation?.location?.name || 'Anytown, USA \\ 5321'}</span></div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between"><span className="text-slate-400">Pilot:</span> <span className="font-bold text-slate-700">{reservation?.students?.[0]?.name || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Instructor:</span> <span className="font-bold text-slate-700">{reservation?.instructors?.[0]?.name || 'None'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Aircraft:</span> <span className="font-bold text-slate-700">{reservation?.aircraft ? `${reservation.aircraft.registration} / ${reservation.aircraft.name}` : 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Location:</span> <span className="font-bold text-slate-700">{reservation?.location?.name || 'Anytown Municipal Airport'}</span></div>
                    </div>
                  </div>

                  {/* Hobbs / Times Readings Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-200 rounded-xl overflow-hidden text-xs sm:text-sm divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Hobbs Time Start:</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span className="inline-block border-l-4 border-l-blue-600 border-y-4 border-y-transparent w-0 h-0 mr-1" />
                          {reservation?.hobbs_out || '0.0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">End Time:</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span className="inline-block border-l-4 border-l-blue-600 border-y-4 border-y-transparent w-0 h-0 mr-1" />
                          {checkinForm?.hobbs_in || reservation?.hobbs_in || '0.0'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Check-in Time:</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span className="inline-block border-l-4 border-l-blue-600 border-y-4 border-y-transparent w-0 h-0 mr-1" />
                          {reservation?.checked_in_at ? new Date(reservation.checked_in_at).toLocaleString() : new Date().toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Check-out Time:</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span className="inline-block border-l-4 border-l-blue-600 border-y-4 border-y-transparent w-0 h-0 mr-1" />
                          {reservation?.dispatched_at ? new Date(reservation.dispatched_at).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table with Blue Header */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-[#2B4C8C] text-white">
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Description</th>
                          <th className="py-3 px-4 text-center font-bold uppercase tracking-wider">Rate</th>
                          <th className="py-3 px-4 text-center font-bold uppercase tracking-wider">Hours / Qty</th>
                          <th className="py-3 px-4 text-right font-bold uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                        {/* Aircraft Line Item */}
                        {parseFloat(invoiceForm.aircraft_rate) > 0 && (
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4">
                              <span className="font-bold block text-slate-800">Aircraft Rental ({reservation?.aircraft?.name || 'Cessna 172'})</span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-600">${parseFloat(invoiceForm.aircraft_rate).toFixed(2)}/hr</td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">{getBlockTime().toFixed(1)}</td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">${(getBlockTime() * parseFloat(invoiceForm.aircraft_rate)).toFixed(2)}</td>
                          </tr>
                        )}

                        {/* Dual Instruction Line Item */}
                        {parseFloat(invoiceForm.instruction_dual_hours) > 0 && (
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4">
                              <span className="font-bold block text-slate-800">Flight Instruction</span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-600">${parseFloat(invoiceForm.instructor_rate).toFixed(2)}/hr</td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">{parseFloat(invoiceForm.instruction_dual_hours).toFixed(1)}</td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">${(parseFloat(invoiceForm.instruction_dual_hours) * parseFloat(invoiceForm.instructor_rate)).toFixed(2)}</td>
                          </tr>
                        )}

                        {/* Ground Instruction Line Item */}
                        {parseFloat(invoiceForm.instruction_ground_hours) > 0 && (
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4">
                              <span className="font-bold block text-slate-800">Ground Instruction</span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-600">${parseFloat(invoiceForm.instructor_rate).toFixed(2)}/hr</td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">{parseFloat(invoiceForm.instruction_ground_hours).toFixed(1)}</td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">${(parseFloat(invoiceForm.instruction_ground_hours) * parseFloat(invoiceForm.instructor_rate)).toFixed(2)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Rows Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    {/* Left: Refunds & Adjustments */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Refunds &amp; Adjustments</span>
                      <span className="text-xs text-slate-500 font-semibold">None</span>
                    </div>

                    {/* Right: Subtotal, Tax Breakdown */}
                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Subtotal:</span>
                        <span className="font-bold text-slate-800">
                          ${(
                            (getBlockTime() * (parseFloat(invoiceForm.aircraft_rate) || 0)) +
                            ((parseFloat(invoiceForm.instruction_dual_hours) || 0) * (parseFloat(invoiceForm.instructor_rate) || 0)) +
                            ((parseFloat(invoiceForm.instruction_ground_hours) || 0) * (parseFloat(invoiceForm.instructor_rate) || 0))
                          ).toFixed(2)}
                        </span>
                      </div>
                      {parseFloat(invoiceForm.tax_percent) > 0 && (
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>State Tax ({parseFloat(invoiceForm.tax_percent)}%):</span>
                          <span className="font-bold text-slate-800">
                            ${(
                              ((getBlockTime() * (parseFloat(invoiceForm.aircraft_rate) || 0)) +
                              ((parseFloat(invoiceForm.instruction_dual_hours) || 0) * (parseFloat(invoiceForm.instructor_rate) || 0)) +
                              ((parseFloat(invoiceForm.instruction_ground_hours) || 0) * (parseFloat(invoiceForm.instructor_rate) || 0))) *
                              parseFloat(invoiceForm.tax_percent) / 100
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {/* Bold Estimated Total */}
                      <div className="flex justify-between border-t border-slate-200 pt-2.5 text-sm sm:text-base font-extrabold text-slate-900 bg-slate-50/50 p-2.5 rounded-lg">
                        <span>Estimated Total:</span>
                        <span className="font-black text-[#1A365D]">${calculateEstimatedTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Notes (if present) */}
                  {invoiceForm.notes && (
                    <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
                      <span className="font-bold text-slate-700 block mb-1">Invoice Notes:</span>
                      {invoiceForm.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Banner representing Final Total */}
              <div className="bg-[#2B4C8C] text-white flex justify-end items-center px-6 py-4 text-xl sm:text-2xl font-black">
                <span className="mr-3 text-xs sm:text-sm text-slate-200 uppercase tracking-widest font-bold">Final Total:</span>
                ${calculateEstimatedTotal().toFixed(2)}
              </div>

              {/* Modal Footer */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <button 
                  type="button" 
                  onClick={() => setShowPreviewModal(false)} 
                  className="px-4 sm:px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  Back to Edit
                </button>
                <button 
                  type="button" 
                  onClick={async (e) => {
                    await handleSaveInvoice(e);
                    setShowPreviewModal(false);
                    setIsEditingInvoice(false);
                  }} 
                  disabled={actionLoading} 
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  {actionLoading ? <FiLoader className="animate-spin" /> : <FiCheckCircle size={16} />}
                  Generate &amp; Save Invoice
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  </div>
);
};

export default ReservationDetail;
