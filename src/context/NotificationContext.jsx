// context/NotificationContext.jsx
// Mount <NotificationProvider> ONCE inside your Router + AuthProvider (e.g. in the main layout).
// Anything below it can call useNotifications() for the bell, list, unread count, etc.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { notificationService } from '../api/services/notificationService';
import { showInfoToast, showWarningToast } from '../utils/notifications';
import { runNotificationHandlers } from '../utils/notificationHandlers';
import { toastTypeFor } from '../config/notificationEvents';

const NotificationContext = createContext(null);

const asList = (res) => (Array.isArray(res?.data) ? res.data : res?.data?.data || []);
const MAX_INDIVIDUAL_TOASTS = 3;

export const NotificationProvider = ({ children, pollMs = 30000, pageSize = 20, toasts = true }) => {
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
    try {
      await notificationService.markRead(id);
    } catch (e) {
      console.error('markRead failed', e);
    }
    return wasUnread;
  }, []);

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
    try {
      const res = await notificationService.list({ per_page: pageSize });
      if (!res?.success) return;

      const list = asList(res);
      setItems(list);
      setUnreadCount(res.unread_count ?? list.filter((n) => !n.read_at).length);

      const fresh = list.filter((n) => !seen.current.has(n.id));
      list.forEach((n) => seen.current.add(n.id));

      if (primed.current && toasts) {
        const unread = fresh.filter((n) => !n.read_at).reverse(); // oldest first
        if (unread.length > MAX_INDIVIDUAL_TOASTS) {
          showInfoToast(`You have ${unread.length} new notifications`, { toastId: 'notification-batch' });
        } else {
          unread.forEach(announce);
        }
      }
      primed.current = true;
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [userId, pageSize, toasts, announce]);

  // Reset when the signed-in user changes (login/logout/switch account).
  useEffect(() => {
    seen.current = new Set();
    primed.current = false;
    setItems([]);
    setUnreadCount(0);
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
    try {
      await notificationService.markAllRead();
    } catch (e) {
      console.error('markAllRead failed', e);
      refresh();
    }
  }, [refresh]);

  const remove = useCallback(
    async (id) => {
      setItems((prev) => prev.filter((n) => n.id !== id));
      try {
        await notificationService.remove(id);
      } catch (e) {
        console.error('remove failed', e);
      }
      refresh();
    },
    [refresh]
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
