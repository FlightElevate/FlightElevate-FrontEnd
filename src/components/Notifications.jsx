import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HiBell } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// Admins can access reservation details in the app, but don't need a feed item
// for every reservation. Individual reservation reminders remain user-facing.
const isReservationEvent = (notification) =>
  typeof notification?.event === 'string' && notification.event.startsWith('reservation.');

const getRoleNames = (user) => {
  const roles = [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])];
  return roles
    .map((role) => (typeof role === 'string' ? role : role?.name ?? role?.slug ?? ''))
    .map((role) => role.toLowerCase());
};

export default function Notifications() {
  const { user } = useAuth();
  const {
    items = [],
    loading,
    markRead,
    markAllRead,
    remove,
    open,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const isAdmin =
    user?.is_admin === true ||
    getRoleNames(user).some((role) => ['admin', 'administrator'].includes(role));

  const visibleItems = useMemo(
    () => (isAdmin ? items.filter((item) => !isReservationEvent(item)) : items),
    [isAdmin, items]
  );
  const visibleUnreadCount = visibleItems.filter((item) => !item.read_at).length;

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const handleMarkAllVisibleRead = async () => {
    if (!isAdmin) {
      await markAllRead();
      return;
    }
    await Promise.all(
      visibleItems.filter((item) => !item.read_at).map((item) => markRead(item.id))
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="hidden min-[360px]:flex text-gray-600 hover:text-gray-900 transition-colors relative min-w-[44px] min-h-[44px] items-center justify-center p-2 rounded-lg hover:bg-gray-100"
        aria-label={`Notifications${visibleUnreadCount ? `, ${visibleUnreadCount} unread` : ''}`}
        aria-expanded={isOpen}
      >
        <HiBell size={20} />
        {visibleUnreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
            {visibleUnreadCount > 99 ? '99+' : visibleUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(60vh, 28rem)' }}
          aria-label="Notifications"
        >
          <header className="flex-shrink-0 bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <strong>Notifications</strong>
            <button
              type="button"
              onClick={handleMarkAllVisibleRead}
              disabled={visibleUnreadCount === 0}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              Mark all read
            </button>
          </header>

          <div
            className="min-h-0 overflow-y-auto overscroll-contain"
            style={{ maxHeight: 'calc(min(60vh, 28rem) - 3.5rem)' }}
          >
            {loading ? (
              <p className="p-4 text-sm text-gray-500">Loading notifications…</p>
            ) : visibleItems.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
            ) : (
              visibleItems.map((notification) => (
                <article
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 ${notification.read_at ? '' : 'bg-blue-50'}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      open(notification);
                      setIsOpen(false);
                    }}
                    className="w-full text-left"
                  >
                    <span className="block text-sm font-medium text-gray-800">
                      {notification.title || 'Notification'}
                    </span>
                    {notification.body && (
                      <span className="block mt-1 text-sm text-gray-600">{notification.body}</span>
                    )}
                    {notification.created_at && (
                      <time className="block mt-1 text-xs text-gray-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </time>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(notification.id)}
                    className="mt-2 text-xs text-gray-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
