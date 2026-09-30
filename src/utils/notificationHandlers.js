// utils/notificationHandlers.js
// Plug-in point: features can take over how a notification is presented
// without touching the provider.
//
//   registerNotificationHandler('weather.*', (n, { navigate }) => {
//     openWeatherModal(n.payload);
//     return true;            // true = handled, skip the default toast
//   });
//
// `match` can be an exact event ('reservation.cancelled'), a prefix ('weather.*'),
// or a function (event) => boolean. Returns an unregister function.

const handlers = [];

const matches = (match, event = '') => {
  if (typeof match === 'function') return match(event);
  if (match === '*') return true;
  if (match.endsWith('.*')) return event.startsWith(match.slice(0, -1));
  return match === event;
};

export const registerNotificationHandler = (match, handler) => {
  const entry = { match, handler };
  handlers.push(entry);
  return () => {
    const i = handlers.indexOf(entry);
    if (i >= 0) handlers.splice(i, 1);
  };
};

export const runNotificationHandlers = (notification, context) =>
  handlers.some(
    ({ match, handler }) => matches(match, notification.event) && handler(notification, context) === true
  );
