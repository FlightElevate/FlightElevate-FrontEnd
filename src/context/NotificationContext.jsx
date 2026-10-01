// context/NotificationContext.jsx
//
// One place that owns notifications for the signed-in user:
//   - polls GET /notifications (server-stored notifications: reminders, cancellations, ...)
//   - listens to Laravel Echo on private channel `user.{id}` for instant events
//   - if the /notifications API isn't available (yet), Echo events are kept as LOCAL
//     notifications (saved in localStorage) so the bell still works today.
//     Once the API is live, Echo just triggers a refresh and local mode switches off.
//
// It must live inside Router + AuthProvider. Header.jsx wraps the bell with it.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import echo from '../echo';
import { notificationService } from '../api/services/notificationService';
import { reservationService } from '../api/services/reservationService';
import { showInfoToast, showWarningToast } from '../utils/notifications';
import { runNotificationHandlers } from '../utils/notificationHandlers';
import { toastTypeFor } from '../config/notificationEvents';

const NotificationContext = createContext(null);

const MAX_INDIVIDUAL_TOASTS = 3;
const LOCAL_CAP = 30;
const MAX_FAILURES = 3;

const asList = (res) => (Array.isArray(res?.data) ? res.data : res?.data?.data || []);
const isLocal = (id) => String(id).startsWith('local-');
const storageKey = (userId) => `notifications:local:${userId}`;

const snapshotKey = (userId) => `notifications:reservation-snapshot:${userId}`;
const readSnapshot = (userId) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(snapshotKey(userId)) || 'null');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
const writeSnapshot = (userId, snapshot) => {
  try {
    localStorage.setItem(snapshotKey(userId), JSON.stringify(snapshot));
  } catch {
    /* storage full / blocked: ignore */
  }
};

const notificationList = (value, depth = 0, seen = new Set()) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object' || depth > 5 || seen.has(value)) return null;
  seen.add(value);
  for (const key of ['notifications', 'items', 'results', 'data', 'payload']) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested;
    const found = notificationList(nested, depth + 1, seen);
    if (found) return found;
  }
  return null;
};

const notificationUnreadCount = (value, depth = 0, seen = new Set()) => {
  if (!value || typeof value !== 'object' || depth > 5 || seen.has(value)) return undefined;
  seen.add(value);
  if (value.unread_count != null && Number.isFinite(Number(value.unread_count))) return Number(value.unread_count);
  if (value.unreadCount != null && Number.isFinite(Number(value.unreadCount))) return Number(value.unreadCount);
  for (const key of ['data', 'meta', 'pagination']) {
    const found = notificationUnreadCount(value[key], depth + 1, seen);
    if (found !== undefined) return found;
  }
  return undefined;
};

const reservationList = (value, depth = 0, seen = new Set()) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object' || depth > 5 || seen.has(value)) return null;
  seen.add(value);
  for (const key of ['reservations', 'items', 'results', 'data']) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested;
    const found = reservationList(nested, depth + 1, seen);
    if (found) return found;
  }
  return null;
};

const firstValue = (sources, keys) => {
  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
  }
  return null;
};

const parseReservationStart = (reservation) => {
  const sources = [reservation, reservation?.reservation, reservation?.booking, reservation?.schedule, reservation?.slot]
    .filter((value) => value && typeof value === 'object');
  const start = firstValue(sources, [
    'start_at', 'starts_at', 'start_time', 'start_datetime', 'scheduled_at', 'scheduled_start_at',
    'scheduled_start', 'start', 'startDateTime', 'startTime', 'departure_time', 'date_time',
  ]);
  const dateValue = firstValue(sources, [
    'reservation_date', 'scheduled_date', 'start_date', 'booking_date', 'flight_date', 'date',
  ]);
  const timeValue = firstValue(sources, ['start_time', 'startTime', 'scheduled_time', 'departure_time', 'time']);

  const parse = (value) => {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number') {
      const date = new Date(value < 1e12 ? value * 1000 : value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    if (typeof value !== 'string' || !value.trim()) return null;
    const text = value.trim();
    let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) return new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
    const date = new Date(text.replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const startDate = parse(start);
  if (startDate && (start instanceof Date || (typeof start === 'string' && /^\d{4}-\d{2}-\d{2}[T ]/.test(start)))) {
    return startDate;
  }
  const date = parse(dateValue);
  if (!date) return null;
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}[T ]/.test(dateValue)) return date;
  if (typeof timeValue === 'string' && /^\d{1,2}:\d{2}/.test(timeValue)) {
    const [hour, minute] = timeValue.split(':');
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(hour), Number(minute.slice(0, 2)));
  }
  return date;
};

const roleNames = (user) => [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])]
  .map((role) => typeof role === 'string' ? role : role?.name ?? role?.slug ?? '')
  .map((role) => role.toLowerCase());
