import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationService } from '../../api/services/reservationService';

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

const AdminFlightLogs = ({ limit = 500, batchSize = 10, title = 'Organization Flight Logs', station }) => {
  const navigate = useNavigate();

  const [flights, setFlights] = useState([]);       // all matching reservations returned by the API
  const [details, setDetails] = useState({});       // id -> detail payload (tail number, slot time...)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(batchSize);

  const requested = useRef(new Set());              // ids whose detail we already asked for
  const scrollRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await reservationService.getReservations({ limit });
      const body = res?.data?.data ?? res?.data ?? res;
      const list = Array.isArray(body)
        ? body
        : body?.data ?? body?.reservations ?? body?.items ?? body?.results ?? [];

      const wanted = list.filter((f) => STATUSES.includes(statusOf(f)));

      // Do not filter by instructor: show every matching reservation returned by the API.
      setFlights(wanted);
      setError(null);
    } catch (err) {
      console.error('[AdminFlightLogs] load failed:', err);
      setError(err?.message ?? 'Failed to load flight logs');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [load]);

  // List rows + any detail we've fetched so far
  const merged = useMemo(
    () => flights.map((f) => (details[f.id] ? { ...f, ...details[f.id] } : f)),
    [flights, details]
  );

  const sorted = useMemo(() => [...merged].sort((a, b) => sortKey(b) - sortKey(a)), [merged]);

  const counts = useMemo(
    () => STATUSES.reduce((acc, s) => ({ ...acc, [s]: merged.filter((f) => statusOf(f) === s).length }), {}),
    [merged]
  );

  const rows = filter === 'all' ? sorted : sorted.filter((f) => statusOf(f) === filter);
  const visibleRows = rows.slice(0, visibleCount);

  // The list endpoint returns a trimmed reservation (no tail number / slot time), so fetch the
  // detail only for rows currently on screen. Cached per id, so scrolling never repeats a call.
  useEffect(() => {
    const missing = visibleRows.filter((f) => (!tailOf(f) || !startOf(f)) && !requested.current.has(f.id));
    if (!missing.length) return;
    missing.forEach((f) => requested.current.add(f.id));
    let cancelled = false;
    (async () => {
      const got = {};
      await Promise.all(
        missing.map(async (f) => {
          try {
            const r = await reservationService.getReservationDetail(f.id);
            got[f.id] = r?.data?.data ?? r?.data ?? r;
          } catch (e) {
            console.error('[AdminFlightLogs] detail failed for', f.id, e);
          }
        })
      );
      if (!cancelled && Object.keys(got).length) setDetails((prev) => ({ ...prev, ...got }));
    })();
    return () => { cancelled = true; };
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
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-500">{error}</p>
        ) : rows.length === 0 ? (
          <p className={`${MONO} py-10 text-center text-xs uppercase tracking-[0.2em] text-slate-400`}>No flight logs found</p>
        ) : (
          <>
            {visibleRows.map((f) => {
              const st = STATUS_STYLES[statusOf(f)];
              const aircraftSub = [f.aircraft?.model, f.aircraft?.engine_type].filter(Boolean).join(' · ');
              const detail = [f.flight_type, f.instructors?.[0]?.name && `CFI ${f.instructors[0].name.split(' ').pop()}`]
                .filter(Boolean).join(' · ');
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => navigate(`/reservations/${f.id}${statusOf(f) === 'completed' ? '?tab=checkin' : ''}`)}
                  className="relative w-full text-left bg-white border border-slate-200 rounded-2xl pl-5 sm:pl-6 pr-4 py-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 md:flex md:items-center md:gap-6 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden"
                >
                  <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${st.accent}`} />

                  {/* Tail + aircraft (phone: top-left) */}
                  <div className="col-start-1 row-start-1 min-w-0 md:w-40 md:flex-shrink-0">
                    <div className={`${MONO} text-[19px] font-bold text-slate-900 tracking-[0.04em] truncate mb-1.5`}>
                      {tailOf(f) ?? '—'}
                    </div>
                    <div className={`${MONO} text-[11px] md:text-xs uppercase tracking-[0.08em] md:tracking-[0.16em] text-slate-400 truncate`}>
                      {aircraftSub || f.aircraft?.name || 'No aircraft'}
                    </div>
                  </div>

                  {/* Name + flight type (phone: bottom-left) */}
                  <div className="col-start-1 row-start-2 min-w-0 md:flex-1">
                    <div className="text-lg md:text-xl font-semibold text-slate-900 truncate mb-1.5 tracking-tight">
                      {studentsLabel(f.students)}
                    </div>
                    <div className={`${MONO} text-[11px] md:text-xs uppercase tracking-[0.08em] md:tracking-[0.16em] text-slate-400 truncate`}>
                      {detail || f.title || '—'}
                    </div>
                  </div>

                  {/* Time (phone: bottom-right) */}
                  <div className="col-start-2 row-start-2 text-right md:flex-shrink-0">
                    <div className={`${MONO} text-[15px] md:text-[17px] text-sky-600 tracking-[0.02em] md:tracking-[0.04em] mb-1.5 whitespace-nowrap`}>
                      {timeRange(f)}
                    </div>
                    <div className={`${MONO} text-[11px] md:text-xs uppercase tracking-[0.08em] md:tracking-[0.16em] text-slate-400`}>
                      {fmtDate(dateOf(f))}
                    </div>
                  </div>

                  {/* Status (phone: top-right) */}
                  <span className={`${MONO} col-start-2 row-start-1 justify-self-end md:flex-shrink-0 md:w-28 text-center px-3 py-1.5 md:py-2 rounded-lg border text-[11px] md:text-xs font-bold tracking-[0.1em] md:tracking-[0.14em] ${st.pill}`}>
                    {st.label}
                  </span>
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
          {rows.length > 0 ? `Showing ${Math.min(visibleCount, rows.length)} of ${rows.length} · ` : ''}Auto-refresh 30 s
        </span>
      </div>
    </div>
  );
};

export default AdminFlightLogs;
