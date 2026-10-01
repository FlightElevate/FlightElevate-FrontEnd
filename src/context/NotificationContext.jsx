// context/NotificationContext.jsx
// Mount <NotificationProvider> ONCE inside your Router + AuthProvider (e.g. in the main layout).
// Anything below it can call useNotifications() for the bell, list, unread count, etc.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { notificationService } from '../api/services/notificationService';
import { reservationService } from '../api/services/reservationService';
import { showInfoToast, showWarningToast } from '../utils/notifications';
import { runNotificationHandlers } from '../utils/notificationHandlers';
import { toastTypeFor } from '../config/notificationEvents';

const NotificationContext = createContext(null);

const asList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.notifications)) return res.notifications;
  if (Array.isArray(res?.data?.notifications)) return res.data.notifications;
  return null;
};
const MAX_INDIVIDUAL_TOASTS = 3;
const localKey = (userId) => `notifications:local:${userId}`;
const snapshotKey = (userId) => `notifications:reservation-snapshot:${userId}`;
const readStored = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
};
const saveStored = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Ignore unavailable storage. */ }
};
const reservationList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.reservations)) return res.reservations;
  if (Array.isArray(res?.data?.reservations)) return res.data.reservations;
  return null;
};
const startOf = (r) => {
  const sources = [r, r?.reservation, r?.booking, r?.schedule, r?.slot].filter(Boolean);
  const find = (keys) => sources.map((x) => keys.map((key) => x?.[key]).find((v) => v != null && v !== '')).find(Boolean);
  const start = find(['start_at', 'starts_at', 'start_datetime', 'scheduled_at', 'start_time', 'start']);
  const date = find(['reservation_date', 'scheduled_date', 'start_date', 'booking_date', 'date']);
  const time = find(['start_time', 'scheduled_time', 'time']);
  if (typeof start === 'string' && /^\d{4}-\d{2}-\d{2}[T ]/.test(start)) return new Date(start.replace(' ', 'T'));
  const rawDate = date || start;
  if (!rawDate) return null;
  const dateText = String(rawDate).trim();
  const dateOnly = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(dateText.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return null;
  if (time && /^\d{1,2}:\d{2}/.test(time)) {
    const [h, m] = time.split(':');
    parsed.setHours(Number(h), Number(m.slice(0, 2)), 0, 0);
  }
  return parsed;
};
const summaryOf = (r) => {
  const name = (v) => typeof v === 'string' ? v : v?.name || `${v?.first_name || ''} ${v?.last_name || ''}`.trim();
  return [name(r.students?.[0] || r.student), name(r.instructors?.[0] || r.instructor)].filter(Boolean).join(' · ');
};
const isAdmin = (user) => [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])]
  .some((r) => ['admin', 'administrator'].includes(String(typeof r === 'string' ? r : r?.name || r?.slug || '').toLowerCase()));