const isAdminUser = (user) => user?.is_admin === true || roleNames(user).some((role) => ['admin', 'administrator'].includes(role));
const isInactiveReservation = (reservation) => ['cancelled', 'canceled', 'completed', 'no_show', 'no-show']
  .includes(String(reservation?.status || '').toLowerCase());
const personName = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value.name) return String(value.name);
  return `${value.first_name || ''} ${value.last_name || ''}`.trim();
};
const reservationPeople = (reservation, key) => {
  const plural = reservation?.[`${key}s`];
  const singular = reservation?.[key];
  const values = Array.isArray(plural) && plural.length ? plural : singular ? [singular] : [];
  return values.map(personName).filter(Boolean).join(', ');
};


const readLocal = (userId) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const writeLocal = (userId, list) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(list.slice(0, LOCAL_CAP)));
  } catch {
    /* storage full / blocked: ignore */
  }
};

// Echo event name -> notification shape. Add new real-time events here.
const REALTIME_EVENTS = {
  '.reservation.requested': (d = {}) => ({
    event: 'reservation.requested',
    title: 'New flight request',
    body: `Student ${d.student_names || 'Someone'} has requested a new flight session!`,
    action_path: d.reservation_id || d.id ? `/reservations/${d.reservation_id || d.id}` : '/reservations',
    payload: d,
  }),
  '.new.message': (d = {}) => ({
    event: 'message.received',
    title: 'New message',
    body: `New message from ${d.sender_name || 'Someone'}`,
    action_path: d.action_path || null, // set a messages route here if you want click-through
    payload: d,
  }),
};

