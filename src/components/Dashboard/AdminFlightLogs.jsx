import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin } from 'react-icons/fi';
import { reservationService } from '../../api/services/reservationService';
import { registerCacheClear } from '../../lib/sessionCache';

// Add once in index.html:
// <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
const MONO = "font-['JetBrains_Mono',ui-monospace,monospace]";

const STATUSES = ['completed', 'requested', 'pending'];

const STATUS_STYLES = {
  completed: { label: 'COMPLETED', accent: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  requested: { label: 'REQUESTED', accent: 'bg-blue-500',    pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  pending:   { label: 'PENDING',   accent: 'bg-sky-300',     pill: 'bg-sky-50 text-sky-700 border-sky-200' },
};

const FILTERS = [{ id: 'all', label: 'All' }, ...STATUSES.map((s) => ({ id: s, label: s[0].toUpperCase() + s.slice(1) }))];

// ---------------------------------------------------------------------------
// Session cache
// Lives in memory only: it survives switching between dashboard modules, and it
// is wiped when the tab/browser is closed or the page is refreshed.
// ---------------------------------------------------------------------------
const STALE_MS = 30 * 1000;            // data younger than this is shown without a refetch on return
const POLL_MS = 60 * 1000;             // background refresh interval (skipped while the tab is hidden)
const INVOICE_RECHECK_MS = 2 * 60 * 1000; // re-check unpaid invoices at most this often

const store = {
  gen: 0,           // bumped on every clear; late responses from an old session are discarded
  limit: null,      // the `limit` the cached list was fetched with
  flights: null,    // cached list of reservations
  fetchedAt: 0,     // when the list was last fetched
  details: {},      // id -> detail payload (tail number, slot time, invoice...)
  detailKeys: {},   // id -> status the detail was fetched for
  invoiceAt: {},    // id -> when the invoice was last requested
};

// Wipes everything cached here. It runs on logout (see src/lib/sessionCache.js),
// so the next user on the same tab never sees the previous user's flight logs.
export const clearAdminFlightLogsCache = () => {
  store.gen += 1;
  store.limit = null;
  store.flights = null;
  store.fetchedAt = 0;
  store.details = {};
  store.detailKeys = {};
  store.invoiceAt = {};
};

registerCacheClear(clearAdminFlightLogsCache);

const statusOf = (f) => String(f.status).toLowerCase();

const shortName = (name) => {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0] : `${parts[0][0]}. ${parts[parts.length - 1]}`;
};

const studentsLabel = (students = []) => {
  if (!students.length) return 'No student';
  return students.length === 1
    ? shortName(students[0].name)
    : `${shortName(students[0].name)} +${students.length - 1}`;
};

// Read the first non-empty value from a list of possible field names ("a.b" paths allowed)
const pick = (obj, keys) => {
  for (const k of keys) {
    const v = k.split('.').reduce((o, part) => (o == null ? o : o[part]), obj);
    if (v != null && v !== '') return v;
  }
  return null;
};

const tailOf = (f) =>
  pick(f, ['aircraft.registration', 'aircraft.tail_number', 'aircraft.tail_no', 'aircraft.registration_number',
           'aircraft.n_number', 'aircraft_registration', 'aircraft_tail_number', 'tail_number', 'registration']);
const dateOf = (f) => pick(f, ['lesson_date', 'date', 'start_date', 'start_at', 'starts_at', 'scheduled_at', 'checked_in_at']);
const startOf = (f) => pick(f, ['lesson_time', 'start_time', 'start_at', 'starts_at', 'scheduled_start']);
const endOf = (f) => pick(f, ['end_time', 'end_at', 'ends_at', 'scheduled_end']);
const routeFromOf = (f) => pick(f, ['route_from', 'checkin.route_from', 'check_out.route_from']);
const routeViaOf = (f) => pick(f, ['route_via', 'checkin.route_via', 'check_out.route_via']);
const routeToOf = (f) => pick(f, ['route_to', 'checkin.route_to', 'check_out.route_to']);
const locationOf = (f) => pick(f, ['location.name', 'location.airport_name', 'location.icao_code', 'location.icao', 'location.code', 'location_name', 'operating_location']);

const paymentStatusOf = (flight) => {
  const status = String(pick(flight, ['invoice.status', 'invoice.payment_status', 'payment_status']) ?? '').toLowerCase();
  if (status === 'paid') return 'paid';
  if (status === 'refunded') return 'refunded';
  return 'pending';
};

const fmtTime = (v) => {
  if (!v) return null;
  const str = String(v);
  if (/^\d{1,2}:\d{2}/.test(str)) return str.slice(0, 5);
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const timeRange = (f) => {
  const a = fmtTime(startOf(f));
  const b = fmtTime(endOf(f));
  if (!a) return '—';
  return b ? `${a}–${b}` : a;
};

const sortKey = (f) => {
  const d = dateOf(f);
  if (!d) return 0;
  const s = startOf(f);
  const t = s && /^\d{1,2}:\d{2}/.test(String(s)) ? String(s).slice(0, 5) : '00:00';
  const v = new Date(`${String(d).slice(0, 10)}T${t}`).getTime();
  return Number.isNaN(v) ? 0 : v;
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

const AdminFlightLogs = ({ limit = 500, batchSize = 10, title = 'Flight Logs', station }) => {
  const navigate = useNavigate();

  // Start from the session cache when we have it, so returning to this module is instant.
  const hasCache = store.limit === limit && Array.isArray(store.flights);

  const [flights, setFlights] = useState(hasCache ? store.flights : []);   // all matching reservations returned by the API
  const [details, setDetails] = useState(() => ({ ...store.details }));    // id -> detail payload (tail number, slot time...)
  const [loading, setLoading] = useState(!hasCache);                        // spinner only when there is nothing cached
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(batchSize);

  const mountedRef = useRef(true);
  const scrollRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const gen = store.gen;
    try {
      const res = await reservationService.getReservations({ limit });
      if (gen !== store.gen) return; // logged out while this request was in flight: drop the result
      const body = res?.data?.data ?? res?.data ?? res;
      const list = Array.isArray(body)
        ? body
        : body?.data ?? body?.reservations ?? body?.items ?? body?.results ?? [];

      // Do not filter by instructor: show every matching reservation returned by the API.
      const wanted = list.filter((f) => STATUSES.includes(statusOf(f)));

      store.limit = limit;
      store.flights = wanted;
      store.fetchedAt = Date.now();

      if (mountedRef.current) {
        setFlights(wanted);
        setError(null);
      }
    } catch (err) {
      console.error('[AdminFlightLogs] load failed:', err);
      // A failed background refresh keeps showing the data we already have.
      if (!silent && mountedRef.current) setError(err?.message ?? 'Failed to load flight logs');
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    mountedRef.current = true;

    if (!(store.limit === limit && Array.isArray(store.flights))) {
      load(false);                                   // nothing cached: normal first load
    } else if (Date.now() - store.fetchedAt > STALE_MS) {
      load(true);                                    // cached but old: show it now, refresh quietly
    }

    const tick = () => {
      if (!document.hidden) load(true);
    };
    const timer = setInterval(tick, POLL_MS);

    const onVisible = () => {
      if (!document.hidden && Date.now() - store.fetchedAt > STALE_MS) load(true);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load, limit]);

  // List rows + any detail we've fetched so far.
  // The status always comes from the list, so a stale detail can never show an old status.
  const merged = useMemo(
    () => flights.map((f) => (details[f.id] ? { ...f, ...details[f.id], status: f.status } : f)),
    [flights, details]
  );

  const sorted = useMemo(() => [...merged].sort((a, b) => sortKey(b) - sortKey(a)), [merged]);

  const counts = useMemo(
    () => STATUSES.reduce((acc, s) => ({ ...acc, [s]: merged.filter((f) => statusOf(f) === s).length }), {}),
    [merged]
  );

  const rows = useMemo(
    () => (filter === 'all' ? sorted : sorted.filter((f) => statusOf(f) === filter)),
    [sorted, filter]
  );
  const visibleRows = useMemo(() => rows.slice(0, visibleCount), [rows, visibleCount]);

  // Fetch missing aircraft/time details and invoice state only for visible rows.
  // Payment state is authoritative from invoice.status (the same source used by checkout).
  // Each row updates as soon as its own request finishes, so rows no longer wait for the slowest one.
  useEffect(() => {
    const now = Date.now();
    const gen = store.gen;

    const applyPatch = (id, patch) => {
      if (gen !== store.gen) return; // logged out while this request was in flight: drop the result
      store.details[id] = { ...(store.details[id] || {}), ...patch };
      if (mountedRef.current) {
        setDetails((prev) => ({ ...prev, [id]: store.details[id] }));
      }
    };

    const missingDetails = visibleRows.filter((f) => {
      const routeMissing = statusOf(f) === 'completed' && (!routeFromOf(f) || !routeToOf(f));
      const needsDetail = !tailOf(f) || !startOf(f) || !locationOf(f) || routeMissing;
      // Asked once per status, so a row that becomes "completed" can load its route.
      return needsDetail && store.detailKeys[f.id] !== statusOf(f);
    });

    const missingInvoices = visibleRows.filter((f) => {
      const askedAt = store.invoiceAt[f.id];
      if (!askedAt) return !f.invoice;
      // Unpaid invoices are re-checked now and then so "Payment pending" doesn't stay stale.
      return paymentStatusOf(f) === 'pending' && now - askedAt > INVOICE_RECHECK_MS;
    });

    missingDetails.forEach((f) => {
      store.detailKeys[f.id] = statusOf(f);
      reservationService
        .getReservationDetail(f.id)
        .then((r) => {
          const detail = r?.data?.data ?? r?.data ?? r;
          applyPatch(f.id, detail);
        })
        .catch((e) => {
          console.error('[AdminFlightLogs] detail failed for', f.id, e);
        });
    });

    missingInvoices.forEach((f) => {
      store.invoiceAt[f.id] = now;
      reservationService
        .getInvoice(f.id)
        .then((r) => {
          const invoice = r?.data?.data ?? r?.data ?? r;
          applyPatch(f.id, { invoice });
        })
        .catch(() => {
          // An invoice may not exist yet; leave it as payment pending.
        });
    });
  }, [visibleRows]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    if (visibleCount < rows.length && el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      setVisibleCount((c) => c + batchSize);
    }
  };

  const changeFilter = (id) => {
    setFilter(id);
    setVisibleCount(batchSize);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/70">
        <h2 className={`${MONO} text-xs tracking-[0.3em] uppercase text-slate-500`}>
          {title}{station ? ` · ${station}` : ''}
        </h2>
        <span className={`${MONO} flex items-center gap-2 text-xs tracking-[0.14em] text-slate-500`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live
        </span>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 px-4 sm:px-6 pt-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => changeFilter(f.id)}
            className={`${MONO} px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.06em] sm:tracking-[0.1em] border whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Rows (scrolls; loads more as you reach the bottom) */}
      <div ref={scrollRef} onScroll={onScroll} className="p-3 sm:p-6 space-y-3 max-h-[70vh] md:max-h-[600px] overflow-y-auto">
        {loading ? (
          <p className={`${MONO} py-10 text-center text-xs uppercase tracking-[0.2em] text-slate-400`}>Loading flight logs…</p>
        ) : error && flights.length === 0 ? (
          <p className="py-10 text-center text-sm text-red-500">{error}</p>
        ) : rows.length === 0 ? (
          <p className={`${MONO} py-10 text-center text-xs uppercase tracking-[0.2em] text-slate-400`}>No flight logs found</p>
        ) : (
          <>
            {visibleRows.map((f) => {
              const st = STATUS_STYLES[statusOf(f)];
              const paymentStatus = paymentStatusOf(f);
              const routeFrom = routeFromOf(f);
              const routeVia = routeViaOf(f);
              const routeTo = routeToOf(f);
              const location = locationOf(f);
              const isCompleted = statusOf(f) === 'completed';
              const fromLocation = isCompleted && routeFrom ? routeFrom : location;
              const showRoute = isCompleted && Boolean(routeFrom || routeVia || routeTo);
              const aircraftSub = [f.aircraft?.model, f.aircraft?.engine_type].filter(Boolean).join(' · ');
              const detail = [f.flight_type, f.instructors?.[0]?.name && `CFI ${f.instructors[0].name.split(' ').pop()}`]
                .filter(Boolean).join(' · ');
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => navigate(`/reservations/${f.id}${statusOf(f) === 'completed' ? '?tab=checkin' : ''}`)}
                  className="relative w-full min-w-0 text-left bg-white border border-slate-200 rounded-2xl pl-4 sm:pl-6 pr-3 sm:pr-4 py-3 sm:py-4 grid grid-cols-[minmax(0,1fr)_108px] items-start gap-x-2 sm:gap-x-3 gap-y-3 md:flex md:items-center md:gap-6 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden"
                >
                  <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${st.accent}`} />

                  {/* Tail + aircraft (phone: top-left) */}
                  <div className="col-start-1 row-start-1 min-w-0 md:w-40 md:flex-shrink-0">
                    <div className={`${MONO} text-base sm:text-[19px] font-bold text-slate-900 tracking-[0.04em] truncate mb-1.5`}>
                      {tailOf(f) ?? '—'}
                    </div>
                    <div className={`${MONO} text-[11px] md:text-xs uppercase tracking-[0.08em] md:tracking-[0.16em] text-slate-400 truncate`}>
                      {aircraftSub || f.aircraft?.name || 'No aircraft'}
                    </div>
                  </div>

                  {/* Name + flight type (phone: bottom-left) */}
                  <div className="col-start-1 row-start-2 min-w-0 md:flex-1">
                    <div className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 truncate mb-1.5 tracking-tight">
                      {studentsLabel(f.students)}
                    </div>
                    <div className={`${MONO} text-[11px] md:text-xs uppercase tracking-[0.08em] md:tracking-[0.16em] text-slate-400 truncate`}>
                      {detail || f.title || '—'}
                    </div>
                    {showRoute && (
                      <div className={`${MONO} mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-[0.08em] text-slate-600`}>
                        <span className="font-bold text-slate-800">{fromLocation || '—'}</span>
                        {routeVia && <><span aria-hidden="true" className="text-slate-300">→</span><span className="font-bold text-slate-800">{routeVia}</span></>}
                        {routeTo && <><span aria-hidden="true" className="text-slate-300">→</span><span className="font-bold text-slate-800">{routeTo}</span></>}
                      </div>
                    )}
                    {!showRoute && location && (
                      <div className={`${MONO} mt-2 flex min-w-0 items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-slate-500`}>
                        <FiMapPin size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="truncate font-semibold text-slate-700">{location}</span>
                      </div>
                    )}
                  </div>

                  {/* Time (phone: bottom-right) */}
                  <div className="col-start-2 row-start-2 text-right md:flex-shrink-0">
                    <div className={`${MONO} text-[13px] sm:text-[15px] md:text-[17px] text-sky-600 tracking-[0.02em] md:tracking-[0.04em] mb-1.5 whitespace-nowrap`}>
                      {timeRange(f)}
                    </div>
                    <div className={`${MONO} text-[11px] md:text-xs uppercase tracking-[0.08em] md:tracking-[0.16em] text-slate-400`}>
                      {fmtDate(dateOf(f))}
                    </div>
                  </div>

                  {/* Status (phone: top-right) */}
                  <div className="col-start-2 row-start-1 justify-self-end flex w-[108px] flex-col gap-1 md:flex-shrink-0 md:w-28">
                    <span className={`${MONO} text-center px-2 py-1.5 md:py-2 rounded-lg border text-[10px] md:text-[11px] font-bold tracking-[0.08em] ${st.pill}`}>
                      {st.label}
                    </span>
                    <span className={`${MONO} text-center px-2 py-1 rounded-lg border text-[9px] md:text-[10px] font-semibold tracking-[0.04em] ${paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : paymentStatus === 'refunded' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {paymentStatus === 'paid' ? 'PAID' : paymentStatus === 'refunded' ? 'REFUNDED' : 'PAYMENT PENDING'}
                    </span>
                  </div>
                </button>
              );
            })}

            {visibleCount < rows.length && (
              <p className={`${MONO} py-3 text-center text-xs uppercase tracking-[0.2em] text-slate-400`}>
                Scroll for more…
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className={`${MONO} flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50/70 text-[11px] sm:text-xs tracking-[0.08em] sm:tracking-[0.12em] text-slate-500`}>
        <span>
          <span className="text-emerald-600 font-semibold">{counts.completed ?? 0} completed</span>
          {' · '}
          <span className="text-blue-600 font-semibold">{counts.requested ?? 0} requested</span>
          {' · '}
          <span className="text-sky-600 font-semibold">{counts.pending ?? 0} pending</span>
        </span>
        <span>
          {rows.length > 0 ? `Showing ${Math.min(visibleCount, rows.length)} of ${rows.length} · ` : ''}Auto-refresh 60 s
        </span>
      </div>
    </div>
  );
};

export default AdminFlightLogs;