// Keep false until the backend notification endpoint is ready; reservation-based local notices still work.
export const NotificationProvider = ({ children, pollMs = 30000, pageSize = 20, toasts = true, useBackendFeed = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const seen = useRef(new Set()); // ids we've already shown/seen
  const primed = useRef(false); // first fetch only records ids, never toasts
  const inFlight = useRef(false);

  const markRead = useCallback(async (id) => {
    let wasUnread = false;
    setItems((prev) =>
      prev.map((n) => {
        if (n.id === id && !n.read_at) {
          wasUnread = true;
          return { ...n, read_at: new Date().toISOString() };
        }
        return n;
      })
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    if (String(id).startsWith('local-')) {
      saveStored(localKey(userId), readStored(localKey(userId), []).map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } else {
      try { await notificationService.markRead(id); } catch (e) { console.error('markRead failed', e); }
    }
    return wasUnread;
  }, [userId]);

  const announce = useCallback(
    (n) => {
      if (runNotificationHandlers(n, { navigate })) return;
      const show = toastTypeFor(n) === 'warning' ? showWarningToast : showInfoToast;
      show(`${n.title}: ${n.body}`, {
        toastId: `notification-${n.id}`, // same id = never shown twice
        autoClose: 6000,
        onClick: () => {
          markRead(n.id);
          if (n.action_path) navigate(n.action_path);
        },
      });
    },
    [navigate, markRead]
  );

  const refresh = useCallback(async () => {
    if (!userId || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      // Skip the unavailable notifications endpoint by default. The local reservation
      // snapshot fallback below continues to use the working reservations endpoint.
      if (useBackendFeed) {
        try {
          const res = await notificationService.list({ per_page: pageSize });
          if (res?.success) {
            const list = asList(res);
            if (!list) throw new Error('Notifications API returned an unexpected response shape');
            setItems(list);
            setUnreadCount(res.unread_count ?? list.filter((n) => !n.read_at).length);
            const fresh = list.filter((n) => !seen.current.has(n.id));
            list.forEach((n) => seen.current.add(n.id));
            if (primed.current && toasts) fresh.filter((n) => !n.read_at).reverse().forEach(announce);
            primed.current = true;
            return;
          }
        } catch { /* Backend notification routes are not ready; continue with reservations. */ }
      }

      const response = await reservationService.getReservations({ per_page: 1000 });
      const reservations = reservationList(response);
      if (!reservations) throw new Error('Reservations API returned an unexpected response shape');
      const previous = readStored(snapshotKey(userId), null);
      const current = {};
      reservations.forEach((r) => {
        if (!r?.id) return;
        const start = startOf(r);
        current[r.id] = { start: start && !Number.isNaN(start.getTime()) ? start.toISOString() : '', status: String(r.status || '').toLowerCase(), summary: summaryOf(r) };
      });

      const local = readStored(localKey(userId), []);
      const notices = [];
      const add = (id, event, title, body, oldStart = '', newStart = '') => notices.push({
        id: `local-${encodeURIComponent(`${id}-${event}-${oldStart}-${newStart}`)}`,
        event, title, body, reservation_id: id, action_path: `/reservations/${id}`,
        read_at: null, created_at: new Date().toISOString(),
      });

      // First fetch is just a baseline; later polls detect changes. Admins are excluded.
      if (previous && !isAdmin(user)) {
        Object.entries(current).forEach(([id, next]) => {
          const old = previous[id];
          if (!old && !['cancelled', 'canceled', 'completed', 'no_show', 'no-show'].includes(next.status)) {
            add(id, 'reservation.created', 'New reservation', `A reservation was added.${next.start ? ` Scheduled for ${new Date(next.start).toLocaleString()}.` : ''}${next.summary ? ` ${next.summary}` : ''}`, '', next.start);
          } else if (old && !['cancelled', 'canceled'].includes(old.status) && ['cancelled', 'canceled'].includes(next.status)) {
            add(id, 'reservation.cancelled', 'Reservation cancelled', `A reservation was cancelled. ${old.summary || ''}`, old.start, next.start);
          } else if (old?.start && next.start && old.start !== next.start) {
            add(id, 'reservation.rescheduled', 'Reservation rescheduled', `Moved from ${new Date(old.start).toLocaleString()} to ${new Date(next.start).toLocaleString()}. ${next.summary || ''}`, old.start, next.start);
          }
        });
        Object.entries(previous).forEach(([id, old]) => {
          if (!current[id] && !['cancelled', 'canceled'].includes(old.status)) {
            add(id, 'reservation.cancelled', 'Reservation removed', `A reservation was removed from the schedule. ${old.summary || ''}`, old.start);
          }
        });
      }

      const known = new Set(local.map((n) => n.id));
      const fresh = notices.filter((n) => !known.has(n.id));
      const nextLocal = [...fresh.reverse(), ...local].slice(0, 100);
      saveStored(localKey(userId), nextLocal);
      saveStored(snapshotKey(userId), current);
      setItems(nextLocal);
      setUnreadCount(nextLocal.filter((n) => !n.read_at).length);
      if (primed.current && toasts) fresh.forEach(announce);
      primed.current = true;
    } catch (e) {
      console.error('Failed to load notifications/reservations', e);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [userId, user, pageSize, toasts, announce, useBackendFeed]);

  // Reset when the signed-in user changes (login/logout/switch account).
  useEffect(() => {
    seen.current = new Set();
    primed.current = false;
    const local = userId ? readStored(localKey(userId), []) : [];
    setItems(local);
    setUnreadCount(local.filter((n) => !n.read_at).length);
    if (userId) setLoading(true);
  }, [userId]);

  // Poll while the tab is visible; refresh immediately when it becomes visible again.
  useEffect(() => {
    if (!userId) return undefined;
    refresh();
    const tick = () => document.visibilityState === 'visible' && refresh();
    const timer = setInterval(tick, pollMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [userId, pollMs, refresh]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    setUnreadCount(0);
    const local = readStored(localKey(userId), []).map((n) => n.read_at ? n : { ...n, read_at: new Date().toISOString() });
    if (userId) saveStored(localKey(userId), local);
    if (items.some((n) => !String(n.id).startsWith('local-'))) {
      try { await notificationService.markAllRead(); } catch (e) { console.error('markAllRead failed', e); refresh(); }
    }
  }, [refresh, items, userId]);

  const remove = useCallback(
    async (id) => {
      setItems((prev) => {
        const next = prev.filter((n) => n.id !== id);
        if (userId) saveStored(localKey(userId), next.filter((n) => String(n.id).startsWith('local-')));
        return next;
      });
      if (!String(id).startsWith('local-')) {
        try { await notificationService.remove(id); } catch (e) { console.error('remove failed', e); }
        refresh();
      }
    },
    [refresh, userId]
  );

  const open = useCallback(
    (n) => {
      markRead(n.id);
      if (n.action_path) navigate(n.action_path);
    },
    [markRead, navigate]
  );

  const value = useMemo(
    () => ({ items, unreadCount, loading, refresh, markRead, markAllRead, remove, open }),
    [items, unreadCount, loading, refresh, markRead, markAllRead, remove, open]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
};
