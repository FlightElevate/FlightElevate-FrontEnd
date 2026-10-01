// components/Notification.jsx (same folder as Header.jsx)
// Drop-in replacement for the bell icon in your header:
//   <NotificationBell />
// Requires <NotificationProvider> higher up the tree (inside Router + AuthProvider).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiBell, FiX, FiCalendar, FiAlertTriangle, FiTool, FiCloud,
  FiBookOpen, FiTrendingUp, FiZap, FiFileText, FiMessageSquare, FiCheckCircle,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { categoryOf, toastTypeFor } from '../config/notificationEvents';

const CATEGORY_ICONS = {
  reservation: FiCalendar,
  aircraft: FiAlertTriangle,
  maintenance: FiTool,
  weather: FiCloud,
  lesson: FiBookOpen,
  student: FiTrendingUp,
  ai: FiZap,
  document: FiFileText,
  message: FiMessageSquare,
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diffSec) >= secs) return rtf.format(Math.round(diffSec / secs), unit);
  }
  return 'just now';
};

const dayGroup = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return 'Earlier';
};

const NotificationItem = ({ n, onOpen, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[categoryOf(n.event)] || FiBell;
  const warning = toastTypeFor(n) === 'warning';
  const unread = !n.read_at;

  return (
    <li className={`group relative border-b border-gray-100 last:border-b-0 ${unread ? 'bg-blue-50/40' : ''}`}>
      <button
        type="button"
        onClick={() => {
          setExpanded((v) => !v); // show / hide the full message
          onOpen(n); // marks it read
        }}
        aria-expanded={expanded}
        className="w-full text-left flex gap-3 px-4 py-3 pr-10 hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50"
      >
        <span
          className={`mt-0.5 h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${
            warning ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          }`}
        >
          <Icon size={16} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className={`text-sm leading-snug ${unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
              {n.title}
            </span>
            {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Unread" />}
          </span>
          <span className={`block text-sm text-gray-600 mt-0.5 break-words ${expanded ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
            {n.body}
          </span>
          <span className="block text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onRemove(n.id)}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2 p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100
                   sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
      >
        <FiX size={14} />
      </button>
    </li>
  );
};

const NotificationBell = ({ viewAllPath = null, className = '' }) => {
  const { items, unreadCount, loading, refresh, markAllRead, remove, open } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('all'); // 'all' | 'unread'
  const rootRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click / Escape.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e) => rootRef.current && !rootRef.current.contains(e.target) && setIsOpen(false);
    const onKey = (e) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const toggle = () => {
    setIsOpen((v) => {
      if (!v) refresh(); // fresh data every time the panel opens
      return !v;
    });
  };

  const visible = useMemo(() => (tab === 'unread' ? items.filter((n) => !n.read_at) : items), [items, tab]);

  const groups = useMemo(() => {
    const order = ['Today', 'Yesterday', 'Earlier'];
    const map = { Today: [], Yesterday: [], Earlier: [] };
    visible.forEach((n) => map[dayGroup(n.created_at)].push(n));
    return order.filter((g) => map[g].length).map((g) => ({ label: g, list: map[g] }));
  }, [visible]);

  // Clicking a notification only shows the message and marks it read (panel stays open).
  const handleOpen = (n) => open(n);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        <FiBell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-semibold leading-[18px] text-center ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-2 top-16 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[24rem]
                     flex flex-col max-h-[min(32rem,calc(100vh-5rem))]
                     bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Header (fixed) */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
            <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="text-sm font-medium text-blue-700 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-default"
            >
              Mark all as read
            </button>
          </div>

          {/* Tabs (fixed) */}
          <div className="flex gap-1 px-3 pt-2 border-b border-gray-100 shrink-0" role="tablist">
            {[
              ['all', 'All'],
              ['unread', unreadCount ? `Unread (${unreadCount})` : 'Unread'],
            ].map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Scrollable list */}
          <div className="flex-1 min-h-[8rem] overflow-y-auto overscroll-contain">
            {loading && items.length === 0 ? (
              <ul aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-2/3 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 px-6">
                <FiCheckCircle className="text-gray-300 mb-2" size={32} aria-hidden="true" />
                <p className="text-sm font-medium text-gray-700">
                  {tab === 'unread' ? "You're all caught up" : 'No notifications yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  New reservations, reminders and updates will show up here.
                </p>
              </div>
            ) : (
              groups.map((g) => (
                <section key={g.label}>
                  <h4 className="sticky top-0 z-10 bg-gray-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100">
                    {g.label}
                  </h4>
                  <ul>
                    {g.list.map((n) => (
                      <NotificationItem key={n.id} n={n} onOpen={handleOpen} onRemove={remove} />
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>

          {viewAllPath && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(viewAllPath);
              }}
              className="shrink-0 w-full text-center text-sm font-medium text-blue-700 hover:bg-gray-50 py-3 border-t border-gray-200"
            >
              View all notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
