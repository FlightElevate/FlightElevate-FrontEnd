import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

const InstructorFlightLogs = ({ limit = 30, title = 'Flight Logs', station }) => {
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // No status param: fetch everything, filter on the client
      const res = await reservationService.getReservations({ limit });
      console.log('[FlightLogs] raw response:', res);

      const body = res?.data?.data ?? res?.data ?? res;
      const list = Array.isArray(body)
        ? body
        : body?.data ?? body?.reservations ?? body?.items ?? body?.results ?? [];
      console.log('[FlightLogs] parsed list:', list);

      setFlights(list.filter((f) => STATUSES.includes(String(f.status).toLowerCase())));
      setError(null);
    } catch (err) {
      console.error('[FlightLogs] load failed:', err);
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

  const sorted = useMemo(
    () =>
      [...flights].sort(
        (a, b) =>
          new Date(`${b.lesson_date?.slice(0, 10)}T${b.lesson_time || '00:00'}`) -
          new Date(`${a.lesson_date?.slice(0, 10)}T${a.lesson_time || '00:00'}`)
      ),
    [flights]
  );

  const counts = useMemo(
    () => STATUSES.reduce((acc, s) => ({ ...acc, [s]: flights.filter((f) => String(f.status).toLowerCase() === s).length }), {}),
    [flights]
  );

  const rows = filter === 'all' ? sorted : sorted.filter((f) => String(f.status).toLowerCase() === filter);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
        <h2 className={`${MONO} text-xs tracking-[0.3em] uppercase text-slate-500`}>
          {title}{station ? ` · ${station}` : ''}
        </h2>
        <span className={`${MONO} flex items-center gap-2 text-xs tracking-[0.14em] text-slate-500`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live
        </span>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-6 pt-4 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`${MONO} px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.1em] border whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="p-4 sm:p-6 space-y-3 max-h-[600px] overflow-y-auto">
        {loading ? (
          <p className={`${MONO} py-10 text-center text-xs uppercase tracking-[0.2em] text-slate-400`}>Loading flight logs…</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-500">{error}</p>
        ) : rows.length === 0 ? (
          <p className={`${MONO} py-10 text-center text-xs uppercase tracking-[0.2em] text-slate-400`}>No flight logs found</p>
        ) : (
          rows.map((f) => {
            const st = STATUS_STYLES[String(f.status).toLowerCase()];
            const aircraftSub = [f.aircraft?.model, f.aircraft?.engine_type].filter(Boolean).join(' · ');
            const detail = [f.flight_type, f.instructors?.[0]?.name && `CFI ${f.instructors[0].name.split(' ').pop()}`]
              .filter(Boolean).join(' · ');
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => navigate(`/reservations/${f.id}${String(f.status).toLowerCase() === 'completed' ? '?tab=checkin' : ''}`)}
                className="relative w-full flex items-center gap-4 sm:gap-6 text-left bg-white border border-slate-200 rounded-2xl pl-6 pr-4 py-4 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden"
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${st.accent}`} />

                {/* Tail + aircraft */}
                <div className="w-28 sm:w-40 flex-shrink-0">
                  <div className={`${MONO} text-[19px] font-bold text-slate-900 tracking-[0.04em] truncate mb-1.5`}>
                    {f.aircraft?.registration ?? '—'}
                  </div>
                  <div className={`${MONO} text-xs uppercase tracking-[0.16em] text-slate-400 truncate`}>
                    {aircraftSub || f.aircraft?.name || 'No aircraft'}
                  </div>
                </div>

                {/* Student + flight type */}
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-semibold text-slate-900 truncate mb-1.5 tracking-tight">
                    {studentsLabel(f.students)}
                  </div>
                  <div className={`${MONO} text-xs uppercase tracking-[0.16em] text-slate-400 truncate`}>
                    {detail || f.title || '—'}
                  </div>
                </div>

                {/* Time */}
                <div className="hidden sm:block text-right flex-shrink-0">
                  <div className={`${MONO} text-[17px] text-sky-600 tracking-[0.04em] mb-1.5`}>
                    {f.lesson_time ? `${f.lesson_time}–${f.end_time}` : '—'}
                  </div>
                  <div className={`${MONO} text-xs uppercase tracking-[0.16em] text-slate-400`}>
                    {fmtDate(f.lesson_date)}
                  </div>
                </div>

                {/* Status */}
                <span className={`${MONO} flex-shrink-0 w-28 text-center px-3 py-2 rounded-lg border text-xs font-bold tracking-[0.14em] ${st.pill}`}>
                  {st.label}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className={`${MONO} flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50/70 text-xs tracking-[0.12em] text-slate-500`}>
        <span>
          <span className="text-emerald-600 font-semibold">{counts.completed ?? 0} completed</span>
          {' · '}
          <span className="text-blue-600 font-semibold">{counts.requested ?? 0} requested</span>
          {' · '}
          <span className="text-sky-600 font-semibold">{counts.pending ?? 0} pending</span>
        </span>
        <span>Auto-refresh 30 s</span>
      </div>
    </div>
  );
};

export default InstructorFlightLogs;