export const NotificationProvider = ({ children, pollMs = 30000, pageSize = 20, toasts = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;

  const [serverItems, setServerItems] = useState([]);
  const [serverUnread, setServerUnread] = useState(0);
  const [localItems, setLocalItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const seen = useRef(new Set());
  const primed = useRef(false);
  const inFlight = useRef(false);
  const serverOk = useRef(null); // null = unknown, true/false after first fetch
  const pollingOff = useRef(false);
  const backendUnavailable = useRef(false);
  const failures = useRef(0);
  const serverItemsRef = useRef([]);
  const userIdRef = useRef(userId);
  const realtimeRef = useRef(() => {});

  userIdRef.current = userId;
  serverItemsRef.current = serverItems;

  const updateLocal = useCallback((fn) => {
    setLocalItems((prev) => {
      const next = fn(prev);
      if (userIdRef.current) writeLocal(userIdRef.current, next);
      return next;
    });
  }, []);

  /* ---------- actions ---------- */

  const markRead = useCallback(
    async (id) => {
      if (isLocal(id)) {
        updateLocal((prev) => prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)));
        return;
      }
      const target = serverItemsRef.current.find((n) => n.id === id);
      if (!target || target.read_at) return;
      setServerItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
      setServerUnread((c) => Math.max(0, c - 1));
      try {
        await notificationService.markRead(id);
      } catch (e) {
        console.error('markRead failed', e);
      }
    },
    [updateLocal]
  );

  const announce = useCallback(
    (n) => {
      if (runNotificationHandlers(n, { navigate })) return;
      const show = toastTypeFor(n) === 'warning' ? showWarningToast : showInfoToast;
      show(`${n.title}: ${n.body}`, {
        toastId: `notification-${n.id}`,
        autoClose: 6000,
        onClick: () => markRead(n.id), // just acknowledge; no navigation for now
      });
    },
    [navigate, markRead]
  );

  const refresh = useCallback(async () => {
    if (!userId || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      // Prefer the backend notification feed. If it is not implemented yet,
      // Prefer the backend notification feed. Once its routes are available, it
      // provides the complete, persistent notification history and actions.
      try {
        const response = await notificationService.list({ per_page: pageSize });
        if (response?.success === false) throw new Error(response?.message || 'Notifications API returned an unsuccessful response');
        const list = notificationList(response);
        if (!list) throw new Error('Notifications API returned an unexpected response shape');
      // disable only this request and keep polling reservations for local changes.
      if (!backendUnavailable.current) {
        try {
          const response = await notificationService.list({ per_page: pageSize });
          if (response?.success === false) throw new Error(response?.message || 'Notifications API returned an unsuccessful response');
          const list = notificationList(response);
          if (!list) throw new Error('Notifications API returned an unexpected response shape');

          serverOk.current = true;
        serverOk.current = true;
        failures.current = 0;
        setServerItems(list);
        setServerUnread(notificationUnreadCount(response) ?? list.filter((n) => !n.read_at).length);
        // Remove temporary reservation-derived items after the backend feed takes over.
        updateLocal((prev) => prev.filter((item) => !String(item.id).startsWith('local-reservation-')));
          backendUnavailable.current = false;
          failures.current = 0;
          setServerItems(list);
          setServerUnread(notificationUnreadCount(response) ?? list.filter((n) => !n.read_at).length);
          // Remove temporary reservation-derived items after the backend feed takes over.
          updateLocal((prev) => prev.filter((item) => !String(item.id).startsWith('local-reservation-')));

        const fresh = list.filter((n) => !seen.current.has(n.id));
        list.forEach((n) => seen.current.add(n.id));
        if (primed.current && toasts) {
          const unread = fresh.filter((n) => !n.read_at).reverse();
          if (unread.length > MAX_INDIVIDUAL_TOASTS) {
            showInfoToast(`You have ${unread.length} new notifications`, { toastId: 'notification-batch' });
          } else {
            unread.forEach(announce);
          const fresh = list.filter((n) => !seen.current.has(n.id));
          list.forEach((n) => seen.current.add(n.id));
          if (primed.current && toasts) {
            const unread = fresh.filter((n) => !n.read_at).reverse();
            if (unread.length > MAX_INDIVIDUAL_TOASTS) {
              showInfoToast(`You have ${unread.length} new notifications`, { toastId: 'notification-batch' });
            } else {
              unread.forEach(announce);
            }
          }
          primed.current = true;
          return;
        } catch (apiError) {
          serverOk.current = false;
          failures.current += 1;
          const status = apiError?.response?.status ?? apiError?.status;
          if (status === 404 || status === 405 || failures.current >= MAX_FAILURES) {
            backendUnavailable.current = true;
          }
          if (failures.current === 1) console.warn('[notifications] backend feed unavailable; using reservation changes:', apiError?.message || apiError);
        }
        primed.current = true;
        return;
      } catch (apiError) {
        // Temporary fallback: derive create/cancel/reschedule notices from reservations.
      } else {
        serverOk.current = false;
        failures.current += 1;
        const status = apiError?.response?.status ?? apiError?.status;
        if (status === 404 || status === 405 || failures.current >= MAX_FAILURES) pollingOff.current = true;
        if (failures.current === 1) console.warn('[notifications] backend feed unavailable; using reservation changes:', apiError?.message || apiError);
      }

      const response = await reservationService.getReservations({ per_page: 1000 });
      if (response?.success === false) throw new Error(response?.message || 'Could not load reservations');
      const reservations = reservationList(response);
      if (!reservations) throw new Error('Reservations API returned an unexpected response shape');

      const previous = readSnapshot(userId);
      const current = {};
      for (const reservation of reservations) {
        if (!reservation?.id) continue;
        const startsAt = parseReservationStart(reservation);
        current[String(reservation.id)] = {
          startsAt: startsAt ? startsAt.toISOString() : null,
          status: String(reservation.status || '').toLowerCase(),
          summary: [
            reservationPeople(reservation, 'student') && `Student: ${reservationPeople(reservation, 'student')}`,
            reservationPeople(reservation, 'instructor') && `Instructor: ${reservationPeople(reservation, 'instructor')}`,
          ].filter(Boolean).join(' · '),
        };
      }

      // First fetch is only a baseline; it should not announce every existing booking.
      if (previous && !isAdminUser(user)) {
        const now = new Date().toISOString();
        const created = [];
        const addNotice = (id, event, title, body, oldStart = '', newStart = '') => {
          const stablePart = encodeURIComponent(`${id}-${event}-${oldStart}-${newStart}`);
          created.push({
            id: `local-reservation-${stablePart}`,
            event,
            title,
            body,
            action_path: `/reservations/${id}`,
            reservation_id: id,
            read_at: null,
            created_at: now,
            payload: { reservation_id: id, previous_start: oldStart || null, starts_at: newStart || null },
          });
        };

        for (const [id, currentReservation] of Object.entries(current)) {
          const oldReservation = previous[id];
          if (!oldReservation) {
            if (!['cancelled', 'canceled', 'completed', 'no_show', 'no-show'].includes(currentReservation.status)) {
              addNotice(id, 'reservation.created', 'New reservation', `A reservation was added to the schedule.${currentReservation.startsAt ? ` Scheduled for ${new Date(currentReservation.startsAt).toLocaleString()}.` : ''}${currentReservation.summary ? ` ${currentReservation.summary}` : ''}`, '', currentReservation.startsAt || '');
            }
            continue;
          }

          const wasCancelled = ['cancelled', 'canceled'].includes(oldReservation.status);
          const isCancelled = ['cancelled', 'canceled'].includes(currentReservation.status);
          if (!wasCancelled && isCancelled) {
            addNotice(id, 'reservation.cancelled', 'Reservation cancelled', `A reservation was cancelled.${oldReservation.summary ? ` ${oldReservation.summary}` : ''}`, oldReservation.startsAt || '', currentReservation.startsAt || '');
          } else if (oldReservation.startsAt && currentReservation.startsAt && oldReservation.startsAt !== currentReservation.startsAt) {
            addNotice(id, 'reservation.rescheduled', 'Reservation rescheduled', `Moved from ${new Date(oldReservation.startsAt).toLocaleString()} to ${new Date(currentReservation.startsAt).toLocaleString()}.${currentReservation.summary ? ` ${currentReservation.summary}` : ''}`, oldReservation.startsAt, currentReservation.startsAt);
          }
        }

        for (const [id, oldReservation] of Object.entries(previous)) {
          if (!current[id] && !['cancelled', 'canceled'].includes(oldReservation.status)) {
            addNotice(id, 'reservation.cancelled', 'Reservation removed', `A reservation was removed from the schedule.${oldReservation.startsAt ? ` It was scheduled for ${new Date(oldReservation.startsAt).toLocaleString()}.` : ''}${oldReservation.summary ? ` ${oldReservation.summary}` : ''}`, oldReservation.startsAt || '', '');
          }
        }

        if (created.length) {
          const existingIds = new Set(readLocal(userId).map((item) => item.id));
          const unique = created.filter((item) => !existingIds.has(item.id));
          if (unique.length) {
            updateLocal((prev) => [...unique.reverse(), ...prev]);
            if (primed.current && toasts) unique.forEach(announce);
          }
        }
      }

      writeSnapshot(userId, current);
      setServerItems([]);
      setServerUnread(0);
      primed.current = true;
    } catch (e) {
      if (failures.current === 0) failures.current += 1;
      if (failures.current >= MAX_FAILURES) pollingOff.current = true;
      if (failures.current === 1) console.warn('[notifications] could not compare reservations:', e?.message || e);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [userId, user, pageSize, updateLocal, toasts, announce]);

  const pushLocal = useCallback(
    (partial) => {
      const n = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        read_at: null,
        created_at: new Date().toISOString(),
        priority: 'normal',
        payload: {},
        ...partial,
      };
      updateLocal((prev) => [n, ...prev]);
      return n;
    },
    [updateLocal]
  );

  // Always points at the latest closures; Echo listeners call through this ref.
  realtimeRef.current = (name, data) => {
    const build = REALTIME_EVENTS[name];
    if (!build || (isAdminUser(user) && name === '.reservation.requested')) return;
    if (!serverOk.current) {
      const n = pushLocal(build(data));
      if (toasts) announce(n);
    } else {
      // Server stores these: pull the new row (slight delay so the queued job can finish).
      setTimeout(refresh, 1500);
    }
  };

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    updateLocal((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    if (!serverOk.current) return;
    setServerItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    setServerUnread(0);
    try {
      await notificationService.markAllRead();
    } catch (e) {
      console.error('markAllRead failed', e);
      refresh();
    }
  }, [refresh, updateLocal]);

  const remove = useCallback(
    async (id) => {
      if (isLocal(id)) {
        updateLocal((prev) => prev.filter((n) => n.id !== id));
        return;
      }
      setServerItems((prev) => prev.filter((n) => n.id !== id));
      try {
        await notificationService.remove(id);
      } catch (e) {
        console.error('remove failed', e);
      }
      refresh();
    },
    [refresh, updateLocal]
  );

  // Opening a notification only marks it read. To make items clickable again later,
  // add `if (n.action_path) navigate(n.action_path);` here.
  const open = useCallback(
    (n) => {
      markRead(n.id);
    },
    [markRead]
  );

  /* ---------- lifecycle ---------- */

  // Reset when the signed-in user changes.
  useEffect(() => {
    seen.current = new Set();
    primed.current = false;
    serverOk.current = null;
    pollingOff.current = false;
    backendUnavailable.current = false;
    failures.current = 0;
    setServerItems([]);
    setServerUnread(0);
    setLocalItems(userId ? readLocal(userId) : []);
    if (userId) setLoading(true);
  }, [userId]);

  // Poll while the tab is visible.
  useEffect(() => {
    if (!userId) return undefined;
    refresh();
    const tick = () => {
      if (document.visibilityState === 'visible' && !pollingOff.current) refresh();
    };
    const timer = setInterval(tick, pollMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [userId, pollMs, refresh]);

  // Real-time events from Laravel Echo.
  useEffect(() => {
    if (!userId) return undefined;
    const channel = echo.private(`user.${userId}`);
    const names = Object.keys(REALTIME_EVENTS);
    names.forEach((name) => channel.listen(name, (data) => realtimeRef.current(name, data)));
    return () => names.forEach((name) => channel.stopListening(name));
  }, [userId]);

  /* ---------- exposed value ---------- */

  const items = useMemo(
    () => [...localItems, ...serverItems].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [localItems, serverItems]
  );
  const unreadCount = serverUnread + localItems.filter((n) => !n.read_at).length;

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
